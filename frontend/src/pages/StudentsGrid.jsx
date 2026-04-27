import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Edit2, Trash2, Download, Upload, FileSpreadsheet, X, Globe, ArrowUpDown, ChevronUp, ChevronDown, Plus, AlertCircle } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx-js-style';
import { useQS } from '../context/QSContext';
import { useAuth } from '../context/AuthContext';
import * as db from '../lib/supabaseService';

const ScholarshipBadge = ({ type }) => {
  const map = {
    HKSES: { icon: '👑', color: 'bg-purple-100 text-purple-700' },
    WIRA: { icon: '🌟', color: 'bg-yellow-100 text-yellow-700' },
    JARDINE: { icon: '💎', color: 'bg-blue-100 text-blue-700' },
    SIR_EDWARD_YOUDE: { icon: '🏆', color: 'bg-green-100 text-green-700' },
    STUDENT_OF_THE_YEAR: { icon: '🎉', color: 'bg-pink-100 text-pink-700' },
    OTHER: { icon: '🏅', color: 'bg-gray-100 text-gray-700' },
    NONE: null
  };
  const badge = map[type];
  if (!badge) return <span className="text-gray-300">-</span>;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-medium leading-none whitespace-nowrap ${badge.color}`} title={type}>
      <span>{badge.icon}</span> <span>{type.replace(/_/g, ' ')}</span>
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const colors = {
    APPLICANT: 'bg-slateBlue-100 text-slateBlue-800',
    ENROLLED: 'bg-aura-teal/20 text-aura-teal',
    GRADUATED: 'bg-serene-indigo/20 text-serene-indigo',
    ALUMNI: 'bg-serene-indigo/20 text-serene-indigo',
    WITHDRAWN: 'bg-red-100 text-red-700',
  };
  const labels = {
    APPLICANT: 'Applicant',
    ENROLLED: 'Studying',
    GRADUATED: 'Grad',
    ALUMNI: 'Grad',
    WITHDRAWN: 'Withdrawn',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-tight whitespace-nowrap shadow-sm ${colors[status] || colors.APPLICANT}`} title={status}>
      {labels[status] || status}
    </span>
  );
};

import StudentEditModal from '../components/modals/StudentEditModal';
import ResolveUniversitiesModal from '../components/modals/ResolveUniversitiesModal';
import {
  IGCSE_SUBJECTS, IAS_SUBJECTS, IAL_SUBJECTS,
  IGCSE_BOARDS, IAS_BOARDS, IAL_BOARDS,
  IGCSE_SUBJECTS_LIST, IAS_SUBJECTS_LIST, IAL_SUBJECTS_LIST
} from '../constants/subjects';
import { useStudents } from '../context/StudentContext';

import { generateSummary } from '../utils/gradeUtils';
import { normalizeSubjectForImport } from '../utils/importUtils';

const GradeBadge = ({ text }) => {
  if (!text) return null;
  const t = text.trim();
  
  // Color Logic
  let color = 'text-gray-500';
  if (t.includes('A*') || t.includes('9')) color = 'text-emerald-900 font-black';
  else if (t.includes('A') || t.includes('8')) color = 'text-emerald-600 font-bold';
  else if (t.includes('B') || t.includes('7')) color = 'text-blue-600 font-bold';
  else if (t.includes('C') || t.includes('6') || t.includes('5')) color = 'text-amber-600 font-bold';
  else if (/[DEU]/.test(t) || /[1234]/.test(t)) color = 'text-red-800 font-black';
  else if (/\d+/.test(t)) color = 'text-slate-500 font-medium'; // Numeric grades fallback

  // Format numeric grades: "1x9" -> "1 × 9"
  const displayText = t.replace(/(\d+)x(\d+)/, '$1 × $2');
  
  return (
    <span className={`text-[12px] whitespace-nowrap leading-none ${color}`}>
      {displayText}
    </span>
  );
};

const SortableHeader = ({ label, sortKey, config, requestSort, className = "" }) => {
  const isActive = config.key === sortKey;
  return (
    <th 
      className={`px-3 py-2.5 cursor-pointer transition-colors group ${className}`}
      onClick={() => requestSort(sortKey)}
    >
      <div className={`flex items-center gap-1.5 ${className.includes('text-center') ? 'justify-center' : ''}`}>
        <span className="whitespace-nowrap">{label}</span>
        <div className="flex flex-col">
          {isActive ? (
            config.direction === 'asc' ? <ChevronUp size={10} className="text-aura-teal" /> : <ChevronDown size={10} className="text-aura-teal" />
          ) : (
            <ArrowUpDown size={10} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </div>
    </th>
  );
};

const StudentsGrid = () => {
  const { findRankByName, findUniversityByName, addCustomMapping } = useQS();
  const { user, role } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { students, upsertStudents, deleteStudent, setUappData } = useStudents();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'grad_year', direction: 'desc' });
  const [exportModal, setExportModal] = useState({ isOpen: false, type: null });
  const [selectedExportYear, setSelectedExportYear] = useState('All');
  const [selectedExportBoard, setSelectedExportBoard] = useState('');
  const [resolvingUnies, setResolvingUnies] = useState([]);

  const allYears = useMemo(() => {
    const years = new Set();
    students.forEach(s => {
      if (s.grad_year) years.add(s.grad_year);
      else if (s.student_num && s.student_num.length >= 4) {
        const year = s.student_num.substring(0, 4);
        if (!isNaN(year)) years.add(parseInt(year));
      }
    });
    return Array.from(years);
  }, [students]);

  // Conflict resolution state
  const [pendingPreImportData, setPendingPreImportData] = useState(null);
  const [pendingImport, setPendingImport] = useState(null); // { conflicts: [], newStudents: [] }
  const [conflictIndex, setConflictIndex] = useState(0);
  const [importStats, setImportStats] = useState({ total: 0, new: 0, merged: 0, skipped: 0 });
  const [importMsg, setImportMsg] = useState(null);

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this student profile? This will also remove their university application records.")) {
      await deleteStudent(id);
    }
  };

  const handleClearAll = async () => {
    if (confirm("⚠️ CRITICAL WARNING\n\nThis will permanently delete ALL student records AND university application data in the system.\n\nThis action cannot be undone. Continue?")) {
      await db.clearAllApplications();
      await db.clearAllStudents();
      
      window.location.reload(); // Hard refresh to clear everything
    }
  };

  const handleEdit = (id) => {
    const student = students.find(s => s.id === id);
    setEditingStudent(student);
  };

  const handleSaveStudent = async (updatedData) => {
    // Basic validation: Compulsory fields
    if (!updatedData.student_num || !updatedData.student_num.trim()) {
      return { success: false, error: "Student ID is compulsory." };
    }
    if (!updatedData.name_en || !updatedData.name_en.trim()) {
      return { success: false, error: "English Name is compulsory." };
    }

    // Only include columns that EXIST in the current Supabase schema.
    // Additional columns (academicData, dob, gender, etc.) will be added
    // after running the ALTER TABLE migration in Supabase SQL Editor.
    const studentToSave = {
      id: editingStudent?.id || undefined,
      grad_year: parseInt(updatedData.grad_year) || null,
      student_num: updatedData.student_num,
      name_en: updatedData.name_en,
      name_zh: updatedData.name_zh || null,
      other_name: updatedData.other_name || null,
      gender: updatedData.gender || null,
      dob: updatedData.dob || null,
      phone: updatedData.phone || null,
      social_media: updatedData.social_media || null,
      profile_picture: updatedData.profile_picture || null,
      quali: updatedData.quali || null,
      status: updatedData.status || editingStudent?.status || 'APPLICANT',
      ias_score: generateSummary(updatedData.ias),
      alevel_score: generateSummary(updatedData.ial),
      igcse_score: generateSummary(updatedData.igcse),
      ielts_score: updatedData.ielts?.overall || '',
      university_dest: updatedData.university_dest || '',
      program_dest: updatedData.program_dest || '',
      academicData: {
        igcse: updatedData.igcse || [],
        ias: updatedData.ias || [],
        ial: updatedData.ial || [],
        ielts: updatedData.ielts || { reading: '', writing: '', listening: '', speaking: '', overall: '' }
      }
    };

    const res = await upsertStudents([studentToSave]);
    if (res.success) {
      setEditingStudent(null);
      return { success: true };
    } else {
      return { success: false, error: res.error };
    }
  };

  const handleExportTemplate = (e) => {
    const type = e.target.value;
    if (!type) return;
    
    // Set default boards
    let defBoard = '';
    if (type === 'IGCSE') defBoard = 'CIE';
    else if (type === 'IAS' || type === 'IAL') defBoard = 'Pearson Edexcel';
    
    setSelectedExportBoard(defBoard);
    setExportModal({ isOpen: true, type });
    e.target.value = ''; // Reset dropdown
  };

  const executeExport = (type, targetYear, targetBoard) => {
    let headers = ['student_num', 'name_en'];
    let filename = '';
    let defaultRows = [];

    // Map column index to color for alternating subjects
    const colColors = {};
    const paletteEven = ["FFF8FAFC", "FFF1F5F9", "FFE2E8F0", "FFF1F5F9"];
    const paletteOdd = ["FFF1F5F9", "FFE2E8F0", "FFCBD5E1", "FFE2E8F0"];

    const makeBlankRows = (count, defaultBoard) => {
      return Array.from({ length: count }, () => {
        let row = new Array(headers.length).fill('');
        headers.forEach((h, i) => { if (h.endsWith('_board')) row[i] = defaultBoard; });
        return row;
      });
    };

    if (type === 'FULL') {
      headers = [
        'grad_year', 'student_num', 'name_en', 'name_zh', 'other_name', 'gender', 'dob', 'phone', 'social_media', 'status',
        'university_dest', 'quali', 'program_dest'
      ];
      filename = `Full_Atracker_Backup_${new Date().toISOString().split('T')[0]}.xlsx`;

      // IGCSE Section
      IGCSE_SUBJECTS_LIST.forEach(sub => {
        headers.push(`IG_${sub}_board`, `IG_${sub}_grade`, `IG_${sub}_score`);
      });
      for (let i = 1; i <= 5; i++) {
        headers.push(`IG_Other${i}_subject`, `IG_Other${i}_board`, `IG_Other${i}_grade`, `IG_Other${i}_score`);
      }

      // IAS Section
      IAS_SUBJECTS_LIST.forEach(sub => {
        headers.push(`AS_${sub}_board`, `AS_${sub}_grade`, `AS_${sub}_score`);
      });
      for (let i = 1; i <= 2; i++) {
        headers.push(`AS_Other${i}_subject`, `AS_Other${i}_board`, `AS_Other${i}_grade`, `AS_Other${i}_score`);
      }

      // IAL Section
      IAL_SUBJECTS_LIST.forEach(sub => {
        headers.push(`AL_${sub}_board`, `AL_${sub}_grade`, `AL_${sub}_score`);
      });
      for (let i = 1; i <= 2; i++) {
        headers.push(`AL_Other${i}_subject`, `AL_Other${i}_board`, `AL_Other${i}_grade`, `AL_Other${i}_score`);
      }

      // IELTS Section
      headers.push('reading', 'writing', 'listening', 'speaking', 'overall');

      defaultRows = students.map(s => {
        return headers.map(h => {
          if (h === 'grad_year') return s.grad_year;
          if (h === 'student_num') return s.student_num;
          if (h === 'name_en') return s.name_en || s.person?.name_en;
          if (h === 'name_zh') return s.name_zh || s.person?.name_zh;
          if (h === 'other_name') return s.other_name || s.person?.other_name;
          if (h === 'gender') return s.gender || s.person?.gender;
          if (h === 'dob') return s.dob || s.person?.dob;
          if (h === 'phone') return s.phone || s.person?.phone;
          if (h === 'social_media') return s.social_media || s.person?.social_media_urls?.ig;
          if (h === 'status') return s.status;
          if (h === 'university_dest') return s.university_dest;
          if (h === 'quali') return s.quali;
          if (h === 'program_dest') return s.program_dest;
          
          if (['reading', 'writing', 'listening', 'speaking', 'overall'].includes(h)) {
            return s.academicData?.ielts?.[h] || '';
          }

          if (h.startsWith('IG_')) {
            const parts = h.replace('IG_', '').split('_');
            const sub = parts[0]; 
            const field = parts[1];
            const found = s.academicData?.igcse?.find(a => a.subject === sub);
            if (found) {
              if (field === 'board') return found.board;
              if (field === 'grade') return found.grade;
              if (field === 'score') return found.value || found.score;
            }
          }
          if (h.startsWith('AS_')) {
            const parts = h.replace('AS_', '').split('_');
            const sub = parts[0]; 
            const field = parts[1];
            const found = s.academicData?.ias?.find(a => a.subject === sub);
            if (found) {
              if (field === 'board') return found.board;
              if (field === 'grade') return found.grade;
              if (field === 'score') return found.value || found.score;
            }
          }
          if (h.startsWith('AL_')) {
            const parts = h.replace('AL_', '').split('_');
            const sub = parts[0]; 
            const field = parts[1];
            const found = s.academicData?.ial?.find(a => a.subject === sub);
            if (found) {
              if (field === 'board') return found.board;
              if (field === 'grade') return found.grade;
              if (field === 'score') return found.value || found.score;
            }
          }
          return '';
        });
      });
    }
    // Strict filtering by graduation year and sort alphabetically by name
    const targetStudents = students
      .filter(s => targetYear === 'All' || String(s.grad_year) === String(targetYear))
      .sort((a, b) => {
        const nameA = (a.name_en || a.person?.name_en || '').trim();
        const nameB = (b.name_en || b.person?.name_en || '').trim();
        return nameA.localeCompare(nameB);
      });

    const getPreFilledRows = (cols, defaultB) => {
      if (targetYear === 'All' || targetStudents.length === 0) {
        return [new Array(cols.length).fill('')];
      }
      return targetStudents.map(s => {
        let row = new Array(cols.length).fill('');
        cols.forEach((h, i) => {
          if (h === 'grad_year') row[i] = s.grad_year || targetYear;
          if (h === 'student_num') row[i] = s.student_num;
          if (h === 'name_en') row[i] = s.name_en || s.person?.name_en;
          if (h === 'name_zh') row[i] = s.name_zh || s.person?.name_zh;
          if (h === 'other_name') row[i] = s.other_name || s.person?.other_name;
          if (h === 'gender') row[i] = s.gender || s.person?.gender;
          if (h === 'status') row[i] = s.status;
          
          // Existing Grade Pre-fill for IGCSE/IAS/IAL
          if (h.endsWith('_board') || h.endsWith('_grade') || h.endsWith('_score')) {
            const parts = h.split('_');
            const sub = parts[0];
            const field = parts[1];
            
            let source = [];
            if (type === 'IGCSE') source = s.academicData?.igcse || [];
            else if (type === 'IAS') source = s.academicData?.ias || [];
            else if (type === 'IAL') source = s.academicData?.ial || [];
            
            const found = source.find(a => a.subject === sub);
            if (found) {
              if (field === 'board') row[i] = found.board;
              if (field === 'grade') row[i] = found.grade;
              if (field === 'score') row[i] = found.value || found.score;
            } else if (field === 'board') {
              row[i] = defaultB; // Default board if not found
            }
          }

          // IELTS pre-fill
          if (type === 'IELTS') {
            if (h === 'reading') row[i] = s.academicData?.ielts?.reading || '';
            if (h === 'writing') row[i] = s.academicData?.ielts?.writing || '';
            if (h === 'listening') row[i] = s.academicData?.ielts?.listening || '';
            if (h === 'speaking') row[i] = s.academicData?.ielts?.speaking || '';
            if (h === 'overall') row[i] = s.academicData?.ielts?.overall || s.ielts_score || '';
          }
        });
        return row;
      });
    };

    if (type === 'PROFILE') {
      headers = ['grad_year', 'student_num', 'name_en', 'name_zh', 'other_name', 'dob', 'gender', 'phone', 'social_media', 'status'];
      filename = targetYear === 'All' ? 'Template_Profile.xlsx' : `Template_Profile_${targetYear}.xlsx`;
      defaultRows = getPreFilledRows(headers, '');
    } else if (type === 'IELTS') {
      headers = ['student_num', 'name_en', 'reading', 'writing', 'listening', 'speaking', 'overall'];
      filename = targetYear === 'All' ? 'Template_IELTS.xlsx' : `Template_IELTS_${targetYear}.xlsx`;
      defaultRows = getPreFilledRows(headers, '');
    } else {
      let subjects = [];
      let defaultBoard = targetBoard;
      let baseName = '';
      
      if (type === 'IGCSE') { 
        subjects = IGCSE_SUBJECTS[targetBoard] || []; 
        baseName = `Template_IGCSE_${targetBoard}`; 
      }
      else if (type === 'IAS') { 
        subjects = IAS_SUBJECTS[targetBoard] || []; 
        baseName = `Template_IAS_${targetBoard}`; 
      }
      else if (type === 'IAL') { 
        subjects = IAL_SUBJECTS[targetBoard] || []; 
        baseName = `Template_IAL_${targetBoard}`; 
      }

      subjects.forEach(sub => {
        headers.push(`${sub}_board`, `${sub}_grade`, `${sub}_score`);
      });

      filename = targetYear === 'All' ? `${baseName}.xlsx` : `${baseName}_${targetYear}.xlsx`;
      defaultRows = getPreFilledRows(headers, defaultBoard);
    }

    const wb = XLSX.utils.book_new();
    const sheetData = [headers, ...defaultRows];
    // Create sheet
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    ws['!dataValidation'] = [{ sqref: "A2:ZZ100", type: "list", values: "A*,A,B,C,D,E,U,9,8,7,6,5,4,3,2,1", allowBlank: true }];
    // Freeze first two columns and the header row
    ws['!views'] = [{ state: "frozen", xSplit: 2, ySplit: 1 }];

    // Format Column Widths automatically
    ws['!cols'] = headers.map(h => {
      if (h === 'name_en' || h === 'student_num') return { wch: 18 };
      if (h.endsWith('_board')) return { wch: 13 };
      if (h.endsWith('_subject')) return { wch: 16 };
      if (h === 'social_media') return { wch: 25 };
      return { wch: 8 }; // grades, scores, ums, dob
    });

    // Apply Background Colors and Text Wrap
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });

        // Create cell object if it doesn't exist (blanks in SheetJS)
        if (!ws[cellAddress]) ws[cellAddress] = { t: 's', v: '' };

        ws[cellAddress].s = {
          border: {
            right: { style: "hair", color: { rgb: "FFD1D5DB" } },
            left: { style: "hair", color: { rgb: "FFD1D5DB" } },
            top: { style: "hair", color: { rgb: "FFD1D5DB" } },
            bottom: { style: "hair", color: { rgb: "FFD1D5DB" } }
          }
        };

        // Alternating fill for data cells
        if (R > 0) {
          const isOddRow = Math.abs(R % 2) === 1;
          let bgColor = isOddRow ? "FFFFFFFF" : "FFF8FAFC"; // Base white / light gray stripe

          if (colColors[C]) {
            bgColor = isOddRow ? colColors[C].odd : colColors[C].even;
          }
          ws[cellAddress].s.fill = { fgColor: { rgb: bgColor } };
        }

        if (R === 0) { // Header row
          ws[cellAddress].s.font = { bold: true, color: { rgb: "FFFFFFFF" } };
          ws[cellAddress].s.fill = { fgColor: { rgb: "FF475569" } }; // Slate Gray
          ws[cellAddress].s.alignment = { wrapText: true, vertical: "center", horizontal: "center" };
        } else {
          // Data rows
          if (C > 1) {
            ws[cellAddress].s.alignment = { vertical: "center", horizontal: "center" };
          }
        }
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, filename);
    setExportModal({ isOpen: false, type: null });
  };

  const handleImportXL = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        if (jsonData.length === 0) {
          setImportMsg({ type: 'warn', text: 'The imported file contains no data rows.' });
          return;
        }

        const unmapped = new Set();
        const skippedNames = ['withdrawn', 'others', 'other', '-'];
        jsonData.forEach(row => {
          const uni = String(row.university_dest || '').trim();
          if (uni && !skippedNames.includes(uni.toLowerCase())) {
             const u = findUniversityByName(uni);
             if (!u) {
                 unmapped.add(uni);
             } else {
                 row.university_dest = u.university;
             }
          }
        });

        const unmappedArr = Array.from(unmapped);
        if (unmappedArr.length > 0) {
           setPendingPreImportData(jsonData);
           setResolvingUnies(unmappedArr);
           return;
        }

        processImportData(jsonData);
      } catch (err) {
        console.error('Import error:', err);
        setImportMsg({ type: 'error', text: `Import failed: ${err.message}` });
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; // Reset input
  };

  const processImportData = async (jsonData) => {
    try {
      const conflicts = [];
      const newStudents = [];
      const seenInExcel = new Map();
      let autoSkipped = 0;

      const isIdentical = (ex, im) => {
        const exNameEn = (ex.name_en || ex.person?.name_en || '').trim();
        const exNameZh = (ex.name_zh || ex.person?.name_zh || '').trim();
        const safeStringify = (obj) => JSON.stringify(obj || {});
        const isSkip = (val) => val === null || val === undefined || String(val).trim() === '' || String(val).trim() === '-';
        
        // IMPORTANT: Only check fields that are NOT null/empty/hyphen in imported
        if (!isSkip(im.name_en) && exNameEn !== (im.name_en || '').trim()) return false;
        if (!isSkip(im.name_zh) && exNameZh !== (im.name_zh || '').trim()) return false;
        if (!isSkip(im.other_name) && (ex.other_name || '') !== (im.other_name || '')) return false;
        if (!isSkip(im.gender) && (ex.gender || '') !== (im.gender || '')) return false;
        if (!isSkip(im.dob) && (ex.dob || '') !== (im.dob || '')) return false;
        if (!isSkip(im.phone) && (ex.phone || '') !== (im.phone || '')) return false;
        if (!isSkip(im.social_media) && (ex.social_media || '') !== (im.social_media || '')) return false;
        if (!isSkip(im.grad_year) && (ex.grad_year || null) !== (im.grad_year || null)) return false;
        if (!isSkip(im.status) && (ex.status || 'APPLICANT') !== (im.status || 'APPLICANT')) return false;
        if (!isSkip(im.university_dest) && (ex.university_dest || '') !== (im.university_dest || '')) return false;
        if (!isSkip(im.program_dest) && (ex.program_dest || '') !== (im.program_dest || '')) return false;
        if (!isSkip(im.igcse_score) && (ex.igcse_score || '') !== (im.igcse_score || '')) return false;
        if (!isSkip(im.ias_score) && (ex.ias_score || '') !== (im.ias_score || '')) return false;
        if (!isSkip(im.alevel_score) && (ex.alevel_score || '') !== (im.alevel_score || '')) return false;
        if (!isSkip(im.ielts_score) && (ex.ielts_score || '') !== (im.ielts_score || '')) return false;

        // For academicData, we only compare if they are modified
        if (im._academicModified && safeStringify(ex.academicData) !== safeStringify(im.academicData)) return false;

        return true;
      };

      jsonData.forEach((row) => {
        if (!row.student_num) return;

        // Helper to parse subject data - supports multiple prefixes (FULL template vs individual templates)
        const parseSubjectData = (examLevel, prefixes, noPrefixFallback = false) => {
          const subjects = [];
          const seen = new Set();
          
          const tryPrefix = (prefix) => {
            Object.keys(row).forEach(key => {
              if (key.startsWith(prefix) && key.endsWith('_grade')) {
                const subjectName = key.replace(prefix, '').replace('_grade', '');
                if (seen.has(subjectName)) return;
                const grade = String(row[key] || '').trim();
                if (grade) {
                  const normalized = normalizeSubjectForImport(
                    examLevel,
                    row[`${prefix}${subjectName}_board`] || '',
                    subjectName
                  );
                  seen.add(subjectName);
                  subjects.push({
                    subject: normalized.subject,
                    board: normalized.board,
                    grade: grade,
                    value: row[`${prefix}${subjectName}_score`] || ''
                  });
                }
              }
            });
          };

          prefixes.forEach(tryPrefix);

          // Fallback: individual template has no prefix e.g. "Physics_grade"
          if (noPrefixFallback && subjects.length === 0) {
            Object.keys(row).forEach(key => {
              const isOtherPrefix = ['IG_', 'AS_', 'AL_'].some(p => key.startsWith(p));
              if (key.endsWith('_grade') && !isOtherPrefix && !key.includes('_Other') && !['reading','writing','listening','speaking','overall'].some(k => key === k)) {
                const subjectName = key.replace('_grade', '');
                if (seen.has(subjectName)) return;
                const grade = String(row[key] || '').trim();
                if (grade) {
                  const normalized = normalizeSubjectForImport(
                    examLevel,
                    row[`${subjectName}_board`] || '',
                    subjectName
                  );
                  seen.add(subjectName);
                  subjects.push({
                    subject: normalized.subject,
                    board: normalized.board,
                    grade: grade,
                    value: row[`${subjectName}_score`] || ''
                  });
                }
              }
            });
          }

          return subjects;
        };

        // Case-insensitive row access helper
        const getVal = (keys) => {
          for (const k of keys) {
            const foundKey = Object.keys(row).find(rk => rk.toLowerCase().trim() === k.toLowerCase());
            if (foundKey) return row[foundKey];
          }
          return null;
        };

        const ig = parseSubjectData('IG', ['IG_'], true);
        const ia = parseSubjectData('AS', ['AS_'], true);
        const il = parseSubjectData('AL', ['AL_'], true);
        const ieRaw = {
          reading: getVal(['reading', 'Reading']),
          writing: getVal(['writing', 'Writing']),
          listening: getVal(['listening', 'Listening']),
          speaking: getVal(['speaking', 'Speaking']),
          overall: getVal(['overall', 'Overall', 'ielts_score', 'IELTS Score'])
        };

        const imported = {
          student_num: String(getVal(['student_num', 'Student ID', 'student_id']) || ''),
          name_en: getVal(['name_en', 'English Name']),
          name_zh: getVal(['name_zh', 'Chinese Name']),
          other_name: getVal(['other_name', 'Other Name']),
          gender: getVal(['gender']),
          dob: getVal(['dob', 'Date of Birth']),
          phone: getVal(['phone', 'Phone Number']),
          social_media: getVal(['social_media', 'Social Media']),
          grad_year: getVal(['grad_year', 'Grad Year']) ? parseInt(getVal(['grad_year', 'Grad Year'])) : null,
          status: getVal(['status']),
          university_dest: getVal(['university_dest', 'University Destination', 'University']),
          quali: getVal(['quali', 'Qualification']),
          program_dest: getVal(['program_dest', 'Program Destination', 'Program']),
          igcse_score: ig.length > 0 ? generateSummary(ig) : null,
          ias_score: ia.length > 0 ? generateSummary(ia) : null,
          alevel_score: il.length > 0 ? generateSummary(il) : null,
          ielts_score: ieRaw.overall,
          _academicModified: (ig.length > 0 || ia.length > 0 || il.length > 0 || ieRaw.overall !== null),
          academicData: { 
            igcse: ig, ias: ia, ial: il,
            ielts: {
              reading: ieRaw.reading || '',
              writing: ieRaw.writing || '',
              listening: ieRaw.listening || '',
              speaking: ieRaw.speaking || '',
              overall: ieRaw.overall || ''
            }
          }
        };

        const existingInDb = students.find(s => s.student_num === imported.student_num);
        
        if (existingInDb) {
          if (isIdentical(existingInDb, imported)) {
            autoSkipped++;
          } else {
            conflicts.push({ existing: existingInDb, imported: { ...imported, id: existingInDb.id } });
          }
        } else if (seenInExcel.has(imported.student_num)) {
          // Duplicate found inside the same Excel file
          const firstOccurrence = seenInExcel.get(imported.student_num);
          if (isIdentical(firstOccurrence, imported)) {
            autoSkipped++;
          } else {
            conflicts.push({ 
              existing: firstOccurrence, // Treat the first row as the "existing" one for the UI
              imported: imported 
            });
          }
        } else {
          seenInExcel.set(imported.student_num, imported);
          newStudents.push(imported);
        }
      });

      // 1. Handle Brand New Students
      if (newStudents.length > 0) {
        // For new students, we use defaults for missing columns
        const toInsert = newStudents.map(s => ({
          student_num: s.student_num,
          grad_year: s.grad_year,
          name_en: s.name_en || '',
          name_zh: s.name_zh || '',
          other_name: s.other_name || null,
          gender: s.gender || 'MALE',
          dob: s.dob || null,
          phone: s.phone || null,
          social_media: s.social_media || null,
          quali: s.quali || null,
          status: s.status || 'APPLICANT',
          university_dest: s.university_dest || '',
          program_dest: s.program_dest || '',
          igcse_score: s.igcse_score || '-',
          ias_score: s.ias_score || '-',
          alevel_score: s.alevel_score || '-',
          ielts_score: s.ielts_score || '-',
          academicData: s.academicData || null
        }));

        const result = await upsertStudents(toInsert);
        if (!result.success) {
          throw new Error(result.error);
        }
      }

      // 2. Handle Conflicts
      if (conflicts.length > 0) {
        setPendingImport({ conflicts, newStudents });
        setConflictIndex(0);
        setImportStats({
          total: jsonData.length,
          new: newStudents.length,
          merged: 0,
          skipped: 0,
          autoSkipped: autoSkipped
        });
      } else {
        setImportMsg({
          type: 'success',
          text: `Import complete! Saved ${newStudents.length} new records. (Auto-skipped ${autoSkipped} identical records).`
        });
        setTimeout(() => setImportMsg(null), 5000);
      }
    } catch (err) {
      console.error('Import processing error:', err);
      setImportMsg({ type: 'error', text: `Database Write Failed: ${err.message}` });
    }
  };

  const handleConflictMerge = async () => {
    const conflict = pendingImport.conflicts[conflictIndex];
    let updated = { ...conflict.existing };
    const incoming = conflict.imported;
    const isSkip = (val) => val === null || val === undefined || String(val).trim() === '' || String(val).trim() === '-';

    // Merge only non-skip fields from incoming
    Object.keys(incoming).forEach(key => {
      if (!isSkip(incoming[key]) && key !== 'id' && !key.startsWith('_')) {
        if (key === 'academicData') {
          // Deep merge for academicData if modified
          if (incoming._academicModified) {
            updated.academicData = {
              ...updated.academicData,
              igcse: incoming.academicData.igcse.length > 0 ? incoming.academicData.igcse : updated.academicData.igcse,
              ias: incoming.academicData.ias.length > 0 ? incoming.academicData.ias : updated.academicData.ias,
              ial: incoming.academicData.ial.length > 0 ? incoming.academicData.ial : updated.academicData.ial,
              ielts: incoming.academicData.ielts.overall ? incoming.academicData.ielts : updated.academicData.ielts
            };
          }
        } else {
          updated[key] = incoming[key];
        }
      }
    });

    delete updated.person;

    await upsertStudents([updated]);
    setImportStats(prev => ({ ...prev, merged: prev.merged + 1 }));
    advanceConflict('merge');
  };

  const handleConflictMergeAll = async () => {
    const remaining = pendingImport.conflicts.slice(conflictIndex);
    const isSkip = (val) => val === null || val === undefined || String(val).trim() === '' || String(val).trim() === '-';
    const toUpdate = remaining.map(conflict => {
      let updated = { ...conflict.existing };
      const incoming = conflict.imported;

      Object.keys(incoming).forEach(key => {
        if (!isSkip(incoming[key]) && key !== 'id' && !key.startsWith('_')) {
          if (key === 'academicData') {
            if (!incoming._academicModified) return;
            updated.academicData = {
              ...updated.academicData,
              igcse: incoming.academicData.igcse.length > 0 ? incoming.academicData.igcse : updated.academicData.igcse,
              ias: incoming.academicData.ias.length > 0 ? incoming.academicData.ias : updated.academicData.ias,
              ial: incoming.academicData.ial.length > 0 ? incoming.academicData.ial : updated.academicData.ial,
              ielts: incoming.academicData.ielts.overall ? incoming.academicData.ielts : updated.academicData.ielts
            };
          } else {
            updated[key] = incoming[key];
          }
        }
      });
      delete updated.person;
      return updated;
    });

    await upsertStudents(toUpdate);
    setImportStats(prev => ({ ...prev, merged: prev.merged + remaining.length }));
    
    // Clear everything as we're done
    setImportMsg({
      type: 'success',
      text: `Import complete. Total: ${importStats.total}, New: ${importStats.new}, Merged: ${importStats.merged + remaining.length}, Skipped: ${importStats.skipped}, Auto-skipped: ${importStats.autoSkipped}`
    });
    setPendingImport(null);
    setConflictIndex(0);
    setTimeout(() => setImportMsg(null), 8000);
  };

  const handleConflictSkip = () => {
    setImportStats(prev => ({ ...prev, skipped: prev.skipped + 1 }));
    advanceConflict('skip');
  };

  const handleCancelImport = () => {
    if (confirm("Cancel batch import? Any unresolved conflicts will be ignored.")) {
      setPendingImport(null);
      setConflictIndex(0);
      setPendingPreImportData(null);
      setImportStats({ total: 0, new: 0, merged: 0, skipped: 0, autoSkipped: 0 });
    }
  };

  const [editIdPrompt, setEditIdPrompt] = useState(null);

  const handleConflictEditAndSave = () => {
    const conflict = pendingImport.conflicts[conflictIndex];
    const incomingName = conflict.imported.name_en || conflict.imported.person?.name_en || 'this student';
    setEditIdPrompt({
      isOpen: true,
      initialValue: conflict.imported.student_num,
      studentName: incomingName,
      errorMsg: null
    });
  };

  const submitEditId = async (newIdVal) => {
    const newId = newIdVal?.trim();
    if (!newId) return;

    const conflict = pendingImport.conflicts[conflictIndex];
    
    if (newId === conflict.existing.student_num) {
      setEditIdPrompt(prev => ({ ...prev, errorMsg: "This ID matches the existing record. Please enter a different one or use Overwrite." }));
      return;
    }

    const isDuplicate = students.some(s => s.student_num === newId);
    if (isDuplicate) {
      setEditIdPrompt(prev => ({ ...prev, errorMsg: "This Student ID is already in use by another student in the database." }));
      return;
    }

    const updated = {
      ...conflict.imported,
      student_num: newId,
      name_en: conflict.imported.name_en,
      name_zh: conflict.imported.name_zh,
      grad_year: parseInt(conflict.imported.grad_year) || null,
      academicData: conflict.imported.academicData
    };
    delete updated.id; // Force inserting as a new record
    delete updated.person;

    await upsertStudents([updated]);
    setImportStats(prev => ({ ...prev, new: prev.new + 1 }));
    setEditIdPrompt(null);
    advanceConflict('new');
  };

  const advanceConflict = (action) => {
    const next = conflictIndex + 1;
    if (next >= pendingImport.conflicts.length) {
      const finalStats = { ...importStats };
      const merged = importStats.merged + (action === 'merge' ? 1 : 0);
      const skipped = importStats.skipped + (action === 'skip' ? 1 : 0);
      const newAdded = importStats.new + (action === 'new' ? 1 : 0);
      
      setImportMsg({
        type: 'success',
        text: `Import complete. Total: ${importStats.total}, New: ${newAdded}, Merged: ${merged}, Skipped: ${skipped}, Auto-skipped: ${importStats.autoSkipped}`
      });
      setPendingImport(null);
      setConflictIndex(0);
      setTimeout(() => setImportMsg(null), 8000);
    } else {
      setConflictIndex(next);
    }
  };

  // Helper for final message after state updates haven't reflected yet
  useEffect(() => {
    if (pendingImport === null && importStats.total > 0) {
      setImportMsg({
        type: 'success',
        text: `Import complete. Total: ${importStats.total}, New: ${importStats.new}, Merged: ${importStats.merged}, Skipped: ${importStats.skipped}, Auto-skipped: ${importStats.autoSkipped}`
      });
      setImportStats({ total: 0, new: 0, merged: 0, skipped: 0, autoSkipped: 0 }); // Reset for next time
    }
  }, [pendingImport]);

  const handleCheckUnmapped = () => {
    const unmapped = new Set();
    const skippedNames = ['withdrawn', 'others', 'other', 'tbc', '-'];
    students.forEach(s => {
      const uni = String(s.university_dest || '').trim();
      if (uni && !skippedNames.includes(uni.toLowerCase()) && !findUniversityByName(uni)) {
        unmapped.add(uni);
      }
    });
    const unmappedArr = Array.from(unmapped);
    if (unmappedArr.length > 0) {
      setResolvingUnies(unmappedArr);
    } else {
      alert("All universities are already mapped or have empty destinations!");
    }
  };

  const handleResolveUniversity = (oldName, newName) => {
    // Save to custom mappings so system learns it
    addCustomMapping(oldName, newName);

    if (pendingPreImportData) {
       setPendingPreImportData(prev => {
          const newData = [...prev];
          newData.forEach(row => {
             if (row.university_dest === oldName) row.university_dest = newName;
          });
          return newData;
       });
    } else {
       setStudents(prev => prev.map(s => {
         if (s.university_dest === oldName) {
           return { ...s, university_dest: newName };
         }
         return s;
       }));
    }
  };

  const handleCloseResolveModal = () => {
     setResolvingUnies([]);
     if (pendingPreImportData) {
        processImportData(pendingPreImportData);
        setPendingPreImportData(null);
     }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredStudents = useMemo(() => {
    let result = students.filter(s => {
      const term = searchTerm.toLowerCase();
      const matchNameEn = (s.name_en || s.person?.name_en || '').toLowerCase().includes(term);
      const matchNameZh = (s.name_zh || s.person?.name_zh || '').toLowerCase().includes(term);
      const matchGradYear = String(s.grad_year || '').includes(term);
      const matchProgram = (s.program_dest || '').toLowerCase().includes(term);
      const matchUniv = (s.university_dest || '').toLowerCase().includes(term);
      const matchIG = (s.igcse_score || '').toLowerCase().includes(term);
      const matchIAS = (s.ias_score || '').toLowerCase().includes(term);
      const matchIAL = (s.alevel_score || '').toLowerCase().includes(term);
      const matchIELTS = String(s.ielts_score || '').toLowerCase().includes(term);

      return matchNameEn || matchNameZh || matchGradYear || matchProgram || matchUniv || matchIG || matchIAS || matchIAL || matchIELTS;
    });

    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue, bValue;

        if (sortConfig.key === 'name') {
          aValue = (a.name_en || a.person?.name_en || '').toLowerCase();
          bValue = (b.name_en || b.person?.name_en || '').toLowerCase();
        } else if (sortConfig.key === 'qs') {
          aValue = findRankByName(a.university_dest);
          bValue = findRankByName(b.university_dest);
          aValue = (aValue === 'N.A.' || aValue === null || aValue === undefined) ? Infinity : Number(aValue);
          bValue = (bValue === 'N.A.' || bValue === null || bValue === undefined) ? Infinity : Number(bValue);
        } else if (['igcse_score', 'ias_score', 'alevel_score', 'ielts_score'].includes(sortConfig.key)) {
          aValue = String(a[sortConfig.key] || '').toLowerCase();
          bValue = String(b[sortConfig.key] || '').toLowerCase();
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        
        // --- Secondary/Fallback Sort ---
        if (sortConfig.key !== 'grad_year') {
          const aYear = parseInt(a.grad_year) || 0;
          const bYear = parseInt(b.grad_year) || 0;
          if (aYear > bYear) return -1;
          if (aYear < bYear) return 1;
        }

        if (sortConfig.key !== 'name') {
          const aName = (a.name_en || a.person?.name_en || '').toLowerCase();
          const bName = (b.name_en || b.person?.name_en || '').toLowerCase();
          if (aName < bName) return -1;
          if (aName > bName) return 1;
        }

        return 0;
      });
    } else {
      // Default sort: grad_year DESC (fallback: year from student_num prefix), then name ASC
      result.sort((a, b) => {
        const getYear = (s) => {
          if (s.grad_year) return parseInt(s.grad_year);
          // Fallback: extract year from student_num prefix (e.g. "20171023" → 2017)
          const match = String(s.student_num || '').match(/^(\d{4})/);
          return match ? parseInt(match[1]) : 0;
        };
        const yearDiff = getYear(b) - getYear(a);
        if (yearDiff !== 0) return yearDiff;

        const aName = (a.name_en || a.person?.name_en || '').toLowerCase();
        const bName = (b.name_en || b.person?.name_en || '').toLowerCase();
        return aName.localeCompare(bName);
      });
    }

    return result;
  }, [students, searchTerm, sortConfig, findRankByName]);

  const unmappedCount = useMemo(() => {
    const unmapped = new Set();
    const skippedNames = ['withdrawn', 'others', 'other', 'tbc', '-'];
    students.forEach(s => {
      const uni = String(s.university_dest || '').trim();
      if (uni && !skippedNames.includes(uni.toLowerCase()) && !findUniversityByName(uni)) {
        unmapped.add(uni);
      }
    });
    return unmapped.size;
  }, [students, findUniversityByName]);

  return (
    <div className="space-y-4">
      {/* Header & Controls - Sticky at top */}
      <div className="sticky top-0 z-40 bg-[#f8fafc] pt-2 pb-1">
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-t-super shadow-sm border border-gray-100 gap-4">
        <div className="relative w-full sm:w-96 group">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-aura-teal transition-colors" />
          <input
            type="text"
            placeholder="Search names, grades (e.g. 2A*), university..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10 py-2 w-full text-sm border border-gray-200 rounded-super focus:outline-none focus:ring-2 focus:ring-aura-teal/20 bg-slateBlue-100 transition-all font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-aura-teal transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCheckUnmapped}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-all shadow-sm active:scale-95 border rounded-super ${
              unmappedCount > 0 
                ? 'bg-red-500 text-white border-red-600 hover:bg-red-600 animate-pulse-subtle' 
                : 'bg-white text-gray-400 border-gray-100 opacity-60 hover:opacity-100'
            }`}
          >
            <Globe size={14} /> 
            RESOLVE MAPPINGS
            {unmappedCount > 0 && <span className="ml-1 bg-white text-red-500 px-1.5 py-0.5 rounded-full text-[10px]">{unmappedCount}</span>}
          </button>
          {role === 'ADMIN' && (
            <div className="relative inline-flex items-center">
              <Download size={14} className="absolute left-3 text-gray-400 pointer-events-none" />
              <select
                onChange={handleExportTemplate}
                className="appearance-none pl-9 pr-6 py-2 text-xs font-bold text-gray-500 bg-white rounded-super hover:bg-gray-50 transition-all border border-gray-200 shadow-sm cursor-pointer outline-none active:scale-95 text-center"
                defaultValue=""
              >
                <option value="" disabled>DOWNLOAD TYPE...</option>
                <option value="FULL">FULL DATA BACKUP</option>
                <option value="PROFILE">Profile Data Template</option>
                <option value="IGCSE">IGCSE Grades Template</option>
                <option value="IAS">IAS Grades Template</option>
                <option value="IAL">IAL/GCEAL Grades Template</option>
                <option value="IELTS">IELTS Scores Template</option>
              </select>
            </div>
          )}

          {role === 'ADMIN' && (
            <label className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-500 bg-white rounded-super hover:bg-gray-50 transition-all border border-gray-200 shadow-sm cursor-pointer active:scale-95">
              <Upload size={14} /> BATCH IMPORT
              <input type="file" accept=".xlsx, .xls" onChange={handleImportXL} className="hidden" />
            </label>
          )}

          {role === 'ADMIN' && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-500 bg-red-50/50 rounded-super hover:bg-red-100 transition-all border border-red-100 shadow-sm active:scale-95"
              title="Remove All Data"
            >
              <Trash2 size={14} /> CLEAR DATA
            </button>
          )}

          {role === 'ADMIN' && (
            <button
              onClick={() => setEditingStudent({})}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-aura-teal rounded-super hover:bg-teal-500 shadow-lg shadow-aura-teal/20 transition-all ml-2 active:scale-95"
            >
              + Add New
            </button>
          )}
        </div>
      </div>
    </div>
    {/* Conflict Resolution Modal */}
      {pendingImport && pendingImport.conflicts[conflictIndex] && (() => {
        const c = pendingImport.conflicts[conflictIndex];
        const ex = c.existing;
        const im = c.imported;
        return (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <div className="bg-white rounded-[1.5rem] shadow-2xl border border-gray-100 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50 relative">
                <button 
                  onClick={handleCancelImport}
                  className="absolute top-6 right-6 p-2 text-amber-400 hover:bg-amber-100/50 rounded-full transition-all"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center justify-between mr-8">
                  <div>
                    <h2 className="text-lg font-black text-slateBlue-800">⚠️ Duplicate Student ID</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Conflict {conflictIndex + 1} of {pendingImport.conflicts.length} — Student ID: <span className="font-bold text-slateBlue-800">{ex.student_num}</span>
                    </p>
                  </div>
                  <div className="text-[11px] font-bold text-amber-600 bg-amber-100 px-3 py-1 rounded-full">MERGE REQUIRED?</div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <table className="w-full text-xs border-collapse table-fixed">
                  <thead>
                    <tr className="bg-slateBlue-100/30 text-gray-500 uppercase font-black text-[10px] tracking-widest text-left">
                      <th className="p-3 w-[20%]">Field</th>
                      <th className="p-3 w-[40%]">Existing Record</th>
                      <th className="p-3 w-[40%]">Incoming Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[
                      ['Student ID', ex.student_num, im.student_num],
                      ['Name (EN)', ex.name_en || ex.person?.name_en, im.name_en || im.person?.name_en],
                      ['Name (ZH)', ex.name_zh || ex.person?.name_zh, im.name_zh || im.person?.name_zh],
                      ['Year', ex.grad_year, im.grad_year],
                      ['IGCSE', ex.igcse_score, im.igcse_score],
                      ['IAS', ex.ias_score, im.ias_score],
                      ['IAL', ex.alevel_score, im.alevel_score],
                      ['IELTS', ex.ielts_score, im.ielts_score],
                      ['Status', ex.status, im.status],
                    ].filter(([_, __, imVal]) => {
                      const isSkip = (v) => v === null || v === undefined || String(v).trim() === '' || String(v).trim() === '-';
                      return !isSkip(imVal);
                    }).map(([label, exVal, imVal]) => {
                      const isDifferent = String(exVal || '').trim() !== String(imVal || '').trim();
                      return (
                        <tr key={label} className={isDifferent ? 'bg-amber-50/50 border-l-4 border-amber-400' : ''}>
                          <td className="p-3 font-black text-gray-500 uppercase text-[10px] tracking-wide">{label}</td>
                          <td className={`p-3 font-semibold ${isDifferent ? 'text-gray-400 line-through' : 'text-slateBlue-800'}`}>
                            {exVal || '-'}
                          </td>
                          <td className="p-3 font-semibold text-slateBlue-800 flex items-center gap-2">
                            {isDifferent ? (
                              <span className="text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded shadow-sm">{imVal || '-'}</span>
                            ) : (
                              <span>{imVal || '-'}</span>
                            )}
                            {isDifferent && <span className="text-[9px] font-black text-amber-500 tracking-wider">NEW</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                <button
                  onClick={handleConflictSkip}
                  className="px-6 py-2.5 text-sm font-bold text-gray-500 bg-white rounded-super border border-gray-200 hover:bg-gray-50 transition-all active:scale-95"
                >
                  Skip (Keep Existing)
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleConflictEditAndSave}
                    className="px-6 py-2.5 text-sm font-bold text-slateBlue-800 bg-slateBlue-50/80 rounded-super hover:bg-slateBlue-100 transition-all shadow-sm active:scale-95 border border-slateBlue-200"
                  >
                    Edit ID & Save New
                  </button>
                  <button
                    onClick={handleConflictMerge}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-500 rounded-super hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-200 active:scale-95"
                  >
                    MERGE THIS →
                  </button>
                  <button
                    onClick={handleConflictMergeAll}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-aura-teal rounded-super hover:opacity-90 transition-all shadow-xl shadow-aura-teal/20 active:scale-95 flex items-center gap-2 animate-pulse-subtle"
                  >
                    <Download size={14} /> IMPORT ALL REMAINING
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Toast Notification */}
      {importMsg && (
        <div className={`fixed top-6 right-6 z-[1000] flex items-center justify-between px-6 py-4 rounded-super text-sm font-bold shadow-2xl border transition-all animate-in fade-in slide-in-from-top-4 ${
          importMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
          importMsg.type === 'warn' ? 'bg-amber-50 text-amber-800 border-amber-200' :
          'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="flex flex-col">
             <span>{importMsg.text}</span>
          </div>
          <button onClick={() => setImportMsg(null)} className="ml-6 hover:opacity-70 transition-opacity">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="bg-white rounded-b-[1.5rem] shadow-sm border border-gray-100 border-t-0 overflow-hidden w-full relative">
        <div className="overflow-auto max-h-[70vh] relative">
          <table className="min-w-full text-left text-xs text-slateBlue-800 border-collapse table-fixed">
            <thead>
              <tr className="bg-slateBlue-800 border-b border-slateBlue-900 text-white uppercase font-black text-[10px] tracking-widest sticky top-0 z-30 shadow-sm transition-all">
                <SortableHeader label="Year" sortKey="grad_year" config={sortConfig} requestSort={requestSort} className="w-[50px] text-center" />
                <th className="px-3 py-2.5 w-[50px] text-center">Status</th>
                <SortableHeader label="Student ID" sortKey="student_num" config={sortConfig} requestSort={requestSort} className="w-[80px] text-center" />
                <SortableHeader label="Name" sortKey="name" config={sortConfig} requestSort={requestSort} className="w-[200px]" />
                <SortableHeader label="IGCSE" sortKey="igcse_score" config={sortConfig} requestSort={requestSort} className="w-[50px] text-center" />
                <SortableHeader label="IAS" sortKey="ias_score" config={sortConfig} requestSort={requestSort} className="w-[50px] text-center" />
                <SortableHeader label="IAL" sortKey="alevel_score" config={sortConfig} requestSort={requestSort} className="w-[50px] text-center" />
                <SortableHeader label="IELTS" sortKey="ielts_score" config={sortConfig} requestSort={requestSort} className="w-[50px] text-center" />
                <SortableHeader label="QS" sortKey="qs" config={sortConfig} requestSort={requestSort} className="w-[50px] text-center" />
                <SortableHeader label="University" sortKey="university_dest" config={sortConfig} requestSort={requestSort} className="w-[350px] min-w-[350px]" />
                <th className="px-3 py-2.5 w-[50px] text-center">Quali</th>
                <th className="px-3 py-2.5 w-[350px] min-w-[350px]">Program</th>
                {role === 'ADMIN' && <th className="px-4 py-2.5 w-[100px] text-center sticky right-0 bg-slateBlue-800 z-30 shadow-[-4px_0_10px_rgba(0,0,0,0.3)]">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.length > 0 ? filteredStudents.map((s, idx) => (
                <tr key={s.id || idx} className={`hover:bg-slate-100 transition-colors group divide-x divide-gray-100/60 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                  {/* Grad Year */}
                  <td className="px-1 py-1.5 text-center text-gray-500 font-bold w-[50px] text-[11px]">
                    {s.grad_year || ''}
                  </td>

                  {/* Status */}
                  <td className="px-1 py-3.5 w-[50px] text-center">
                    <StatusBadge status={s.status} />
                  </td>

                  {/* Student ID */}
                  <td className="px-1 py-1.5 w-[80px] text-center font-bold text-[11px] text-gray-500">
                    {s.student_num || ''}
                  </td>

                  {/* Name */}
                  <td className="px-3 py-1.5 font-bold text-slateBlue-800 w-[200px]">
                    <div className="flex flex-col">
                      <span className="truncate text-xs tracking-tight">
                        {s.name_en || s.person?.name_en} {(s.other_name || s.person?.other_name) && `(${s.other_name || s.person?.other_name})`}
                      </span>
                      {(s.name_zh || s.person?.name_zh) && <span className="text-gray-400 text-[11px] font-semibold">{s.name_zh || s.person?.name_zh}</span>}
                    </div>
                  </td>

                  {/* Academics */}
                  <td className="px-1 py-1.5 align-middle text-center w-[50px]">
                    <div className="flex flex-col gap-0.5 items-center justify-center font-sans">
                      {(() => {
                        const scoreStr = (s.igcse_score && s.igcse_score !== '-') ? s.igcse_score : (s.academicData?.igcse?.length > 0 ? generateSummary(s.academicData.igcse) : '');
                        if (!scoreStr) return null;
                        const tokens = scoreStr.split(',').map(t => t.trim()).filter(t => !t.toUpperCase().includes('NR'));
                        const letters = tokens.filter(t => /[A-Z]/.test(t));
                        const numbers = tokens.filter(t => /\d+x\d+/.test(t));
                        return (
                          <>
                            <div className="flex gap-1 flex-wrap justify-center items-center">
                              {letters.map((g, i) => (
                                <React.Fragment key={i}>
                                  <GradeBadge text={g} />
                                  {i < letters.length - 1 && <span className="text-[11px] text-gray-300">,</span>}
                                </React.Fragment>
                              ))}
                            </div>
                            <div className="flex gap-1 flex-wrap justify-center items-center mt-0.5">
                              {numbers.map((g, i) => (
                                <React.Fragment key={i}>
                                  <GradeBadge text={g} />
                                  {i < numbers.length - 1 && <span className="text-[10px] text-gray-300">,</span>}
                                </React.Fragment>
                              ))}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-1 py-3.5 align-middle text-center w-[50px]">
                    <div className="flex flex-col gap-0.5 items-center justify-center font-sans">
                      {(() => {
                        const scoreStr = (s.ias_score && s.ias_score !== '-') ? s.ias_score : (s.academicData?.ias?.length > 0 ? generateSummary(s.academicData.ias) : '');
                        if (!scoreStr) return null;
                        const tokens = scoreStr.split(',').map(t => t.trim()).filter(t => !t.toUpperCase().includes('NR'));
                        const letters = tokens.filter(t => /[A-Z]/.test(t));
                        const numbers = tokens.filter(t => /\d+x\d+/.test(t));
                        return (
                          <>
                            <div className="flex gap-1 flex-wrap justify-center items-center">
                              {letters.map((g, i) => (
                                <React.Fragment key={i}>
                                  <GradeBadge text={g} />
                                  {i < letters.length - 1 && <span className="text-[11px] text-gray-300">,</span>}
                                </React.Fragment>
                              ))}
                            </div>
                            <div className="flex gap-1 flex-wrap justify-center items-center mt-0.5">
                              {numbers.map((g, i) => (
                                <React.Fragment key={i}>
                                  <GradeBadge text={g} />
                                  {i < numbers.length - 1 && <span className="text-[10px] text-gray-300">,</span>}
                                </React.Fragment>
                              ))}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-1 py-3.5 align-middle text-center w-[50px]">
                    <div className="flex flex-col gap-0.5 items-center justify-center font-sans">
                      {(() => {
                        const scoreStr = (s.alevel_score && s.alevel_score !== '-') ? s.alevel_score : (s.academicData?.ial?.length > 0 ? generateSummary(s.academicData.ial) : '');
                        if (!scoreStr) return null;
                        const tokens = scoreStr.split(',').map(t => t.trim()).filter(t => !t.toUpperCase().includes('NR'));
                        const letters = tokens.filter(t => /[A-Z]/.test(t));
                        const numbers = tokens.filter(t => /\d+x\d+/.test(t));
                        return (
                          <>
                            <div className="flex gap-1 flex-wrap justify-center items-center">
                              {letters.map((g, i) => (
                                <React.Fragment key={i}>
                                  <GradeBadge text={g} />
                                  {i < letters.length - 1 && <span className="text-[10px] text-gray-300">,</span>}
                                </React.Fragment>
                              ))}
                            </div>
                            <div className="flex gap-1 flex-wrap justify-center items-center mt-0.5">
                              {numbers.map((g, i) => (
                                <React.Fragment key={i}>
                                  <GradeBadge text={g} />
                                  {i < numbers.length - 1 && <span className="text-[10px] text-gray-300">,</span>}
                                </React.Fragment>
                              ))}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-1 py-1.5 text-center font-black text-aura-teal text-[11px] align-middle w-[50px]">
                    {(s.ielts_score && s.ielts_score !== '-') ? s.ielts_score : (s.academicData?.ielts?.overall || '')}
                  </td>

                  <td className="px-1 py-1.5 text-center align-middle w-[50px]">
                    <span className="text-[16px] font-black text-slateBlue-800">
                      {findRankByName(s.university_dest) || ''}
                    </span>
                  </td>

                  {/* Dest */}
                  <td className="px-2 py-1.5 w-[350px] min-w-[350px] max-w-[350px]">
                    <div className="flex flex-col">
                      <span className="font-bold text-slateBlue-800 text-[11px] leading-tight break-words">{s.university_dest === '-' ? '' : s.university_dest}</span>
                    </div>
                  </td>

                  {/* Quali */}
                  <td className="px-1 py-1.5 text-center align-middle w-[50px]">
                    <span className="text-[11px] font-bold text-gray-400">
                      {s.quali === '-' ? '' : s.quali}
                    </span>
                  </td>

                  <td className="px-2 py-1.5 w-[350px] min-w-[350px] max-w-[350px]">
                    <span className="text-[11px] text-gray-500 font-medium break-words block">{s.program_dest === '-' ? '' : s.program_dest}</span>
                  </td>

                  {/* Actions */}
                  {role === 'ADMIN' && (
                    <td className={`px-2 py-1.5 w-[100px] text-center sticky right-0 z-10 shadow-[-4px_0_10px_rgba(0,0,0,0.05)] ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(s.id)}
                          className="p-1 bg-indigo-50 text-serene-indigo rounded-md hover:bg-serene-indigo hover:text-white transition-all shadow-sm active:scale-90"
                          title="Edit Profile"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 bg-rose-50 text-rose-400 rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90"
                          title="Delete Profile"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )) : (
                <tr>
                  <td colSpan="13" className="px-4 py-24 text-center">
                    <div className="flex flex-col items-center text-gray-300">
                      <FileSpreadsheet size={64} className="mb-4 opacity-10" />
                      <p className="text-lg font-bold tracking-tight">No student records found.</p>
                      <p className="text-sm mt-1">Try adding a new student or generating dummy data.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingStudent && (
        <StudentEditModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSave={async (s) => {
            const { id, person, ...studentToSave } = s;
            const result = await handleSaveStudent(studentToSave);
            if (result?.success) {
              setEditingStudent(null);
            }
            return result;
          }}
        />
      )}

      {/* University Mapping Modal */}
      <ResolveUniversitiesModal 
        isOpen={resolvingUnies.length > 0} 
        onClose={handleCloseResolveModal} 
        unmappedNames={resolvingUnies} 
        onResolve={handleResolveUniversity} 
      />

      {/* Custom Edit ID Prompt Modal */}
      {editIdPrompt && editIdPrompt.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="p-6">
              <h3 className="text-xl font-black text-slateBlue-800 mb-2">Assign New Student ID</h3>
              <p className="text-sm text-gray-500 mb-6">
                Please enter a new, unique Student ID for <strong className="text-slateBlue-800">{editIdPrompt.studentName}</strong>.
              </p>
              
              <div className="space-y-1">
                <input
                  type="text"
                  autoFocus
                  defaultValue={editIdPrompt.initialValue}
                  onChange={(e) => setEditIdPrompt(prev => ({ ...prev, errorMsg: null }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitEditId(e.target.value);
                  }}
                  id="new-student-id-input"
                  className={`w-full px-4 py-3 bg-gray-50 border ${editIdPrompt.errorMsg ? 'border-red-400 focus:ring-red-400 focus:bg-red-50' : 'border-gray-200 focus:ring-aura-teal focus:bg-white'} rounded-xl text-sm font-bold text-slateBlue-800 focus:outline-none focus:ring-2 transition-all`}
                  placeholder="Enter unique Student ID..."
                />
                {editIdPrompt.errorMsg && (
                  <p className="text-[11px] font-bold text-red-500 flex items-center gap-1 mt-2">
                    <AlertCircle size={14} /> {editIdPrompt.errorMsg}
                  </p>
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100">
              <button
                onClick={() => setEditIdPrompt(null)}
                className="px-5 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 bg-white border border-gray-200 transition-colors rounded-xl active:scale-95 shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => submitEditId(document.getElementById('new-student-id-input').value)}
                className="px-6 py-2 text-sm font-bold text-white bg-aura-teal rounded-xl hover:bg-teal-500 shadow-lg shadow-aura-teal/20 active:scale-95 transition-all"
              >
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Template Year Selection Modal */}
      {exportModal.isOpen && (
        <TemplateYearModal
          type={exportModal.type}
          onClose={() => setExportModal({ isOpen: false, type: null })}
          onConfirm={(year, board) => executeExport(exportModal.type, year, board)}
          availableYears={allYears}
          initialBoard={selectedExportBoard}
        />
      )}
    </div>
  );
};

const TemplateYearModal = ({ type, onClose, onConfirm, availableYears, initialBoard }) => {
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedBoard, setSelectedBoard] = useState(initialBoard || '');

  const isAcademic = ['IGCSE', 'IAS', 'IAL'].includes(type);
  const boards = type === 'IGCSE' ? IGCSE_BOARDS : (type === 'IAS' ? IAS_BOARDS : IAL_BOARDS);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
        <div className="p-6">
          <h3 className="text-xl font-black text-slateBlue-800 mb-2">Export Template</h3>
          <p className="text-sm text-gray-500 mb-6 font-medium">
            Configure your <strong className="text-aura-teal">{type}</strong> template download.
          </p>
          
          <div className="space-y-4">
            {/* Year Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Graduation Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:border-aura-teal focus:ring-4 focus:ring-aura-teal/10 outline-none transition-all font-bold text-slateBlue-800"
              >
                <option value="All">All Years (Empty Template)</option>
                {availableYears && [...availableYears].sort((a,b) => b-a).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Board Selector (Optional) */}
            {isAcademic && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Exam Board</label>
                <select
                  value={selectedBoard}
                  onChange={(e) => setSelectedBoard(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:border-aura-teal focus:ring-4 focus:ring-aura-teal/10 outline-none transition-all font-bold text-slateBlue-800"
                >
                  {boards.filter(b => b !== 'Other').map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 text-sm font-black text-gray-400 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all active:scale-95"
              >
                CANCEL
              </button>
              <button
                onClick={() => onConfirm(selectedYear, selectedBoard)}
                className="flex-1 px-4 py-3 text-sm font-black text-white bg-aura-teal rounded-xl shadow-lg shadow-aura-teal/20 hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Download size={16} /> DOWNLOAD
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentsGrid;
