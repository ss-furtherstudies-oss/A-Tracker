import { useState, useRef } from 'react';
import * as XLSX from 'xlsx-js-style';
import * as db from '../lib/supabaseService';
import { normalizeCountry, deriveStatus, normalizeUniKey } from '../constants/uapp';

export const useUAppImport = ({
  data,
  sharedStudents,
  uappData,
  findUniversityByName,
  addCustomMapping,
  upsertStudents,
  updateStudent,
  upsertApplications,
  addApplications,
  refreshData,
  showToast
}) => {
  const [exportModal, setExportModal] = useState({ isOpen: false, type: null });
  const [pendingPreImportData, setPendingPreImportData] = useState(null);
  const [resolvingUnies, setResolvingUnies] = useState([]);
  const [pendingImport, setPendingImport] = useState(null);
  const [conflictIndex, setConflictIndex] = useState(0);
  const [isMergingAllConflicts, setIsMergingAllConflicts] = useState(false);
  
  const importInputRef = useRef(null);
  const pendingDataRef = useRef(null);

  const isTruthyCell = (value) => {
    const v = String(value ?? '').trim().toLowerCase();
    return v === 'true' || v === 'yes' || v === '1' || v === 'y';
  };

  const executeExport = (type, targetYear) => {
    const headers = [
      'Grad Year', 'Student ID', 'English Name', 'Other Name', 'Chinese Name', 
      'Country', 'University', 'Program', 'Quali', 'Offer Type', 'Conditions', 'Decision', 'Final Destination'
    ];

    const targetStudents = data
      .filter((s) => targetYear === 'All' || String(s.grad_year) === String(targetYear))
      .sort((a, b) => {
        if (a.grad_year !== b.grad_year) return Number(b.grad_year) - Number(a.grad_year);
        return (a.person.name_en || '').localeCompare(b.person.name_en || '');
      });

    let rows = [];
    if (type === 'FULL') {
      targetStudents.forEach((s) => {
        if (s.applications.length === 0) {
          rows.push([
            s.grad_year, s.student_num, s.person.name_en, s.person.other_name, s.person.name_zh, 
            '', '', '', '', '', '', '', ''
          ]);
        } else {
          s.applications.forEach((app) => {
            rows.push([
              s.grad_year, s.student_num, s.person.name_en, s.person.other_name, s.person.name_zh, 
              app.country || '', app.university || '', app.program || '', app.quali || '', 
              app.has_offer ? 'Y' : 'N', app.condition || '', app.decision || '', app.is_final ? 'Y' : 'N'
            ]);
          });
        }
      });
    } else {
      rows = targetStudents.map((s) => [
        s.grad_year, s.student_num, s.person.name_en, s.person.other_name, s.person.name_zh, 
        '', '', '', '', '', '', '', ''
      ]);
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'U-App Data');
    XLSX.writeFile(wb, `${type === 'FULL' ? 'Full_UApp_Data' : 'Template_UApp'}_${targetYear}.csv`, { bookType: 'csv' });
    
    setExportModal({ isOpen: false, type: null });
  };

  const processImportData = async (rows) => {
    try {
      const studentMap = new Map();
      rows.forEach((row) => {
        const studentId = String(row['Student ID'] || '').trim();
        if (!studentId) return;
        if (!studentMap.has(studentId)) {
          studentMap.set(studentId, { 
            student_num: studentId, 
            grad_year: parseInt(row['Grad Year'] || '0', 10) || null, 
            name_en: String(row['English Name'] || '').trim(), 
            name_zh: String(row['Chinese Name'] || '').trim(), 
            other_name: String(row['Other Name'] || '').trim(), 
            applications: [] 
          });
        }
        const rawUni = String(row['University'] || '').trim();
        const matchedUni = findUniversityByName(rawUni);
        const resolvedUniversity = matchedUni?.university || rawUni;
        const resolvedCountry = matchedUni?.location 
          ? normalizeCountry(matchedUni.location) 
          : normalizeCountry(row['Country']);

        const app = { 
          country: resolvedCountry, 
          university: resolvedUniversity, 
          program: String(row['Program'] || '').trim(), 
          quali: String(row['Quali'] || '').trim(), 
          condition: String(row['Conditions'] || '').trim(), 
          decision: String(row['Decision'] || '').trim(), 
          has_offer: isTruthyCell(row['Offer Type']), 
          is_final: isTruthyCell(row['Final Destination']), 
          status: deriveStatus(row['Offer Type'], row['Decision']) 
        };
        if (app.university || app.program || app.country) studentMap.get(studentId).applications.push(app);
      });
      
      console.log('[IMPORT] Parsed studentMap:', studentMap.size, 'students');
      console.log('[IMPORT] sharedStudents in DB:', sharedStudents.length);
      console.log('[IMPORT] uappData in DB:', uappData.length);

      const conflicts = [];
      const newStudents = [];
      const studentsToUpdate = [];
      const appsToAutoInsert = [];
      let autoImportedStudentsCount = 0;

      for (const [sid, imported] of studentMap.entries()) {
        const existing = sharedStudents.find((s) => s.student_num === sid);
        if (!existing) { newStudents.push(imported); continue; }
        
        // Auto-update grad_year if it exists in CSV and differs from DB
        if (imported.grad_year && String(existing.grad_year) !== String(imported.grad_year)) {
           studentsToUpdate.push({ id: existing.id, grad_year: imported.grad_year });
        }
        
        const existingApps = uappData.filter((a) => a.student_id === existing.id);
        const seenImportKeys = new Set();
        const newApps = [];
        const duplicateApps = [];
        const updateApps = [];

        imported.applications.forEach((app) => {
          const appKey = `${normalizeUniKey(app.university)}|${normalizeUniKey(app.program)}`;
          if (!normalizeUniKey(app.university)) { newApps.push(app); return; }
          
          if (seenImportKeys.has(appKey)) { duplicateApps.push(app); return; }
          seenImportKeys.add(appKey);

          const existingApp = existingApps.find(a => 
            normalizeUniKey(a.university) === normalizeUniKey(app.university) && 
            normalizeUniKey(a.program) === normalizeUniKey(app.program)
          );
          
          if (!existingApp) {
            newApps.push(app);
          } else {
            const hasChanged = 
              (existingApp.country || '') !== (app.country || '') ||
              (existingApp.quali || '') !== (app.quali || '') ||
              (existingApp.condition || '') !== (app.condition || '') ||
              (existingApp.decision || '') !== (app.decision || '') ||
              !!existingApp.has_offer !== !!app.has_offer ||
              !!existingApp.is_final !== !!app.is_final ||
              (existingApp.status || 'PENDING') !== (app.status || 'PENDING');

            if (hasChanged) {
              updateApps.push({ ...app, id: existingApp.id, student_id: existing.id });
            } else {
              duplicateApps.push(app);
            }
          }
        });
        
        console.log(`[IMPORT] Analyzing ${sid}: new=${newApps.length}, update=${updateApps.length}, duplicates=${duplicateApps.length}`);

        // Auto-import path: NO update conflicts
        if (newApps.length > 0 && updateApps.length === 0) {
          appsToAutoInsert.push(...newApps.map(a => ({ ...a, student_id: existing.id })));
          autoImportedStudentsCount++;
          continue;
        }

        // Conflict path: show modal for updateApps
        if (updateApps.length > 0) {
          // Still auto-queue the purely new apps
          if (newApps.length > 0) {
            appsToAutoInsert.push(...newApps.map(a => ({ ...a, student_id: existing.id })));
          }
          conflicts.push({ 
            existing, 
            imported, 
            newApps: updateApps, 
            duplicateApps, 
            existingApps,
            duplicateUniversities: Array.from(new Set(
              updateApps.map(a => String(a.university || '').trim()).filter(Boolean)
            ))
          });
        }
      }

      console.log(`[IMPORT] Collected ${appsToAutoInsert.length} apps for auto-insertion across ${autoImportedStudentsCount} students`);

      // 1. Perform bulk insert for all auto-importable apps
      if (appsToAutoInsert.length > 0) {
        const CHUNK = 100;
        for (let i = 0; i < appsToAutoInsert.length; i += CHUNK) {
          const chunk = appsToAutoInsert.slice(i, i + CHUNK);
          const result = await addApplications(chunk);
          if (!result.success) {
            showToast('error', `Failed to auto-insert apps: ${result.error}`);
            break;
          }
        }
      }


      console.log(`[IMPORT] Summary: newStudents=${newStudents.length}, autoImportedStudents=${autoImportedStudentsCount}, conflicts=${conflicts.length}, gradYearUpdates=${studentsToUpdate.length}`);

      if (newStudents.length > 0) {
        console.log('[IMPORT] Creating new students:', newStudents.map(s => s.student_num));
        const studentRows = newStudents.map(s => ({
          student_num: s.student_num,
          name_en: s.name_en,
          name_zh: s.name_zh,
          other_name: s.other_name || null,
          grad_year: s.grad_year,
          status: 'APPLICANT'
        }));

        const { data: createdStudents, success } = await upsertStudents(studentRows);
        console.log('[IMPORT] upsertStudents result: success=', success, 'count=', createdStudents?.length);
        if (success && createdStudents) {
          const allNewApps = [];
          newStudents.forEach(s => {
            const created = createdStudents.find(cs => cs.student_num === s.student_num);
            if (created && s.applications.length > 0) {
              allNewApps.push(...s.applications.map(a => ({ ...a, student_id: created.id })));
            }
          });
          console.log('[IMPORT] Total new apps to insert:', allNewApps.length);
          if (allNewApps.length > 0) {
            const CHUNK = 50;
            for (let i = 0; i < allNewApps.length; i += CHUNK) {
              const chunk = allNewApps.slice(i, i + CHUNK);
              const result = await addApplications(chunk);
              if (!result.success) {
                console.error(`[IMPORT] FAILED batch ${Math.floor(i/CHUNK)+1}:`, result.error);
                showToast('error', `Failed to add apps (batch ${Math.floor(i/CHUNK)+1}): ${result.error}`);
                break;
              }
              console.log(`[IMPORT] Inserted batch ${Math.floor(i/CHUNK)+1} (${chunk.length} apps)`);
            }
          }
        } else {
          console.error('[IMPORT] FAILED to create students');
          showToast('error', 'Failed to create new students.');
        }
      }

      // Automatically sync grad_year for existing students
      if (studentsToUpdate.length > 0) {
         await Promise.all(studentsToUpdate.map(stu => updateStudent(stu.id, { grad_year: stu.grad_year })));
      }

      if (conflicts.length > 0) {
        console.log('[IMPORT] Opening conflict modal for', conflicts.length, 'students');
        setPendingImport({ conflicts, newCount: newStudents.length, updatedCount: 0 });
        setConflictIndex(0);
        return;
      }

      await refreshData();
      showToast('success', `Import complete. ${newStudents.length} new students, ${autoImportedStudentsCount} students updated.`);
    } catch (err) { showToast('error', `Import failed: ${err.message}`); }
  };

  const handleImportXL = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const dataArr = new Uint8Array(evt.target.result);
        const wb = XLSX.read(dataArr, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        if (rows.length === 0) { showToast('warn', 'No data rows found.'); return; }
        
        let currentStudentId = '';
        let currentGradYear = '';
        let currentEnName = '';
        let currentZhName = '';
        let currentOtherName = '';

        rows.forEach(row => {
          const sid = String(row['Student ID'] || '').trim();
          if (sid) {
            currentStudentId = sid;
            if (row['Grad Year']) currentGradYear = row['Grad Year'];
            if (row['English Name']) currentEnName = row['English Name'];
            if (row['Chinese Name']) currentZhName = row['Chinese Name'];
            if (row['Other Name']) currentOtherName = row['Other Name'];
          } else if (currentStudentId) {
            row['Student ID'] = currentStudentId;
            row['Grad Year'] = currentGradYear;
            row['English Name'] = currentEnName;
            row['Chinese Name'] = currentZhName;
            row['Other Name'] = currentOtherName;
          }
        });
        
        const unmapped = new Set();
        rows.forEach((row) => {
          const original = String(row['University'] || '').trim();
          if (!original || ['withdrawn', 'others', 'other', '-'].includes(original.toLowerCase())) return;
          const matched = findUniversityByName(original);
          if (!matched) unmapped.add(original);
          else row['University'] = matched.university;
        });
        
        if (unmapped.size > 0) {
          setPendingPreImportData(rows);
          pendingDataRef.current = rows;
          setResolvingUnies(Array.from(unmapped));
          return;
        }
        await processImportData(rows);
      } catch (err) { showToast('error', `Import failed: ${err.message}`); }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleResolveOneRow = async (oldName, newName, action) => {
    const resolved = action === 'ADD'
      ? newName.trim()
      : (findUniversityByName(newName)?.university || newName.trim());

    if (action === 'ADD') {
      try {
        const result = await Promise.race([
          db.upsertQSRankings([{
            university: resolved, rank_latest: null, rank_prev: null, location: '', subject: ''
          }]),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
        ]);
        if (result?.error) console.warn('[RESOLVE] QS upsert error:', result.error.message);
      } catch (err) {
        console.warn('[RESOLVE] QS upsert failed:', err.message);
      }
    }

    try {
      await Promise.race([
        addCustomMapping(oldName, resolved),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
      ]);
    } catch (err) {
      console.warn('[RESOLVE] Mapping failed:', err.message);
    }

    const updated = (pendingDataRef.current || []).map(row =>
      normalizeUniKey(row['University']) === normalizeUniKey(oldName)
        ? { ...row, University: resolved }
        : row
    );
    pendingDataRef.current = updated;
    setPendingPreImportData(updated);
  };

  const handleFinishResolve = async () => {
    setResolvingUnies([]);
    const rows = pendingDataRef.current;
    pendingDataRef.current = null;
    setPendingPreImportData(null);
    if (rows) {
      await processImportData(rows);
    }
  };

  const handleCloseResolveModal = () => {
    setResolvingUnies([]);
    pendingDataRef.current = null;
    setPendingPreImportData(null);
  };

  const advanceConflict = async () => {
    const next = conflictIndex + 1;
    if (next >= pendingImport?.conflicts.length) {
      setPendingImport(null); setConflictIndex(0); await refreshData();
      showToast('success', 'Import complete.');
    } else { setConflictIndex(next); }
  };

  const handleConflictMerge = async (selectedApps) => {
    const conflict = pendingImport.conflicts[conflictIndex];
    const sourceApps = Array.isArray(selectedApps) ? selectedApps : (conflict.newApps || []);
    const apps = sourceApps.map((a) => ({ ...a, student_id: conflict.existing.id }));
    
    if (apps.length > 0) {
      const result = await upsertApplications(apps);
      if (!result.success) {
        showToast('error', `Failed to merge applications: ${result.error}`);
        return;
      }
    }
    await advanceConflict();
  };

  const handleConflictImportAll = async () => {
    const conflict = pendingImport.conflicts[conflictIndex];
    const apps = (conflict.imported.applications || []).map((a) => ({ ...a, student_id: conflict.existing.id }));
    if (apps.length > 0) {
      const result = await upsertApplications(apps);
      if (!result.success) {
        showToast('error', `Failed to import applications: ${result.error}`);
        return;
      }
    }
    await advanceConflict();
  };

  const handleConflictMergeAll = async () => {
    if (isMergingAllConflicts) return;
    setIsMergingAllConflicts(true);
    showToast('info', 'Merging all conflicts, please wait...');
    
    try {
      const remaining = pendingImport.conflicts.slice(conflictIndex);
      const allNewApps = [];
      
      for (const conflict of remaining) {
        const apps = (conflict.newApps || []).map((a) => ({ 
          ...a, 
          student_id: conflict.existing.id 
        }));
        allNewApps.push(...apps);
      }
      
      let processedCount = 0;
      if (allNewApps.length > 0) {
        const CHUNK_SIZE = 25;
        for (let i = 0; i < allNewApps.length; i += CHUNK_SIZE) {
          const chunk = allNewApps.slice(i, i + CHUNK_SIZE);
          const result = await upsertApplications(chunk);
          
          if (!result.success) {
            const errorMsg = `Bulk merge failed at batch ${Math.floor(i/CHUNK_SIZE) + 1} (Apps ${i+1}-${Math.min(i+CHUNK_SIZE, allNewApps.length)}). Error: ${result.error}`;
            showToast('error', errorMsg);
            break; 
          }
          processedCount += chunk.length;
          if (allNewApps.length > CHUNK_SIZE) {
            showToast('info', `Merging... ${processedCount} of ${allNewApps.length} done.`);
          }
        }
        if (processedCount === 0) return; 
      }
      
      setPendingImport(null); 
      setConflictIndex(0); 
      await refreshData();
      showToast('success', `Bulk import partially/fully complete. Processed ${processedCount} apps.`);
    } catch (err) {
      showToast('error', `Bulk merge encountered an error: ${err.message}`);
    } finally { 
      setIsMergingAllConflicts(false); 
    }
  };

  return {
    exportModal, setExportModal,
    pendingPreImportData,
    resolvingUnies,
    pendingImport,
    conflictIndex,
    isMergingAllConflicts,
    importInputRef,
    executeExport,
    handleImportXL,
    handleResolveOneRow,
    handleFinishResolve,
    handleCloseResolveModal,
    advanceConflict,
    handleConflictMerge,
    handleConflictImportAll,
    handleConflictMergeAll
  };
};
