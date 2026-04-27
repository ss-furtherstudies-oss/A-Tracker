import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Users, School, Award, TrendingUp, MapPin, ChevronDown, Copy, Check, Download
} from 'lucide-react';
import { useStudents } from '../context/StudentContext';
import { useQS } from '../context/QSContext';
import { getChartSubjectOptions, doesSubjectMatchChartOption } from '../constants/subjects';

// ─── Constants & Utils ───────────────────────────────────────────────────────
const FIELD_KEYWORDS = {
  'Natural Science':  ['science', 'physics', 'chemistry', 'biology', 'math', 'statistics', 'biochemistry', 'geology', 'environmental', 'computer', 'data', 'it ', 'cs', 'computing', 'biomedical', 'astronomy', 'pharmacology', 'ecology', 'natural', 'pure', 'quantitative'],
  'Social Science':   ['social', 'psychology', 'sociology', 'political', 'geography', 'history', 'law', 'philosophy', 'media', 'communication', 'linguistics', 'education', 'english', 'anthropology', 'criminology', 'international relations', 'public policy', 'theology', 'literature'],
  'Health Science':   ['medicine', 'medical', 'nursing', 'pharmacy', 'health', 'dental', 'physiotherapy', 'nutrition', 'food', 'veterinary', 'radiography', 'optometry', 'surgery', 'clinical'],
  'Business':         ['business', 'bba', 'finance', 'accounting', 'management', 'marketing', 'commerce', 'economics', 'actuarial', 'entrepreneurship', 'hospitality', 'real estate', 'supply chain', 'audit', 'bank'],
  'Engineering':      ['engineering', 'civil', 'mechanical', 'electrical', 'electronic', 'chemical engineering', 'aerospace', 'architecture', 'robotics', 'structural', 'tech'],
  'Arts & Humanities':['art', 'design', 'music', 'film', 'drama', 'fashion', 'visual', 'creative', 'fine art', 'languages', 'translation', 'archaeology', 'classics', 'journalism', 'photography'],
};

const COUNTRY_KEYWORDS = {
  'United Kingdom': ['oxford', 'cambridge', 'imperial', 'ucl', 'london', 'edinburgh', 'manchester', 'bristol', 'warwick', 'exeter', 'bath', 'durham', 'king', 'queen', 'nottingham', 'southampton', 'glasgow', 'st andrews', 'lse', 'goldsmiths', 'kingston'],
  'Hong Kong SAR':  ['hong kong', 'hku', 'cuhk', 'hkust', 'polyu', 'cityu', 'lingnan', 'chu hai', 'hkbu', 'shue yan'],
  'United States':  ['harvard', 'mit', 'stanford', 'yale', 'princeton', 'columbia', 'chicago', 'pennsylvania', 'cornell', 'university of california', 'uc ', 'ucla', 'usc', 'duke', 'johns hopkins', 'purdue', 'davis', 'san diego', 'michigan', 'northwestern', 'nyu', 'carnegie'],
  'Australia':      ['australian', 'melbourne', 'sydney', 'queensland', 'monash', 'unsw', 'anu', 'uwa', 'adelaide', 'macquarie', 'rmit'],
  'Canada':         ['toronto', 'mcgill', 'ubc', 'waterloo', 'alberta', 'queens', 'dalhousie', 'ottawa', 'western', 'montreal'],
  'Singapore':      ['singapore', 'nus', 'ntu', 'smu'],
  'Netherlands':    ['delft', 'netherlands', 'leiden', 'amsterdam', 'rotterdam', 'eindhoven', 'twente', 'utrecht', 'groningen'],
  'Japan':          ['tokyo', 'kyoto', 'osaka', 'waseda', 'keio', 'nagoya', 'hiroshima', 'tohoku'],
  'Germany':        ['munich', 'berlin', 'heidelberg', 'hamburg', 'frankfurt', 'bonn', 'tübingen', 'freiburg', 'lmu'],
  'China Mainland': ['peking', 'tsinghua', 'fudan', 'zhejiang', 'nanjing', 'tongji', 'wuhan', 'renmin', 'sun yat'],
  'Taiwan':         ['taiwan', 'nthu', 'ntu', 'ncku', 'yuan ze', 'tamkang'],
};

const classifyProgram = (program) => {
  if (!program || program === '-') return 'Inter-disciplinary';
  const p = program.toLowerCase();
  for (const [key, keywords] of Object.entries(FIELD_KEYWORDS)) {
    if (keywords.some(k => p.includes(k))) return key;
  }
  return 'Inter-disciplinary';
};

const inferCountry = (uniName) => {
  if (!uniName || uniName === '-') return null;
  const name = uniName.toLowerCase();
  for (const [country, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
    if (keywords.some(k => name.includes(k))) return country;
  }
  return 'Inter-disciplinary';
};

const IGCSE_LETTER_GRADES = ['A*', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];
const ALEVEL_LETTER_GRADES = ['A*', 'A', 'B', 'C', 'D', 'E', 'U'];
const IELTS_BANDS = ['9.0', '8.5', '8.0', '7.5', '7.0', '6.5', '<6.5'];
const IELTS_COMPONENTS = ['overall', 'reading', 'writing', 'listening', 'speaking'];

const normalizeIGCSEGrade = (grade) => {
  const g = String(grade || '').toUpperCase().trim();
  return IGCSE_LETTER_GRADES.includes(g) ? g : '';
};

// ─── Visual Components ───────────────────────────────────────────────────────
const isSummaryRow = (row) => 
  row.grade === 'GRAND TOTAL' || 
  row.band === 'GRAND TOTAL' || 
  row.level === 'GRAND TOTAL' || 
  row.name === 'GRAND TOTAL' || 
  row.rowLabel === 'GRAND TOTAL';

const Card = ({ children, title, icon: Icon, className = "", headerExtra, headerBg = "bg-slateBlue-100/30" }) => {
  const [copied, setCopied] = React.useState(false);
  const cardRef = React.useRef(null);

  const handleCopy = () => {
    const table = cardRef.current.querySelector('table');
    if (table) {
      const rows = Array.from(table.querySelectorAll('tr'));
      const text = rows.map(row => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        return cells.map(cell => {
           // Handle nested data structures if any
           return cell.innerText.replace(/\n/g, ' ').trim();
        }).join('\t');
      }).join('\n');
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div ref={cardRef} className={`bg-white rounded-xl shadow-md border-2 border-slateBlue-100/80 overflow-hidden flex flex-col h-full hover:shadow-lg transition-all duration-300 ${className}`}>
      {title && (
        <div className={`px-5 py-2.5 border-b border-gray-50 flex items-center justify-between shrink-0 ${headerBg}`}>
          <div className="flex items-center gap-2">
            {Icon && <Icon size={14} className="text-slateBlue-600" />}
            <h3 className="text-[10px] font-black text-slateBlue-800 uppercase tracking-widest">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
             {headerExtra}
             <button 
               onClick={handleCopy}
               className="p-1.5 hover:bg-white/50 rounded-md transition-colors text-slateBlue-400 hover:text-aura-teal"
               title="Copy table data"
             >
               {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
             </button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto grow">
        {children}
      </div>
    </div>
  );
};

const StatsTable = ({ headers, rows, emptyMsg = "No data available", noZebra = false }) => {
  const mainRows = rows?.filter(r => !isSummaryRow(r)) || [];
  const summaryRow = rows?.find(r => isSummaryRow(r));

  const renderRow = (row, rowIndex, isSummary = false) => (
    <tr key={rowIndex} className={`transition-colors ${row.className ? row.className : `hover:bg-slate-100 ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}`}>
      {headers.map((h, j) => {
        const cellData = row[h.key];
        const isDataColumn = j > 0;
        const isEmpty = isDataColumn && cellData && cellData.hasData === false;
        const greyClass = isEmpty ? 'bg-gray-100/60' : '';
        
        return (
          <td 
            key={j} 
            className={`px-2 py-1 border-r border-gray-50/50 last:border-r-0 ${h.center ? 'text-center' : h.left ? 'text-left' : (j === 0 ? 'text-center' : '')} ${h.className || ''} ${greyClass}`}
          >
            {isDataColumn && cellData && typeof cellData === 'object' ? (
              <DataCellInner {...cellData} isSummary={isSummary} />
            ) : (
              <span className={h.primary || h.key === 'name' || j === 0 || isSummary ? "font-black" : "font-bold opacity-90"}>
                {cellData && cellData !== '-' ? cellData : ''}
              </span>
            )}
          </td>
        );
      })}
    </tr>
  );

  return (
    <div className="flex flex-col h-full min-h-[220px]">
      <div className="grow overflow-auto relative">
        <table className="w-full text-center text-[10px] border-collapse tabular-nums text-slateBlue-700 table-fixed">
          <thead>
            <tr className="bg-slateBlue-800 text-white uppercase font-black text-[8.5px] tracking-widest border-b border-slateBlue-900 sticky top-0 z-20">
              {headers.map((h, i) => (
                <th key={i} className={`px-2 py-1.5 text-center ${h.width || ''}`}>
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {mainRows.length > 0 ? mainRows.map((row, i) => renderRow(row, i)) : (
              <tr><td colSpan={headers.length} className="px-4 py-8 text-center text-gray-400 italic font-medium">No data available</td></tr>
            )}
          </tbody>
          {summaryRow && (
            <tfoot className="sticky bottom-0 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
              {renderRow(summaryRow, 0, true)}
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

const DataCellInner = ({ count, pct, hasData, labelOnly = false, isSummary = false }) => {
  if (!hasData) return <span className="text-gray-300"></span>;
  if (labelOnly) return <span className={`${isSummary ? 'text-white' : 'text-slateBlue-800'} font-bold text-[11px]`}>{count > 0 ? count : ''}</span>;
  if (count === 0) return <span className="text-gray-200"></span>;
  
  const isHigh = pct >= 50;
  const isMedium = pct >= 25;
  const colorClass = isSummary ? 'text-white font-black' : (isHigh ? 'text-emerald-500 font-black' : isMedium ? 'text-serene-indigo font-bold' : 'text-slateBlue-400 font-bold');

  return (
    <div className="flex flex-col items-center leading-none py-1">
      <span className={`text-[11px] ${colorClass}`}>{pct.toFixed(0)}%</span>
      <span className={`text-[7px] font-bold ${isSummary ? 'text-white/70' : 'text-gray-400'} mt-0.5`}>({count})</span>
    </div>
  );
};

const Select = ({ options, value, onChange, className = "" }) => (
  <div className={`relative ${className}`}>
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="appearance-none pl-2 pr-6 py-0.5 text-[9px] font-black text-slateBlue-800 bg-white border border-gray-200 rounded-md focus:border-aura-teal shadow-xs cursor-pointer uppercase tracking-tight"
    >
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
    <ChevronDown size={8} className="absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" />
  </div>
);

// ─── Main Page ───────────────────────────────────────────────────────────────
const Statistics = () => {
  const { t } = useTranslation();
  const { students = [] } = useStudents();
  const { findRankByName } = useQS();
  const [activeTab, setActiveTab] = useState('academic');
  const [timeWindow, setTimeWindow] = useState('all'); 

  const currentYear = new Date().getFullYear();

  const allYears = useMemo(() => 
    [...new Set(students.map(s => s.grad_year).filter(Boolean))].sort((a,b) => a-b), 
  [students]);

  const [subIGCSE, setSubIGCSE] = useState('Overall');
  const [subIAS, setSubIAS] = useState('Overall');
  const [subIAL, setSubIAL] = useState('Overall');
  const [ieltsComp, setIeltsComp] = useState('overall');

  // University filters
  const [uniLocation, setUniLocation] = useState('All');
  const [uniYear, setUniYear] = useState('All');

  const uniYearsList = useMemo(() => {
    return [...new Set(students.filter(s => s.status !== 'WITHDRAWN').map(s => s.grad_year).filter(Boolean))].sort((a,b) => b-a);
  }, [students]);

  const uniLocationsList = useMemo(() => {
    return [...new Set(students.filter(s => s.status !== 'WITHDRAWN' && s.university_dest && s.university_dest !== '-').map(s => inferCountry(s.university_dest)).filter(Boolean))].sort();
  }, [students]);

  // Pivot Demographics Selectors
  const pivotDimensions = useMemo(() => [
    { value: 'field', label: 'Field of Study' },
    { value: 'location', label: 'Destination Country' },
    { value: 'gender', label: 'Gender' },
    { value: 'status', label: 'Status' },
    { value: 'qs_tier', label: 'QS Rank Tier' },
    { value: 'academic_tier', label: 'Academic Tier (A-Level)' },
    { value: 'ielts_tier', label: 'IELTS Score Range' }
  ], []);

  const [pivotRow, setPivotRow] = useState('field');
  const [pivotCol, setPivotCol] = useState('gender');
  const [pivotYear, setPivotYear] = useState('All');

  const pivotYearsList = useMemo(() => {
    return ['All', ...[...new Set(students.filter(s => s.status !== 'WITHDRAWN').map(s => s.grad_year).filter(Boolean))].sort((a,b) => b-a).map(String)];
  }, [students]);

  const getVisibleYears = (type, subject) => {
    let filtered = allYears;
    if (timeWindow === '5') filtered = allYears.filter(y => y >= currentYear - 5);
    else if (timeWindow === '10') filtered = allYears.filter(y => y >= currentYear - 10);

    return filtered.filter(year => {
      const cohort = students.filter(s => s.grad_year === year);
      if (type === 'ielts') return cohort.some(s => s.academicData?.ielts?.[ieltsComp]);
      return cohort.some(s => {
        const exams = s.academicData?.[type] || [];
        return subject === 'Overall'
          ? exams.length > 0
          : exams.some(e => doesSubjectMatchChartOption(type, subject, e.subject));
      });
    });
  };

  const getGradeYearData = (type, subject) => {
    const gradeScale = type === 'igcse' ? IGCSE_LETTER_GRADES : ALEVEL_LETTER_GRADES;
    const visibleYears = getVisibleYears(type, subject);
    const rows = gradeScale.map(grade => {
      const row = { grade };
      let anyDataAcrossYears = false;
      visibleYears.forEach(year => {
        const cohort = students.filter(s => s.grad_year === year);
        let totalCount = 0;
        let gradeCount = 0;
        let hasData = false;

        cohort.forEach(s => {
          const exams = (s.academicData?.[type] || []).filter(
            e => subject === 'Overall' || doesSubjectMatchChartOption(type, subject, e.subject)
          );
          if (exams.length > 0) hasData = true;
          exams.forEach(e => {
            totalCount++;
            const g = type === 'igcse' ? normalizeIGCSEGrade(e.grade) : e.grade?.toUpperCase().trim();
            if (g === grade) gradeCount++;
          });
        });

        if (gradeCount > 0) anyDataAcrossYears = true;
        const pct = totalCount > 0 ? (gradeCount / totalCount) * 100 : 0;
        row[year] = { count: gradeCount, pct, hasData };
      });
      return { row, anyDataAcrossYears };
    })
    const finalRows = rows.filter(r => r.anyDataAcrossYears).map(r => r.row);
    if (finalRows.length > 0) {
      const summaryRow = { grade: 'GRAND TOTAL', className: 'bg-slateBlue-800 text-white font-black' };
      visibleYears.forEach(year => {
        const sum = finalRows.reduce((acc, curr) => acc + (curr[year]?.count || 0), 0);
        summaryRow[year] = { count: sum, pct: 100, hasData: sum > 0 };
      });
      finalRows.push(summaryRow);
    }
    const headers = [{ key: 'grade', label: 'GRADE', width: 'w-12' }, ...visibleYears.map(y => ({ key: String(y), label: String(y), center: true, width: 'w-14' }))];
    return { headers, rows: finalRows };
  };

  const ieltsData = useMemo(() => {
    const visibleYears = getVisibleYears('ielts');
    const rows = IELTS_BANDS.map(label => {
      const row = { band: label };
      let anyDataAcrossYears = false;
      visibleYears.forEach(year => {
        const cohort = students.filter(s => s.grad_year === year && s.academicData?.ielts?.[ieltsComp]);
        const scores = cohort.map(s => parseFloat(s.academicData.ielts[ieltsComp])).filter(v => !isNaN(v));
        let count = 0;
        const val = parseFloat(label);
        if (label === '<6.5') count = scores.filter(v => v < 6.5).length;
        else count = scores.filter(v => v === val).length;
        if (count > 0) anyDataAcrossYears = true;
        const pct = cohort.length > 0 ? (count / cohort.length) * 100 : 0;
        row[year] = { count, pct, hasData: cohort.length > 0 };
      });
      return { row, anyDataAcrossYears };
    })
    const finalRows = rows.filter(r => r.anyDataAcrossYears).map(r => r.row);

    if (finalRows.length > 0) {
      const summaryRow = { band: 'GRAND TOTAL', className: 'bg-slateBlue-800 text-white font-black' };
      visibleYears.forEach(year => {
        const sum = finalRows.reduce((acc, curr) => acc + (curr[year]?.count || 0), 0);
        summaryRow[year] = { count: sum, pct: 100, hasData: sum > 0 };
      });
      finalRows.push(summaryRow);
    }
    
    const headers = [{ key: 'band', label: 'BAND', width: 'w-12' }, ...visibleYears.map(y => ({ key: String(y), label: String(y), center: true, width: 'w-14' }))];
    return { headers, rows: finalRows };
  }, [students, timeWindow, allYears, ieltsComp]);

  const getAMilestones = (type) => {
    const letter = type === 'ias' ? 'A' : 'A*';
    const visibleYears = allYears.filter(y => (timeWindow === 'all' || (timeWindow === '5' ? y >= currentYear - 5 : y >= currentYear - 10)))
      .filter(y => students.filter(s => s.grad_year === y).some(s => (s.academicData?.[type] || []).length > 0));

    // For IGCSE, show 9 down to 1 if data exists. For IAL/IAS show 6 down to 1.
    const maxVal = type === 'igcse' ? 9 : 6;
    const levels = [];
    for (let i = maxVal; i >= 1; i--) levels.push(i === 6 && type !== 'igcse' ? '6+' : String(i));

    const rows = levels.map(lv => {
      const row = { level: `${lv}${letter}` };
      let anyDataAcrossYears = false;
      visibleYears.forEach(year => {
        const cohort = students.filter(s => s.grad_year === year);
        const studentCounts = cohort.map(s => (s.academicData?.[type] || []).filter(m => {
          const g = type === 'igcse' ? normalizeIGCSEGrade(m.grade) : m.grade?.toUpperCase().trim();
          return g === letter;
        }).length);
        
        let count = 0;
        if (lv === '6+') count = studentCounts.filter(c => c >= 6).length;
        else count = studentCounts.filter(c => c === parseInt(lv)).length;
        if (count > 0) anyDataAcrossYears = true;
        row[year] = { count, hasData: cohort.length > 0, labelOnly: true };
      });
      return { row, anyDataAcrossYears, val: parseInt(lv) };
    })
    // Filter rows logic: keep all if <= 6 or if they have data
    const finalRows = rows.filter(r => r.val <= 6 || r.anyDataAcrossYears).map(r => r.row);
    if (finalRows.length > 0) {
      const summaryRow = { level: 'GRAND TOTAL', className: 'bg-slateBlue-800 text-white font-black' };
      visibleYears.forEach(year => {
        const sum = finalRows.reduce((acc, curr) => acc + (curr[year]?.count || 0), 0);
        summaryRow[year] = { count: sum, hasData: sum > 0, labelOnly: true };
      });
      finalRows.push(summaryRow);
    }
    const headers = [{ key: 'level', label: 'Milestone', width: 'w-16' }, ...visibleYears.map(y => ({ key: String(y), label: String(y), center: true, width: 'w-16' }))];
    return { headers, rows: finalRows };
  };

  const uniEnrollment = useMemo(() => {
    const map = {};
    const validStudents = students.filter(s => {
      if (s.status === 'WITHDRAWN') return false;
      if (uniYear !== 'All' && String(s.grad_year) !== uniYear) return false;
      if (uniLocation !== 'All' && inferCountry(s.university_dest) !== uniLocation) return false;
      return true;
    });

    validStudents.forEach(s => {
      const uni = s.university_dest; if (!uni || uni === '-') return;
      if (!map[uni]) map[uni] = { name: uni, total: 0, rank: findRankByName(uni) || 'N/A' };
      map[uni].total++;
    });
    const finalData = Object.values(map).sort((a,b) => b.total - a.total);
    if (finalData.length > 0) {
      const totalCount = finalData.reduce((acc, curr) => acc + curr.total, 0);
      finalData.push({ 
        rank: '', 
        name: 'GRAND TOTAL', 
        total: totalCount, 
        className: 'bg-slateBlue-800 text-white font-black' 
      });
    }
    return finalData;
  }, [students, findRankByName, uniYear, uniLocation]);

  const pivotData = useMemo(() => {
    const validStudents = students.filter(s => {
      if (s.status === 'WITHDRAWN') return false;
      if (pivotYear !== 'All' && String(s.grad_year) !== pivotYear) return false;
      return true;
    });

    const getDimValue = (s, dim) => {
       if (dim === 'gender') {
         const g = s.gender || s.person?.gender;
         return g ? g.charAt(0).toUpperCase() + g.slice(1).toLowerCase() : 'Unknown';
       }
       if (dim === 'status') return s.status || 'Unknown';
       if (dim === 'location') return inferCountry(s.university_dest) || 'Inter-disciplinary';
       if (dim === 'field') return classifyProgram(s.program_dest);
       if (dim === 'qs_tier') {
          const rank = findRankByName(s.university_dest);
          if (!rank || rank === 'N/A') return 'Unranked/Other';
          const r = parseInt(rank);
          if (r <= 20) return 'Top 20';
          if (r <= 50) return '21-50';
          if (r <= 100) return '51-100';
          if (r <= 200) return '101-200';
          return '201+';
       }
       if (dim === 'academic_tier') {
          const score = s.alevel_score || '';
          if (score.includes('A*') && (score.match(/A\*/g) || []).length >= 2) return '2A* or more';
          if (score.includes('A*') || (score.match(/A/g) || []).length >= 3) return '3A or more';
          if (score.includes('A') || (score.match(/B/g) || []).length >= 2) return '2B or more';
          return 'Other';
       }
       if (dim === 'ielts_tier') {
          const sc = parseFloat(s.ielts_score);
          if (isNaN(sc)) return 'N/A';
          if (sc >= 8.0) return '8.0+';
          if (sc >= 7.5) return '7.5';
          if (sc >= 7.0) return '7.0';
          if (sc >= 6.5) return '6.5';
          return '< 6.5';
       }
       return 'Unk';
    };

    const rowKeys = new Set();
    const colKeys = new Set();
    
    validStudents.forEach(s => {
       rowKeys.add(getDimValue(s, pivotRow));
       colKeys.add(getDimValue(s, pivotCol));
    });

    const rowsSorted = Array.from(rowKeys).sort();
    const colsSorted = Array.from(colKeys).sort();

    const headers = [
       { key: 'rowLabel', label: pivotDimensions.find(d => d.value === pivotRow)?.label || 'Category', width: 'min-w-[150px]', center: true },
       ...colsSorted.map(col => ({ key: col, label: col, center: true })),
       { key: 'total', label: 'Total', center: true }
    ];

    const mappedRows = rowsSorted.map(rowLabel => {
       const rowObj = { rowLabel, totalCount: 0 };
       colsSorted.forEach(c => rowObj[c] = 0);
       return rowObj;
    });

    validStudents.forEach(s => {
       const r = getDimValue(s, pivotRow);
       const c = getDimValue(s, pivotCol);
       const rowObj = mappedRows.find(x => x.rowLabel === r);
       if (rowObj) {
           rowObj[c]++;
           rowObj.totalCount++;
       }
    });

    const finalRows = mappedRows.map(r => {
       const finalR = { rowLabel: r.rowLabel };
       colsSorted.forEach(c => {
         finalR[c] = r[c] || '';
       });
       finalR.total = r.totalCount || '';
       return finalR;
    }).sort((a, b) => (b.total || 0) - (a.total || 0));

    // Also include a total summary row at the bottom
    const summaryRow = { rowLabel: 'GRAND TOTAL', className: 'bg-slateBlue-800 text-white font-black' };
    let grandTotal = 0;
    colsSorted.forEach(c => {
       const sum = mappedRows.reduce((acc, curr) => acc + curr[c], 0);
       summaryRow[c] = sum || '';
       grandTotal += sum;
    });
    summaryRow.total = grandTotal || '';

    return { headers, rows: finalRows.length > 0 ? [...finalRows, summaryRow] : [] };
  }, [students, pivotRow, pivotCol, pivotYear, pivotDimensions]);

  // Memoize expensive per-tab computations
  const igcseData   = useMemo(() => getGradeYearData('igcse', subIGCSE), [students, timeWindow, allYears, subIGCSE]);
  const iasData     = useMemo(() => getGradeYearData('ias',   subIAS),   [students, timeWindow, allYears, subIAS]);
  const ialData     = useMemo(() => getGradeYearData('ial',   subIAL),   [students, timeWindow, allYears, subIAL]);
  const igcseMiles  = useMemo(() => getAMilestones('igcse'), [students, timeWindow, allYears]);
  const iasMiles    = useMemo(() => getAMilestones('ias'),   [students, timeWindow, allYears]);
  const ialMiles    = useMemo(() => getAMilestones('ial'),   [students, timeWindow, allYears]);

  return (
    <div className="space-y-4 px-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-slateBlue-800 tracking-tight leading-none">{t('stats.title')}</h1>
          <div className="flex gap-4 mt-2">
             {['all', '5', '10'].map(win => (
               <button key={win} onClick={() => setTimeWindow(win)}
                className={`text-[9.5px] font-black uppercase tracking-widest pb-1 transition-all ${timeWindow === win ? 'text-aura-teal border-b-2 border-aura-teal' : 'text-gray-400 hover:text-slateBlue-800'}`}>
                 {win === 'all' ? 'All Years' : `Last ${win} Years`}
               </button>
             ))}
          </div>
        </div>
        <div className="flex bg-white p-0.5 rounded-lg shadow-sm border border-gray-100 self-start">
          {['academic', 'milestones', 'university', 'demographics'].map(tabId => (
            <button key={tabId} onClick={() => setActiveTab(tabId)} 
              className={`px-3 py-1 text-[9px] font-black tracking-widest uppercase transition-all rounded-md ${activeTab === tabId ? 'bg-aura-teal text-white shadow-xs' : 'text-gray-400 hover:text-slateBlue-800'}`}>
              {t(`stats.tabs.${tabId}`)}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'academic' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card title={t('stats.academic.igcse')} icon={Award} headerBg="bg-aura-teal/10" headerExtra={<Select options={[{ value: 'Overall', label: 'Overall IGCSE' }, ...getChartSubjectOptions('igcse')]} value={subIGCSE} onChange={setSubIGCSE} />}>
            <StatsTable {...igcseData} />
          </Card>
          <Card title={t('stats.academic.ias')} icon={Award} headerBg="bg-blue-50" headerExtra={<Select options={[{ value: 'Overall', label: 'Overall IAS' }, ...getChartSubjectOptions('ias')]} value={subIAS} onChange={setSubIAS} />}>
            <StatsTable {...iasData} />
          </Card>
          <Card title={t('stats.academic.ial')} icon={Award} headerBg="bg-purple-50" headerExtra={<Select options={[{ value: 'Overall', label: 'Overall IAL' }, ...getChartSubjectOptions('ial')]} value={subIAL} onChange={setSubIAL} />}>
            <StatsTable {...ialData} />
          </Card>
          <Card title={t('stats.academic.ielts')} icon={TrendingUp} headerBg="bg-orange-50" headerExtra={<Select options={IELTS_COMPONENTS.map(c=>({value:c,label:c}))} value={ieltsComp} onChange={setIeltsComp} />}>
            <StatsTable {...ieltsData} />
          </Card>
        </div>
      )}

      {activeTab === 'milestones' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[['igcse', igcseMiles], ['ias', iasMiles], ['ial', ialMiles]].map(([type, milesData]) => (
            <Card key={type} title={t(`stats.milestones.${type}`)} icon={TrendingUp} headerBg={type === 'ias' ? 'bg-blue-50' : type === 'ial' ? 'bg-purple-50' : 'bg-aura-teal/10'}>
              <StatsTable {...milesData} />
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'university' && (
        <Card 
          title={t('stats.university.enrollment')} 
          icon={School}
          headerExtra={
            <div className="flex gap-2">
               <Select options={[{value:'All',label:'All Locations'}, ...uniLocationsList.map(l => ({value:l,label:l}))]} value={uniLocation} onChange={setUniLocation} />
               <Select options={[{value:'All',label:'All Years'}, ...uniYearsList.map(y => ({value:String(y),label:String(y)}))]} value={uniYear} onChange={setUniYear} />
            </div>
          }
        >
          <StatsTable headers={[{ key: 'rank', label: 'QS Rank', center: true, width: 'w-24' }, { key: 'name', label: 'University', width: 'w-[300px]', left: true, primary: true }, { key: 'total', label: 'Count', center: true, width: 'w-24' }]} rows={uniEnrollment} />
        </Card>
      )}

      {activeTab === 'demographics' && (
        <Card 
          title="Demographics cross-tabulation" 
          icon={Users}
          headerExtra={
             <div className="flex gap-2">
                <Select options={pivotDimensions} value={pivotRow} onChange={setPivotRow} />
                <span className="text-gray-300 font-bold self-center text-xs">VS</span>
                <Select options={pivotDimensions} value={pivotCol} onChange={setPivotCol} />
                <div className="w-px bg-slateBlue-100/50 mx-1"></div>
                <Select 
                  options={pivotYearsList.map(y => ({value: y, label: y === 'All' ? 'All Years' : y}))} 
                  value={pivotYear} 
                  onChange={setPivotYear} 
                />
             </div>
          }
        >
          <StatsTable headers={pivotData.headers} rows={pivotData.rows} />
        </Card>
      )}
    </div>
  );
};

export default Statistics;
