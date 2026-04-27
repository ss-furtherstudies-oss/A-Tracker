import React, { useState, useEffect } from 'react';
import { X, Search, Check, Plus } from 'lucide-react';
import { useQS } from '../../context/QSContext';

const ResolveUniversitiesModal = ({ isOpen, onClose, unmappedNames, onResolve }) => {
  const { overallData, updateQSData } = useQS();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Reset when unmapped names change
  useEffect(() => {
    setCurrentIndex(0);
  }, [unmappedNames]);

  if (!isOpen || !unmappedNames || unmappedNames.length === 0) return null;

  const currentUnmapped = unmappedNames[currentIndex];

  const filteredQS = overallData.filter(u => 
    u.university.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMapToExisting = async (qsName) => {
    await onResolve(currentUnmapped, qsName);
    nextStep();
  };

  const handleAddNew = async () => {
    const newUni = {
      university: currentUnmapped,
      rank_latest: null,
      rank_prev: null,
      location: '',
      subject: ''
    };
    await updateQSData([newUni]);
    await onResolve(currentUnmapped, currentUnmapped); // mapped to itself
    nextStep();
  };

  const handleSkip = () => {
    nextStep();
  };

  const nextStep = () => {
    if (currentIndex < unmappedNames.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSearchTerm('');
    } else {
      onClose(); // all done
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slateBlue-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-slateBlue-100/30">
          <div>
            <h2 className="text-lg font-black text-slateBlue-900 tracking-tight">Unmapped University</h2>
            <p className="text-gray-500 text-sm font-semibold mt-1">
              {currentIndex + 1} of {unmappedNames.length} left to resolve
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-slateBlue-900 bg-white rounded-full shadow-sm hover:shadow transition-all group">
            <X size={18} className="group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Unrecognized Name</h3>
            <div className="text-xl font-black text-aura-teal bg-aura-teal/5 border border-aura-teal/20 px-4 py-3 rounded-xl">
              {currentUnmapped}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={handleAddNew}
                className="flex-1 py-3 px-4 bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white rounded-xl font-bold transition-colors border border-emerald-200 shadow-sm flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Add to QS Rankings (As N.A.)
              </button>
              <button 
                onClick={handleSkip}
                className="py-3 px-6 bg-gray-50 hover:bg-gray-200 text-gray-600 rounded-xl font-bold transition-colors border border-gray-200 shadow-sm"
              >
                Skip for now
              </button>
            </div>

            <div className="relative mt-8">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white text-xs font-bold text-gray-400 tracking-widest uppercase">Or map to existing QS University</span>
              </div>
            </div>

            {/* Search Existing */}
            <div className="relative group">
              <Search size={16} className="absolute left-3 top-3 text-gray-400 group-focus-within:text-interact-blue transition-colors" />
              <input 
                type="text" 
                placeholder="Search QS Rankings..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-interact-blue/20 outline-none font-medium text-sm transition-all"
              />
            </div>

            <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
              {filteredQS.length > 0 ? filteredQS.map(qs => (
                <button
                  key={qs.id || qs.university}
                  onClick={() => handleMapToExisting(qs.university)}
                  className="w-full text-left px-4 py-3 hover:bg-slateBlue-50 transition-colors flex items-center justify-between group"
                >
                  <span className="font-bold text-sm text-slateBlue-800">{qs.university}</span>
                  <div className="flex items-center gap-4">
                    {qs.rank_latest && (
                      <span className="text-xs font-black text-gray-400 bg-white px-2 py-1 rounded shadow-sm border border-gray-100">
                        QS: {qs.rank_latest}
                      </span>
                    )}
                    <Check size={16} className="text-interact-blue opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              )) : (
                <div className="p-4 text-center text-sm font-semibold text-gray-400">
                  No matching university found in QS database.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResolveUniversitiesModal;
