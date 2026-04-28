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
  RefreshCw 
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
  const { students: liveStudents, lastModified } = useStudents();
  const [fieldModal, setFieldModal] = useState(null);
  const [selectedCohortYear, setSelectedCohortYear] = useState('auto');

  // ── Snapshot cache ──────────────────────────────────────────────────────────
  const [snapStudents, setSnapStudents] = useState(null);
  const [snapTime, setSnapTime]         = useState(0);

  const takeSnapshot = useCallback(() => {
    setSnapStudents(liveStudents);
    setSnapTime(Date.now());
  }, [liveStudents]);

  useEffect(() => {
    if (liveStudents.length > 0 && snapTime === 0) {
      takeSnapshot();
    }
  }, [liveStudents, snapTime, takeSnapshot]);

  const isStale = lastModified > 0 && lastModified > snapTime;
  const students = snapStudents ?? liveStudents;

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slateBlue-800 tracking-tight leading-none">Dashboard</h1>
          <p className="text-[10px] text-gray-400 font-semibold mt-1">{snapLabel}</p>
        </div>

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Students" value={metrics.total} icon={Users} color="bg-aura-teal" />
        <MetricCard title="Graduated" value={metrics.graduated} icon={GraduationCap} color="bg-serene-indigo" />
        <MetricCard title="Currently Enrolled" value={metrics.enrolled} icon={School} color="bg-blue-500" />
        <MetricCard title="Cohort Years" value={metrics.years} icon={BookOpen} color="bg-purple-500" />
      </div>

      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 px-1">Academic Results — Grade Distribution by Year</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AcademicStackChart title="IGCSE Results" examKey="igcse" students={students} />
          <AcademicStackChart title="IAS Results" examKey="ias" students={students} />
          <AcademicStackChart title="IAL / GCEAL Results" examKey="ial" students={students} />
          <IELTSChart students={students} />
        </div>
      </div>

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

      <div>
        <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 px-1">Global Student Distribution</h2>
        <Card title="Interactive Map" icon={Globe} className="p-5">
           <WorldMap students={mapData} />
        </Card>
      </div>

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
