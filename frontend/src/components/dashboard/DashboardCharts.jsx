import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LabelList
} from 'recharts';
import { TrendingUp, Award, Globe, ChevronDown } from 'lucide-react';
import { Card, StackedTooltip } from './DashboardUI';
import { 
  GRADE_COLORS, 
  LETTER_GRADES, 
  IGCSE_LETTER_GRADES, 
  NUMERIC_GRADES, 
  normalizeIGCSEGrade, 
  normalizeIGCSENumericGrade,
  inferCountry 
} from '../../utils/dashboardUtils';
import { getChartSubjectOptions, doesSubjectMatchChartOption } from '../../constants/subjects';

export const AcademicStackChart = React.memo(({ title, examKey, students }) => {
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
          const dbKey = examKey === 'ial' ? 'alevel_score' : `${examKey}_score`;
          const summary = s[dbKey];
          if (summary && summary !== '-') {
            const parts = summary.split(',');
            parts.forEach(part => {
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

      if (total === 0) return null;

      const pcts = {};
      gradeOrder.forEach(g => {
        pcts[g] = total > 0 ? Math.min(100, Math.round((counts[g] / total) * 100)) : 0;
      });

      return { year: String(year), ...pcts, rawCounts: counts, totalCount: total, studentCount };
    }).filter(Boolean);
  }, [students, examKey, selected, gradeOrder, isNumeric]);

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
            className="appearance-none text-[10px] font-black uppercase text-slateBlue-800 bg-slateBlue-100 border border-transparent rounded px-2.5 py-1 pr-6 focus:outline-none focus:ring-2 focus:ring-aura-teal/20 cursor-pointer"
          >
            {subjectOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
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
              isAnimationActive={false}
              content={(props) => <StackedTooltip {...props} isNumericGrades={isNumeric} />}
              cursor={{ fill: 'rgba(241,245,249,0.7)' }}
              offset={15}
              allowEscapeViewBox={{ x: false, y: true }}
              wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }}
            />
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

export const IELTSChart = React.memo(({ students }) => {
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
      bandKeys.forEach(b => dist[b] = 0);
      scores.forEach(v => {
        if (v < 5) dist['<5']++;
        else {
          const key = String(v);
          if (dist[key] !== undefined) dist[key]++;
          else dist['9']++;
        }
      });
      if (scores.length === 0) return null;

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
            className="appearance-none text-[10px] font-black uppercase text-slateBlue-800 bg-slateBlue-100 border border-transparent rounded px-2.5 py-1 pr-6 focus:outline-none focus:ring-2 focus:ring-aura-teal/20 cursor-pointer capitalize"
          >
            {bands.map(b => <option key={b} value={b}>{b}</option>)}
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
            isAnimationActive={false}
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
            cursor={{ fill: 'rgba(241,245,249,0.7)' }}
          />
          {bandKeys.map((b, i) => (
            <Bar key={b} dataKey={b} stackId="a" fill={bandColors[i]} radius={b === '9' ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
});
IELTSChart.displayName = 'IELTSChart';

export const CountryChart = ({ students, title, color, headerExtra }) => {
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
            isAnimationActive={false}
            formatter={(val) => [`${val}%`]}
            cursor={{ fill: 'rgba(241,245,249,0.7)' }} 
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
                  <text x={x + width + 8} y={y + height / 2} fill="#94a3b8" fontSize={10} fontWeight={800} textAnchor="start" dominantBaseline="middle">
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
