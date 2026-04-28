import React from 'react';
import { AlertCircle } from 'lucide-react';

export const EditStudentIdModal = ({ 
  isOpen, 
  initialValue, 
  studentName, 
  errorMsg, 
  onClose, 
  onSave,
  onErrorClear
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
        <div className="p-6">
          <h3 className="text-xl font-black text-slateBlue-800 mb-2">Assign New Student ID</h3>
          <p className="text-sm text-gray-500 mb-6">
            Please enter a new, unique Student ID for <strong className="text-slateBlue-800">{studentName}</strong>.
          </p>
          
          <div className="space-y-1">
            <input
              type="text"
              autoFocus
              defaultValue={initialValue}
              onChange={onErrorClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSave(e.target.value);
              }}
              id="new-student-id-input"
              className={`w-full px-4 py-3 bg-gray-50 border ${errorMsg ? 'border-red-400 focus:ring-red-400 focus:bg-red-50' : 'border-gray-200 focus:ring-aura-teal focus:bg-white'} rounded-xl text-sm font-bold text-slateBlue-800 focus:outline-none focus:ring-2 transition-all`}
              placeholder="Enter unique Student ID..."
            />
            {errorMsg && (
              <p className="text-[11px] font-bold text-red-500 flex items-center gap-1 mt-2">
                <AlertCircle size={14} /> {errorMsg}
              </p>
            )}
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 bg-white border border-gray-200 transition-colors rounded-xl active:scale-95 shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(document.getElementById('new-student-id-input').value)}
            className="px-6 py-2 text-sm font-bold text-white bg-aura-teal rounded-xl hover:bg-teal-500 shadow-lg shadow-aura-teal/20 active:scale-95 transition-all"
          >
            Save Record
          </button>
        </div>
      </div>
    </div>
  );
};
