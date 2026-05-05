import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStudents } from '../context/StudentContext';
import { WorldMap } from '../components/WorldMap';
import { 
  classifyProgram, 
  inferCountry, 
  FIELD_COLORS 
} from '../utils/dashboardUtils';
import { 
  Card, 
  MetricCard 
} from '../components/dashboard/DashboardUI';
import { 
  AcademicStackChart, 
  IELTSChart, 
  CountryChart 
} from '../components/dashboard/DashboardCharts';
import { 
  Users, 
  GraduationCap, 
  School, 
  Globe, 
  BookOpen, 
  ChevronDown, 
  RefreshCw,
  Trophy,
  Star
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

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

const Dashboard = () => {
  const { t } = useTranslation();
  const { students } = useStudents();
  const [fieldModal, setFieldModal] = useState(null);
  const [selectedCohortYear, setSelectedCohortYear] = useState('auto');

  const metrics = useMemo(() => {
    const graduated = students.filter(s => {
      const st = String(s.status || '').toLowerCase();
      return st === 'graduated' || st === 'alumni';
    }).length;
    const total     = students.length;
    const years     = [...new Set(students.map(s => s.grad_year).filter(Boolean))].length;
    const g11       = students.filter(s => String(s.grad_year) === '2027').length;
    const g12       = students.filter(s => String(s.grad_year) === '2026').length;
    
    const getEliteCount = (count) => students.filter(s => {
      const ial = s.academicData?.ial || [];
      return ial.filter(row => row.grade === 'A*').length >= count;
    }).length;

    const getElitePct = (count) => students.length > 0 ? ((count / students.length) * 100).toFixed(1) : 0;

    const elite3 = getEliteCount(3);
    const elite4 = getEliteCount(4);
    const elite5 = getEliteCount(5);
    const elite6 = getEliteCount(6);

    const getGradeStats = (targetStudents, type, gradeLevels) => {
      let total = 0;
      let matchGrades = 0;
      targetStudents.forEach(s => {
        const data = s.academicData?.[type] || [];
        data.forEach(row => {
          if (row.grade && row.grade !== '-' && row.grade !== 'NR') {
            total++;
            const g = String(row.grade).trim().toUpperCase();
            if (gradeLevels.includes(g)) matchGrades++;
          }
        });
      });
      return total > 0 ? ((matchGrades / total) * 100).toFixed(1) : 0;
    };

    const topLevels = ['A*', 'A', '9', '8', '7'];
    const aLevels   = ['A', '8', '7']; 

    const igcseAll = getGradeStats(students, 'igcse', topLevels);
    const ialAll   = getGradeStats(students, 'ial', topLevels);
    const igcseA   = getGradeStats(students, 'igcse', aLevels);
    const ialA     = getGradeStats(students, 'ial', aLevels);

    const gradYears = students.map(s => parseInt(s.grad_year)).filter(y => !isNaN(y) && y < 2026);
    const lastYear  = gradYears.length > 0 ? Math.max(...gradYears) : 2025;
    const lastYearStudents = students.filter(s => parseInt(s.grad_year) === lastYear);
    
    const igcseLast = getGradeStats(lastYearStudents, 'igcse', topLevels);
    const ialLast   = getGradeStats(lastYearStudents, 'ial', topLevels);
    const igcseALast = getGradeStats(lastYearStudents, 'igcse', aLevels);
    const ialALast   = getGradeStats(lastYearStudents, 'ial', aLevels);

    return { 
      graduated, total, years, g11, g12, 
      elite3, elite3Pct: getElitePct(elite3),
      elite4, elite4Pct: getElitePct(elite4),
      elite5, elite5Pct: getElitePct(elite5),
      elite6, elite6Pct: getElitePct(elite6),
      igcseAll, ialAll, igcseLast, ialLast, 
      igcseA, ialA, igcseALast, ialALast,
      lastYear
    };
  }, [students]);

  const graduatedStudents = useMemo(() => students.filter(s => {
    const dest = String(s.university_dest || '').trim().toLowerCase();
    const st = String(s.status || '').toLowerCase();
    return (st === 'graduated' || st === 'alumni') && dest && dest !== '-' && dest !== 'tbc' && dest !== 'pending' && dest !== 'unknown';
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
        name: `${s.name_en || s.person?.name_en || s.student_num}${s.other_name || s.person?.other_name ? ` (${s.other_name || s.person?.other_name})` : ''}`,
        country: c, 
        uni: s.university_dest || '-',
        program: s.program_dest || '-',
        year: s.grad_year || 'Unknown'
      };
    }).filter(m => m.country && m.country !== 'Other');
  }, [graduatedStudents]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slateBlue-800 tracking-tight leading-none">Dashboard</h1>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Real-time Data Sync</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        {/* Total Graduates */}
        <Card className="relative overflow-hidden p-3 bg-gradient-to-br from-blue-500 to-blue-600 border-none shadow-lg shadow-blue-600/20 group">
          <div className="absolute -top-2 -right-2 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <GraduationCap size={70} className="text-white" />
          </div>
          <div className="relative z-10 text-white">
            <div className="flex items-center gap-1.5 mb-2">
              <GraduationCap size={10} className="text-white/70" />
              <p className="text-[12px] font-black uppercase tracking-widest text-white/70">Graduates</p>
            </div>
            <h3 className="text-3xl font-black">{metrics.graduated}</h3>
          </div>
        </Card>

        {/* G12 Students */}
        <Card className="relative overflow-hidden p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 border-none shadow-lg shadow-indigo-600/20 group">
          <div className="absolute -top-2 -right-2 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Users size={70} className="text-white" />
          </div>
          <div className="relative z-10 text-white">
            <div className="flex items-center gap-1.5 mb-2">
              <Users size={10} className="text-white/70" />
              <p className="text-[12px] font-black uppercase tracking-widest text-white/70">G12 (2026)</p>
            </div>
            <h3 className="text-3xl font-black">{metrics.g12}</h3>
          </div>
        </Card>

        {/* G11 Students */}
        <Card className="relative overflow-hidden p-3 bg-gradient-to-br from-violet-500 to-violet-600 border-none shadow-lg shadow-violet-600/20 group">
          <div className="absolute -top-2 -right-2 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Users size={70} className="text-white" />
          </div>
          <div className="relative z-10 text-white">
            <div className="flex items-center gap-1.5 mb-2">
              <Users size={10} className="text-white/70" />
              <p className="text-[12px] font-black uppercase tracking-widest text-white/70">G11 (2027)</p>
            </div>
            <h3 className="text-3xl font-black">{metrics.g11}</h3>
          </div>
        </Card>

        {/* Elite Card - Small Golden */}
        <Card className="relative overflow-hidden p-3 bg-gradient-to-br from-amber-400 to-amber-500 border-none shadow-lg shadow-amber-500/30 group">
          <div className="absolute -top-2 -right-2 opacity-20 group-hover:scale-110 transition-transform duration-500">
            <Trophy size={70} className="text-white" />
          </div>
          <div className="relative z-10 text-white">
            <div className="flex items-center gap-1.5 mb-2">
              <Star size={10} className="text-white fill-white" />
              <p className="text-[12px] font-black uppercase tracking-widest text-white/70">3A* or above</p>
            </div>
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-3xl font-black">{metrics.elite3}</h3>
              <span className="text-[10px] font-black text-white/60">{metrics.elite3Pct}%</span>
            </div>
          </div>
        </Card>

        {/* All Years A*-A Stats */}
        <Card className="relative overflow-hidden p-3 bg-gradient-to-br from-yellow-400 to-yellow-500 border-none shadow-lg shadow-yellow-500/20 group">
          <div className="absolute -top-2 -right-2 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <BookOpen size={70} className="text-white" />
          </div>
          <div className="relative z-10 text-white">
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen size={10} className="text-white/70" />
              <p className="text-[12px] font-black uppercase tracking-widest text-white/70">A*-A %: All Time</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black">{metrics.igcseAll}%</span>
                <span className="text-[7px] font-bold text-white/50 uppercase">IG</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black">{metrics.ialAll}%</span>
                <span className="text-[7px] font-bold text-white/50 uppercase">IAL</span>
              </div>
            </div>
          </div>
        </Card>

        {/* A % Card */}
        <Card className="relative overflow-hidden p-3 bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 border-none shadow-lg shadow-fuchsia-600/20 group">
          <div className="absolute -top-2 -right-2 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Star size={70} className="text-white" />
          </div>
          <div className="relative z-10 text-white">
            <div className="flex items-center gap-1.5 mb-2">
              <Star size={10} className="text-white/70" />
              <p className="text-[12px] font-black uppercase tracking-widest text-white/70">A %: All vs {metrics.lastYear}</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black">{metrics.ialA}%</span>
                <span className="text-[7px] font-bold text-white/50 uppercase">All</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black">{metrics.ialALast}%</span>
                <span className="text-[7px] font-bold text-white/50 uppercase">Last</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Last Year A*-A Stats */}
        <Card className="relative overflow-hidden p-3 bg-gradient-to-br from-rose-500 to-rose-600 border-none shadow-lg shadow-rose-600/20 group">
          <div className="absolute -top-2 -right-2 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <BookOpen size={70} className="text-white" />
          </div>
          <div className="relative z-10 text-white">
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen size={10} className="text-white/70" />
              <p className="text-[12px] font-black uppercase tracking-widest text-white/70">A*-A: {metrics.lastYear}</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black">{metrics.igcseLast}%</span>
                <span className="text-[7px] font-bold text-white/50 uppercase">IG</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black">{metrics.ialLast}%</span>
                <span className="text-[7px] font-bold text-white/50 uppercase">IAL</span>
              </div>
            </div>
          </div>
        </Card>

        {/* GCE History Card - Small Green */}
        <Card className="relative overflow-hidden p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 border-none shadow-lg shadow-emerald-600/20 group">
          <div className="absolute -top-2 -right-2 opacity-20 group-hover:scale-110 transition-transform duration-500">
            <School size={70} className="text-white" />
          </div>
          <div className="relative z-10 text-white">
            <div className="flex items-center gap-1.5 mb-2">
              <School size={10} className="text-white" />
              <p className="text-[12px] font-black uppercase tracking-widest text-white/70">GCE History</p>
            </div>
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-3xl font-black">{metrics.years}</h3>
              <span className="text-[10px] font-black text-white/60">Batches</span>
            </div>
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 px-1">Academic Results — Grade Distribution by Year</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AcademicStackChart 
            title="IGCSE Results" 
            examKey="igcse" 
            students={students} 
            badge={`${students.filter(s => s.academicData?.igcse?.length > 0).length} Entries up to ${latestYearWithData || 'N/A'}`}
          />
          <AcademicStackChart 
            title="IAS Results" 
            examKey="ias" 
            students={students} 
            badge={`${students.filter(s => s.academicData?.ias?.length > 0).length} Entries up to ${latestYearWithData || 'N/A'}`}
          />
          <AcademicStackChart 
            title="IAL / GCEAL Results" 
            examKey="ial" 
            students={students} 
            badge={`${students.filter(s => s.academicData?.ial?.length > 0).length} Entries up to ${latestYearWithData || 'N/A'}`}
          />
          <IELTSChart 
            students={students} 
            badge={`${students.filter(s => s.academicData?.ielts?.overall).length} Entries up to ${latestYearWithData || 'N/A'}`}
          />
        </div>
      </div>

      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 px-1">Study Destination Analysis</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CountryChart 
            students={graduatedStudents} 
            title="Students by Country — All Years" 
            color="#14b8a6" 
            badge={`${graduatedStudents.length} Entries up to ${latestYearWithData || 'N/A'}`}
          />
          <CountryChart
            students={activeCohortYear ? graduatedStudents.filter(s => s.grad_year === activeCohortYear) : []}
            title={`Students by Country — ${activeCohortYear === latestYearWithData ? 'Latest Cohort' : 'Cohort'} (${activeCohortYear ?? 'N/A'})`}
            color="#6366f1"
            badge={`${activeCohortYear ? graduatedStudents.filter(s => s.grad_year === activeCohortYear).length : 0} Entries`}
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

      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 px-1">Global Student Distribution</h2>
        <Card title="Interactive Map" icon={Globe} className="p-5">
           <WorldMap students={mapData} />
        </Card>
      </div>

      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 px-1">Field of Study Distribution</h2>
        <Card 
          title="Field Distribution" 
          icon={BookOpen} 
          badge={`${totalFieldStudents} Entries up to ${latestYearWithData || 'N/A'}`}
          className="p-5"
        >
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
                    isAnimationActive={false}
                    formatter={(value) => [`${value} (${((value / totalFieldStudents) * 100).toFixed(1)}%)`]}
                    contentStyle={{ fontSize: 9, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', padding: '6px 10px', color: '#1e293b' }} 
                    itemStyle={{ color: '#14b8a6', fontWeight: 900, fontSize: 10 }}
                    offset={15}
                    allowEscapeViewBox={{ x: false, y: true }}
                    wrapperStyle={{ pointerEvents: 'none', zIndex: 9999 }}
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
