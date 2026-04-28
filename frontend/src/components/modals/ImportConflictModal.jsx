import React from 'react';
import { X, Download } from 'lucide-react';

export const ImportConflictModal = ({ 
  conflict, 
  index, 
  totalCount, 
  onCancel, 
  onSkip, 
  onEditId, 
  onMerge, 
  onMergeAll 
}) => {
  if (!conflict) return null;
  const ex = conflict.existing;
  const im = conflict.imported;

  const isSkip = (v) => v === null || v === undefined || String(v).trim() === '' || String(v).trim() === '-';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-white rounded-[1.5rem] shadow-2xl border border-gray-100 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50 relative">
          <button 
            onClick={onCancel}
            className="absolute top-6 right-6 p-2 text-amber-400 hover:bg-amber-100/50 rounded-full transition-all"
          >
            <X size={20} />
          </button>
          <div className="flex items-center justify-between mr-8">
            <div>
              <h2 className="text-lg font-black text-slateBlue-800">Duplicate Student ID</h2>
              <p className="text-sm text-gray-500 mt-1">
                Conflict {index + 1} of {totalCount} — Student ID: <span className="font-bold text-slateBlue-800">{ex.student_num}</span>
              </p>
            </div>
            <div className="text-[11px] font-bold text-amber-600 bg-amber-100 px-3 py-1 rounded-full">MERGE REQUIRED</div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <table className="w-full text-xs border-collapse table-fixed">
            <thead>
              <tr className="bg-slateBlue-100/30 text-gray-500 uppercase font-black text-[10px] tracking-widest text-left">
                <th className="p-3 w-[20%]">Field</th>
                <th className="p-3 w-[40%]">Existing Record</th>
                <th className="p-3 w-[40%]">Incoming Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                ['Student ID', ex.student_num, im.student_num],
                ['Name (EN)', ex.name_en || ex.person?.name_en, im.name_en || im.person?.name_en],
                ['Name (ZH)', ex.name_zh || ex.person?.name_zh, im.name_zh || im.person?.name_zh],
                ['Year', ex.grad_year, im.grad_year],
                ['IGCSE', ex.igcse_score, im.igcse_score],
                ['IAS', ex.ias_score, im.ias_score],
                ['IAL', ex.alevel_score, im.alevel_score],
                ['IELTS', ex.ielts_score, im.ielts_score],
                ['Status', ex.status, im.status],
              ].filter(([_, __, imVal]) => !isSkip(imVal)).map(([label, exVal, imVal]) => {
                const isDifferent = String(exVal || '').trim() !== String(imVal || '').trim();
                return (
                  <tr key={label} className={isDifferent ? 'bg-amber-50/50 border-l-4 border-amber-400' : ''}>
                    <td className="p-3 font-black text-gray-500 uppercase text-[10px] tracking-wide">{label}</td>
                    <td className={`p-3 font-semibold ${isDifferent ? 'text-gray-400 line-through' : 'text-slateBlue-800'}`}>
                      {exVal || '-'}
                    </td>
                    <td className="p-3 font-semibold text-slateBlue-800 flex items-center gap-2">
                      {isDifferent ? (
                        <span className="text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded shadow-sm">{imVal || '-'}</span>
                      ) : (
                        <span>{imVal || '-'}</span>
                      )}
                      {isDifferent && <span className="text-[9px] font-black text-amber-500 tracking-wider">NEW</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <button
            onClick={onSkip}
            className="px-6 py-2.5 text-sm font-bold text-gray-500 bg-white rounded-super border border-gray-200 hover:bg-gray-50 transition-all active:scale-95"
          >
            Skip (Keep Existing)
          </button>
          <div className="flex gap-2">
            <button
              onClick={onEditId}
              className="px-6 py-2.5 text-sm font-bold text-slateBlue-800 bg-slateBlue-50/80 rounded-super hover:bg-slateBlue-100 transition-all shadow-sm active:scale-95 border border-slateBlue-200"
            >
              Edit ID & Save New
            </button>
            <button
              onClick={onMerge}
              className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-500 rounded-super hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-200 active:scale-95"
            >
              MERGE THIS
            </button>
            <button
              onClick={onMergeAll}
              className="px-6 py-2.5 text-sm font-bold text-white bg-aura-teal rounded-super hover:opacity-90 transition-all shadow-xl shadow-aura-teal/20 active:scale-95 flex items-center gap-2 animate-pulse-subtle"
            >
              <Download size={14} /> IMPORT ALL REMAINING
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
