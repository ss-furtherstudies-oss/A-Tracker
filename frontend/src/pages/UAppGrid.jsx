import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { useQS } from '../context/QSContext';
import { useStudents } from '../context/StudentContext';
import { useAuth } from '../context/AuthContext';
import * as db from '../lib/supabaseService';
import ResolveUniversitiesModal from '../components/modals/ResolveUniversitiesModal';
import ApplicationEntryModal from '../components/modals/ApplicationEntryModal';
import UAppToolbar from '../components/uapp/UAppToolbar';
import UAppRow from '../components/uapp/UAppRow';
import { ImportConflictModal, TemplateYearModal } from '../components/uapp/UAppModals';

const isTruthyCell = (value) => {
  const v = String(value ?? '').trim().toLowerCase();
  return v === 'true' || v === 'yes' || v === '1' || v === 'y';
};
const normalizeUniKey = (value) => String(value ?? '').trim().toUpperCase();

const UAppGrid = () => {
  const { role } = useAuth();
  const { findUniversityByName, addCustomMapping } = useQS();
  const {
    students: sharedStudents,
    uappData,
    loading,
    updateApplication,
    addApplications,
    deleteApplication,
    clearAllApplications,
    refreshData
  } = useStudents();

  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [selectedStudentForEntry, setSelectedStudentForEntry] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('All');
  const [filterFinalOnly, setFilterFinalOnly] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const [exportModal, setExportModal] = useState({ isOpen: false, type: null });

  const [pendingPreImportData, setPendingPreImportData] = useState(null);
  const [resolvingUnies, setResolvingUnies] = useState([]);
  const [pendingImport, setPendingImport] = useState(null);
  const [conflictIndex, setConflictIndex] = useState(0);
  const [isMergingAllConflicts, setIsMergingAllConflicts] = useState(false);
  const importInputRef = useRef(null);
  const canEditApplications = role === 'ADMIN';

  const data = useMemo(() => {
    const appsByStudent = new Map();
    uappData.forEach((app) => {
      if (!app.student_id) return;
      if (!appsByStudent.has(app.student_id)) appsByStudent.set(app.student_id, []);
      appsByStudent.get(app.student_id).push(app);
    });

    return sharedStudents.map((s) => {
      const apps = appsByStudent.get(s.id) || [];
      const finalApp = apps.find((a) => a.is_final === true);
      return {
        id: s.id,
        student_num: s.student_num,
        grad_year: String(s.grad_year || ''),
        person: {
          name_en: s.name_en || s.person?.name_en || '',
          name_zh: s.name_zh || s.person?.name_zh || '',
          other_name: s.other_name || s.person?.other_name || ''
        },
        final_dest_uni: finalApp?.university || '',
        final_dest_prog: finalApp?.program || '',
        final_dest_cond: finalApp?.condition || '',
        last_update: s.updated_at || '',
        as_grades: s.ias_score || '',
        applications: apps
      };
    });
  }, [sharedStudents, uappData]);

  const gradYears = useMemo(() => {
    const years = new Set(data.map((s) => s.grad_year).filter((y) => y && y !== '0'));
    return ['All', ...Array.from(years).sort().reverse()];
  }, [data]);

  const filteredData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return data
      .filter((s) => {
        if (yearFilter !== 'All' && s.grad_year !== yearFilter) return false;
        if (filterFinalOnly && !s.final_dest_uni) return false;
        if (!term) return true;
        const inName = `${s.person.name_en} ${s.person.name_zh}`.toLowerCase().includes(term);
        const inId = String(s.student_num || '').toLowerCase().includes(term);
        const inApps = s.applications.some((a) => {
          if (filterFinalOnly && !a.is_final) return false;
          const u = String(a.university || '').toLowerCase();
          const p = String(a.program || '').toLowerCase();
          return u.includes(term) || p.includes(term);
        });
        return inName || inId || inApps;
      })
      .sort((a, b) => {
        if (a.grad_year !== b.grad_year) return Number(b.grad_year) - Number(a.grad_year);
        return (a.person.name_en || '').localeCompare(b.person.name_en || '');
      });
  }, [data, searchTerm, yearFilter, filterFinalOnly]);

  const showToast = (type, text) => {
    setImportMsg({ type, text });
    setTimeout(() => setImportMsg(null), 4000);
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to delete ALL application data? This action cannot be undone.')) {
      const result = await clearAllApplications();
      if (result?.success) {
        showToast('success', 'All application data has been cleared.');
        await refreshData();
      } else {
        showToast('error', `Clear data failed: ${result?.error || 'Unknown error'}`);
      }
    }
  };

  const executeExport = (type, targetYear) => {
    // 1. Updated Headers: Removed 'Class', swapped 'Chinese Name' and 'Other Name'
    const headers = [
      'Grad Year', 'Student ID', 'English Name', 'Other Name', 'Chinese Name', 
      'Country', 'University', 'Program', 'Quali', 'Offer Type', 'Conditions', 'Decision', 'Final Destination'
    ];

    // 2. Sorting: Sort by Grad Year (descending) first, then English Name (alphabetical)
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
          // Columns: Year, ID, Eng, Other, Chinese, ... (empty app fields)
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
      // Template only: No applications
      rows = targetStudents.map((s) => [
        s.grad_year, s.student_num, s.person.name_en, s.person.other_name, s.person.name_zh, 
        '', '', '', '', '', '', '', ''
      ]);
    }

    // 3. Export as CSV
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'U-App Data');
    
    // Using writeFile with bookType: 'csv' for automatic formatting
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
          studentMap.set(studentId, { student_num: studentId, grad_year: parseInt(row['Grad Year'] || '0', 10) || null, name_en: String(row['English Name'] || '').trim(), name_zh: String(row['Chinese Name'] || '').trim(), other_name: String(row['Other Name'] || '').trim(), applications: [] });
        }
        const app = { country: String(row['Country'] || '').trim(), university: (() => { const raw = String(row['University'] || '').trim(); return findUniversityByName(raw)?.university || raw; })(), program: String(row['Program'] || '').trim(), quali: String(row['Quali'] || '').trim(), condition: String(row['Conditions'] || '').trim(), decision: String(row['Decision'] || '').trim(), has_offer: isTruthyCell(row['Offer Type']), is_final: isTruthyCell(row['Final Destination']), status: isTruthyCell(row['Offer Type']) ? 'OFFER' : 'PENDING' };
        if (app.university || app.program || app.country) studentMap.get(studentId).applications.push(app);
      });
      const conflicts = [];
      const newStudents = [];
      for (const [sid, imported] of studentMap.entries()) {
        const existing = sharedStudents.find((s) => s.student_num === sid);
        if (!existing) { newStudents.push(imported); continue; }
        const existingApps = uappData.filter((a) => a.student_id === existing.id);
        const existingUniKeys = new Set(existingApps.map((a) => normalizeUniKey(a.university)).filter(Boolean));
        const seenImportUniKeys = new Set();
        const newApps = [];
        const duplicateApps = [];
        imported.applications.forEach((app) => {
          const uniKey = normalizeUniKey(app.university);
          if (!uniKey) { newApps.push(app); return; }
          if (seenImportUniKeys.has(uniKey) || existingUniKeys.has(uniKey)) { duplicateApps.push(app); return; }
          seenImportUniKeys.add(uniKey);
          newApps.push(app);
        });
        conflicts.push({ existing, imported, newApps, duplicateApps, duplicateUniversities: Array.from(new Set(duplicateApps.map((a) => String(a.university || '').trim()).filter(Boolean))) });
      }
      for (const student of newStudents) {
        const { data: created, error } = await db.insertStudent({ student_num: student.student_num, name_en: student.name_en, name_zh: student.name_zh, other_name: student.other_name || null, grad_year: student.grad_year, status: 'APPLICANT' });
        if (!error && student.applications.length > 0) {
          const apps = student.applications.map((a) => ({ ...a, student_id: created.id }));
          await addApplications(apps);
        }
      }
      if (conflicts.length > 0) {
        setPendingImport({ conflicts, newCount: newStudents.length });
        setConflictIndex(0);
        return;
      }
      await refreshData();
      showToast('success', `Import complete. Added ${newStudents.length} new student records.`);
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
          setResolvingUnies(Array.from(unmapped));
          return;
        }
        await processImportData(rows);
      } catch (err) { showToast('error', `Import failed: ${err.message}`); }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleCloseResolveModal = async () => {
    setResolvingUnies([]);
    if (pendingPreImportData) {
      const rows = pendingPreImportData;
      setPendingPreImportData(null);
      await processImportData(rows);
    }
  };

  const advanceConflict = async () => {
    const next = conflictIndex + 1;
    if (next >= pendingImport?.conflicts.length) {
      setPendingImport(null); setConflictIndex(0); await refreshData();
      showToast('success', 'Import complete.');
    } else { setConflictIndex(next); }
  };

  const handleConflictMerge = async () => {
    const conflict = pendingImport.conflicts[conflictIndex];
    const apps = (conflict.newApps || conflict.imported.applications || []).map((a) => ({ ...a, student_id: conflict.existing.id }));
    if (apps.length > 0) await addApplications(apps);
    await advanceConflict();
  };

  const handleConflictImportAll = async () => {
    const conflict = pendingImport.conflicts[conflictIndex];
    const apps = (conflict.imported.applications || []).map((a) => ({ ...a, student_id: conflict.existing.id }));
    if (apps.length > 0) await addApplications(apps);
    await advanceConflict();
  };

  const handleConflictMergeAll = async () => {
    if (isMergingAllConflicts) return;
    setIsMergingAllConflicts(true);
    try {
      const remaining = pendingImport.conflicts.slice(conflictIndex);
      for (const conflict of remaining) {
        const apps = (conflict.newApps || conflict.imported.applications || []).map((a) => ({ ...a, student_id: conflict.existing.id }));
        if (apps.length > 0) await addApplications(apps);
      }
      setPendingImport(null); setConflictIndex(0); await refreshData();
      showToast('success', 'Import complete.');
    } finally { setIsMergingAllConflicts(false); }
  };

  const handleUpdateAppField = async (studentId, appId, field, value) => {
    if (!canEditApplications) return;
    const result = await updateApplication(studentId, appId, { [field]: value });
    if (!result?.success) showToast('error', `Update failed: ${result?.error || 'Unknown error'}`);
  };

  const handleToggleFinal = async (studentId, appId) => {
    if (!canEditApplications) return;
    try {
      const student = data.find((s) => s.id === studentId);
      const current = student.applications.find((a) => a.id === appId);
      const targetValue = !current.is_final;
      if (targetValue) {
        const others = student.applications.filter((a) => a.is_final && a.id !== appId);
        for (const app of others) await updateApplication(studentId, app.id, { is_final: false });
      }
      await updateApplication(studentId, appId, { is_final: targetValue });
      if (targetValue) {
        await db.updateStudentById(studentId, { university_dest: current.university, program_dest: current.program, quali: current.quali || null });
      }
    } catch (err) { showToast('error', `Final update failed: ${err.message}`); }
  };

  const handleSaveEntry = async (entry) => {
    if (!canEditApplications) return false;
    try {
      if (entry.is_final) {
        const apps = uappData.filter((a) => a.student_id === entry.student_id && a.id !== entry.id && a.is_final);
        for (const app of apps) await updateApplication(entry.student_id, app.id, { is_final: false });
      }
      if (entry.id) {
        const { id, student_id, ...updates } = entry;
        await updateApplication(student_id, id, updates);
      } else {
        await addApplications([entry]);
      }
      if (entry.is_final) {
        await db.updateStudentById(entry.student_id, { university_dest: entry.university, program_dest: entry.program, quali: entry.quali || null });
      }
      await refreshData();
      showToast('success', entry.id ? 'Application updated.' : 'Application added.');
      return true;
    } catch { showToast('error', 'Save failed.'); return false; }
  };

  const handleDeleteEntry = async (studentId, appId) => {
    if (!canEditApplications || !window.confirm('Delete this application?')) return;
    try {
      const student = data.find((s) => s.id === studentId);
      const targetApp = student?.applications?.find((a) => a.id === appId);
      await deleteApplication(studentId, appId);
      if (targetApp?.is_final) {
        await db.updateStudentById(studentId, { university_dest: null, program_dest: null, quali: null });
      }
      showToast('success', 'Application deleted.');
    } catch (err) { showToast('error', `Delete failed: ${err.message}`); }
  };

  return (
    <div className="space-y-4">
      <UAppToolbar
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        yearFilter={yearFilter} setYearFilter={setYearFilter}
        gradYears={gradYears} filterFinalOnly={filterFinalOnly}
        setFilterFinalOnly={setFilterFinalOnly}
        onImportClick={() => importInputRef.current?.click()}
        onExportClick={() => setExportModal({ isOpen: true, type: 'FULL' })}
        onAddClick={() => { setEditingEntry(null); setSelectedStudentForEntry(null); setIsEntryModalOpen(true); }}
        onClearClick={handleClearAll}
        canEdit={canEditApplications}
      />
      <input ref={importInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImportXL} className="hidden" />

      {importMsg && (
        <div className={`fixed top-6 right-6 z-[1000] flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold shadow-2xl border ${
          importMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 
          importMsg.type === 'warn' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <span>{importMsg.text}</span>
          <button onClick={() => setImportMsg(null)} className="hover:opacity-70 transition-opacity"><X size={16} /></button>
        </div>
      )}

      <ImportConflictModal
        conflict={pendingImport?.conflicts[conflictIndex]}
        index={conflictIndex}
        total={pendingImport?.conflicts.length}
        isMergingAll={isMergingAllConflicts}
        onSkip={advanceConflict}
        onMerge={handleConflictMerge}
        onMergeAll={handleConflictMergeAll}
        onImportAll={handleConflictImportAll}
      />

      <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden w-full">
        <div className="overflow-auto max-h-[70vh]">
          <table className="w-full text-left text-xs text-slateBlue-800 border-collapse">
            <thead>
              <tr className="bg-slateBlue-800 text-white uppercase font-black text-[10px] tracking-widest sticky top-0 z-30 shadow-sm">
                <th className="px-3 py-2.5 w-10 text-center">#</th>
                <th className="px-3 py-2.5 w-20 text-center">Year</th>
                <th className="px-3 py-2.5 w-28">Student ID</th>
                <th className="px-3 py-2.5 w-48">Name</th>
                <th className="px-2 py-2.5 w-12 text-center">QS</th>
                <th className="px-3 py-2.5 w-64">Final Uni</th>
                <th className="px-3 py-2.5 w-64">Final Program</th>
                <th className="px-3 py-2.5 w-20 text-center">Stats</th>
                <th className="px-3 py-2.5 w-16 text-center">Act</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="9" className="px-4 py-16 text-center text-gray-400 font-bold">Loading applications...</td></tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((student, idx) => (
                  <UAppRow
                    key={student.id} student={student} index={idx}
                    onToggleFinal={handleToggleFinal} onUpdateApp={handleUpdateAppField}
                    onDeleteApp={handleDeleteEntry} onEditApp={(s, a) => { setSelectedStudentForEntry(s); setEditingEntry(a); setIsEntryModalOpen(true); }}
                    onAddApp={(s) => { setSelectedStudentForEntry(s); setEditingEntry(null); setIsEntryModalOpen(true); }}
                    canEdit={canEditApplications}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-4 py-24 text-center">
                    <div className="flex flex-col items-center text-gray-300">
                      <FileSpreadsheet size={56} className="mb-4 opacity-20" />
                      <p className="text-lg font-bold tracking-tight">No application records found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ApplicationEntryModal
        isOpen={isEntryModalOpen} onClose={() => setIsEntryModalOpen(false)}
        onSave={handleSaveEntry} initialStudent={selectedStudentForEntry} initialApplication={editingEntry}
      />

      {exportModal.isOpen && (
        <TemplateYearModal
          type={exportModal.type} onClose={() => setExportModal({ isOpen: false, type: null })}
          onConfirm={(year) => executeExport(exportModal.type, year)} availableYears={gradYears}
        />
      )}

      <ResolveUniversitiesModal
        isOpen={resolvingUnies.length > 0} onClose={handleCloseResolveModal}
        unmappedNames={resolvingUnies}
        onResolve={async (oldName, newName) => {
          const resolved = findUniversityByName(newName)?.university || String(newName || '').trim();
          await addCustomMapping(oldName, resolved);
          setPendingPreImportData(prev => prev?.map(row => normalizeUniKey(row['University']) === normalizeUniKey(oldName) ? { ...row, University: resolved } : row));
        }}
      />
    </div>
  );
};

export default UAppGrid;
