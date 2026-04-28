import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { useQS } from '../../context/QSContext';

const ResolveUniversitiesModal = ({ isOpen, onClose, unmappedNames, onResolve }) => {
  const { overallData, updateQSData } = useQS();
  const [resolutions, setResolutions] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && unmappedNames) {
      const initial = {};
      unmappedNames.forEach(name => {
        initial[name] = { action: 'SKIP', value: name };
      });
      setResolutions(initial);
      setError('');
    }
  }, [isOpen, unmappedNames]);

  if (!isOpen || !unmappedNames || unmappedNames.length === 0) return null;

  const handleActionChange = (name, action) => {
    setResolutions(prev => ({
      ...prev,
      [name]: { ...prev[name], action, value: action === 'MAP' ? '' : name }
    }));
  };

  const handleValueChange = (name, value) => {
    setResolutions(prev => ({
      ...prev,
      [name]: { ...prev[name], value }
    }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setError('');
    try {
      const finalResolutions = [];
      const newQSUniversities = [];

      for (const name of unmappedNames) {
        const res = resolutions[name];
        if (res.action === 'SKIP') continue;
        
        const finalName = String(res.value || '').trim();
        if (!finalName) {
           throw new Error(`Please provide a target value for "${name}"`);
        }

        if (res.action === 'ADD') {
          const exists = overallData.some(
            (u) => String(u.university || '').trim().toUpperCase() === finalName.toUpperCase()
          );
          if (!exists && !newQSUniversities.some(u => u.university.toUpperCase() === finalName.toUpperCase())) {
            newQSUniversities.push({
              university: finalName,
              rank_latest: null,
              rank_prev: null,
              location: '',
              subject: ''
            });
          }
        }
        
        finalResolutions.push({ oldName: name, newName: finalName });
      }

      if (newQSUniversities.length > 0) {
        const qsResult = await updateQSData(newQSUniversities);
        if (!qsResult?.success) throw new Error(qsResult?.error || 'Failed to save new universities to QS rankings.');
      }

      if (finalResolutions.length > 0) {
        await onResolve(finalResolutions);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slateBlue-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-slateBlue-100/30">
          <div>
            <h2 className="text-lg font-black text-slateBlue-900 tracking-tight">Bulk Resolve Universities</h2>
            <p className="text-gray-500 text-sm font-semibold mt-1">
              Review and map {unmappedNames.length} unrecognized universities
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {unmappedNames.map((name) => {
                const res = resolutions[name] || { action: 'SKIP', value: name };
                return (
                  <tr key={name} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-slateBlue-800">{name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={res.action}
                        onChange={(e) => handleActionChange(name, e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-slateBlue-800 focus:outline-none focus:ring-2 focus:ring-aura-teal/50"
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
                          placeholder="Search QS Rankings..."
                          className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm font-bold text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      ) : (
                        <input
                          type="text"
                          value={res.value}
                          onChange={(e) => handleValueChange(name, e.target.value)}
                          placeholder="Enter new university name..."
                          className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        />
                      )}
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
              disabled={isSaving}
              className="px-6 py-2.5 text-sm font-bold text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-6 py-2.5 text-sm font-black text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save All Resolutions'}
              {!isSaving && <Save size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResolveUniversitiesModal;
