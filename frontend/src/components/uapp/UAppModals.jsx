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
  
  const appPairs = useMemo(() => {
    const exApps = conflict.existingApps || [];
    const imApps = im.applications || [];
    const pairs = [];
    const matchedEx = new Set();
    const normalize = (u, p) => `${(u||'').toLowerCase().trim()}|${(p||'').toLowerCase().trim()}`;

    imApps.forEach(imApp => {
      const imKey = normalize(imApp.university, imApp.program);
      const exApp = exApps.find(a => normalize(a.university, a.program) === imKey && !matchedEx.has(a.id));
      
      if (exApp) {
        matchedEx.add(exApp.id);
        pairs.push({ type: 'UPDATE', existing: exApp, incoming: imApp });
      } else {
        pairs.push({ type: 'NEW', existing: null, incoming: imApp });
      }
    });

    exApps.forEach(exApp => {
      if (!matchedEx.has(exApp.id)) {
        pairs.push({ type: 'EXISTING_ONLY', existing: exApp, incoming: null });
      }
    });

    return pairs;
  }, [conflict]);

  const [decisions, setDecisions] = useState([]);

  useEffect(() => {
    setDecisions(
      appPairs.map(pair => pair.type === 'EXISTING_ONLY' ? 'EXISTING' : 'INCOMING')
    );
  }, [appPairs]);

  const toggleDecision = (idx, choice) => {
    const newDecisions = [...decisions];
    newDecisions[idx] = choice;
    setDecisions(newDecisions);
  };

  const handleApply = () => {
    const appsToUpsert = [];
    appPairs.forEach((pair, idx) => {
      const decision = decisions[idx];
      if (pair.type === 'NEW' && decision === 'INCOMING') {
        appsToUpsert.push(pair.incoming);
      } else if (pair.type === 'UPDATE' && decision === 'INCOMING') {
        appsToUpsert.push({ ...pair.incoming, id: pair.existing.id });
      }
    });
    onMerge(appsToUpsert);
  };

  const incomingCount = decisions.filter(d => d === 'INCOMING').length;

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
              <h2 className="text-xl font-black text-slateBlue-800">Entry-by-Entry Comparison</h2>
              <p className="text-sm text-gray-500 mt-1">
                Conflict {index + 1} of {total} — <span className="font-bold text-slateBlue-800">{ex.student_num || im.student_num}</span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-black text-white bg-slateBlue-600 px-3 py-1 rounded-full uppercase tracking-widest">
                Side-by-Side View
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/50 p-6 space-y-4">
          {appPairs.map((pair, idx) => {
            const decision = decisions[idx];
            return (
              <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {pair.type === 'UPDATE' ? 'Conflict Detected' : pair.type === 'NEW' ? 'New Application' : 'Existing Only (Not in CSV)'}
                  </span>
                </div>
                <div className="flex divide-x divide-gray-100">
                  {/* Left: Existing */}
                  <div className={`flex-1 p-4 transition-all ${decision === 'EXISTING' ? 'bg-emerald-50/30' : 'opacity-60 grayscale-[50%]'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-slateBlue-400 uppercase tracking-widest">System Record</span>
                      {pair.existing && (
                        <button
                          onClick={() => toggleDecision(idx, 'EXISTING')}
                          className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${decision === 'EXISTING' ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                          {decision === 'EXISTING' ? 'Selected' : 'Keep This'}
                        </button>
                      )}
                    </div>
                    {pair.existing ? (
                      <div className="space-y-1">
                        <p className="font-bold text-[14px] text-slateBlue-800">{pair.existing.university}</p>
                        <p className="text-[12px] text-slateBlue-500">{pair.existing.program || 'General Program'}</p>
                        <div className="pt-2 flex flex-wrap gap-2 text-[10px] font-black uppercase">
                           {pair.existing.status && <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">{pair.existing.status}</span>}
                           {pair.existing.condition && <span className="bg-gray-100 px-2 py-1 rounded text-gray-600 truncate max-w-[150px]" title={pair.existing.condition}>{pair.existing.condition}</span>}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs font-bold text-gray-400 py-4">No matching record</div>
                    )}
                  </div>

                  {/* Right: Incoming */}
                  <div className={`flex-1 p-4 transition-all ${decision === 'INCOMING' ? 'bg-amber-50/50' : 'opacity-60 grayscale-[50%]'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Excel Data</span>
                      {pair.incoming && (
                        <button
                          onClick={() => toggleDecision(idx, 'INCOMING')}
                          className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${decision === 'INCOMING' ? 'bg-amber-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                          {decision === 'INCOMING' ? 'Selected' : 'Use This'}
                        </button>
                      )}
                    </div>
                    {pair.incoming ? (
                      <div className="space-y-1">
                        <p className="font-bold text-[14px] text-slateBlue-800">{pair.incoming.university}</p>
                        <p className="text-[12px] text-slateBlue-500">{pair.incoming.program || 'General Program'}</p>
                        <div className="pt-2 flex flex-wrap gap-2 text-[10px] font-black uppercase">
                           {pair.incoming.status && <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">{pair.incoming.status}</span>}
                           {pair.incoming.condition && <span className="bg-gray-100 px-2 py-1 rounded text-gray-600 truncate max-w-[150px]" title={pair.incoming.condition}>{pair.incoming.condition}</span>}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs font-bold text-gray-400 py-4">Not in CSV</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-6 flex items-center justify-between bg-white border-t border-gray-100 shrink-0">
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
              Merge All Remaining
            </button>
            <button
              onClick={handleApply}
              disabled={isMergingAll}
              className="px-8 py-2.5 text-sm font-black text-white bg-aura-teal rounded-super hover:opacity-90 transition-all shadow-lg shadow-aura-teal/20 active:scale-95 disabled:opacity-50"
            >
              {incomingCount === 0 ? 'Keep Existing Only' : `Apply ${incomingCount} Changes`}
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

export const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slateBlue-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 mx-auto">
          <AlertTriangle size={32} className="text-red-500" />
        </div>
        <h3 className="text-2xl font-black text-slateBlue-900 mb-3 text-center tracking-tight">{title}</h3>
        <p className="text-sm text-gray-500 mb-8 text-center font-medium leading-relaxed">
          {message}
        </p>
        <div className="flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 px-4 py-3 text-sm font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 px-4 py-3 bg-red-500 text-white text-sm font-black rounded-2xl shadow-lg shadow-red-500/30 hover:bg-red-600 hover:-translate-y-0.5 transition-all"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export const DeduplicateModal = ({ isOpen, onClose, groups, onResolve, onMergeAll, isProcessing }) => {
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (isOpen && groups.length > 0) {
      const final = groups[0].items.find(app => app.is_final);
      setSelectedId(final ? final.id : groups[0].items[0].id);
    }
  }, [isOpen, groups]);

  if (!isOpen || groups.length === 0) return null;

  const currentGroup = groups[0];
  
  const handleApply = async () => {
    if (!selectedId) return;
    await onResolve(currentGroup.key, selectedId);
  };

  const handleSkipToNext = () => {
    // We just remove the current group from local view without deleting anything
    // This is a bit tricky since groups is controlled by the hook
    // But since the user wants "Skip to Next", I'll just skip the first group in the display logic if needed
    // However, the cleanest way is to just resolve it by keeping the existing state but moving it to the end of the list?
    // Actually, I'll just treat it as "Next" without action.
    onResolve(currentGroup.key, null); // If idToKeep is null, we just filter it out from display list in the hook
  };

  return (
    <div 
      className="fixed inset-0 bg-slateBlue-900/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-[2rem] w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100 shrink-0 flex justify-between items-center bg-gray-50/30">
          <div>
            <h2 className="text-lg font-black text-slateBlue-900">Resolve Data Conflicts</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
              Items to Process: <span className="text-aura-teal">{groups.length}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-slateBlue-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4 text-center">
            <h3 className="text-md font-black text-slateBlue-800">{currentGroup.studentName}</h3>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1">
              {currentGroup.university} — {currentGroup.program || 'General'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {currentGroup.items.map((app) => (
              <div 
                key={app.id} 
                onClick={() => setSelectedId(app.id)}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all relative ${
                  selectedId === app.id 
                    ? 'border-aura-teal bg-aura-teal/5 shadow-sm' 
                    : 'border-gray-50 bg-white hover:border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${
                    selectedId === app.id ? 'bg-aura-teal text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {selectedId === app.id ? 'KEEP' : 'Discard'}
                  </span>
                  {app.is_final && (
                    <span className="text-[8px] font-black text-white bg-slateBlue-400 px-2 py-0.5 rounded-md uppercase tracking-widest">
                      Final
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Status</span>
                    <span className={`text-[10px] font-black ${app.status === 'OFFER' ? 'text-emerald-600' : 'text-slateBlue-800'}`}>
                      {app.status || 'PENDING'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Decision</span>
                    <span className="text-[10px] font-bold text-slateBlue-800 truncate pl-3">{app.decision || 'N/A'}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-100 min-h-[36px]">
                    <p className="text-[9px] text-gray-500 italic line-clamp-2 leading-tight">
                      {app.condition || 'No conditions.'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between pt-5 border-t border-gray-100 gap-4">
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-[10px] font-black text-gray-400 hover:bg-gray-50 rounded-lg uppercase tracking-widest transition-all"
              >
                Skip All
              </button>
              <button
                onClick={handleSkipToNext}
                className="px-4 py-2 text-[10px] font-black text-slateBlue-600 hover:bg-slateBlue-50 rounded-lg uppercase tracking-widest transition-all"
              >
                Skip to Next
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onMergeAll}
                disabled={isProcessing}
                className="px-5 py-2 text-[10px] font-black text-aura-teal bg-white border border-aura-teal/20 rounded-lg uppercase tracking-widest hover:bg-aura-teal/5 transition-all disabled:opacity-50"
              >
                Merge All Exact
              </button>
              <button
                onClick={handleApply}
                disabled={isProcessing || !selectedId}
                className="px-8 py-2 bg-emerald-500 text-white text-[10px] font-black rounded-lg uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Apply & Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



