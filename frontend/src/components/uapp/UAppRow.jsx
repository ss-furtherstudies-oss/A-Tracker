import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown, ChevronRight, Check, Edit2, Trash2, Plus } from 'lucide-react';
import { useQS } from '../../context/QSContext';
import EditableCell from '../ui/EditableCell';

const UAppRow = ({
  student,
  index,
  onToggleFinal,
  onUpdateApp,
  onDeleteApp,
  onEditApp,
  onAddApp,
  canEdit
}) => {
  const { findRankByName } = useQS();
  const [expanded, setExpanded] = useState(false);
  const isAlumni = Number(student.grad_year) < new Date().getFullYear();

  return (
    <>
      <tr
        className={`group cursor-pointer border-b border-gray-100 transition-colors hover:bg-slate-100 ${
          index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
        }`}
        onClick={() => setExpanded((p) => !p)}
      >
        <td className="px-3 py-2 text-center text-aura-teal">
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </td>
        <td className="px-3 py-2 text-center text-[11px] font-bold text-gray-500">{student.grad_year}</td>
        <td className="px-3 py-2 text-[11px] font-bold text-slateBlue-800">{student.student_num}</td>
        <td className="px-3 py-2 text-[11px] text-slateBlue-800">
          <div className="flex flex-col">
            <span className="font-bold">
              {student.person.name_en} {student.person.other_name ? `(${student.person.other_name})` : ''}
            </span>
            <span className="text-[10px] text-gray-400 font-semibold">{student.person.name_zh || '-'}</span>
          </div>
        </td>
        <td className="px-2 py-2 text-center text-[15px] font-black text-slateBlue-800">
          {student.final_dest_uni ? findRankByName(student.final_dest_uni) || '-' : '-'}
        </td>
        <td className="px-3 py-2 text-[11px] font-bold text-slateBlue-700 break-words">{student.final_dest_uni || '-'}</td>
        <td className="px-3 py-2 text-[11px] text-gray-600">
          <div className="font-semibold text-slateBlue-800 break-words">{student.final_dest_prog || '-'}</div>
          {student.final_dest_cond ? (
            <div className="text-[10px] text-gray-400 mt-1 leading-tight break-words">{student.final_dest_cond}</div>
          ) : null}
        </td>
        <td className="px-2 py-2 text-center">
          <div className="flex flex-col items-center">
            <div className="text-[10px] font-bold text-gray-400">{student.applications.length} Apps</div>
            <div className="text-[9px] text-gray-400/70 font-semibold mt-0.5">{student.last_update || '-'}</div>
          </div>
        </td>
        <td className="px-2 py-2 text-center">
          {canEdit ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddApp(student);
              }}
              title="Add Application"
              className="p-1.5 rounded-lg text-aura-teal hover:bg-aura-teal/10 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Plus size={14} />
            </button>
          ) : null}
        </td>
      </tr>

      {expanded && (
        <tr className="bg-gray-50/80 border-b border-gray-200">
          <td colSpan="9" className="p-0 border-l-4 border-aura-teal">
            <div className="p-4 pl-10 overflow-auto max-h-[55vh]">
              <table className="w-full text-left text-xs bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden table-fixed">
                <thead className="sticky top-0 z-20 bg-slateBlue-100/95 backdrop-blur-sm text-gray-500 uppercase font-black text-[10px] tracking-widest border-b border-gray-100">
                  <tr>
                    <th className="p-3 w-14">Loc</th>
                    <th className="p-3 w-48">University</th>
                    <th className="p-3 w-14 text-center">QS</th>
                    <th className="p-3 w-40">Program</th>
                    <th className="p-3 w-16">Quali</th>
                    <th className="p-3 w-16 text-center">Offer</th>
                    <th className="p-3 w-24">AS</th>
                    <th className="p-3 w-56">Condition</th>
                    <th className="p-3 w-24">Decision</th>
                    <th className="p-3 w-16 text-center">Final</th>
                    <th className="p-3 w-20 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {student.applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slateBlue-50/40 transition-colors">
                      <td className="p-3 font-bold text-gray-500">
                        <EditableCell value={app.country} onSave={(v) => onUpdateApp(student.id, app.id, 'country', v)} readOnly={!canEdit} />
                      </td>
                      <td className="p-3 font-bold text-slateBlue-700">
                        <EditableCell value={app.university} onSave={(v) => onUpdateApp(student.id, app.id, 'university', v)} readOnly={!canEdit} />
                      </td>
                      <td className="p-3 text-center text-[15px] font-bold text-gray-400">
                        {(() => {
                          const rank = findRankByName(app.university) || (app.qs > 0 ? app.qs : null);
                          return rank ? (
                            <NavLink to="/rankings" className="hover:text-aura-teal hover:underline transition-colors">
                              {rank}
                            </NavLink>
                          ) : '-';
                        })()}
                      </td>
                      <td className="p-3 text-gray-600">
                        <EditableCell value={app.program} onSave={(v) => onUpdateApp(student.id, app.id, 'program', v)} readOnly={!canEdit} />
                      </td>
                      <td className="p-3 text-gray-500 font-semibold">{app.quali || '-'}</td>
                      <td className="p-3 text-center">{app.has_offer ? <Check size={16} className="text-emerald-500 mx-auto" strokeWidth={3} /> : '-'}</td>
                      <td className="p-3 text-gray-600 font-bold whitespace-nowrap">{isAlumni ? '-' : student.as_grades || '-'}</td>
                      <td className="p-3 text-gray-500">
                        <EditableCell value={app.condition} onSave={(v) => onUpdateApp(student.id, app.id, 'condition', v)} readOnly={!canEdit} />
                      </td>
                      <td className="p-3 font-semibold text-slateBlue-800">{app.decision || '-'}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFinal(student.id, app.id);
                          }}
                          disabled={!canEdit}
                          className={`w-5 h-5 rounded flex items-center justify-center border mx-auto transition-colors ${
                            app.is_final
                              ? 'bg-aura-teal border-aura-teal text-white'
                              : 'border-gray-300 hover:border-aura-teal'
                          } ${canEdit ? '' : 'cursor-not-allowed opacity-50'}`}
                          title="Toggle final destination"
                        >
                          {app.is_final ? <Check size={14} strokeWidth={3} /> : null}
                        </button>
                      </td>
                      <td className="p-3">
                        {canEdit ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditApp(student, app);
                              }}
                              className="p-1.5 text-slateBlue-400 hover:text-slateBlue-800 hover:bg-slateBlue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteApp(student.id, app.id);
                              }}
                              className="p-1.5 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default UAppRow;
