import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { IGCSE_BOARDS, IAS_BOARDS, IAL_BOARDS } from '../../constants/subjects';

export const TemplateYearModal = ({ type, onClose, onConfirm, availableYears, initialBoard }) => {
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedBoard, setSelectedBoard] = useState(initialBoard || '');

  const isAcademic = ['IGCSE', 'IAS', 'IAL'].includes(type);
  const boards = type === 'IGCSE' ? IGCSE_BOARDS : (type === 'IAS' ? IAS_BOARDS : IAL_BOARDS);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
        <div className="p-6">
          <h3 className="text-xl font-black text-slateBlue-800 mb-2">Export Template</h3>
          <p className="text-sm text-gray-500 mb-6 font-medium">
            Configure your <strong className="text-aura-teal">{type}</strong> template download.
          </p>
          
          <div className="space-y-4">
            {/* Year Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Graduation Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:border-aura-teal focus:ring-4 focus:ring-aura-teal/10 outline-none transition-all font-bold text-slateBlue-800"
              >
                <option value="All">All Years (Empty Template)</option>
                {availableYears && [...availableYears].sort((a,b) => b-a).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Board Selector (Optional) */}
            {isAcademic && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Exam Board</label>
                <select
                  value={selectedBoard}
                  onChange={(e) => setSelectedBoard(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl focus:border-aura-teal focus:ring-4 focus:ring-aura-teal/10 outline-none transition-all font-bold text-slateBlue-800"
                >
                  {boards.filter(b => b !== 'Other').map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 text-sm font-black text-gray-400 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all active:scale-95"
              >
                CANCEL
              </button>
              <button
                onClick={() => onConfirm(selectedYear, selectedBoard)}
                className="flex-1 px-4 py-3 text-sm font-black text-white bg-aura-teal rounded-xl shadow-lg shadow-aura-teal/20 hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Download size={16} /> DOWNLOAD
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
