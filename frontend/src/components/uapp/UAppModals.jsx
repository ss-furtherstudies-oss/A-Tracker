import React, { useMemo, useState, useEffect } from 'react';
import { X } from 'lucide-react';

export const ImportConflictModal = ({ 
  conflict, 
  index, 
  total, 
  isMergingAll, 
  onSkip, 
  onMerge, 
  onMergeAll, 
  onImportAll 
}) => {
  if (!conflict) return null;
  
  const ex = conflict.existing;
  const im = conflict.imported;
  const duplicateApps = conflict.duplicateApps || [];
  const newApps = conflict.newApps || im.applications || [];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-white rounded-[1.5rem] shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
          <h2 className="text-lg font-black text-slateBlue-800">Duplicate Student ID</h2>
          <p className="text-sm text-gray-500 mt-1">
            Conflict {index + 1} of {total} -{' '}
            <span className="font-bold text-slateBlue-800">{ex.student_num || im.student_num}</span>
          </p>
        </div>
        <div className="p-6 space-y-3 text-xs">
          <div className="grid grid-cols-3 gap-3 font-black text-gray-400 uppercase tracking-wider">
            <div>Field</div>
            <div>Existing</div>
            <div>Imported</div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="font-bold text-gray-500">Name</div>
            <div className="font-semibold text-slateBlue-800">{ex.name_en || ex.person?.name_en || '-'}</div>
            <div className="font-semibold text-slateBlue-800">{im.name_en || '-'}</div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="font-bold text-gray-500">Grad Year</div>
            <div className="font-semibold text-slateBlue-800">{ex.grad_year || '-'}</div>
            <div className="font-semibold text-slateBlue-800">{im.grad_year || '-'}</div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="font-bold text-gray-500">Imported Applications</div>
            <div className="font-semibold text-slateBlue-800">-</div>
            <div className="font-semibold text-slateBlue-800">{im.applications.length}</div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="font-bold text-gray-500">Non-duplicate Apps</div>
            <div className="font-semibold text-slateBlue-800">-</div>
            <div className="font-semibold text-emerald-700">{newApps.length}</div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="font-bold text-gray-500">Duplicate by University</div>
            <div className="font-semibold text-slateBlue-800">-</div>
            <div className="font-semibold text-amber-700">{duplicateApps.length}</div>
          </div>
          {duplicateApps.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
                University conflict needs your decision
              </p>
              <p className="text-[11px] text-amber-700 mt-1">
                Duplicate universities found: {(conflict.duplicateUniversities || []).join(', ')}
              </p>
            </div>
          )}
        </div>
        <div className="p-6 flex items-center justify-between bg-gray-50/50 border-t border-gray-100">
          <button
            onClick={onSkip}
            disabled={isMergingAll}
            className="px-6 py-2.5 text-sm font-bold text-gray-500 bg-white rounded-super border border-gray-200 hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onMergeAll}
              disabled={isMergingAll}
              className="px-6 py-2.5 text-sm font-bold text-aura-teal bg-white rounded-super border border-aura-teal/30 hover:bg-aura-teal/5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMergingAll ? 'Merging...' : 'Merge All'}
            </button>
            <button
              onClick={onMerge}
              disabled={isMergingAll}
              className="px-6 py-2.5 text-sm font-bold text-white bg-aura-teal rounded-super hover:opacity-90 transition-all shadow-lg shadow-aura-teal/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Merge Non-Duplicates
            </button>
            {duplicateApps.length > 0 && (
              <button
                onClick={onImportAll}
                disabled={isMergingAll}
                className="px-6 py-2.5 text-sm font-bold text-white bg-amber-500 rounded-super hover:opacity-90 transition-all shadow-lg shadow-amber-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import All (Keep Duplicates)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const TemplateYearModal = ({ type, onClose, onConfirm, availableYears }) => {
  const yearOptions = useMemo(
    () => (type === 'TEMPLATE' ? availableYears.filter((y) => y !== 'All') : availableYears),
    [type, availableYears]
  );
  const [year, setYear] = useState(yearOptions[0] || '');

  useEffect(() => {
    setYear(yearOptions[0] || '');
  }, [yearOptions]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-100">
        <h3 className="text-xl font-black text-slateBlue-800 mb-2">{type === 'FULL' ? 'Export Data' : 'Export Template'}</h3>
        <p className="text-sm text-gray-500 mb-6">
          {type === 'TEMPLATE' ? 'Select a specific graduation year for this template.' : 'Select a graduation year to download.'}
        </p>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-slateBlue-800 mb-6"
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y === 'All' ? 'All Years' : y}
            </option>
          ))}
        </select>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-gray-400 hover:bg-gray-100 rounded-xl">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(year)}
            disabled={!year}
            className="px-6 py-2 bg-aura-teal text-white text-xs font-bold rounded-xl shadow-lg shadow-aura-teal/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
};
