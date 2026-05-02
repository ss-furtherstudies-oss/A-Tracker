import React from 'react';
import { useQS } from '../../context/QSContext';

const UAppRow = React.memo(({
  student,
  index,
  onViewApplications
}) => {
  const { findRankByName } = useQS();

  return (
    <tr
      className={`group cursor-pointer border-b border-gray-100 transition-colors hover:bg-slate-100 ${
        index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
      }`}
      onClick={() => onViewApplications(student)}
    >
      <td className="px-3 py-3 text-center text-[11px] font-bold text-gray-400 group-hover:text-aura-teal transition-colors">
        {index + 1}
      </td>
      <td className="px-3 py-3 text-center text-[11px] font-bold text-gray-500">{student.grad_year}</td>
      <td className="px-3 py-3 text-[11px] font-bold text-slateBlue-800">{student.student_num}</td>
      <td className="px-3 py-3 text-[11px] text-slateBlue-800">
        <div className="flex flex-col">
          <span className="font-bold">
            {student.person.name_en} {student.person.other_name ? `(${student.person.other_name})` : ''}
          </span>
          <span className="text-[10px] text-gray-400 font-semibold">{student.person.name_zh || '-'}</span>
        </div>
      </td>
      <td className="px-2 py-3 text-center text-[15px] font-black text-slateBlue-800">
        {student.final_dest_uni ? findRankByName(student.final_dest_uni) || '-' : '-'}
      </td>
      <td className="px-3 py-3 text-[11px] font-bold text-slateBlue-700 break-words">{student.final_dest_uni || '-'}</td>
      <td className="px-3 py-3 text-[11px] text-gray-600">
        <div className="font-semibold text-slateBlue-800 break-words">{student.final_dest_prog || '-'}</div>
        {student.final_dest_cond ? (
          <div className="text-[10px] text-gray-400 mt-1 leading-tight break-words">{student.final_dest_cond}</div>
        ) : null}
      </td>
      <td className="px-2 py-3 text-center">
        <div className="flex flex-col items-center">
          <div className="text-[10px] font-bold text-gray-400">{student.applications?.length || 0} Apps</div>
          <div className="text-[9px] text-gray-400/70 font-semibold mt-0.5">{student.last_update || '-'}</div>
        </div>
      </td>
      <td className="px-2 py-3 text-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewApplications(student);
          }}
          title="View/Edit Applications"
          className="px-3 py-1.5 rounded-lg text-[10px] font-black bg-gray-100 text-gray-500 hover:bg-aura-teal hover:text-white transition-all uppercase tracking-widest"
        >
          View Apps
        </button>
      </td>
    </tr>
  );
});

export default UAppRow;
