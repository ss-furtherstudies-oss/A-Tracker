import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

const StudentContext = createContext();

export const generateSummary = (gradesArr) => {
  if (!gradesArr || gradesArr.length === 0) return '-';
  const counts = {};
  gradesArr.forEach(item => {
    const g = item.grade?.toUpperCase().trim();
    if (g) counts[g] = (counts[g] || 0) + 1;
  });
  if (Object.keys(counts).length === 0) return '-';

  return Object.keys(counts).sort((a, b) => {
    const aIsNum = !isNaN(a) && a.trim() !== '';
    const bIsNum = !isNaN(b) && b.trim() !== '';
    if (aIsNum && bIsNum) return Number(b) - Number(a);
    if (!aIsNum && bIsNum) return -1;
    if (aIsNum && !bIsNum) return 1;
    if (a === 'A*') return -1;
    if (b === 'A*') return 1;
    return a.localeCompare(b);
  }).map(g => {
    const isNum = !isNaN(g) && g.trim() !== '';
    return isNum ? `${counts[g]}x${g}` : `${counts[g]}${g}`;
  }).join(', ');
};

export const StudentProvider = ({ children }) => {
  const [students, setStudents] = useState([]);
  const [uappData, setUappData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastModified, setLastModified] = useState(0);

  // Fetch data from Supabase on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Students
      const { data: studentsData, error: sError } = await supabase
        .from('students')
        .select('*')
        .order('grad_year', { ascending: false });

      if (sError) throw sError;
      setStudents(studentsData || []);

      // 2. Fetch Applications
      const { data: appsData, error: aError } = await supabase
        .from('applications')
        .select('*');

      if (aError) throw aError;
      setUappData(appsData || []);
    } catch (err) {
      console.error("Error fetching students/apps:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Cloud Sync Helpers ──────────────────────────────────────────────────
  
  // Update a single application in Supabase
  const updateApplication = async (studentId, appId, updates) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update(updates)
        .eq('id', appId);
      
      if (error) throw error;
      
      // Update local state
      setUappData(prev => prev.map(s => {
        if (s.id !== studentId) return s;
        return {
          ...s,
          applications: s.applications.map(a => a.id === appId ? { ...a, ...updates } : a)
        };
      }));
      setLastModified(Date.now());
      return { success: true };
    } catch (err) {
      console.error("Failed to update application:", err.message);
      return { success: false, error: err.message };
    }
  };

  // Add multiple applications to Supabase (used in batch import)
  const addApplications = async (newApps) => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .insert(newApps)
        .select();
      
      if (error) throw error;
      
      // Update local state
      setUappData(prev => {
        const next = [...prev];
        data.forEach(app => {
          const sIdx = next.findIndex(s => s.id === app.student_id);
          if (sIdx > -1) {
            next[sIdx] = {
              ...next[sIdx],
              applications: [...(next[sIdx].applications || []), app]
            };
          }
        });
        return next;
      });
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
        });
      }
    });
    return students.map(s => ({
      ...s,
      university_dest: uappMap.get(s.id)?.university_dest || s.university_dest || '',
      program_dest: uappMap.get(s.id)?.program_dest || s.program_dest || '',
    }));
  }, [students, uappData]);

  // Wrapper to update students locally (upsert to Supabase should be done per-component)
  const updateStudents = async (newStudents) => {
    setStudents(newStudents);
    setLastModified(Date.now());
  };

  // Upsert multiple students to Supabase
  const upsertStudents = async (studentDataArray) => {
    try {
      const { data: result, error } = await supabase
        .from('students')
        .upsert(studentDataArray, { onConflict: 'student_num' })
        .select();

      if (error) throw error;
      
      // Update local state by merging or refreshing
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
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setStudents(prev => prev.filter(s => s.id !== id));
      setLastModified(Date.now());
      return { success: true };
    } catch (err) {
      console.error("Failed to delete student:", err.message);
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
