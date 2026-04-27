import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Search,
  Download,
  Upload,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Users,
  Edit2,
  Trash2,
  Plus,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { useQS } from '../context/QSContext';
import { useStudents } from '../context/StudentContext';
import { useAuth } from '../context/AuthContext';
import * as db from '../lib/supabaseService';
import ResolveUniversitiesModal from '../components/modals/ResolveUniversitiesModal';
import ApplicationEntryModal from '../components/modals/ApplicationEntryModal';

const isTruthyCell = (value) => {
  const v = String(value ?? '').trim().toLowerCase();
  return v === 'true' || v === 'yes' || v === '1' || v === 'y';
};
const normalizeUniKey = (value) => String(value ?? '').trim().toUpperCase();

const EditableCell = ({ value, onSave, className = '' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');

  const commit = async () => {
    setIsEditing(false);
    if ((draft ?? '') !== (value ?? '')) {
      await onSave(draft);
    }
  };

  if (isEditing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            setDraft(value ?? '');
            setIsEditing(false);
          }
        }}
        className={`w-full px-1 py-0.5 border border-aura-teal rounded bg-white text-slateBlue-800 outline-none ${className}`}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-slateBlue-50 rounded px-1 -mx-1 transition-colors min-h-[1.5em] ${className}`}
    >
      {value || '-'}
    </div>
  );
};

const CollapsibleRow = ({ student, index, onToggleFinal, onUpdateApp, onDeleteApp, onEditApp, onAddApp }) => {
  const { findRankByName } = useQS();
  const [expanded, setExpanded] = useState(false);
  const isAlumni = Number(student.grad_year) < new Date().getFullYear();

  return (
    <>
      <tr
        className={`group cursor-pointer border-b border-gray-100 transition-colors hover:bg-slate-100 ${
          index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
        }`}
        onClick={() => setExpanded((p) => !p)}
      >
        <td className="px-3 py-2 text-center text-aura-teal">
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </td>
        <td className="px-3 py-2 text-center text-[11px] font-bold text-gray-500">{student.grad_year}</td>
        <td className="px-3 py-2 text-[11px] font-bold text-slateBlue-800">{student.student_num}</td>
        <td className="px-3 py-2 text-[11px] text-slateBlue-800">
          <div className="flex flex-col">
            <span className="font-bold">
              {student.person.name_en} {student.person.other_name ? `(${student.person.other_name})` : ''}
            </span>
            <span className="text-[10px] text-gray-400 font-semibold">{student.person.name_zh || '-'}</span>
          </div>
        </td>
        <td className="px-2 py-2 text-center text-[15px] font-black text-slateBlue-800">
          {student.final_dest_uni ? findRankByName(student.final_dest_uni) || '-' : '-'}
        </td>
        <td className="px-3 py-2 text-[11px] font-bold text-slateBlue-700 break-words">{student.final_dest_uni || '-'}</td>
        <td className="px-3 py-2 text-[11px] text-gray-600">
          <div className="font-semibold text-slateBlue-800 break-words">{student.final_dest_prog || '-'}</div>
          {student.final_dest_cond ? (
            <div className="text-[10px] text-gray-400 mt-1 leading-tight break-words">{student.final_dest_cond}</div>
          ) : null}
        </td>
        <td className="px-2 py-2 text-center">
          <div className="flex flex-col items-center">
            <div className="text-[10px] font-bold text-gray-400">{student.applications.length} Apps</div>
            <div className="text-[9px] text-gray-400/70 font-semibold mt-0.5">{student.last_update || '-'}</div>
          </div>
        </td>
        <td className="px-2 py-2 text-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddApp(student);
            }}
            title="Add Application"
            className="p-1.5 rounded-lg text-aura-teal hover:bg-aura-teal/10 opacity-0 group-hover:opacity-100 transition-all"
          >
            <Plus size={14} />
          </button>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-gray-50/80 border-b border-gray-200">
          <td colSpan="9" className="p-0 border-l-4 border-aura-teal">
            <div className="p-4 pl-10 overflow-x-auto">
              <table className="w-full text-left text-xs bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden table-fixed">
                <thead className="bg-slateBlue-100/30 text-gray-500 uppercase font-black text-[10px] tracking-widest border-b border-gray-100">
                  <tr>
                    <th className="p-3 w-14">Loc</th>
                    <th className="p-3 w-48">University</th>
                    <th className="p-3 w-14 text-center">QS</th>
                    <th className="p-3 w-40">Program</th>
                    <th className="p-3 w-16">Quali</th>
                    <th className="p-3 w-16 text-center">Offer</th>
                    <th className="p-3 w-24">AS</th>
                    <th className="p-3 w-56">Condition</th>
                    <th className="p-3 w-24">Decision</th>
                    <th className="p-3 w-16 text-center">Final</th>
                    <th className="p-3 w-20 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {student.applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slateBlue-50/40 transition-colors">
                      <td className="p-3 font-bold text-gray-500">
                        <EditableCell value={app.country} onSave={(v) => onUpdateApp(student.id, app.id, 'country', v)} />
                      </td>
                      <td className="p-3 font-bold text-slateBlue-700">
                        <EditableCell value={app.university} onSave={(v) => onUpdateApp(student.id, app.id, 'university', v)} />
                      </td>
                      <td className="p-3 text-center text-[15px] font-bold text-gray-400">
                        {(() => {
                          const rank = findRankByName(app.university) || (app.qs > 0 ? app.qs : null);
                          return rank ? (
                            <NavLink to="/rankings" className="hover:text-aura-teal hover:underline transition-colors">
                              {rank}
                            </NavLink>
                          ) : '-';
                        })()}
                      </td>
                      <td className="p-3 text-gray-600">
                        <EditableCell value={app.program} onSave={(v) => onUpdateApp(student.id, app.id, 'program', v)} />
                      </td>
                      <td className="p-3 text-gray-500 font-semibold">{app.quali || '-'}</td>
                      <td className="p-3 text-center">{app.has_offer ? <Check size={16} className="text-emerald-500 mx-auto" strokeWidth={3} /> : '-'}</td>
                      <td className="p-3 text-gray-600 font-bold whitespace-nowrap">{isAlumni ? '-' : student.as_grades || '-'}</td>
                      <td className="p-3 text-gray-500">
                        <EditableCell value={app.condition} onSave={(v) => onUpdateApp(student.id, app.id, 'condition', v)} />
                      </td>
                      <td className="p-3 font-semibold text-slateBlue-800">{app.decision || '-'}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFinal(student.id, app.id);
                          }}
                          className={`w-5 h-5 rounded flex items-center justify-center border mx-auto transition-colors ${
                            app.is_final
                              ? 'bg-aura-teal border-aura-teal text-white'
                              : 'border-gray-300 hover:border-aura-teal'
                          }`}
                          title="Toggle final destination"
                        >
                          {app.is_final ? <Check size={14} strokeWidth={3} /> : null}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditApp(student, app);
                            }}
                            className="p-1.5 text-slateBlue-400 hover:text-slateBlue-800 hover:bg-slateBlue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteApp(student.id, app.id);
                            }}
                            className="p-1.5 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

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
        final_dest_uni: finalApp?.university || s.university_dest || '',
        final_dest_prog: finalApp?.program || s.program_dest || '',
        final_dest_cond: finalApp?.condition || s.final_dest_cond || '',
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

  const executeExport = (type, targetYear) => {
    const headers = [
      'Grad Year',
      'Student ID',
      'Class',
      'English Name',
      'Chinese Name',
      'Other Name',
      'Country',
      'University',
      'Program',
      'Quali',
      'Offer Type',
      'Conditions',
      'Decision',
      'Final Destination'
    ];

    const targetStudents = data
      .filter((s) => targetYear === 'All' || String(s.grad_year) === String(targetYear))
      .sort((a, b) => (a.person.name_en || '').localeCompare(b.person.name_en || ''));

    let rows = [];
    let filename = '';

    if (type === 'FULL') {
      targetStudents.forEach((s) => {
        if (s.applications.length === 0) {
          rows.push([s.grad_year, s.student_num, '', s.person.name_en, s.person.name_zh, s.person.other_name, '', '', '', '', '', '', '', '']);
        } else {
          s.applications.forEach((app) => {
            rows.push([
              s.grad_year,
              s.student_num,
              '',
              s.person.name_en,
              s.person.name_zh,
              s.person.other_name,
              app.country || '',
              app.university || '',
              app.program || '',
              app.quali || '',
              app.has_offer ? 'Y' : 'N',
              app.condition || '',
              app.decision || '',
              app.is_final ? 'Y' : 'N'
            ]);
          });
        }
      });
      filename = `Full_UApp_Data_${targetYear}_${new Date().toISOString().split('T')[0]}.xlsx`;
    } else {
      rows = targetStudents.map((s) => [s.grad_year, s.student_num, '', s.person.name_en, s.person.name_zh, s.person.other_name, '', '', '', '', '', '', '', '']);
      filename = `Template_UApp_${targetYear}.xlsx`;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'U-App Data');
    XLSX.writeFile(wb, filename);
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

        const app = {
          country: String(row['Country'] || '').trim(),
          university: (() => {
            const rawUniversity = String(row['University'] || '').trim();
            const matched = findUniversityByName(rawUniversity);
            return matched?.university || rawUniversity;
          })(),
          program: String(row['Program'] || '').trim(),
          quali: String(row['Quali'] || '').trim(),
          condition: String(row['Conditions'] || '').trim(),
          decision: String(row['Decision'] || '').trim(),
          has_offer: isTruthyCell(row['Offer Type']),
          is_final: isTruthyCell(row['Final Destination']),
          status: isTruthyCell(row['Offer Type']) ? 'OFFER' : 'PENDING'
        };

        if (app.university || app.program || app.country) {
          studentMap.get(studentId).applications.push(app);
        }
      });

      const conflicts = [];
      const newStudents = [];

      for (const [sid, imported] of studentMap.entries()) {
        const existing = sharedStudents.find((s) => s.student_num === sid);
        if (existing) conflicts.push({ existing, imported });
        else newStudents.push(imported);
      }

      for (const student of newStudents) {
        const { data: created, error } = await db.insertStudent({
            student_num: student.student_num,
            name_en: student.name_en,
            name_zh: student.name_zh,
            other_name: student.other_name || null,
            grad_year: student.grad_year,
            status: 'APPLICANT'
          });

        if (error) continue;

        if (student.applications.length > 0) {
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
    } catch (err) {
      showToast('error', `Import failed: ${err.message}`);
    }
  };

  const handleImportXL = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setPendingImport(null);
    setConflictIndex(0);
    setPendingPreImportData(null);
    setResolvingUnies([]);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const dataArr = new Uint8Array(evt.target.result);
        const wb = XLSX.read(dataArr, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (rows.length === 0) {
          showToast('warn', 'No data rows found.');
          return;
        }

        const unmapped = new Set();
        rows.forEach((row) => {
          const original = String(row['University'] || '').trim();
          if (!original) return;
          if (['withdrawn', 'others', 'other', '-'].includes(original.toLowerCase())) return;
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
      } catch (err) {
        showToast('error', `Import failed: ${err.message}`);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleResolveUniversity = async (oldName, newName) => {
    const resolvedUniversity = findUniversityByName(newName)?.university || String(newName || '').trim();
    await addCustomMapping(oldName, resolvedUniversity);
    const oldKey = normalizeUniKey(oldName);
    setPendingPreImportData((prev) =>
      (prev || []).map((row) =>
        normalizeUniKey(row['University']) === oldKey
          ? { ...row, University: resolvedUniversity }
          : row
      )
    );
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
    if (!pendingImport) return;
    if (next >= pendingImport.conflicts.length) {
      setPendingImport(null);
      setConflictIndex(0);
      await refreshData();
      showToast('success', 'Import complete.');
      return;
    }
    setConflictIndex(next);
  };

  const handleConflictMerge = async () => {
    if (!pendingImport) return;
    try {
      const conflict = pendingImport.conflicts[conflictIndex];
      const apps = conflict.imported.applications.map((a) => ({ ...a, student_id: conflict.existing.id }));
      if (apps.length > 0) {
        const result = await addApplications(apps);
        if (!result?.success) throw new Error(result?.error || 'Failed to merge application data.');
      }
      await advanceConflict();
    } catch (err) {
      showToast('error', `Merge failed: ${err.message}`);
    }
  };

  const handleConflictSkip = async () => {
    await advanceConflict();
  };

  const handleConflictMergeAll = async () => {
    if (!pendingImport || isMergingAllConflicts) return;
    setIsMergingAllConflicts(true);
    try {
      const remainingConflicts = pendingImport.conflicts.slice(conflictIndex);
      let insertedApps = 0;
      for (const conflict of remainingConflicts) {
        const apps = conflict.imported.applications.map((a) => ({ ...a, student_id: conflict.existing.id }));
        if (apps.length > 0) {
          const result = await addApplications(apps);
          if (!result?.success) throw new Error(result?.error || 'Failed to merge application data.');
          insertedApps += apps.length;
        }
      }
      setPendingImport(null);
      setConflictIndex(0);
      await refreshData();
      showToast(
        'success',
        `Import complete. Merged ${remainingConflicts.length} conflict${remainingConflicts.length === 1 ? '' : 's'} and inserted ${insertedApps} application${insertedApps === 1 ? '' : 's'}.`
      );
    } catch (err) {
      showToast('error', `Merge all failed: ${err.message}`);
    } finally {
      setIsMergingAllConflicts(false);
    }
  };

  const handleUpdateAppField = async (studentId, appId, field, value) => {
    const result = await updateApplication(studentId, appId, { [field]: value });
    if (!result?.success) {
      showToast('error', `Update failed: ${result?.error || 'Unknown error'}`);
    }
  };

  const handleToggleFinal = async (studentId, appId) => {
    try {
      const student = data.find((s) => s.id === studentId);
      if (!student) return;
      const current = student.applications.find((a) => a.id === appId);
      if (!current) return;
      const targetValue = !current.is_final;

      if (targetValue) {
        const others = student.applications.filter((a) => a.is_final && a.id !== appId);
        for (const app of others) {
          const result = await updateApplication(studentId, app.id, { is_final: false });
          if (!result?.success) throw new Error(result?.error || 'Failed to clear previous final application.');
        }
      }

      {
        const result = await updateApplication(studentId, appId, { is_final: targetValue });
        if (!result?.success) throw new Error(result?.error || 'Failed to update final status.');
      }
      if (targetValue) {
        const { error } = await db.updateStudentById(studentId, {
            university_dest: current.university,
            program_dest: current.program,
            quali: current.quali || null
          });
        if (error) throw error;
      }
    } catch (err) {
      showToast('error', `Final update failed: ${err.message}`);
    }
  };

  const handleAddEntry = (student = null) => {
    setSelectedStudentForEntry(student);
    setEditingEntry(null);
    setIsEntryModalOpen(true);
  };

  const handleEditEntry = (student, app) => {
    setSelectedStudentForEntry(student);
    setEditingEntry(app);
    setIsEntryModalOpen(true);
  };

  const handleDeleteEntry = async (studentId, appId) => {
    if (!window.confirm('Delete this application?')) return;
    await deleteApplication(studentId, appId);
    await refreshData();
    showToast('success', 'Application deleted.');
  };

  const handleSaveEntry = async (entry) => {
    try {
      if (entry.is_final) {
        const apps = uappData.filter((a) => a.student_id === entry.student_id && a.id !== entry.id && a.is_final);
        for (const app of apps) {
          await updateApplication(entry.student_id, app.id, { is_final: false });
        }
      }

      if (entry.id) {
        const { id, student_id, ...updates } = entry;
        await updateApplication(student_id, id, updates);
      } else {
        await addApplications([entry]);
      }

      if (entry.is_final) {
        await db.updateStudentById(entry.student_id, {
            university_dest: entry.university,
            program_dest: entry.program,
            quali: entry.quali || null
          });
      }

      await refreshData();
      showToast('success', entry.id ? 'Application updated.' : 'Application added.');
      return true;
    } catch {
      showToast('error', 'Save failed.');
      return false;
    }
  };

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-40 bg-slateBlue-100 pt-2 pb-1">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-t-super shadow-sm border border-gray-100">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="appearance-none px-4 py-2 text-sm font-bold text-slateBlue-800 bg-slateBlue-100/50 rounded-super border border-transparent focus:border-aura-teal outline-none pr-8"
              >
                {gradYears.map((year) => (
                  <option key={year} value={year}>
                    {year === 'All' ? 'All Years' : year}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-3 text-gray-500 pointer-events-none" />
            </div>

            <div className="relative w-full sm:w-72 group">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-aura-teal transition-colors" />
              <input
                type="text"
                placeholder="Search names, ID, university, program..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 py-2 w-full text-sm border border-gray-200 rounded-super focus:outline-none focus:ring-2 focus:ring-aura-teal/20 bg-slateBlue-100/50 transition-all font-medium"
              />
              {searchTerm ? (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-aura-teal transition-colors">
                  <X size={16} />
                </button>
              ) : null}
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-500 whitespace-nowrap">
              <input
                type="checkbox"
                checked={filterFinalOnly}
                onChange={(e) => setFilterFinalOnly(e.target.checked)}
                className="rounded text-aura-teal"
              />
              Final Only
            </label>
          </div>

          {role === 'ADMIN' ? (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative inline-flex items-center">
                <Download size={14} className="absolute left-3 text-gray-400 pointer-events-none" />
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const type = e.target.value;
                    if (!type) return;
                    setExportModal({ isOpen: true, type });
                    e.target.value = '';
                  }}
                  className="appearance-none pl-9 pr-6 py-2 text-xs font-bold text-gray-500 bg-white rounded-super hover:bg-gray-50 transition-all border border-gray-200 shadow-sm cursor-pointer outline-none active:scale-95"
                >
                  <option value="" disabled>
                    DOWNLOAD...
                  </option>
                  <option value="FULL">Full U-App Data</option>
                  <option value="TEMPLATE">Blank Template</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-500 bg-white rounded-super hover:bg-gray-50 transition-all border border-gray-200 shadow-sm cursor-pointer active:scale-95"
              >
                <Upload size={14} /> BATCH IMPORT
              </button>
              <input ref={importInputRef} type="file" accept=".xlsx,.xls" onChange={handleImportXL} className="hidden" />

            </div>
          ) : null}
        </div>
      </div>

      {importMsg ? (
        <div
          className={`fixed top-6 right-6 z-[1000] flex items-center justify-between px-6 py-4 rounded-super text-sm font-bold shadow-2xl border ${
            importMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : importMsg.type === 'warn'
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <span>{importMsg.text}</span>
          <button onClick={() => setImportMsg(null)} className="ml-4 hover:opacity-70 transition-opacity">
            <X size={16} />
          </button>
        </div>
      ) : null}

      {pendingImport && pendingImport.conflicts[conflictIndex] ? (
        (() => {
          const c = pendingImport.conflicts[conflictIndex];
          const ex = c.existing;
          const im = c.imported;
          return (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
              <div className="bg-white rounded-[1.5rem] shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
                  <h2 className="text-lg font-black text-slateBlue-800">Duplicate Student ID</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Conflict {conflictIndex + 1} of {pendingImport.conflicts.length} -{' '}
                    <span className="font-bold text-slateBlue-800">{ex.student_num || im.student_num}</span>
                  </p>
                </div>
                <div className="p-6 space-y-3 text-xs">
                  <div className="grid grid-cols-3 gap-3 font-black text-gray-400 uppercase tracking-wider">
                    <div>Field</div>
                    <div>Existing</div>
                    <div>Imported</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="font-bold text-gray-500">Name</div>
                    <div className="font-semibold text-slateBlue-800">{ex.name_en || ex.person?.name_en || '-'}</div>
                    <div className="font-semibold text-slateBlue-800">{im.name_en || '-'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="font-bold text-gray-500">Grad Year</div>
                    <div className="font-semibold text-slateBlue-800">{ex.grad_year || '-'}</div>
                    <div className="font-semibold text-slateBlue-800">{im.grad_year || '-'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="font-bold text-gray-500">New Applications</div>
                    <div className="font-semibold text-slateBlue-800">-</div>
                    <div className="font-semibold text-slateBlue-800">{im.applications.length}</div>
                  </div>
                </div>
                <div className="p-6 flex items-center justify-between bg-gray-50/50 border-t border-gray-100">
                  <button
                    onClick={handleConflictSkip}
                    disabled={isMergingAllConflicts}
                    className="px-6 py-2.5 text-sm font-bold text-gray-500 bg-white rounded-super border border-gray-200 hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Skip
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleConflictMergeAll}
                      disabled={isMergingAllConflicts}
                      className="px-6 py-2.5 text-sm font-bold text-aura-teal bg-white rounded-super border border-aura-teal/30 hover:bg-aura-teal/5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isMergingAllConflicts ? 'Merging...' : 'Merge All'}
                    </button>
                    <button
                      onClick={handleConflictMerge}
                      disabled={isMergingAllConflicts}
                      className="px-6 py-2.5 text-sm font-bold text-white bg-aura-teal rounded-super hover:opacity-90 transition-all shadow-lg shadow-aura-teal/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Merge Applications
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      ) : null}

      <div className="bg-white rounded-b-[1.5rem] shadow-sm border border-gray-100 border-t-0 overflow-hidden w-full">
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
                <tr>
                  <td colSpan="9" className="px-4 py-16 text-center text-gray-400 font-bold">
                    Loading applications...
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((student, idx) => (
                  <CollapsibleRow
                    key={student.id}
                    student={student}
                    index={idx}
                    onToggleFinal={handleToggleFinal}
                    onUpdateApp={handleUpdateAppField}
                    onDeleteApp={handleDeleteEntry}
                    onEditApp={handleEditEntry}
                    onAddApp={handleAddEntry}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-4 py-24 text-center">
                    <div className="flex flex-col items-center text-gray-300">
                      <FileSpreadsheet size={56} className="mb-4 opacity-20" />
                      <p className="text-lg font-bold tracking-tight">No application records found.</p>
                      <p className="text-sm mt-1">Try adding a new entry or importing data.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ApplicationEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        onSave={handleSaveEntry}
        initialStudent={selectedStudentForEntry}
        initialApplication={editingEntry}
      />

      {exportModal.isOpen ? (
        <TemplateYearModal
          type={exportModal.type}
          onClose={() => setExportModal({ isOpen: false, type: null })}
          onConfirm={(year) => executeExport(exportModal.type, year)}
          availableYears={gradYears}
        />
      ) : null}

      <ResolveUniversitiesModal
        isOpen={resolvingUnies.length > 0}
        onClose={handleCloseResolveModal}
        unmappedNames={resolvingUnies}
        onResolve={handleResolveUniversity}
      />
    </div>
  );
};

const TemplateYearModal = ({ type, onClose, onConfirm, availableYears }) => {
  const yearOptions = useMemo(
    () => (type === 'TEMPLATE' ? availableYears.filter((y) => y !== 'All') : availableYears),
    [type, availableYears]
  );
  const [year, setYear] = useState(yearOptions[0] || '');

  useEffect(() => {
    setYear(yearOptions[0] || '');
  }, [yearOptions]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-100">
        <h3 className="text-xl font-black text-slateBlue-800 mb-2">{type === 'FULL' ? 'Export Data' : 'Export Template'}</h3>
        <p className="text-sm text-gray-500 mb-6">
          {type === 'TEMPLATE' ? 'Select a specific graduation year for this template.' : 'Select a graduation year to download.'}
        </p>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slateBlue-800 mb-6"
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y === 'All' ? 'All Years' : y}
            </option>
          ))}
        </select>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-gray-400 hover:bg-gray-100 rounded-xl">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(year)}
            disabled={!year}
            className="px-6 py-2 bg-aura-teal text-white text-xs font-bold rounded-xl shadow-lg shadow-aura-teal/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default UAppGrid;
