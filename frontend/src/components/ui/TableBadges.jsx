import React, { useMemo } from 'react';
import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';

export const ScholarshipBadge = ({ type }) => {
  const map = {
    HKSES: { icon: '??', color: 'bg-purple-100 text-purple-700' },
    WIRA: { icon: '??', color: 'bg-yellow-100 text-yellow-700' },
    JARDINE: { icon: '??', color: 'bg-blue-100 text-blue-700' },
    SIR_EDWARD_YOUDE: { icon: '??', color: 'bg-green-100 text-green-700' },
    STUDENT_OF_THE_YEAR: { icon: '??', color: 'bg-pink-100 text-pink-700' },
    OTHER: { icon: '??', color: 'bg-gray-100 text-gray-700' },
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

export const StatusBadge = ({ status }) => {
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

export const GradeBadge = ({ text }) => {
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

  const displayText = t.replace(/\s*[x×]\s*/g, '');

  return (
    <span className={`text-[10px] whitespace-nowrap leading-none ${color}`}>
      {displayText}
    </span>
  );
};

export const expandGrades = (scoreStr) => {
  if (!scoreStr || scoreStr === '-') return { letters: [], numbers: [] };
  const tokens = scoreStr.split(',').map(t => t.trim()).filter(t => !t.toUpperCase().includes('NR'));
  const letters = [];
  const numbers = [];

  tokens.forEach(token => {
    // Matches "3A*", "2B", "5x9", "1 x 8", "1x7", etc.
    const match = token.match(/^(\d+)?\s*[x×]?\s*([a-zA-Z*]+|\d+)$/);
    if (match) {
      const count = match[1] ? parseInt(match[1]) : 1;
      const grade = match[2];
      
      if (/[a-zA-Z]/.test(grade)) {
        // Keep letters condensed (e.g. 3A*)
        letters.push(token);
      } else {
        // Expand numbers (e.g. 3x7 -> 7, 7, 7)
        for (let i = 0; i < count; i++) {
          numbers.push(grade);
        }
      }
    } else {
       if (/[a-zA-Z]/.test(token)) letters.push(token);
       else if (/\d/.test(token)) numbers.push(token);
    }
  });

  return { letters, numbers };
};

export const ExpandedGradeCell = React.memo(({ scoreStr }) => {
  const { letters, numbers } = useMemo(() => expandGrades(scoreStr), [scoreStr]);
  if (letters.length === 0 && numbers.length === 0) return null;

  return (
    <div className="flex flex-col gap-0.5 items-center justify-center font-sans">
      {letters.length > 0 && (
        <div className="flex flex-nowrap justify-center items-center">
          {letters.map((g, i) => (
            <React.Fragment key={i}>
              <GradeBadge text={g} />
              {i < letters.length - 1 && <span className="text-[10px] text-gray-300">,</span>}
            </React.Fragment>
          ))}
        </div>
      )}
      {numbers.length > 0 && (
        <div className="flex flex-nowrap justify-center items-center mt-0.5">
          {numbers.map((g, i) => (
            <React.Fragment key={i}>
              <GradeBadge text={g} />
              {i < numbers.length - 1 && <span className="text-[8px] text-gray-300">,</span>}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
});

export const SortableHeader = ({ label, sortKey, config, requestSort, className = "" }) => {
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
