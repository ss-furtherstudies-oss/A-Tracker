import React, { useMemo, useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

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
  const allApps = im.applications || [];
  
  // Track decision for each app: 'KEEP' or 'SKIP'
  // Initialize 'KEEP' for new apps, 'SKIP' for duplicates by default
  const [decisions, setDecisions] = useState(
    allApps.map(app => conflict.duplicateUniversities?.includes(app.university) ? 'SKIP' : 'KEEP')
  );

  const toggleDecision = (idx) => {
    const newDecisions = [...decisions];
    newDecisions[idx] = newDecisions[idx] === 'KEEP' ? 'SKIP' : 'KEEP';
    setDecisions(newDecisions);
  };

  const handleApply = () => {
    const selectedApps = allApps.filter((_, idx) => decisions[idx] === 'KEEP');
    // If user selected apps, we use a custom merge logic
    // For now, I'll hijack onMerge to accept the selected list
    onMerge(selectedApps);
  };

  const keepCount = decisions.filter(d => d === 'KEEP').length;

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
      onClick={onSkip}
    >
      <div 
        className="bg-white rounded-[1.5rem] shadow-2xl border border-gray-100 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-slate-100 shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-slateBlue-800">Compare & Resolve Conflict</h2>
              <p className="text-sm text-gray-500 mt-1">
                Conflict {index + 1} of {total} — <span className="font-bold text-slateBlue-800">{ex.student_num || im.student_num}</span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-black text-white bg-slateBlue-600 px-3 py-1 rounded-full uppercase tracking-widest">
                Data Comparison View
              </span>
              <p className="text-[11px] font-bold text-slateBlue-400">Comparing Excel data with Supabase records</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Header Student Info Comparison */}
          <div className="grid grid-cols-2 gap-px bg-gray-100 border-b border-gray-100">
            <div className="bg-white p-6">
              <p className="text-[10px] font-black text-slateBlue-400 uppercase tracking-widest mb-4">Current System Info</p>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-xs text-gray-400 font-bold">English Name</span>
                  <span className="text-sm font-black text-slateBlue-800">{ex.name_en || ex.person?.name_en || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-xs text-gray-400 font-bold">Grad Year</span>
                  <span className="text-sm font-black text-slateBlue-800">{ex.grad_year || '-'}</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-6">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-4">Importing From Excel</p>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-xs text-gray-400 font-bold">English Name</span>
                  <span className="text-sm font-black text-amber-700">{im.name_en || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-xs text-gray-400 font-bold">Grad Year</span>
                  <span className="text-sm font-black text-amber-700">{im.grad_year || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Side-by-Side Application Grid */}
          <div className="grid grid-cols-2 gap-px bg-gray-100 min-h-full">
            {/* Left: Existing Applications */}
            <div className="bg-white p-6 space-y-4">
              <div className="flex justify-between items-center px-1">
                <p className="text-[10px] font-black text-slateBlue-400 uppercase tracking-widest">Existing Records ({conflict.existingApps?.length || 0})</p>
              </div>
              <div className="space-y-2">
                {(!conflict.existingApps || conflict.existingApps.length === 0) ? (
                  <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-xs font-bold text-gray-400">No applications found in system.</p>
                  </div>
                ) : (
                  conflict.existingApps.map((app, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-bold text-[13px] text-slateBlue-800 truncate">{app.university}</p>
                        <span className="text-[8px] font-black bg-slateBlue-600 text-white px-1.5 py-0.5 rounded uppercase tracking-tighter shrink-0">
                          EXISTING
                        </span>
                      </div>
                      <p className="text-[11px] text-slateBlue-500 truncate">{app.program || 'General Program'}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Imported Applications with Decisions */}
            <div className="bg-amber-50/20 p-6 space-y-4">
              <div className="flex justify-between items-center px-1">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">New Import Data ({allApps.length})</p>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      const smartDecisions = allApps.map(app => conflict.duplicateUniversities?.includes(app.university) ? 'SKIP' : 'KEEP');
                      const selectedApps = allApps.filter((_, idx) => smartDecisions[idx] === 'KEEP');
                      onMerge(selectedApps);
                    }}
                    className="text-[9px] font-black text-emerald-600 bg-white hover:bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 transition-all uppercase tracking-tight shadow-sm"
                  >
                    Smart Merge
                  </button>
                  <button 
                    onClick={() => onMerge(allApps)}
                    className="text-[9px] font-black text-amber-600 bg-white hover:bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 transition-all uppercase tracking-tight shadow-sm"
                  >
                    Keep All
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                {allApps.map((app, idx) => {
                  const isDup = conflict.duplicateUniversities?.includes(app.university);
                  const decision = decisions[idx];
                  
                  return (
                    <div 
                      key={idx} 
                      className={`group flex items-center gap-4 p-3 rounded-xl border transition-all ${
                        decision === 'KEEP' 
                          ? (isDup ? 'bg-amber-100/50 border-amber-300 shadow-sm' : 'bg-emerald-50 border-emerald-300 shadow-sm')
                          : 'bg-white border-gray-100 opacity-60'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-bold text-[13px] text-slateBlue-800 truncate">{app.university}</p>
                          {isDup && (
                            <span className="text-[8px] font-black bg-amber-600 text-white px-1.5 py-0.5 rounded uppercase tracking-tighter shrink-0 animate-pulse">
                              CONFLICT
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slateBlue-500 truncate">{app.program || 'General Program'}</p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => toggleDecision(idx)}
                          className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
                            decision === 'KEEP'
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-white text-gray-400 border border-gray-200'
                          }`}
                        >
                          Keep
                        </button>
                        <button
                          onClick={() => toggleDecision(idx)}
                          className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
                            decision === 'SKIP'
                              ? 'bg-slate-700 text-white shadow-md'
                              : 'bg-white text-gray-400 border border-gray-200'
                          }`}
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 flex items-center justify-between bg-gray-50 border-t border-gray-100 shrink-0">
          <button
            onClick={onSkip}
            disabled={isMergingAll}
            className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-slateBlue-800 transition-colors disabled:opacity-50"
          >
            Skip Student
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onMergeAll}
              disabled={isMergingAll}
              className="px-6 py-2.5 text-sm font-bold text-aura-teal bg-white rounded-super border border-aura-teal/30 hover:bg-aura-teal/5 transition-all active:scale-95 disabled:opacity-50"
            >
              Merge All Students
            </button>
            <button
              onClick={handleApply}
              disabled={isMergingAll || keepCount === 0}
              className="px-8 py-2.5 text-sm font-black text-white bg-aura-teal rounded-super hover:opacity-90 transition-all shadow-lg shadow-aura-teal/20 active:scale-95 disabled:opacity-50"
            >
              {keepCount === 0 ? 'Skip All Rows' : `Import ${keepCount} Selected`}
            </button>
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
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
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
