import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Edit2, Trash2, Download, Upload, FileSpreadsheet, X, Globe, ArrowUpDown, ChevronUp, ChevronDown, Plus, AlertCircle } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx-js-style';
import { useQS } from '../context/QSContext';
import { useAuth } from '../context/AuthContext';
import * as db from '../lib/supabaseService';
import StudentEditModal from '../components/modals/StudentEditModal';
import ResolveUniversitiesModal from '../components/modals/ResolveUniversitiesModal';
import {
  IGCSE_SUBJECTS, IAS_SUBJECTS, IAL_SUBJECTS,
  IGCSE_BOARDS, IAS_BOARDS, IAL_BOARDS,
  IGCSE_SUBJECTS_LIST, IAS_SUBJECTS_LIST, IAL_SUBJECTS_LIST,
  SUBJECT_FULL_NAMES
} from '../constants/subjects';
import { useStudents } from '../context/StudentContext';
import { generateSummary } from '../utils/gradeUtils';
import { normalizeSubjectForImport } from '../utils/importUtils';

import { ScholarshipBadge, StatusBadge, GradeBadge, expandGrades, ExpandedGradeCell, SortableHeader } from '../components/ui/TableBadges';
import { StudentsTable } from '../components/tables/StudentsTable';
import { TemplateYearModal } from '../components/modals/TemplateYearModal';
import { ImportConflictModal } from '../components/modals/ImportConflictModal';
import { EditStudentIdModal } from '../components/modals/EditStudentIdModal';
import { StudentsGridToolbar } from '../components/ui/StudentsGridToolbar';

const StudentsGrid = () => {
  const { findRankByName, findUniversityByName, addCustomMapping } = useQS();
  const { user, role } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { students, upsertStudents, deleteStudent, setUappData } = useStudents();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce the search term to prevent sluggish typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Pre-calculate computed scores to avoid running generateSummary on every render
  const processedStudents = useMemo(() => {
    return students.map(s => ({
      ...s,
      computed_igcse: (s.igcse_score && s.igcse_score !== '-') ? s.igcse_score : (s.academicData?.igcse?.length > 0 ? generateSummary(s.academicData.igcse) : ''),
      computed_ias: (s.ias_score && s.ias_score !== '-') ? s.ias_score : (s.academicData?.ias?.length > 0 ? generateSummary(s.academicData.ias) : ''),
      computed_ial: (s.alevel_score && s.alevel_score !== '-') ? s.alevel_score : (s.academicData?.ial?.length > 0 ? generateSummary(s.academicData.ial) : ''),
    }));
  }, [students]);

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
  const [importContext, setImportContext] = useState({ type: null, year: null });
  const [importMsg, setImportMsg] = useState(null);
  const pendingDataRef = useRef(null);

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this student profile? This will also remove their university application records.")) {
      await deleteStudent(id);
    }
  };

  const handleClearAll = async () => {
    if (confirm("?? CRITICAL WARNING\n\nThis will permanently delete ALL student records AND university application data in the system.\n\nThis action cannot be undone. Continue?")) {
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
        const fullName = SUBJECT_FULL_NAMES[sub] || '';
        const displayLabel = fullName ? `${sub} ${fullName}` : sub;
        headers.push(`IG_${displayLabel}_board`, `IG_${displayLabel}_grade`, `IG_${displayLabel}_score`);
      });
      for (let i = 1; i <= 5; i++) {
        headers.push(`IG_Other${i}_subject`, `IG_Other${i}_board`, `IG_Other${i}_grade`, `IG_Other${i}_score`);
      }

      // IAS Section
      IAS_SUBJECTS_LIST.forEach(sub => {
        const fullName = SUBJECT_FULL_NAMES[sub] || '';
        const displayLabel = fullName ? `${sub} ${fullName}` : sub;
        headers.push(`AS_${displayLabel}_board`, `AS_${displayLabel}_grade`, `AS_${displayLabel}_score`);
      });
      for (let i = 1; i <= 2; i++) {
        headers.push(`AS_Other${i}_subject`, `AS_Other${i}_board`, `AS_Other${i}_grade`, `AS_Other${i}_score`);
      }

      // IAL Section
      IAL_SUBJECTS_LIST.forEach(sub => {
        const fullName = SUBJECT_FULL_NAMES[sub] || '';
        const displayLabel = fullName ? `${sub} ${fullName}` : sub;
        headers.push(`AL_${displayLabel}_board`, `AL_${displayLabel}_grade`, `AL_${displayLabel}_score`);
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
            const fullSub = parts[0]; 
            const sub = fullSub.split(' ')[0]; // Extract code
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
            const fullSub = parts[0]; 
            const sub = fullSub.split(' ')[0]; // Extract code
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
            const fullSub = parts[0]; 
            const sub = fullSub.split(' ')[0]; // Extract code
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
            // Handle both prefixed (IG_0452 Accounting_grade) and non-prefixed (0452 Accounting_grade)
            const fullSub = parts.length === 3 ? parts[1] : parts[0];
            const sub = fullSub.split(' ')[0]; 
            const field = parts.length === 3 ? parts[2] : parts[1];
            
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
        const fullName = SUBJECT_FULL_NAMES[sub] || '';
        const displayLabel = fullName ? `${sub} ${fullName}` : sub;
        headers.push(`${displayLabel}_board`, `${displayLabel}_grade`, `${displayLabel}_score`);
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

    // Detect type and year from filename
    const fName = file.name.toUpperCase();
    const detectedType = fName.includes('IGCSE') ? 'IGCSE' : 
                         fName.includes('IAS') ? 'IAS' : 
                         fName.includes('IAL') ? 'IAL' : 
                         fName.includes('IELTS') ? 'IELTS' : 
                         fName.includes('PROFILE') ? 'PROFILE' : null;
    const yearMatch = fName.match(/20\d{2}/);
    const detectedYear = yearMatch ? parseInt(yearMatch[0]) : null;
    setImportContext({ type: detectedType, year: detectedYear });

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
           pendingDataRef.current = jsonData;
           setResolvingUnies(unmappedArr);
           return;
        }

        processImportData(jsonData, { type: detectedType, year: detectedYear });
      } catch (err) {
        console.error('Import error:', err);
        setImportMsg({ type: 'error', text: `Import failed: ${err.message}` });
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; // Reset input
  };

  const processImportData = async (jsonData, contextOverride = null) => {
    const context = contextOverride || importContext;
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
                  // Skip if no prefix and not a confirmed match for this level
                  if (!normalized.isMatch) return;

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

        const ig = (context.type === null || context.type === 'IGCSE') ? parseSubjectData('IG', ['IG_'], true) : [];
        const ia = (context.type === null || context.type === 'IAS') ? parseSubjectData('AS', ['AS_'], true) : [];
        const il = (context.type === null || context.type === 'IAL') ? parseSubjectData('AL', ['AL_'], true) : [];
        const ieRaw = {
          reading: getVal(['reading', 'Reading']),
          writing: getVal(['writing', 'Writing']),
          listening: getVal(['listening', 'Listening']),
          speaking: getVal(['speaking', 'Speaking']),
          overall: getVal(['overall', 'Overall', 'ielts_score', 'IELTS Score'])
        };

        const imported = {
          student_num: String(getVal(['student_num', 'Student ID', 'student_id']) || '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 50),
          name_en: String(getVal(['name_en', 'English Name']) || '').trim().slice(0, 100),
          name_zh: String(getVal(['name_zh', 'Chinese Name']) || '').trim().slice(0, 100),
          other_name: String(getVal(['other_name', 'Other Name']) || '').trim().slice(0, 100),
          gender: getVal(['gender']),
          dob: getVal(['dob', 'Date of Birth']),
          phone: String(getVal(['phone', 'Phone Number']) || '').trim().slice(0, 50),
          social_media: String(getVal(['social_media', 'Social Media']) || '').trim().slice(0, 200),
          grad_year: getVal(['grad_year', 'Grad Year']) ? parseInt(getVal(['grad_year', 'Grad Year'])) : (context.year || null),
          status: String(getVal(['status']) || 'APPLICANT').trim().toUpperCase(),
          university_dest: String(getVal(['university_dest', 'University Destination', 'University']) || '').trim().slice(0, 200),
          quali: String(getVal(['quali', 'Qualification']) || '').trim().slice(0, 100),
          program_dest: String(getVal(['program_dest', 'Program Destination', 'Program']) || '').trim().slice(0, 200),
          igcse_score: ig.length > 0 ? generateSummary(ig) : null,
          ias_score: ia.length > 0 ? generateSummary(ia) : null,
          alevel_score: il.length > 0 ? generateSummary(il) : null,
          ielts_score: ieRaw.overall,
          _academicModified: (ig.length > 0 || ia.length > 0 || il.length > 0 || ieRaw.overall !== null),
          academicData: { 
            igcse: ig, ias: ia, ial: il,
            ielts: {
              reading: String(ieRaw.reading || '').trim().slice(0, 10),
              writing: String(ieRaw.writing || '').trim().slice(0, 10),
              listening: String(ieRaw.listening || '').trim().slice(0, 10),
              speaking: String(ieRaw.speaking || '').trim().slice(0, 10),
              overall: String(ieRaw.overall || '').trim().slice(0, 10)
            }
          }
        };

        // Strict Validation Check
        if (!imported.student_num || imported.student_num.length < 3) return; // Skip invalid IDs
        if (!imported.name_en) return; // Skip without name


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
        else console.log('[RESOLVE] QS upsert OK:', resolved);
      } catch (err) {
        console.warn('[RESOLVE] QS upsert failed:', err.message);
      }
    }

    try {
      await Promise.race([
        addCustomMapping(oldName, resolved),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
      ]);
      console.log('[RESOLVE] Mapping OK:', oldName, '->', resolved);
    } catch (err) {
      console.warn('[RESOLVE] Mapping failed:', err.message);
    }

    // Update ref directly (avoids stale state)
    if (pendingDataRef.current) {
      const updated = pendingDataRef.current.map(row =>
        row.university_dest === oldName ? { ...row, university_dest: resolved } : row
      );
      pendingDataRef.current = updated;
      setPendingPreImportData(updated);
    } else {
      const toUpdate = students
        .filter(s => s.university_dest === oldName)
        .map(s => ({ ...s, university_dest: resolved, person: undefined }));
      if (toUpdate.length > 0) await upsertStudents(toUpdate);
    }
  };

  const handleFinishResolve = async () => {
    setResolvingUnies([]);
    const rows = pendingDataRef.current;
    pendingDataRef.current = null;
    setPendingPreImportData(null);
    if (rows) {
      await processImportData(rows, importContext);
    }
    setImportContext({ type: null, year: null });
  };

  const handleCloseResolveModal = () => {
     setResolvingUnies([]);
     pendingDataRef.current = null;
     setPendingPreImportData(null);
     setImportContext({ type: null, year: null });
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredStudents = useMemo(() => {
    let result = processedStudents.filter(s => {
      const term = debouncedSearchTerm.toLowerCase();
      if (!term) return true;
      const matchNameEn = (s.name_en || s.person?.name_en || '').toLowerCase().includes(term);
      const matchNameZh = (s.name_zh || s.person?.name_zh || '').toLowerCase().includes(term);
      const matchGradYear = String(s.grad_year || '').includes(term);
      const matchProgram = (s.program_dest || '').toLowerCase().includes(term);
      const matchUniv = (s.university_dest || '').toLowerCase().includes(term);
      const matchIG = (s.computed_igcse || '').toLowerCase().includes(term);
      const matchIAS = (s.computed_ias || '').toLowerCase().includes(term);
      const matchIAL = (s.computed_ial || '').toLowerCase().includes(term);
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
          // Fallback: extract year from student_num prefix (e.g. "20171023" ??2017)
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
  }, [processedStudents, debouncedSearchTerm, sortConfig, findRankByName]);

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
      <StudentsGridToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        resultCount={filteredStudents.length}
        onResolveMappings={handleCheckUnmapped}
        unmappedCount={unmappedCount}
        role={role}
        onExportTemplate={handleExportTemplate}
        onImportXL={handleImportXL}
        onClearAll={handleClearAll}
        onAddNew={() => setEditingStudent({})}
      />
      {pendingImport && pendingImport.conflicts[conflictIndex] && (
        <ImportConflictModal
          conflict={pendingImport.conflicts[conflictIndex]}
          index={conflictIndex}
          totalCount={pendingImport.conflicts.length}
          onCancel={handleCancelImport}
          onSkip={handleConflictSkip}
          onEditId={handleConflictEditAndSave}
          onMerge={handleConflictMerge}
          onMergeAll={handleConflictMergeAll}
        />
      )}

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

      <StudentsTable
        filteredStudents={filteredStudents}
        sortConfig={sortConfig}
        requestSort={requestSort}
        role={role}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        findRankByName={findRankByName}
      />

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
        onResolveRow={handleResolveOneRow}
        onFinish={handleFinishResolve}
      />

      <EditStudentIdModal
        isOpen={editIdPrompt?.isOpen}
        initialValue={editIdPrompt?.initialValue}
        studentName={editIdPrompt?.studentName}
        errorMsg={editIdPrompt?.errorMsg}
        onClose={() => setEditIdPrompt(null)}
        onSave={submitEditId}
        onErrorClear={() => setEditIdPrompt(prev => ({ ...prev, errorMsg: null }))}
      />
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

export default StudentsGrid;
