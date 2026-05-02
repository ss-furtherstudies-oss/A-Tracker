import React, { useState, useEffect } from 'react';
import { X, Check, Loader2, AlertCircle } from 'lucide-react';
import { useQS } from '../../context/QSContext';

const ResolveUniversitiesModal = ({ isOpen, onClose, unmappedNames, onResolveRow, onFinish }) => {
  const { overallData } = useQS();
  const [resolutions, setResolutions] = useState({});
  const [savedRows, setSavedRows] = useState(new Set());
  const [savingRow, setSavingRow] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && unmappedNames) {
      const initial = {};
      unmappedNames.forEach(name => {
        initial[name] = { action: 'SKIP', value: name };
      });
      setResolutions(initial);
      setSavedRows(new Set());
      setSavingRow(null);
      setError('');
    }
  }, [isOpen, unmappedNames]);

  if (!isOpen || !unmappedNames || unmappedNames.length === 0) return null;

  const handleActionChange = (name, action) => {
    setSavedRows(prev => { const next = new Set(prev); next.delete(name); return next; });
    setResolutions(prev => ({
      ...prev,
      [name]: { ...prev[name], action, value: action === 'MAP' ? '' : name }
    }));
  };

  const handleValueChange = (name, value) => {
    setSavedRows(prev => { const next = new Set(prev); next.delete(name); return next; });
    setResolutions(prev => ({
      ...prev,
      [name]: { ...prev[name], value }
    }));
  };

  const handleSaveRow = async (name) => {
    const res = resolutions[name];
    if (!res || res.action === 'SKIP') {
      setSavedRows(prev => new Set(prev).add(name));
      return;
    }

    const finalName = String(res.value || '').trim();
    if (!finalName) {
      setError(`Please provide a target value for "${name}"`);
      return;
    }

    setSavingRow(name);
    setError('');
    try {
      await onResolveRow(name, finalName, res.action);
      setSavedRows(prev => new Set(prev).add(name));
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingRow(null);
    }
  };

  const handleFinish = async () => {
    // Save any unsaved non-SKIP rows first
    for (const name of unmappedNames) {
      if (savedRows.has(name)) continue;
      const res = resolutions[name];
      if (res.action === 'SKIP') continue;
      const finalName = String(res.value || '').trim();
      if (!finalName) {
        setError(`Please provide a target value for "${name}"`);
        return;
      }
      setSavingRow(name);
      try {
        await onResolveRow(name, finalName, res.action);
        setSavedRows(prev => new Set(prev).add(name));
      } catch (err) {
        setError(err.message);
        setSavingRow(null);
        return;
      }
    }
    setSavingRow(null);
    onFinish();
  };

  const allDone = unmappedNames.every(name => {
    if (savedRows.has(name)) return true;
    const res = resolutions[name];
    return res?.action === 'SKIP';
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slateBlue-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-slateBlue-100/30">
          <div>
            <h2 className="text-lg font-black text-slateBlue-900 tracking-tight">Bulk Resolve Universities</h2>
            <p className="text-gray-500 text-sm font-semibold mt-1">
              Review and map {unmappedNames.length} unrecognized universities · {savedRows.size} saved
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-slateBlue-900 bg-white rounded-full shadow-sm hover:shadow transition-all group">
            <X size={18} className="group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-0">
          <datalist id="qs-unis-list">
            {overallData.map(qs => (
              <option key={qs.id || qs.university} value={qs.university} />
            ))}
          </datalist>

          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3 text-xs font-black text-slateBlue-800 uppercase tracking-widest border-b border-gray-200">Unrecognized Name</th>
                <th className="px-6 py-3 text-xs font-black text-slateBlue-800 uppercase tracking-widest border-b border-gray-200 w-[200px]">Action</th>
                <th className="px-6 py-3 text-xs font-black text-slateBlue-800 uppercase tracking-widest border-b border-gray-200">Target Value</th>
                <th className="px-2 py-3 text-xs font-black text-slateBlue-800 uppercase tracking-widest border-b border-gray-200 w-[60px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {unmappedNames.map((name) => {
                const res = resolutions[name] || { action: 'SKIP', value: name };
                const isSaved = savedRows.has(name);
                const isSaving = savingRow === name;
                const canSave = res.action === 'SKIP' || (res.value && String(res.value).trim());

                return (
                  <tr key={name} className={`transition-colors ${isSaved ? 'bg-emerald-50/50' : 'hover:bg-slate-50/50'}`}>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${isSaved ? 'text-emerald-700' : 'text-slateBlue-800'}`}>{name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={res.action}
                        onChange={(e) => handleActionChange(name, e.target.value)}
                        disabled={isSaving}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-slateBlue-800 focus:outline-none focus:ring-2 focus:ring-aura-teal/50 disabled:opacity-50"
                      >
                        <option value="SKIP">Skip</option>
                        <option value="MAP">Map to QS</option>
                        <option value="ADD">Add as New</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      {res.action === 'SKIP' ? (
                        <span className="text-gray-400 text-sm font-medium italic">Will be ignored</span>
                      ) : res.action === 'MAP' ? (
                        <input
                          list="qs-unis-list"
                          value={res.value}
                          onChange={(e) => handleValueChange(name, e.target.value)}
                          disabled={isSaving || isSaved}
                          placeholder="Search QS Rankings..."
                          className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm font-bold text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
                        />
                      ) : (
                        <input
                          type="text"
                          value={res.value}
                          onChange={(e) => handleValueChange(name, e.target.value)}
                          disabled={isSaving || isSaved}
                          placeholder="Enter new university name..."
                          className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
                        />
                      )}
                    </td>
                    <td className="px-2 py-4 text-center">
                      {isSaved ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600">
                          <Check size={16} strokeWidth={3} />
                        </span>
                      ) : isSaving ? (
                        <Loader2 size={18} className="animate-spin text-blue-500 mx-auto" />
                      ) : canSave ? (
                        <button
                          onClick={() => handleSaveRow(name)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                          title="Save this row"
                        >
                          <Check size={16} />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex-1">
            {error && (
              <p className="text-xs font-bold text-red-500 flex items-center gap-1">
                <AlertCircle size={14} /> {error}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={!!savingRow}
              className="px-6 py-2.5 text-sm font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleFinish}
              disabled={!!savingRow}
              className="px-6 py-2.5 text-sm font-black text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {savingRow ? 'Saving...' : allDone ? 'Finish & Import' : 'Save All & Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResolveUniversitiesModal;
