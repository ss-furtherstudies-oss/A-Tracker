import React from 'react';
import { Search, Globe, Download, Upload, Trash2, X } from 'lucide-react';

export const StudentsGridToolbar = ({
  searchTerm,
  onSearchChange,
  resultCount,
  onResolveMappings,
  unmappedCount,
  role,
  onExportTemplate,
  onImportXL,
  onClearAll,
  onAddNew
}) => {
  return (
    <div className="sticky top-0 z-40 bg-[#f8fafc] pt-2 pb-1">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-t-super shadow-sm border border-gray-100 gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-96 group">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-aura-teal transition-colors" />
            <input
              type="text"
              placeholder="Search names, grades (e.g. 2A*), university..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-10 py-2 w-full text-sm border border-gray-200 rounded-super focus:outline-none focus:ring-2 focus:ring-aura-teal/20 bg-slateBlue-100 transition-all font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-aura-teal transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {searchTerm && (
            <span className="text-[10px] font-black text-aura-teal bg-white border border-aura-teal/20 px-2 py-1.5 rounded shadow-sm whitespace-nowrap uppercase tracking-widest">
              {resultCount} results
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onResolveMappings}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-all shadow-sm active:scale-95 border rounded-super ${
              unmappedCount > 0 
                ? 'bg-red-500 text-white border-red-600 hover:bg-red-600 animate-pulse-subtle' 
                : 'bg-white text-gray-400 border-gray-100 opacity-60 hover:opacity-100'
            }`}
          >
            <Globe size={14} /> 
            RESOLVE MAPPINGS
            {unmappedCount > 0 && <span className="ml-1 bg-white text-red-500 px-1.5 py-0.5 rounded-full text-[10px]">{unmappedCount}</span>}
          </button>
          
          {role === 'ADMIN' && (
            <div className="relative inline-flex items-center">
              <Download size={14} className="absolute left-3 text-gray-400 pointer-events-none" />
              <select
                onChange={onExportTemplate}
                className="appearance-none pl-9 pr-6 py-2 text-xs font-bold text-gray-500 bg-white rounded-super hover:bg-gray-50 transition-all border border-gray-200 shadow-sm cursor-pointer outline-none active:scale-95 text-center"
                defaultValue=""
              >
                <option value="" disabled>DOWNLOAD TYPE...</option>
                <option value="FULL">FULL DATA BACKUP</option>
                <option value="PROFILE">Profile Data Template</option>
                <option value="IGCSE">IGCSE Grades Template</option>
                <option value="IAS">IAS Grades Template</option>
                <option value="IAL">IAL/GCEAL Grades Template</option>
                <option value="IELTS">IELTS Scores Template</option>
              </select>
            </div>
          )}

          {role === 'ADMIN' && (
            <label className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-500 bg-white rounded-super hover:bg-gray-50 transition-all border border-gray-200 shadow-sm cursor-pointer active:scale-95">
              <Upload size={14} /> BATCH IMPORT
              <input type="file" accept=".xlsx, .xls" onChange={onImportXL} className="hidden" />
            </label>
          )}

          {role === 'ADMIN' && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-500 bg-red-50/50 rounded-super hover:bg-red-100 transition-all border border-red-100 shadow-sm active:scale-95"
              title="Remove All Data"
            >
              <Trash2 size={14} /> CLEAR DATA
            </button>
          )}

          {role === 'ADMIN' && (
            <button
              onClick={onAddNew}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-aura-teal rounded-super hover:bg-teal-500 shadow-lg shadow-aura-teal/20 transition-all ml-2 active:scale-95"
            >
              + Add New
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
