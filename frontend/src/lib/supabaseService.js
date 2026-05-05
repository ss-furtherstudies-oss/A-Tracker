/**
 * Supabase Data Access Layer (DAL).
 *
 * All direct `supabase.from(...)` calls are centralised here so that
 * Context providers and UI components never touch the database client
 * directly.  This makes it trivial to swap Supabase for another backend,
 * add caching, or inject middleware (e.g. audit logging) later.
 */
import { supabase } from './supabaseClient';

// ─── Students ───────────────────────────────────────────────────────────────

export const fetchStudents = async () => {
  let allData = [];
  let from = 0;
  const step = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('grad_year', { ascending: false })
      .range(from, from + step - 1);
    
    if (error) return { data: null, error };
    allData = [...allData, ...(data || [])];
    
    if (!data || data.length < step) break;
    from += step;
  }
  
  return { data: allData, error: null };
};

export const upsertStudents = (rows) =>
  supabase.from('students').upsert(rows, { onConflict: 'student_num' }).select();

export const deleteStudentById = (id) =>
  supabase.from('students').delete().eq('id', id);

export const updateStudentById = (id, updates) =>
  supabase.from('students').update(updates).eq('id', id);

export const insertStudent = (row) =>
  supabase.from('students').insert(row).select().single();

export const clearAllStudents = () =>
  supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');

// ─── Applications ───────────────────────────────────────────────────────────

export const fetchApplications = async () => {
  let allData = [];
  let from = 0;
  const step = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .range(from, from + step - 1);
    
    if (error) return { data: null, error };
    allData = [...allData, ...(data || [])];
    
    if (!data || data.length < step) break;
    from += step;
  }
  
  return { data: allData, error: null };
};

export const insertApplications = (rows) =>
  supabase.from('applications').insert(rows).select();

export const upsertApplications = (rows) =>
  supabase.from('applications').upsert(rows, { onConflict: 'id' }).select();

export const updateApplicationById = (id, updates) =>
  supabase.from('applications').update(updates).eq('id', id);

export const deleteApplicationById = (id) =>
  supabase.from('applications').delete().eq('id', id);

export const deleteApplicationsByStudentIds = async (studentIds) => {
  // Chunking to avoid URL length limits in PostgREST
  const chunkSize = 200;
  for (let i = 0; i < studentIds.length; i += chunkSize) {
    const chunk = studentIds.slice(i, i + chunkSize);
    const { error } = await supabase.from('applications').delete().in('student_id', chunk);
    if (error) throw error;
  }
  return { success: true };
};

export const clearAllApplications = () =>
  supabase.from('applications').delete().neq('id', '00000000-0000-0000-0000-000000000000');

// ─── QS Rankings ────────────────────────────────────────────────────────────

export const fetchQSRankings = async () => {
  const pageSize = 1000;
  let from = 0;
  let allRows = [];

  while (true) {
    const { data, error } = await supabase
      .from('qs_rankings')
      .select('*')
      .order('rank_latest', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) return { data: null, error };

    const chunk = data || [];
    allRows = allRows.concat(chunk);

    if (chunk.length < pageSize) break;
    from += pageSize;
  }

  return { data: allRows, error: null };
};

export const upsertQSRankings = (rows) => {
  // If rows have IDs, we are likely updating existing records, so conflict on 'id'.
  // If not, we are importing new data, so conflict on 'university' name.
  const hasId = rows.length > 0 && rows[0].id;
  return supabase.from('qs_rankings').upsert(rows, { onConflict: hasId ? 'id' : 'university' });
};

export const deleteQSRanking = (id) =>
  supabase.from('qs_rankings').delete().eq('id', id);

// ─── University Mappings ────────────────────────────────────────────────────

export const fetchUniversityMappings = () =>
  supabase.from('university_mappings').select('original_name, resolved_name');

export const upsertUniversityMapping = (original, resolved) =>
  supabase.from('university_mappings').upsert(
    { original_name: original, resolved_name: resolved },
    { onConflict: 'original_name' }
  );

export const upsertUniversityMappings = (rows) =>
  supabase.from('university_mappings').upsert(rows, { onConflict: 'original_name' });

// ─── Profiles (admin user management) ───────────────────────────────────────

export const fetchProfiles = () =>
  supabase.from('profiles').select('*').order('email');

export const fetchProfileById = (id) =>
  supabase.from('profiles').select('role').eq('id', id).single();

export const updateProfileRole = (userId, newRole) =>
  supabase.from('profiles').update({ role: newRole }).eq('id', userId);
