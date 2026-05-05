import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import * as db from '../lib/supabaseService';
import { useAuth } from './AuthContext';

const StudentContext = createContext();

export const StudentProvider = ({ children }) => {
  const [students, setStudents] = useState([]);
  const [uappData, setUappData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastModified, setLastModified] = useState(0);

  const { user } = useAuth();

  // Fetch data from Supabase whenever user auth state changes
  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setStudents([]);
      setUappData([]);
      setLoading(false);
    }
  }, [user?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('Fetch timeout')), ms));
      const [studentsResult, appsResult] = await Promise.all([
        Promise.race([db.fetchStudents(), timeout(30000)]),
        Promise.race([db.fetchApplications(), timeout(30000)])
      ]);

      if (studentsResult.error) throw studentsResult.error;
      if (appsResult.error) throw appsResult.error;

      setStudents(studentsResult.data || []);
      setUappData(appsResult.data || []);
    } catch (err) {
      console.error("Error fetching students/apps:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Cloud Sync Helpers ──────────────────────────────────────────────────

  const withTimeout = (promise, ms = 30000) =>
    Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database request timed out. Please check RLS policies.')), ms))
    ]);

  const updateApplication = async (studentId, appId, updates) => {
    try {
      const { error } = await withTimeout(db.updateApplicationById(appId, updates));
      if (error) throw error;

      setUappData(prev => prev.map(app => (app.id === appId ? { ...app, ...updates } : app)));
      setLastModified(Date.now());
      return { success: true };
    } catch (err) {
      console.error("Failed to update application:", err.message);
      return { success: false, error: err.message };
    }
  };

  const addApplications = async (newApps) => {
    try {
      const { data, error } = await withTimeout(db.insertApplications(newApps));
      console.log(`[DB] insertApplications: sent=${newApps.length}, returned=${data?.length ?? 'null'}, error=${error?.message ?? 'none'}`);
      if (error) throw error;
      if (!data || data.length === 0) {
        console.error('[DB] INSERT RETURNED NO DATA — likely RLS policy blocking insert');
        return { success: false, error: 'Insert returned no data. Check RLS policies.' };
      }

      setUappData(prev => [...prev, ...data]);
      setLastModified(Date.now());
      return { success: true };
    } catch (err) {
      console.error("Failed to add applications:", err.message);
      return { success: false, error: err.message };
    }
  };

  const upsertApplications = async (apps) => {
    try {
      const toInsert = apps.filter(a => !a.id);
      const toUpdate = apps.filter(a => !!a.id);
      const allData = [];

      if (toInsert.length > 0) {
        const { data, error } = await withTimeout(db.insertApplications(toInsert));
        if (error) throw error;
        allData.push(...(data || []));
      }
      
      if (toUpdate.length > 0) {
        const { data, error } = await withTimeout(db.upsertApplications(toUpdate));
        if (error) throw error;
        allData.push(...(data || []));
      }

      setUappData(prev => {
        const next = [...prev];
        allData.forEach(updatedApp => {
          const idx = next.findIndex(a => a.id === updatedApp.id);
          if (idx >= 0) next[idx] = updatedApp;
          else next.push(updatedApp);
        });
        return next;
      });
      setLastModified(Date.now());
      return { success: true, data: allData };
    } catch (err) {
      console.error("Failed to upsert applications:", err.message);
      return { success: false, error: err.message };
    }
  };

  // Compute derived data: merge final application destination into each student
  const studentsWithDestinations = useMemo(() => {
    const uappMap = new Map();
    uappData.forEach(app => {
      if (!app.student_id) return;
      if (app.is_final) {
        uappMap.set(app.student_id, {
          university_dest: app.university || '',
          program_dest: app.program || '',
          quali: app.quali || '',
        });
      }
    });
    return students.map(s => ({
      ...s,
      university_dest: uappMap.get(s.id)?.university_dest ?? s.university_dest ?? '',
      program_dest: uappMap.get(s.id)?.program_dest ?? s.program_dest ?? '',
      quali: uappMap.get(s.id)?.quali ?? s.quali ?? '',
    }));
  }, [students, uappData]);

  // Upsert multiple students to Supabase (used for bulk import where student_num is conflict key)
  const upsertStudents = async (studentDataArray) => {
    try {
      const { data: result, error } = await withTimeout(db.upsertStudents(studentDataArray));
      if (error) throw error;

      // Refresh all data to keep local state in sync
      await fetchData();
      return { success: true, data: result };
    } catch (err) {
      console.error("Failed to upsert students:", err.message);
      return { success: false, error: err.message };
    }
  };

  // Update a single student by ID
  const updateStudent = async (id, updates) => {
    try {
      // Remove id from updates if it exists to prevent updating primary key
      const { id: _id, ...cleanUpdates } = updates;
      const { error } = await withTimeout(db.updateStudentById(id, cleanUpdates));
      if (error) throw error;

      await fetchData();
      return { success: true };
    } catch (err) {
      console.error("Failed to update student:", err.message);
      return { success: false, error: err.message };
    }
  };

  // Delete a student from Supabase
  const deleteStudent = async (id) => {
    try {
      const { error } = await withTimeout(db.deleteStudentById(id));
      if (error) throw error;

      setStudents(prev => prev.filter(s => s.id !== id));
      setLastModified(Date.now());
      return { success: true };
    } catch (err) {
      console.error("Failed to delete student:", err.message);
      return { success: false, error: err.message };
    }
  };

  // Delete an application from Supabase
  const deleteApplication = async (studentId, appId) => {
    try {
      const { error } = await withTimeout(db.deleteApplicationById(appId));
      if (error) throw error;

      setUappData(prev => prev.filter(a => a.id !== appId));
      setLastModified(Date.now());
      return { success: true };
    } catch (err) {
      console.error("Failed to delete application:", err.message);
      return { success: false, error: err.message };
    }
  };

  const clearAllApplications = async (year = 'All') => {
    try {
      if (year === 'All') {
        const { error } = await withTimeout(db.clearAllApplications());
        if (error) throw error;

        // Reset destination fields for ALL students
        const allStudentIds = students.map(s => s.id);
        if (allStudentIds.length > 0) {
          const resetData = { university_dest: null, program_dest: null, quali: null };
          // We do this in chunks to avoid overwhelming the connection
          const CHUNK = 50;
          for (let i = 0; i < allStudentIds.length; i += CHUNK) {
            const chunk = allStudentIds.slice(i, i + CHUNK);
            await Promise.all(chunk.map(id => db.updateStudentById(id, resetData)));
          }
        }
        
        setUappData([]);
      } else {
        const studentsInYear = students.filter(s => s.grad_year === Number(year) || s.grad_year === String(year));
        const studentIds = studentsInYear.map(s => s.id);
        if (studentIds.length > 0) {
          // 1. Delete the application records
          const { error } = await withTimeout(db.deleteApplicationsByStudentIds(studentIds));
          if (error) throw error;

          // 2. Clear the destination fields on the students themselves (the "fallback" data)
          const resetData = { university_dest: null, program_dest: null, quali: null };
          await Promise.all(studentIds.map(id => db.updateStudentById(id, resetData)));
          
          setUappData(prev => prev.filter(app => !studentIds.includes(app.student_id)));
        }
      }
      await fetchData();
      return { success: true };
    } catch (err) {
      console.error("Failed to clear applications:", err.message);
      return { success: false, error: err.message };
    }
  };

  const setUappDataDirect = (updater) => {
    setUappData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return next;
    });
    setLastModified(Date.now());
  };

  return (
    <StudentContext.Provider value={{
      students: studentsWithDestinations,
      upsertStudents,
      updateStudent,
      deleteStudent,
      uappData,
      setUappData: setUappDataDirect,
      updateApplication,
      addApplications,
      upsertApplications,
      deleteApplication,
      clearAllApplications,
      loading,
      refreshData: fetchData,
      lastModified
    }}>
      {children}
    </StudentContext.Provider>
  );
};

export const useStudents = () => {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error('useStudents must be used within a StudentProvider');
  return ctx;
};
