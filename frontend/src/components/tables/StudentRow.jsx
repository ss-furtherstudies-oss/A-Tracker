import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { StatusBadge, ExpandedGradeCell } from '../ui/TableBadges';

export const StudentRow = React.memo(({ s, idx, role, handleEdit, handleDelete, findRankByName }) => {
  return (
    <tr className={`hover:bg-slate-100 transition-colors group divide-x divide-gray-100/60 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
      <td className="px-1 py-1.5 text-center w-[90px]">
        <div className="flex flex-col items-center">
          <span className="text-[11px] font-bold text-gray-500">{s.grad_year || ''}</span>
          <span className="text-[6px] font-black uppercase tracking-tight">
             <StatusBadge status={s.status} />
          </span>
        </div>
      </td>

      <td className="px-1 py-1.5 w-[80px] text-center font-bold text-[10px] text-gray-500">
        {s.student_num || ''}
      </td>

      <td className="px-3 py-1.5 font-bold text-slateBlue-800 w-[250px]">
        <div className="flex flex-col">
          <span className="truncate text-xs tracking-tight">
            {s.name_en || s.person?.name_en} {(s.other_name || s.person?.other_name) && `(${s.other_name || s.person?.other_name})`}
          </span>
          {(s.name_zh || s.person?.name_zh) && <span className="text-gray-400 text-[11px] font-semibold">{s.name_zh || s.person?.name_zh}</span>}
        </div>
      </td>

      <td className="px-1 py-1.5 align-middle text-center w-[70px]">
        <ExpandedGradeCell scoreStr={s.computed_igcse} />
      </td>
      <td className="px-1 py-3.5 align-middle text-center w-[70px]">
        <ExpandedGradeCell scoreStr={s.computed_ias} />
      </td>
      <td className="px-1 py-3.5 align-middle text-center w-[70px]">
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

      <td className="px-2 py-1.5 w-[250px] min-w-[250px] max-w-[250px]">
        <div className="flex flex-col">
          <span className="font-bold text-slateBlue-800 text-[11px] leading-tight break-words">{s.university_dest === '-' ? '' : s.university_dest}</span>
        </div>
      </td>

      <td className="px-1 py-1.5 text-center align-middle w-[50px]">
        <span className="text-[11px] font-bold text-gray-400">
          {s.quali === '-' ? '' : s.quali}
        </span>
      </td>

      <td className="px-2 py-1.5 w-[250px] min-w-[250px] max-w-[250px]">
        <span className="text-[11px] text-gray-500 font-medium break-words block">{s.program_dest === '-' ? '' : s.program_dest}</span>
      </td>

      {role === 'ADMIN' && (
        <td className={`px-2 py-1.5 w-[70px] text-center sticky right-0 z-10 shadow-[-4px_0_10px_rgba(0,0,0,0.05)] ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
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
  );
});
