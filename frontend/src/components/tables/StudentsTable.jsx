import React from 'react';
import { Edit2, Trash2, FileSpreadsheet } from 'lucide-react';
import { StatusBadge, ExpandedGradeCell, GradeBadge, SortableHeader } from '../ui/TableBadges';

export const StudentsTable = ({
  filteredStudents,
  sortConfig,
  requestSort,
  role,
  handleEdit,
  handleDelete,
  findRankByName
}) => {
  return (
    <div className="bg-white rounded-b-[1.5rem] shadow-sm border border-gray-100 border-t-0 overflow-hidden w-full relative">
      <div className="overflow-auto max-h-[70vh] relative">
        <table className="min-w-full text-left text-xs text-slateBlue-800 border-collapse table-fixed">
          <thead>
            <tr className="bg-slateBlue-800 border-b border-slateBlue-900 text-white uppercase font-black text-[10px] tracking-widest sticky top-0 z-30 shadow-sm transition-all">
              <SortableHeader label="Year" sortKey="grad_year" config={sortConfig} requestSort={requestSort} className="w-[50px] text-center" />
              <th className="px-3 py-2.5 w-[50px] text-center">Status</th>
              <SortableHeader label="Student ID" sortKey="student_num" config={sortConfig} requestSort={requestSort} className="w-[80px] text-center" />
              <SortableHeader label="Name" sortKey="name" config={sortConfig} requestSort={requestSort} className="w-[200px]" />
              <SortableHeader label="IGCSE" sortKey="igcse_score" config={sortConfig} requestSort={requestSort} className="w-[90px] text-center" />
              <SortableHeader label="IAS" sortKey="ias_score" config={sortConfig} requestSort={requestSort} className="w-[90px] text-center" />
              <SortableHeader label="IAL" sortKey="alevel_score" config={sortConfig} requestSort={requestSort} className="w-[90px] text-center" />
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
                <td className="px-1 py-1.5 align-middle text-center w-[90px]">
                  <ExpandedGradeCell scoreStr={s.computed_igcse} />
                </td>
                <td className="px-1 py-3.5 align-middle text-center w-[90px]">
                  <ExpandedGradeCell scoreStr={s.computed_ias} />
                </td>
                <td className="px-1 py-3.5 align-middle text-center w-[90px]">
                  <ExpandedGradeCell scoreStr={s.computed_ial} />
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
  );
};
