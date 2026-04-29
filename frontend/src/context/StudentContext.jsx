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
      const { data: studentsData, error: sError } = await db.fetchStudents();
      if (sError) throw sError;
      setStudents(studentsData || []);

      const { data: appsData, error: aError } = await db.fetchApplications();
      if (aError) throw aError;
      setUappData(appsData || []);
    } catch (err) {
      console.error("Error fetching students/apps:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Cloud Sync Helpers ──────────────────────────────────────────────────

  const updateApplication = async (studentId, appId, updates) => {
    try {
      const { error } = await db.updateApplicationById(appId, updates);
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
      const { data, error } = await db.insertApplications(newApps);
      if (error) throw error;

      setUappData(prev => [...prev, ...(data || [])]);
      setLastModified(Date.now());
      return { success: true };
    } catch (err) {
      console.error("Failed to add applications:", err.message);
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

  // Upsert multiple students to Supabase
  const upsertStudents = async (studentDataArray) => {
    try {
      const { data: result, error } = await db.upsertStudents(studentDataArray);
      if (error) throw error;

      // Refresh all data to keep local state in sync
      await fetchData();
      return { success: true, data: result };
    } catch (err) {
      console.error("Failed to upsert students:", err.message);
      return { success: false, error: err.message };
    }
  };

  // Delete a student from Supabase
  const deleteStudent = async (id) => {
    try {
      const { error } = await db.deleteStudentById(id);
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
      const { error } = await db.deleteApplicationById(appId);
      if (error) throw error;

      setUappData(prev => prev.filter(a => a.id !== appId));
      setLastModified(Date.now());
      return { success: true };
    } catch (err) {
      console.error("Failed to delete application:", err.message);
      return { success: false, error: err.message };
    }
  };

  const clearAllApplications = async () => {
    try {
      const { error } = await db.clearAllApplications();
      if (error) throw error;
      setUappData([]);
      setLastModified(Date.now());
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
      deleteStudent,
      uappData,
      setUappData: setUappDataDirect,
      updateApplication,
      addApplications,
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
