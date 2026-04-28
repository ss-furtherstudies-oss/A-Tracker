import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Cell, PieChart, Pie, LabelList
} from 'recharts';
import { 
  Users, GraduationCap, School, Globe, BookOpen, ChevronDown, 
  Copy, Download, Check, TrendingUp, Award, RefreshCw
} from 'lucide-react';
import { useStudents } from '../context/StudentContext';
import { getChartSubjectOptions, doesSubjectMatchChartOption } from '../constants/subjects';
import { WorldMap } from '../components/WorldMap';

// ─── Grade ordering & colors ────────────────────────────────────────────────
const LETTER_GRADES = ['U', 'E', 'D', 'C', 'B', 'A', 'A*'];
const IGCSE_LETTER_GRADES = ['U', 'G', 'F', 'E', 'D', 'C', 'B', 'A', 'A*'];
const NUMERIC_GRADES = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

const GRADE_COLORS = {
  'U':  '#ef4444', 'E':  '#f97316', 'D':  '#f59e0b',
  'F':  '#fb7185', 'G':  '#fda4af',
  'C':  '#eab308', 'B':  '#84cc16', 'A':  '#22c55e', 'A*': '#10b981',
  '1':  '#ef4444', '2':  '#f97316', '3':  '#f59e0b', '4':  '#eab308',
  '5':  '#84cc16', '6':  '#22c55e', '7':  '#14b8a6', '8':  '#6366f1', '9':  '#8b5cf6',
};

const normalizeIGCSEGrade = (grade) => {
  const g = String(grade || '').toUpperCase().trim();
  return IGCSE_LETTER_GRADES.includes(g) ? g : '';
};

const normalizeIGCSENumericGrade = (grade) => {
  const g = String(grade || '').trim();
  return NUMERIC_GRADES.includes(g) ? g : '';
};

// ─── Program classification ──────────────────────────────────────────────────
const FIELD_KEYWORDS = {
  'Natural Science':  ['science', 'physics', 'chemistry', 'biology', 'math', 'statistics', 'biochemistry', 'geology', 'environmental', 'computer', 'data', 'it ', 'cs', 'computing', 'biomedical', 'astronomy', 'pharmacology', 'ecology', 'natural', 'pure', 'quantitative'],
  'Social Science':   ['social', 'psychology', 'sociology', 'political', 'geography', 'history', 'law', 'philosophy', 'media', 'communication', 'linguistics', 'education', 'english', 'anthropology', 'criminology', 'international relations', 'public policy', 'theology', 'literature'],
  'Health Science':   ['medicine', 'medical', 'nursing', 'pharmacy', 'health', 'dental', 'physiotherapy', 'nutrition', 'food', 'veterinary', 'radiography', 'optometry', 'surgery', 'clinical'],
  'Business':         ['business', 'bba', 'finance', 'accounting', 'management', 'marketing', 'commerce', 'economics', 'actuarial', 'entrepreneurship', 'hospitality', 'real estate', 'supply chain', 'audit', 'bank'],
  'Engineering':      ['engineering', 'civil', 'mechanical', 'electrical', 'electronic', 'chemical engineering', 'aerospace', 'architecture', 'robotics', 'structural', 'tech'],
  'Arts & Humanities':['art', 'design', 'music', 'film', 'drama', 'fashion', 'visual', 'creative', 'fine art', 'languages', 'translation', 'archaeology', 'classics', 'journalism', 'photography'],
};

const classifyProgram = (program) => {
  if (!program || program === '-') return 'Inter-disciplinary';
  const p = program.toLowerCase();
  for (const [field, keywords] of Object.entries(FIELD_KEYWORDS)) {
    if (keywords.some(k => p.includes(k))) return field;
  }
  return 'Inter-disciplinary';
};

// ─── Country mapping from university name ────────────────────────────────────
const COUNTRY_KEYWORDS = {
  'United Kingdom': ['oxford', 'cambridge', 'imperial', 'ucl', 'london', 'edinburgh', 'manchester', 'bristol', 'warwick', 'exeter', 'bath', 'durham', 'king', 'queen', 'nottingham', 'southampton', 'glasgow', 'st andrews', 'lse', 'goldsmiths', 'kingston', 'leeds', 'birmingham', 'sheffield', 'sussex', 'surrey', 'kent', 'leicester', 'reading', 'lancaster', 'loughborough', 'newcastle', 'cardiff', 'swansea', 'aberdeen', 'strathclyde', 'stirling', 'dundee', 'royal holloway', 'city university of london', 'brunel', 'westminster', 'hertfordshire', 'anglia ruskin', 'northumbria', 'plymouth', 'central lancashire', 'salford', 'portsmouth', 'brighton', 'huddersfield', 'lincoln', 'roehampton', 'gloucestershire', 'coventry', 'york', 'liverpool', 'uk)', '(uk'],
  'Hong Kong SAR':  ['hong kong', 'hku', 'cuhk', 'hkust', 'polyu', 'cityu', 'lingnan', 'chu hai', 'hkbu', 'shue yan', 'hkmu', 'hsuhk', 'hkapa', 'twc', 'vtc', 'hk)', '(hk'],
  'United States':  ['harvard', 'mit', 'stanford', 'yale', 'princeton', 'columbia', 'chicago', 'pennsylvania', 'cornell', 'university of california', 'uc ', 'ucla', 'usc', 'duke', 'johns hopkins', 'purdue', 'davis', 'san diego', 'michigan', 'northwestern', 'nyu', 'carnegie', 'georgia tech', 'caltech', 'penn state', 'texas', 'florida', 'wisconsin', 'maryland', 'boston', 'ohio state', 'washington', 'minnesota', 'purdue', 'rice', 'notre dame', 'vanderbilt', 'emory', 'us)', '(us'],
  'Australia':      ['australian', 'melbourne', 'sydney', 'queensland', 'monash', 'unsw', 'anu', 'uwa', 'adelaide', 'macquarie', 'rmit', 'curtin', 'deakin', 'griffith', 'tasmania', 'swinburne', 'uts', 'la trobe', 'wollongong', 'australia', 'au)', '(au'],
  'Canada':         ['toronto', 'mcgill', 'ubc', 'waterloo', 'alberta', 'queens', 'dalhousie', 'ottawa', 'western', 'montreal', 'calgary', 'simon fraser', 'mcmaster', 'victoria', 'saskatchewan', 'york u', 'concordia', 'canada', 'ca)', '(ca'],
  'Singapore':      ['singapore', 'nus', 'ntu', 'smu', 'sutd', 'sg)', '(sg'],
  'Netherlands':    ['delft', 'netherlands', 'leiden', 'amsterdam', 'rotterdam', 'eindhoven', 'twente', 'utrecht', 'groningen', 'maastricht', 'wageningen', 'nijmegen', 'nl)', '(nl'],
  'Japan':          ['tokyo', 'kyoto', 'osaka', 'waseda', 'keio', 'nagoya', 'hiroshima', 'tohoku', 'kyushu', 'hokudai', 'tokyotech', 'japan', 'jp)', '(jp'],
  'Germany':        ['munich', 'berlin', 'heidelberg', 'hamburg', 'frankfurt', 'bonn', 'tübingen', 'freiburg', 'lmu', 'rwth', 'karlsruhe', 'dresden', 'stuttgart', 'germany', 'de)', '(de'],
  'China Mainland': ['peking', 'tsinghua', 'fudan', 'zhejiang', 'nanjing', 'tongji', 'wuhan', 'renmin', 'sun yat', 'sjtu', 'ustc', 'harbin', 'xian jiaotong', 'sichuan', 'shandong', 'beihang', 'china', 'cn)', '(cn'],
  'Taiwan':         ['taiwan', 'nthu', 'ntu', 'ncku', 'yuan ze', 'tamkang', 'nctu', 'nsysu', 'ntust', 'tw)', '(tw'],
};

const inferCountry = (uniName) => {
  if (!uniName || uniName === '-') return null;
  const name = uniName.toLowerCase();
  for (const [country, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
    if (keywords.some(k => name.includes(k))) return country;
  }
  return 'Other';
};

// ─── Reusable card ───────────────────────────────────────────────────────────
const Card = ({ children, className = '', title, icon: Icon, headerExtra }) => {
  const [copied, setCopied] = useState(false);
  const cardRef = React.useRef(null);

  const handleAction = () => {
    const svg = cardRef.current.querySelector('svg');
    const table = cardRef.current.querySelector('table');

    if (svg) {
      try {
        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(svg);
        
        // Ensure XML namespaces
        if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
            source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
        }

        // Add XML header
        const fullSource = '<?xml version="1.0" standalone="no"?>\r\n' + source;
        const blob = new Blob([fullSource], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.href = url;
        link.download = `${title || 'chart'}.svg`.replace(/\s+/g, '_');
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("SVG Export failed:", err);
      }
    } else if (table) {
      // Copy Table
      const rows = Array.from(table.querySelectorAll('tr'));
      const text = rows.map(row => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        return cells.map(cell => cell.innerText.replace(/\n/g, ' ').trim()).join('\t');
      }).join('\n');
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div ref={cardRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible relative group flex flex-col h-full">
      {title && (
        <div className="px-5 py-2.5 border-b border-gray-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {Icon && <Icon size={18} className="text-slateBlue-600" />}
            <h3 className="text-[14px] font-black text-slateBlue-800 uppercase tracking-widest">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
             {headerExtra}
             <button 
               onClick={handleAction}
               className="p-1.5 hover:bg-slateBlue-50 rounded-lg transition-all text-gray-400 hover:text-aura-teal"
               title="Download/Copy"
             >
               {copied ? <Check size={14} className="text-emerald-500" /> : (cardRef.current?.querySelector('svg') ? <Download size={14} /> : <Copy size={14} />)}
             </button>
          </div>
        </div>
      )}
      <div className={`grow bg-white rounded-b-2xl ${className}`}>
        {children}
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon: Icon, color }) => (
  <Card className="p-4">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10 shrink-0`}>
        <Icon className={`${color.replace('bg-', 'text-')}`} size={24} />
      </div>
      <div className="flex flex-col justify-center">
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{title}</p>
        <h3 className="text-2xl font-black text-slateBlue-800 mt-0.5 leading-none">{value}</h3>
      </div>
    </div>
  </Card>
);

// ─── Shared custom tooltip for stacked bar charts ────────────────────────────
const StackedTooltip = ({ active, payload, label, isNumericGrades }) => {
  if (!active || !payload || !payload.length) return null;
  const items = [...payload].reverse();
  const cols = isNumericGrades ? 'grid-cols-3' : (items.length > 8 ? 'grid-cols-5' : 'grid-cols-4');
  
  const studentCount = payload[0].payload.studentCount;
  const totalCount = payload[0].payload.totalCount || payload[0].payload.count;

  return (
    <div className="bg-white/95 backdrop-blur-sm p-2 rounded-xl shadow-2xl border border-gray-100 min-w-[120px] pointer-events-none">
      <div className="text-[10px] font-black text-gray-400 mb-1.5 border-b border-gray-100 pb-1 flex justify-between uppercase tracking-tighter gap-3">
        <span>Cohort {label}</span>
        <span className="text-aura-teal">
          {studentCount ? `${studentCount} Students (${totalCount} Grades)` : `${totalCount} Results`}
        </span>
      </div>
      <div className={`grid ${cols} gap-x-2 gap-y-1.5`}>
        {items.map((entry) => {
          const rawCount = entry.payload.rawCounts?.[entry.name];
          return (
            <div key={entry.name} className="flex flex-col items-center leading-none">
              <span className="text-[10px] font-black uppercase mb-0.5" style={{ color: entry.fill }}>{entry.name}</span>
              <span className="text-[11px] font-bold text-slateBlue-800">{entry.value}%</span>
              {rawCount !== undefined && (
                <span className="text-[8px] text-gray-400 font-bold mt-0.5">({rawCount})</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Stacked Bar chart for academics ────────────────────────────────────────
const AcademicStackChart = React.memo(({ title, examKey, students }) => {
  const [selected, setSelected] = useState('Overall');
  const ialNumericSubjects = new Set(['9CN0', '9FA0', '9EN0']);

  const subjectOptions = useMemo(() => {
    return [{ value: 'Overall', label: 'Overall' }, ...getChartSubjectOptions(examKey)];
  }, [examKey]);

  useEffect(() => {
    if (!subjectOptions.some(opt => opt.value === selected)) {
      setSelected('Overall');
    }
  }, [subjectOptions, selected]);

  const ialShouldUseNumeric = useMemo(() => {
    if (examKey !== 'ial' || selected === 'Overall' || !ialNumericSubjects.has(selected)) return false;
    for (const s of students) {
      const data = s.academicData?.[examKey] || [];
      const filtered = data.filter(d => doesSubjectMatchChartOption(examKey, selected, d.subject));
      for (const d of filtered) {
        if (normalizeIGCSENumericGrade(d.grade)) return true;
      }
    }
    return false;
  }, [examKey, selected, students]);

  const isNumeric = useMemo(() => {
    if (examKey === 'igcse') {
      return selected === '4CN1' || selected === '4FA1';
    }
    if (examKey === 'ial') {
      return ialNumericSubjects.has(selected) && ialShouldUseNumeric;
    }
    return false;
  }, [examKey, selected, ialShouldUseNumeric]);

  const gradeOrder = examKey === 'igcse'
    ? (isNumeric ? NUMERIC_GRADES : IGCSE_LETTER_GRADES)
    : examKey === 'ial'
      ? (isNumeric ? NUMERIC_GRADES : LETTER_GRADES)
      : LETTER_GRADES;

  const chartData = useMemo(() => {
    const years = [...new Set(students.map(s => s.grad_year).filter(Boolean))].sort();

    return years.map(year => {
      const cohort = students.filter(s => s.grad_year === year);
      const counts = {};
      gradeOrder.forEach(g => counts[g] = 0);
      let total = 0;
      let studentCount = 0;

      cohort.forEach(s => {
        let hasDataForThisExam = false;
        const data = s.academicData?.[examKey] || [];
        
        if (data.length > 0) {
          // Use detailed subject data if available
          let filtered = data;
          if (selected !== 'Overall') {
            filtered = data.filter(d => doesSubjectMatchChartOption(examKey, selected, d.subject));
          }

          filtered.forEach(d => {
            const g = examKey === 'igcse'
              ? (isNumeric ? normalizeIGCSENumericGrade(d.grade) : normalizeIGCSEGrade(d.grade))
              : examKey === 'ial'
                ? (isNumeric ? normalizeIGCSENumericGrade(d.grade) : d.grade?.toUpperCase().trim())
                : d.grade?.toUpperCase().trim();
            if (g && counts[g] !== undefined) {
              counts[g]++;
              total++;
              hasDataForThisExam = true;
            }
          });
        } else if (selected === 'Overall') {
          // Fallback: parse the summary string if available (e.g. from Batch Import)
          const dbKey = examKey === 'ial' ? 'alevel_score' : `${examKey}_score`;
          const summary = s[dbKey];
          if (summary && summary !== '-') {
            const parts = summary.split(',');
            parts.forEach(part => {
              // Matches formats like "5A*", "3A", "5x9", "1 x 8", or just "A*"
              const match = part.trim().match(/^(\d+)?\s*x?\s*([a-zA-Z*]+|\d+)$/);
              if (match) {
                const count = match[1] ? parseInt(match[1]) : 1;
                const g = examKey === 'igcse'
                  ? (isNumeric ? normalizeIGCSENumericGrade(match[2]) : normalizeIGCSEGrade(match[2]))
                  : examKey === 'ial'
                    ? (isNumeric ? normalizeIGCSENumericGrade(match[2]) : match[2].toUpperCase())
                    : match[2].toUpperCase();
                if (counts[g] !== undefined) {
                  counts[g] += count;
                  total += count;
                  hasDataForThisExam = true;
                }
              } else {
                // If they typed something like "A*A*A" (no commas), we could try splitting by characters,
                // but let's just do a basic match for standalone grades if possible
                let tempStr = part.trim().toUpperCase();
                gradeOrder.forEach(g => {
                   if (tempStr === g) {
                      counts[g]++;
                      total++;
                      hasDataForThisExam = true;
                   }
                });
              }
            });
          }
        }
        if (hasDataForThisExam) studentCount++;
      });

      if (total === 0) return null; // Filter out years with no results

      // Convert to percentages
      const pcts = {};
      gradeOrder.forEach(g => {
        pcts[g] = total > 0 ? Math.min(100, Math.round((counts[g] / total) * 100)) : 0;
      });

      return { year: String(year), ...pcts, rawCounts: counts, totalCount: total, studentCount };
    }).filter(Boolean);
  }, [students, examKey, selected, gradeOrder]);

  const hasData = chartData.some(d => gradeOrder.some(g => d[g] > 0));

  return (
    <Card 
      title={title} 
      icon={TrendingUp} 
      className="p-5"
      headerExtra={(
        <div className="relative">
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            className="appearance-none text-[10px] font-black uppercase text-slateBlue-800 bg-slateBlue-100 border border-transparent hover:border-gray-200 rounded px-2.5 py-1 pr-6 focus:outline-none focus:ring-2 focus:ring-aura-teal/20 cursor-pointer"
          >
            {subjectOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown size={10} className="absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" />
        </div>
      )}
    >
      {!hasData ? (
        <div className="h-52 flex items-center justify-center text-gray-300 text-xs font-semibold">No grade data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(val) => `${Math.min(100, val)}%`} />
            <Tooltip
              content={(props) => <StackedTooltip {...props} isNumericGrades={isNumeric} />}
              cursor={{ fill: 'rgba(241,245,249,0.7)' }}
              offset={15}
              allowEscapeViewBox={{ x: true, y: true }}
              wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }}
            />
            {/* Legend removed per user request */}
            {gradeOrder.map(g => (
              <Bar key={g} dataKey={g} stackId="a" fill={GRADE_COLORS[g]} radius={g === gradeOrder[gradeOrder.length - 1] ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
});
AcademicStackChart.displayName = 'AcademicStackChart';

// ─── IELTS chart ─────────────────────────────────────────────────────────────
const IELTSChart = React.memo(({ students }) => {
  const [selected, setSelected] = useState('overall');
  const bands = ['overall', 'reading', 'writing', 'listening', 'speaking'];
  const bandKeys = ['<5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9'];
  const bandColors = ['#ef4444','#f97316','#f59e0b','#eab308','#84cc16','#22c55e','#14b8a6','#6366f1','#8b5cf6','#10b981'];

  const chartData = useMemo(() => {
    const years = [...new Set(students.map(s => s.grad_year).filter(Boolean))].sort();
    return years.map(year => {
      const cohort = students.filter(s => s.grad_year === year && s.academicData?.ielts?.[selected]);
      const scores = cohort.map(s => parseFloat(s.academicData.ielts[selected])).filter(v => !isNaN(v));
      const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;
      const dist = {};
      ['<5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9'].forEach(b => dist[b] = 0);
      scores.forEach(v => {
        if (v < 5) dist['<5']++;
        else {
          const key = String(v);
          if (dist[key] !== undefined) dist[key]++;
          else dist['9']++;
        }
      });
      if (scores.length === 0) return null; // Skip years with no data

      // Convert to percentages
      const pcts = {};
      bandKeys.forEach(b => {
        pcts[b] = scores.length > 0 ? Math.min(100, Math.round((dist[b] / scores.length) * 100)) : 0;
      });
      return { year: String(year), avg: avg ? parseFloat(avg) : 0, count: scores.length, studentCount: scores.length, ...pcts, rawCounts: dist };
    }).filter(Boolean);
  }, [students, selected, bandKeys]);

  return (
    <Card 
      title="IELTS Results" 
      icon={Award} 
      className="p-5"
      headerExtra={(
        <div className="relative">
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            className="appearance-none text-[10px] font-black uppercase text-slateBlue-800 bg-slateBlue-100 border border-transparent hover:border-gray-200 rounded px-2.5 py-1 pr-6 focus:outline-none focus:ring-2 focus:ring-aura-teal/20 cursor-pointer capitalize"
          >
            {bands.map(b => <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>)}
          </select>
          <ChevronDown size={10} className="absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" />
        </div>
      )}
    >
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(val) => `${Math.min(100, val)}%`} />
          <Tooltip 
            content={(props) => {
              if (!props.active || !props.payload || !props.payload.length) return null;
              const items = [...props.payload].reverse();
              return (
                <div className="bg-white/95 backdrop-blur-sm p-2 rounded-xl shadow-2xl border border-gray-100 min-w-[120px] pointer-events-none">
                  <div className="text-[10px] font-black text-gray-400 mb-1.5 border-b border-gray-100 pb-1 flex justify-between uppercase tracking-tighter gap-3">
                    <span>Cohort {props.label}</span>
                    <span className="text-aura-teal">{props.payload[0].payload.count} results</span>
                  </div>
                  <div className="grid grid-cols-5 gap-x-1.5 gap-y-1">
                    {items.map((entry) => {
                      const rawCount = entry.payload.rawCounts?.[entry.name];
                      return (
                        <div key={entry.name} className="flex flex-col items-center leading-none">
                          <span className="text-[9px] font-black uppercase text-gray-400 mb-0.5">{entry.name}</span>
                          <span className="text-[10px] font-bold" style={{ color: entry.fill }}>{entry.value}%</span>
                          {rawCount !== undefined && (
                            <span className="text-[8px] text-gray-400 font-bold mt-0.5">({rawCount})</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }}
            offset={15}
            allowEscapeViewBox={{ x: true, y: true }}
            wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }}
            cursor={{ fill: 'rgba(241,245,249,0.7)' }}
          />
          {/* Legend removed per user request */}
          {bandKeys.map((b, i) => (
            <Bar key={b} dataKey={b} stackId="a" fill={bandColors[i]} radius={b === '9' ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
});
IELTSChart.displayName = 'IELTSChart';

// ─── Field Pie Chart ─────────────────────────────────────────────────────────
const FIELD_COLORS = {
  'Natural Science':  '#14b8a6',
  'Social Science':   '#6366f1',
  'Health Science':   '#f43f5e',
  'Business':         '#f59e0b',
  'Engineering':      '#3b82f6',
  'Arts & Humanities':'#a855f7',
  'Inter-disciplinary': '#94a3b8',
};

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  if (percent < 0.04) return null;
  const rad = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * rad);
  const y = cy + r * Math.sin(-midAngle * rad);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight="700">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ─── Country Bar Charts ───────────────────────────────────────────────────────
const CountryChart = ({ students, title, color, headerExtra }) => {
  const data = useMemo(() => {
    const map = {};
    students.forEach(s => {
      const c = inferCountry(s.university_dest);
      if (c) map[c] = (map[c] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count, pct: ((count / students.filter(s => inferCountry(s.university_dest)).length) * 100).toFixed(1) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [students]);

  return (
    <Card title={title} className="p-5" icon={Globe} headerExtra={headerExtra}>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 45, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" hide domain={[0, 'dataMax + 5']} />
          <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <Tooltip 
            contentStyle={{ fontSize: 9, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', padding: '6px 10px', color: '#1e293b' }} 
            itemStyle={{ color: '#14b8a6', fontWeight: 900, fontSize: 10 }}
            labelStyle={{ display: 'none' }}
            formatter={(val) => [`${val}%`]}
            cursor={{ fill: 'rgba(241,245,249,0.7)' }} 
            offset={15}
            allowEscapeViewBox={{ x: true, y: true }}
            wrapperStyle={{ pointerEvents: 'none' }}
          />
          <Bar dataKey="pct" fill={color} radius={[0, 6, 6, 0]} barSize={16}>
            {data.map((entry, i) => <Cell key={i} fill={color} opacity={1 - i * 0.08} />)}
            <LabelList 
              dataKey="pct" 
              position="right" 
              content={(props) => {
                const { x, y, width, height, value, index } = props;
                const entry = data[index];
                if (!entry) return null;
                return (
                  <text 
                    x={x + width + 8} 
                    y={y + height / 2} 
                    fill="#94a3b8" 
                    fontSize={10} 
                    fontWeight={800} 
                    textAnchor="start" 
                    dominantBaseline="middle"
                  >
                    {`${value}% (${entry.count})`}
                  </text>
                );
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard = () => {
  const { t } = useTranslation();
  const { students: liveStudents, lastModified } = useStudents();
  const [fieldModal, setFieldModal] = useState(null);
  const [selectedCohortYear, setSelectedCohortYear] = useState('auto');

  // ── Snapshot cache ──────────────────────────────────────────────────────────
  // Charts render from `snapStudents` (frozen copy), not live context.
  // This decouples the dashboard from reactive re-renders triggered by edits
  // on other pages, and lets the user control when to refresh.
  const [snapStudents, setSnapStudents] = useState(null);
  const [snapTime, setSnapTime]         = useState(0);

  // Take a fresh snapshot from live data
  const takeSnapshot = useCallback(() => {
    setSnapStudents(liveStudents);
    setSnapTime(Date.now());
  }, [liveStudents]);

  // Auto-snapshot on first mount (no user action needed)
  // Auto-snapshot when data first arrives
  useEffect(() => {
    if (liveStudents.length > 0 && snapTime === 0) {
      takeSnapshot();
    }
  }, [liveStudents, snapTime, takeSnapshot]);

  // Is the cached snapshot out of date?
  const isStale = lastModified > 0 && lastModified > snapTime;

  // Charts always use the snapshot (fall back to live before first snapshot)
  const students = snapStudents ?? liveStudents;

  // Human-readable "last refreshed" label
  const snapLabel = snapTime > 0
    ? `Snapshot: ${new Date(snapTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Loading…';
  // ──────────────────────────────────────────────────────────────────────────

  const metrics = useMemo(() => {
    const graduated = students.filter(s => s.status === 'GRADUATED' || s.status === 'ALUMNI').length;
    const enrolled  = students.filter(s => s.status === 'ENROLLED').length;
    const total     = students.length;
    const years     = [...new Set(students.map(s => s.grad_year).filter(Boolean))].length;
    return { graduated, enrolled, total, years };
  }, [students]);

  const graduatedStudents = useMemo(() => students.filter(s => {
    const dest = String(s.university_dest || '').trim().toLowerCase();
    return s.status !== 'WITHDRAWN' && dest && dest !== '-' && dest !== 'tbc' && dest !== 'pending' && dest !== 'unknown';
  }), [students]);

  const fieldData = useMemo(() => {
    const map = {};
    graduatedStudents.forEach(s => {
      const field = classifyProgram(s.program_dest);
      map[field] = (map[field] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [graduatedStudents]);

  const totalFieldStudents = useMemo(() => fieldData.reduce((a, b) => a + b.value, 0), [fieldData]);

  const cohortYears = useMemo(() => {
    const years = [...new Set(graduatedStudents.map(s => s.grad_year))].filter(Boolean).sort((a, b) => b - a);
    return years;
  }, [graduatedStudents]);

  const latestYearWithData = cohortYears[0] || null;

  const activeCohortYear = useMemo(() => {
    if (selectedCohortYear === 'auto') return latestYearWithData;
    return parseInt(selectedCohortYear);
  }, [selectedCohortYear, latestYearWithData]);

  const mapData = useMemo(() => {
    return graduatedStudents.map(s => {
      const c = inferCountry(s.university_dest);
      return { 
        name: s.name_en || s.person?.name_en || s.student_num || 'Unknown', 
        country: c, 
        uni: s.university_dest || '-',
        program: s.program_dest || '-',
        year: s.grad_year || 'Unknown'
      };
    }).filter(m => m.country && m.country !== 'Other');
  }, [graduatedStudents]);

  return (
    <div className="space-y-6">
      {/* ── Dashboard Header with Refresh ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slateBlue-800 tracking-tight leading-none">Dashboard</h1>
          <p className="text-[10px] text-gray-400 font-semibold mt-1">{snapLabel}</p>
        </div>

        {/* Refresh button: subtle when fresh, glowing when stale */}
        <button
          onClick={takeSnapshot}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black tracking-wide transition-all duration-300 ${
            isStale
              ? 'bg-aura-teal text-white shadow-lg shadow-aura-teal/40 animate-pulse hover:animate-none hover:shadow-xl hover:scale-105'
              : 'bg-white text-gray-400 border border-gray-100 hover:border-aura-teal/40 hover:text-aura-teal hover:bg-aura-teal/5'
          }`}
          title={isStale ? 'Student data has changed — click to refresh charts' : 'Charts are up to date'}
        >
          <RefreshCw size={13} className={isStale ? 'animate-spin [animation-duration:2s]' : ''} />
          {isStale ? (
            <>
              Refresh Charts
              <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-400 rounded-full ring-2 ring-white" />
            </>
          ) : (
            'Refresh'
          )}
        </button>
      </div>
      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Students" value={metrics.total} icon={Users} color="bg-aura-teal" />
        <MetricCard title="Graduated" value={metrics.graduated} icon={GraduationCap} color="bg-serene-indigo" />
        <MetricCard title="Currently Enrolled" value={metrics.enrolled} icon={School} color="bg-blue-500" />
        <MetricCard title="Cohort Years" value={metrics.years} icon={BookOpen} color="bg-purple-500" />
      </div>

      {/* ── Academic Grade Charts ── */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 px-1">Academic Results — Grade Distribution by Year</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AcademicStackChart
            title="IGCSE Results"
            examKey="igcse"
            students={students}
          />
          <AcademicStackChart
            title="IAS Results"
            examKey="ias"
            students={students}
          />
          <AcademicStackChart
            title="IAL / GCEAL Results"
            examKey="ial"
            students={students}
          />
          <IELTSChart students={students} />
        </div>
      </div>

      {/* ── Country Charts ── */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 px-1">Study Destination Analysis</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CountryChart students={graduatedStudents} title="Students by Country — All Years" color="#14b8a6" />
          <CountryChart
            students={activeCohortYear ? graduatedStudents.filter(s => s.grad_year === activeCohortYear) : []}
            title={`Students by Country — ${activeCohortYear === latestYearWithData ? 'Latest Cohort' : 'Cohort'} (${activeCohortYear ?? 'N/A'})`}
            color="#6366f1"
            headerExtra={
              cohortYears.length > 1 && (
                <div className="relative">
                  <select
                    value={selectedCohortYear}
                    onChange={(e) => setSelectedCohortYear(e.target.value)}
                    className="appearance-none text-[10px] font-black uppercase text-slateBlue-800 bg-slateBlue-100 border border-transparent hover:border-gray-200 rounded px-2.5 py-1 pr-6 focus:outline-none focus:ring-2 focus:ring-aura-teal/20 cursor-pointer"
                  >
                    <option value="auto">Auto (Latest)</option>
                    {cohortYears.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <ChevronDown size={10} className="absolute right-1.5 top-1.5 text-gray-400 pointer-events-none" />
                </div>
              )
            }
          />
        </div>
      </div>

      {/* ── Global Student Distribution (Interactive Map) ── */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 px-1">Global Student Distribution</h2>
        <Card title="Interactive Map" icon={Globe} className="p-5">
           <WorldMap students={mapData} />
        </Card>
      </div>

      {/* ── Field of Study Pie ── */}
      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 px-1">Field of Study Distribution</h2>
        <Card title="Field Distribution" icon={BookOpen} className="p-5">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="w-full lg:w-80 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fieldData}
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    dataKey="value"
                    labelLine={false}
                    label={<CustomPieLabel />}
                  >
                    {fieldData.map((entry, i) => (
                      <Cell 
                        key={i} 
                        fill={FIELD_COLORS[entry.name] || '#94a3b8'} 
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setFieldModal(entry.name)}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} (${((value / totalFieldStudents) * 100).toFixed(1)}%)`]}
                    contentStyle={{ fontSize: 9, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', padding: '6px 10px', color: '#1e293b' }} 
                    itemStyle={{ color: '#14b8a6', fontWeight: 900, fontSize: 10 }}
                    offset={15}
                    allowEscapeViewBox={{ x: true, y: true }}
                    wrapperStyle={{ pointerEvents: 'none' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {fieldData.map(({ name, value }) => {
                const pct = ((value / totalFieldStudents) * 100).toFixed(1);
                return (
                  <div 
                    key={name} 
                    className="flex items-center gap-3 bg-slateBlue-100/60 rounded-xl p-3 cursor-pointer hover:bg-slateBlue-100 transition-colors group"
                    onClick={() => setFieldModal(name)}
                  >
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: FIELD_COLORS[name] || '#94a3b8' }} />
                    <div className="flex-1 min-0">
                      <div className="text-xs font-bold text-slateBlue-800 truncate group-hover:text-aura-teal transition-colors">{name}</div>
                      <div className="text-[10px] text-gray-400 font-semibold">{value} students · {pct}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* ── Field Details Modal ── */}
      {fieldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setFieldModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0">
              <h3 className="text-base font-black text-slateBlue-800">
                {t('stats.fields.title', { field: fieldModal })}
              </h3>
              <button 
                onClick={() => setFieldModal(null)} 
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all text-xl"
              >&times;</button>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slateBlue-800 text-[10px] font-black text-white sticky top-0 z-10 uppercase tracking-widest border-b border-slateBlue-900">
                    <th className="px-5 py-3 border-r border-white/10">{t('stats.fields.year')}</th>
                    <th className="px-5 py-3 border-r border-white/10">{t('stats.fields.program')}</th>
                    <th className="px-5 py-3 border-r border-white/10">{t('stats.fields.university')}</th>
                    <th className="px-5 py-3">{t('stats.fields.name')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {students
                    .filter(s => classifyProgram(s.program_dest) === fieldModal)
                    .sort((a, b) => (b.grad_year || 0) - (a.grad_year || 0) || (a.person?.name_en || '').localeCompare(b.person?.name_en || ''))
                    .map((s, idx) => (
                      <tr key={idx} className={`hover:bg-slate-100 transition-colors text-[11px] ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                        <td className="px-5 py-2.5 font-bold text-gray-400 tabular-nums">{s.grad_year || '-'}</td>
                        <td className="px-5 py-2.5 font-black text-slateBlue-800">{s.program_dest || '-'}</td>
                        <td className="px-5 py-2.5 font-bold text-aura-teal">{s.university_dest || '-'}</td>
                        <td className="px-5 py-2.5 font-black text-slateBlue-800">{s.person?.name_en || s.student_num}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
