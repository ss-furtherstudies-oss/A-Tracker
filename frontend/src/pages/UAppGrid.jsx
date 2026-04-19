import React, { useState, useMemo, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Search, Download, Upload, ChevronDown, ChevronRight, Check, X, Users } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { useQS } from '../context/QSContext';
import { useStudents } from '../context/StudentContext';
import { useAuth } from '../context/AuthContext';
import ResolveUniversitiesModal from '../components/modals/ResolveUniversitiesModal';

const UAPP_STORAGE_KEY = 'atracker_uapp';


const EditableCell = ({ value, onSave, className = "" }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(value);

  const handleBlur = () => {
    setIsEditing(false);
    if (val !== value) onSave(val);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleBlur();
    if (e.key === 'Escape') {
      setVal(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
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

const CollapsibleRow = ({ student, toggleFinalDest, onUpdateApp, index }) => {
  const { findRankByName } = useQS();
  const [expanded, setExpanded] = useState(false);
  const currentYear = new Date().getFullYear();
  const isAlumni = parseInt(student.grad_year) < 2026; // Set to 2026 as per mock data context

  return (
    <>
      {/* Parent Row */}
      <tr className={`border-b border-gray-100 hover:bg-slate-100 transition-colors group cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`} onClick={() => setExpanded(!expanded)}>
        <td className="px-4 py-1.5 text-center text-aura-teal">
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </td>
        <td className="px-4 py-1.5 font-bold text-gray-500 text-center">{student.grad_year}</td>
        <td className="px-4 py-1.5 font-semibold text-slateBlue-800">{student.student_num}</td>
        <td className="px-4 py-1.5 font-bold text-slateBlue-800">
          <div className="flex flex-col">
            <span>{student.person.name_en} {student.person.other_name && `(${student.person.other_name})`}</span>
            <span className="text-[11px] text-gray-400 font-semibold">{student.person.name_zh}</span>
          </div>
        </td>
        {/* QS Rank */}
        <td className="px-1 py-1.5 text-center align-top">
          <span className="text-[16px] font-black text-slateBlue-800">
            {student.final_dest_uni ? (findRankByName(student.final_dest_uni) || '-') : '-'}
          </span>
        </td>
        <td className="px-2 py-1.5 text-[11px] font-bold text-slateBlue-700 w-72 max-w-[250px] break-words whitespace-normal align-top">
          {student.final_dest_uni || '-'}
        </td>
        <td className="px-2 py-1.5 text-[11px] text-gray-500 w-72 max-w-[250px] align-top">
          <div className="font-semibold text-slateBlue-800 break-words whitespace-normal">{student.final_dest_prog || '-'}</div>
          {student.final_dest_cond && (
            <div className="text-[10px] text-gray-400 mt-1 leading-tight break-words whitespace-normal font-medium" title={student.final_dest_cond}>
              {student.final_dest_cond}
            </div>
          )}
        </td>
        <td className="px-2 py-1.5 text-center">
          <div className="text-[10px] font-bold text-gray-400">{student.applications.length} Apps</div>
          {student.last_update && <div className="text-[9px] text-gray-400/70 font-semibold mt-0.5">{student.last_update}</div>}
        </td>
      </tr>

      {/* Child Apps Table */}
      {expanded && (
        <tr className="bg-gray-50/80 border-b border-gray-200">
          <td colSpan="7" className="p-0 border-l-4 border-aura-teal">
            <div className="p-4 pl-12 overflow-x-auto">
              <table className="w-full text-left text-xs bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden table-fixed">
                <thead className="bg-slateBlue-100/30 text-gray-500 uppercase font-black text-[10px] tracking-widest border-b border-gray-100">
                  <tr>
                    <th className="p-3 w-16">Loc</th>
                    <th className="p-3 w-48">University</th>
                    <th className="p-3 w-16 text-center">QS</th>
                    <th className="p-3 w-40">Program</th>
                    <th className="p-3 w-20">Quali</th>
                    <th className="p-3 w-20 text-center">Prog Rank</th>
                    <th className="p-3 w-16 text-center">Offer?</th>
                    <th className="p-3 w-28">AS Grades</th>
                    <th className="p-3 w-64 max-w-[250px]">Condition</th>
                    <th className="p-3 w-32">Decision</th>
                    <th className="p-3 w-20 text-center">Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {student.applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slateBlue-50/30 transition-colors">
                      <td className="p-3 font-bold text-gray-500">
                        <EditableCell 
                          value={app.country} 
                          onSave={(val) => onUpdateApp(student.id, app.id, 'country', val)} 
                        />
                      </td>
                      <td className="p-3 font-bold text-slateBlue-700">
                        <EditableCell 
                          value={app.university} 
                          onSave={(val) => onUpdateApp(student.id, app.id, 'university', val)} 
                        />
                      </td>
                      <td className="p-3 text-center text-[15px] font-bold text-gray-400">
                        {(() => {
                          const qsRank = findRankByName(app.university) || (app.qs > 0 ? app.qs : null);
                          return qsRank ? (
                            <NavLink to="/rankings" className="hover:text-aura-teal hover:underline transition-colors title='Go to Rankings'">
                              {qsRank}
                            </NavLink>
                          ) : '-';
                        })()}
                      </td>
                      <td className="p-3 text-gray-600">
                        <EditableCell 
                          value={app.program} 
                          onSave={(val) => onUpdateApp(student.id, app.id, 'program', val)} 
                        />
                      </td>
                      <td className="p-3 text-gray-500 font-semibold">{app.quali}</td>
                      <td className="p-3 text-center text-gray-400">{app.prog_rank}</td>
                      <td className="p-3 text-center">
                        {app.has_offer && <Check size={18} className="text-[#10b981] mx-auto" strokeWidth={3} />}
                      </td>
                      <td className="p-3 text-gray-600 font-bold whitespace-nowrap">{!isAlumni ? student.as_grades : ''}</td>
                      <td className="p-3 text-gray-500 leading-tight break-words whitespace-normal w-64 max-w-[250px]">
                        <EditableCell 
                          value={app.condition} 
                          onSave={(val) => onUpdateApp(student.id, app.id, 'condition', val)} 
                        />
                      </td>
                      <td className="p-3 font-semibold text-slateBlue-800">{app.decision}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFinalDest(student.id, app.id); }}
                          className={`w-5 h-5 rounded flex items-center justify-center border mx-auto transition-colors ${app.is_final ? 'bg-aura-teal border-aura-teal text-white' : 'border-gray-300 hover:border-aura-teal'
                            }`}
                        >
                          {app.is_final && <Check size={14} strokeWidth={3} />}
                        </button>
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
  const { 
    students: sharedStudents, 
    uappData, 
    setUappData, 
    loading, 
    updateApplication, 
    addApplications, 
    refreshData 
  } = useStudents();
  const [localLoading, setLocalLoading] = useState(false);
  const { findUniversityByName } = useQS();

  // Group flat applications array by student_id
  const data = useMemo(() => {
    // Build a map: student_id -> [app, app, ...]
    const appsByStudent = new Map();
    uappData.forEach(app => {
      if (!app.student_id) return;
      if (!appsByStudent.has(app.student_id)) {
        appsByStudent.set(app.student_id, []);
      }
      appsByStudent.get(app.student_id).push(app);
    });

    return sharedStudents.map(s => {
      const apps = appsByStudent.get(s.id) || [];
      const finalApp = apps.find(a => a.is_final === true);
      
      // Fallback: if no is_final application, use student's university_dest / program_dest
      const finalUni = finalApp?.university || s.university_dest || '';
      const finalProg = finalApp?.program || s.program_dest || '';

      return {
        id: s.id,
        student_num: s.student_num,
        grad_year: String(s.grad_year || ''),
        person: {
          name_en: s.name_en || s.person?.name_en || '',
          name_zh: s.name_zh || s.person?.name_zh || '',
          other_name: s.other_name || s.person?.other_name || ''
        },
        final_dest_uni: finalUni,
        final_dest_prog: finalProg,
        final_dest_cond: finalApp?.condition || s.final_dest_cond || '',
        last_update: s.updated_at || '',
        as_grades: s.ias_score || '',
        applications: apps
      };
    });
  }, [sharedStudents, uappData]);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('All');
  const [filterFinalOnly, setFilterFinalOnly] = useState(false);
  const [importMsg, setImportMsg] = useState(null);

  // Generate Flat Excel Template
  const handleExportTemplate = () => {
    const headers = [
      'Grad Year', 'Student ID', 'Class', 'English Name', 'Chinese Name', 'Other Name',
      'Country', 'University', 'Program', 'Quali',
      'Offer Type', 'Conditions', 'Decision', 'Final Destination'
    ];

    // Five blank default rows
    const defaultRow = new Array(headers.length).fill('');
    const sheetData = [headers, defaultRow, defaultRow, defaultRow, defaultRow, defaultRow];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    ws['!views'] = [{ state: "frozen", xSplit: 0, ySplit: 1 }];
    ws['!cols'] = headers.map(h => ({ wch: 18 }));

    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[cellAddress]) ws[cellAddress] = { t: 's', v: '' };
      ws[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFFFF" } },
        fill: { fgColor: { rgb: "FF475569" } },
        alignment: { vertical: "center", horizontal: "center" }
      };
    }

    XLSX.utils.book_append_sheet(wb, ws, "U-App Data");
    XLSX.writeFile(wb, "Template_UApp.xlsx");
  };

  const handleDownloadAll = () => {
     const headers = [
      'Grad Year', 'Student ID', 'Class', 'English Name', 'Chinese Name', 'Other Name',
      'Country', 'University', 'Program', 'Quali',
      'Offer Type', 'Conditions', 'Decision', 'Final Destination'
    ];

    const rows = [];
    data.forEach(s => {
       if (s.applications.length === 0) {
          // Export at least student info if no apps
          rows.push([
             s.grad_year, s.student_num, '', s.person.name_en, s.person.name_zh, s.person.other_name,
             '', '', '', '', '', '', '', ''
          ]);
       } else {
          s.applications.forEach(app => {
             rows.push([
                s.grad_year, s.student_num, '', s.person.name_en, s.person.name_zh, s.person.other_name,
                app.country, app.university, app.program, app.quali,
                app.has_offer ? 'Y' : 'N', app.condition, app.decision, app.is_final ? 'Y' : 'N'
             ]);
          });
       }
    });

    const sheetData = [headers, ...rows];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    ws['!views'] = [{ state: "frozen", xSplit: 0, ySplit: 1 }];
    ws['!cols'] = headers.map(h => ({ wch: 20 }));

    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[cellAddress]) ws[cellAddress] = { t: 's', v: '' };
      ws[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFFFF" } },
        fill: { fgColor: { rgb: "FF334155" } },
        alignment: { vertical: "center", horizontal: "center" }
      };
    }

    XLSX.utils.book_append_sheet(wb, ws, "UAppBackup");
    XLSX.writeFile(wb, `Atracker_UApp_Backup_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Conflict resolution state
  const [pendingPreImportData, setPendingPreImportData] = useState(null);
  const [resolvingUnies, setResolvingUnies] = useState([]);
  const [pendingImport, setPendingImport] = useState(null); // { conflicts: [], newStudents: [] }
  const [conflictIndex, setConflictIndex] = useState(0);

  // Excel Batch Import Handler
  const handleImportXL = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // reset so same file can be re-imported

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (rows.length === 0) {
          setImportMsg({ type: 'warn', text: 'The imported file contains no data rows.' });
          return;
        }

        // Parse rows into a Map keyed by student_num
        const studentMap = new Map();
        const unmapped = new Set();

        rows.forEach((row, idx) => {
          const gradYear = String(row['Grad Year'] || '').trim();
          const studentId = String(row['Student ID'] || '').trim();
          const nameEn = String(row['English Name'] || '').trim();
          const nameZh = String(row['Chinese Name'] || '').trim();
          const otherName = String(row['Other Name'] || '').trim();
          const country = String(row['Country'] || '').trim();
          const program = String(row['Program'] || '').trim();
          const quali = String(row['Quali'] || '').trim();
          const offerRaw = String(row['Offer Type'] || '').trim().toLowerCase();
          const hasOffer = offerRaw === 'true' || offerRaw === 'yes' || offerRaw === '1' || offerRaw === 'y';
          const condition = String(row['Conditions'] || '').trim();
          const decision = String(row['Decision'] || '').trim();
          const finalDest = String(row['Final Destination'] || '').trim().toLowerCase();
          const isFinal = finalDest === 'true' || finalDest === 'yes' || finalDest === '1' || finalDest === 'y';
          
          let university = String(row['University'] || '').trim();
          const skippedNames = ['withdrawn', 'others', 'other', '-'];

          // Skip completely empty rows
          if (!studentId && !nameEn && !university) return;

          if (university && !skippedNames.includes(university.toLowerCase())) {
             const u = findUniversityByName(university);
             if (!u) {
                 unmapped.add(university);
             } else {
                 university = u.university;
                 row['University'] = university; // Update row data for subsequent processing
             }
          }

          if (!studentMap.has(studentId)) {
            studentMap.set(studentId, {
              id: `import-${studentId}-${Date.now()}`,
              student_num: studentId,
              grad_year: gradYear,
              person: { name_en: nameEn, name_zh: nameZh, other_name: otherName },
              final_dest_uni: '',
              final_dest_prog: '',
              final_dest_cond: '',
              last_update: new Date().toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
              as_grades: '',
              applications: []
            });
          }

          const student = studentMap.get(studentId);
          const appEntry = {
            id: `app-${studentId}-${idx}-${Date.now()}`,
            country,
            university,
            qs: 0,
            program,
            quali,
            prog_rank: '-',
            has_offer: hasOffer,
            condition,
            decision,
            is_final: isFinal
          };

          student.applications.push(appEntry);

          if (isFinal) {
            student.final_dest_uni = university;
            student.final_dest_prog = program;
            student.final_dest_cond = condition;
          }
        });

        const unmappedArr = Array.from(unmapped);
        if (unmappedArr.length > 0) {
           setPendingPreImportData(rows);
           setResolvingUnies(unmappedArr);
           return;
        }

        processImportData(rows);

      } catch (err) {
        console.error('Import error:', err);
        setImportMsg({ type: 'error', text: `Import failed: ${err.message}` });
        setTimeout(() => setImportMsg(null), 5000);
      }
    };
    reader.readAsBinaryString(file);
  };

  const processImportData = async (rows) => {
    try {
      const studentMap = new Map();

      rows.forEach((row, idx) => {
        const gradYear = parseInt(row['Grad Year'] || '0');
        const studentId = String(row['Student ID'] || '').trim();
        const nameEn = String(row['English Name'] || '').trim();
        const nameZh = String(row['Chinese Name'] || '').trim();
        const otherName = String(row['Other Name'] || '').trim();
        const country = String(row['Country'] || '').trim();
        const university = String(row['University'] || '').trim();
        const program = String(row['Program'] || '').trim();
        const quali = String(row['Quali'] || '').trim();
        const offerRaw = String(row['Offer Type'] || '').trim().toLowerCase();
        const hasOffer = offerRaw === 'true' || offerRaw === 'yes' || offerRaw === '1' || offerRaw === 'y';
        const condition = String(row['Conditions'] || '').trim();
        const decision = String(row['Decision'] || '').trim();
        const finalDest = String(row['Final Destination'] || '').trim().toLowerCase();
        const isFinal = finalDest === 'true' || finalDest === 'yes' || finalDest === '1' || finalDest === 'y';

        if (!studentId && !nameEn && !university) return;

        if (!studentMap.has(studentId)) {
          studentMap.set(studentId, {
            student_num: studentId,
            grad_year: gradYear,
            name_en: nameEn,
            name_zh: nameZh,
            status: 'APPLICANT',
            applications: []
          });
        }

        const student = studentMap.get(studentId);
        student.applications.push({
          country,
          university,
          program,
          is_final: isFinal,
          status: hasOffer ? 'OFFER' : 'PENDING',
          condition,
          decision
        });
      });

      const clarifications = [];
      const newStudentsWithApps = [];

      for (const [studentId, imported] of studentMap.entries()) {
        const existing = sharedStudents.find(s => s.student_num === studentId);
        
        if (existing) {
          clarifications.push({ 
            existing, 
            imported: { ...imported, id: existing.id }, 
            reason: 'ID MATCHED', 
            type: 'EXISTING' 
          });
        } else {
          newStudentsWithApps.push(imported);
        }
      }

      // 1. Process Brand New Students
      if (newStudentsWithApps.length > 0) {
        setLocalLoading(true);
        for (const sData of newStudentsWithApps) {
          // Create Student
          const { data: newS, error: sErr } = await supabase
            .from('students')
            .insert({
              student_num: sData.student_num,
              name_en: sData.name_en,
              name_zh: sData.name_zh,
              grad_year: sData.grad_year,
              status: sData.status
            })
            .select()
            .single();
          
          if (!sErr && newS) {
            // Create Applications for this student
            const apps = sData.applications.map(a => ({ ...a, student_id: newS.id }));
            await addApplications(apps);
          }
        }
        setLocalLoading(false);
      }

      // 2. Show Modal for Existing/Conflict students
      if (clarifications.length > 0) {
        setPendingImport({ conflicts: clarifications, newCount: newStudentsWithApps.length });
        setConflictIndex(0);
      } else {
        setImportMsg({ type: 'success', text: `Imported ${newStudentsWithApps.length} new student(s). Refreshing...` });
        refreshData();
        setTimeout(() => setImportMsg(null), 5000);
      }

    } catch (err) {
      console.error('Import processing error:', err);
      setImportMsg({ type: 'error', text: `Import failed: ${err.message}` });
      setLocalLoading(false);
    }
  };

  const handleResolveUniversity = (oldName, newName) => {
    if (pendingPreImportData) {
       setPendingPreImportData(prev => {
          const newData = [...prev];
          newData.forEach(row => {
             if (String(row['University']).trim() === oldName) row['University'] = newName;
          });
          return newData;
       });
    }
  };

  const handleCloseResolveModal = () => {
     setResolvingUnies([]);
     if (pendingPreImportData) {
        processImportData(pendingPreImportData);
        setPendingPreImportData(null);
     }
  };

  // Conflict resolution handlers
  const handleConflictMerge = () => {
    const conflict = pendingImport.conflicts[conflictIndex];
    
    // Transform applications to use student's database ID
    const appsToInsert = conflict.imported.applications.map(app => ({
      student_id: conflict.existing.id,
      university: app.university,
      program: app.program,
      country: app.country,
      status: app.has_offer ? 'OFFER' : 'PENDING',
      is_final: app.is_final
    }));

    addApplications(appsToInsert).then(() => {
      advanceConflict();
    });
  };

  const handleConflictSkip = () => {
    advanceConflict();
  };

  const advanceConflict = () => {
    const next = conflictIndex + 1;
    if (next >= pendingImport.conflicts.length) {
      // All conflicts resolved
      const merged = conflictIndex + 1; // we processed this many
      setImportMsg({ type: 'success', text: `Import complete. ${pendingImport.newCount} new student(s) added. ${merged} conflict(s) reviewed.` });
      setPendingImport(null);
      setConflictIndex(0);
      setTimeout(() => setImportMsg(null), 5000);
    } else {
      setConflictIndex(next);
    }
  };

  // Derive unique years for dropdown
  const gradYears = useMemo(() => {
    const years = new Set(data.map(s => s.grad_year).filter(Boolean));
    return ['All', ...Array.from(years).sort().reverse()];
  }, [data]);

  const toggleFinalDest = async (studentId, appId) => {
    const student = data.find(s => s.id === studentId);
    if (!student) return;

    const currentApp = student.applications.find(a => a.id === appId);
    if (!currentApp) return;
    const targetValue = !currentApp.is_final;

    try {
      if (targetValue === true) {
        const otherApps = student.applications.filter(a => a.is_final && a.id !== appId);
        for (const other of otherApps) {
          await updateApplication(studentId, other.id, { is_final: false });
        }
      }
      await updateApplication(studentId, appId, { is_final: targetValue });
    } catch (err) {
      console.error("Toggle final failed:", err);
    }
  };

  const handleUpdateAppField = async (studentId, appId, field, value) => {
    await updateApplication(studentId, appId, { [field]: value });
  };

  const filteredData = useMemo(() => {
    const filtered = data.filter(s => {
      const term = searchTerm.toLowerCase();
      // Year Filter — only filter if student has a grad_year AND it doesn't match
      if (yearFilter !== 'All' && s.grad_year && s.grad_year !== yearFilter) return false;
      // Final Dest Filter
      if (filterFinalOnly && (!s.final_dest_uni || s.final_dest_uni === '')) return false;
      // Search
      const matchName = `${s.person.name_en} ${s.person.name_zh} ${s.person.other_name}`.toLowerCase().includes(term);
      const matchId = s.student_num.toLowerCase().includes(term);
      const matchApps = s.applications.some(a =>
        a.university.toLowerCase().includes(term) ||
        a.program.toLowerCase().includes(term) ||
        a.country.toLowerCase().includes(term)
      );

      return term === '' || matchName || matchId || matchApps;
    });

    // Apply strict sorting: Year (DESC) -> Name (ASC)
    return filtered.sort((a, b) => {
      const getYear = (s) => {
        if (s.grad_year && !isNaN(parseInt(s.grad_year))) return parseInt(s.grad_year);
        const match = String(s.student_num || '').match(/^(\d{4})/);
        return match ? parseInt(match[1]) : 0;
      };
      const yearA = getYear(a);
      const yearB = getYear(b);
      if (yearA !== yearB) return yearB - yearA;

      const nameA = (a.person.name_en || '').trim().toLowerCase();
      const nameB = (b.person.name_en || '').trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [data, searchTerm, yearFilter, filterFinalOnly]);

  return (
    <div className="space-y-4">
      {/* Top Control Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-super shadow-sm border border-gray-100 gap-4">

        {/* Left Side: Dropdown + Search + Checkbox */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Year Dropdown */}
          <div className="relative">
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="appearance-none px-4 py-2 text-sm font-bold text-slateBlue-800 bg-slateBlue-100/50 rounded-super hover:bg-slateBlue-100 transition-all border border-transparent focus:border-aura-teal outline-none focus:ring-2 focus:ring-aura-teal/20 cursor-pointer pr-8"
            >
              {gradYears.map(y => <option key={y} value={y}>{y === 'All' ? 'All Years' : y}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-3 text-gray-500 pointer-events-none" />
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64 group">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-aura-teal transition-colors" />
            <input
              type="text"
              placeholder="Search student, uni, program..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-8 py-2 w-full text-sm border border-gray-200 rounded-super focus:outline-none focus:ring-2 focus:ring-aura-teal/20 bg-slateBlue-100/50 transition-all font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-aura-teal transition-colors"
                title="Clear Search"
              >
                <X size={14} strokeWidth={3} />
              </button>
            )}
          </div>

          {/* Filter Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer group text-sm font-bold text-gray-500 hover:text-slateBlue-800 transition-colors ml-2">
            <input
              type="checkbox"
              checked={filterFinalOnly}
              onChange={(e) => setFilterFinalOnly(e.target.checked)}
              className="rounded text-aura-teal focus:ring-aura-teal/20 cursor-pointer"
            />
            Has Final Dest
          </label>
        </div>

        {/* Right Side: Tools */}
        <div className="flex items-center gap-2">
          {role === 'ADMIN' && (
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slateBlue-800 rounded-super hover:bg-slateBlue-700 transition-all shadow-sm active:scale-95"
            >
              <Download size={14} /> DOWNLOAD FULL DATA
            </button>
          )}
          {role === 'ADMIN' && (
            <button
              onClick={handleExportTemplate}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-500 bg-white rounded-super hover:bg-gray-50 transition-all border border-gray-200 shadow-sm active:scale-95"
            >
              <Download size={14} /> TEMPLATE
            </button>
          )}
          {role === 'ADMIN' && (
            <label className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-500 bg-white rounded-super hover:bg-gray-50 transition-all border border-gray-200 shadow-sm cursor-pointer active:scale-95">
              <Upload size={14} /> BATCH IMPORT
              <input type="file" accept=".xlsx, .xls" onChange={handleImportXL} className="hidden" />
            </label>
          )}
        </div>
      </div>

      {/* Import Result Toast */}
      {importMsg && (
        <div className={`flex items-center justify-between px-4 py-3 rounded-super text-sm font-bold shadow-sm border ${importMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            importMsg.type === 'warn' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-red-50 text-red-700 border-red-200'
          }`}>
          <span>{importMsg.text}</span>
          <button onClick={() => setImportMsg(null)} className="ml-4 hover:opacity-70 transition-opacity">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slateBlue-800 border-collapse">
            <thead>
              <tr className="bg-slateBlue-800 border-b border-slateBlue-900 text-white uppercase font-black text-[10px] tracking-widest">
                <th className="px-3 py-2 w-10 text-center text-white/40">#</th>
                <th className="px-3 py-2 w-20 text-center">Year</th>
                <th className="px-3 py-2 w-28">Student ID</th>
                <th className="px-3 py-2 w-40">Name</th>
                <th className="px-2 py-2 w-10 text-center">QS</th>
                <th className="px-3 py-2 w-64 max-w-[250px]">Final Dest (Uni)</th>
                <th className="px-3 py-2 w-64 max-w-[250px]">Final Dest (Program)</th>
                <th className="px-3 py-2 w-20 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((student, idx) => (
                <CollapsibleRow 
                  key={student.id} 
                  student={student} 
                  toggleFinalDest={toggleFinalDest} 
                  onUpdateApp={handleUpdateAppField}
                  index={idx} 
                />
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-400 font-bold">No applications found matching your criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conflict Resolution Modal */}
      {pendingImport && pendingImport.conflicts[conflictIndex] && (() => {
        const c = pendingImport.conflicts[conflictIndex];
        const ex = c.existing;
        const im = c.imported;
        const reason = c.reason;
        
        return (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <div className="bg-white rounded-[1.5rem] shadow-2xl border border-gray-100 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className={`p-6 border-b border-gray-100 ${c.type === 'AMBIGUOUS' ? 'bg-gradient-to-r from-purple-50 to-indigo-50' : 'bg-gradient-to-r from-amber-50 to-orange-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slateBlue-800 flex items-center gap-2">
                       {c.type === 'AMBIGUOUS' ? <Users className="text-purple-600" /> : <div className="p-1 px-2 bg-amber-500 text-white text-[10px] rounded">MATCH</div>}
                       Import Clarification Required
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 font-medium">
                      Student <span className="font-black text-slateBlue-800 px-1.5 py-0.5 bg-white/80 rounded border border-gray-200 ml-1">{conflictIndex + 1} of {pendingImport.conflicts.length}</span> — {reason}
                    </p>
                  </div>
                </div>
              </div>

              {/* Comparison Table */}
              <div className="p-6 space-y-4">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slateBlue-100/30 text-gray-500 uppercase font-black text-[10px] tracking-widest">
                      <th className="p-3 w-32">Field</th>
                      <th className="p-3">Existing Record</th>
                      <th className="p-3">Incoming Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[
                      ['Name (EN)', ex.person.name_en, im.person.name_en],
                      ['Name (ZH)', ex.person.name_zh, im.person.name_zh],
                      ['Other Name', ex.person.other_name, im.person.other_name],
                      ['Grad Year', ex.grad_year, im.grad_year],
                      ['Applications', `${ex.applications.length} app(s)`, `${im.applications.length} new app(s)`],
                      ['Final Dest', ex.final_dest_uni || '-', im.final_dest_uni || '-'],
                    ].map(([label, exVal, imVal]) => (
                      <tr key={label} className={exVal !== imVal && imVal ? 'bg-amber-50/50' : ''}>
                        <td className="p-3 font-black text-gray-500 uppercase text-[10px] tracking-wide">{label}</td>
                        <td className="p-3 font-semibold text-slateBlue-800">{exVal || '-'}</td>
                        <td className="p-3 font-semibold text-slateBlue-800">
                          {imVal || '-'}
                          {exVal !== imVal && imVal && <span className="ml-2 text-[10px] font-bold text-amber-600">CHANGED</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Incoming Applications Preview */}
                <div className="mt-4">
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">New Applications to Add</h3>
                  <div className="space-y-1">
                    {im.applications.map((app, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs bg-slateBlue-100/30 px-3 py-2 rounded-lg">
                        <span className="font-bold text-gray-500">{app.country}</span>
                        <span className="font-bold text-slateBlue-700 flex-1">{app.university}</span>
                        <span className="text-gray-500">{app.program}</span>
                        {app.has_offer && <Check size={14} className="text-[#10b981]" strokeWidth={3} />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                <button
                  onClick={handleConflictSkip}
                  className="px-6 py-2.5 text-sm font-bold text-gray-500 bg-white rounded-super border border-gray-200 hover:bg-gray-50 transition-all active:scale-95"
                >
                  Skip (Keep Existing)
                </button>
                <button
                  onClick={handleConflictMerge}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-aura-teal rounded-super hover:opacity-90 transition-all shadow-sm active:scale-95"
                >
                  Merge Applications →
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* University Mapping Modal */}
      <ResolveUniversitiesModal 
        isOpen={resolvingUnies.length > 0} 
        onClose={handleCloseResolveModal} 
        unmappedNames={resolvingUnies} 
        onResolve={handleResolveUniversity} 
      />
    </div>
  );
};

export default UAppGrid;
