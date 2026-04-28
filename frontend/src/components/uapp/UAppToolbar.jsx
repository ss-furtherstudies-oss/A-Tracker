import React from 'react';
import { Search, Download, Upload, Plus, Trash2, FileSpreadsheet, ChevronDown } from 'lucide-react';

const UAppToolbar = ({
  searchTerm,
  setSearchTerm,
  yearFilter,
  setYearFilter,
  gradYears,
  filterFinalOnly,
  setFilterFinalOnly,
  onImportClick,
  onExportClick,
  onAddClick,
  onClearClick,
  canEdit
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1 group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400 group-focus-within:text-aura-teal transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Search by student name, ID, university or program..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2.5 border border-gray-100 rounded-2xl bg-white shadow-sm focus:ring-2 focus:ring-aura-teal/20 focus:border-aura-teal outline-none transition-all text-sm font-semibold text-slateBlue-800 placeholder:text-gray-400"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Year Filter */}
        <div className="relative group">
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-aura-teal/20 outline-none transition-all text-sm font-black text-slateBlue-800 cursor-pointer min-w-[120px]"
          >
            {gradYears.map((y) => (
              <option key={y} value={y}>{y === 'All' ? 'All Cohorts' : `Class of ${y}`}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-aura-teal transition-colors" />
        </div>

        {/* Final Only Toggle */}
        <button
          onClick={() => setFilterFinalOnly(!filterFinalOnly)}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black tracking-tight border transition-all ${
            filterFinalOnly
              ? 'bg-aura-teal border-aura-teal text-white shadow-lg shadow-aura-teal/20'
              : 'bg-white border-gray-100 text-gray-400 hover:border-aura-teal/30 hover:text-aura-teal'
          }`}
        >
          Final Destinations Only
        </button>

        <div className="h-8 w-px bg-gray-100 mx-1 hidden sm:block" />

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <button
                onClick={onImportClick}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 text-slateBlue-600 rounded-2xl shadow-sm hover:border-aura-teal/30 hover:text-aura-teal transition-all text-xs font-black tracking-tight"
                title="Bulk Import from Excel"
              >
                <Upload size={14} />
                <span className="hidden lg:inline">Import</span>
              </button>
              <button
                onClick={onClearClick}
                className="p-2.5 bg-white border border-gray-100 text-red-400 rounded-2xl shadow-sm hover:border-red-200 hover:text-red-500 transition-all"
                title="Clear All Application Data"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}

          <button
            onClick={onExportClick}
            className="flex items-center gap-2 px-4 py-2.5 bg-slateBlue-800 text-white rounded-2xl shadow-lg shadow-slateBlue-900/20 hover:bg-slateBlue-900 hover:-translate-y-0.5 transition-all text-xs font-black tracking-tight"
          >
            <Download size={14} />
            <span className="hidden lg:inline">Export Results</span>
          </button>

          {canEdit && (
            <button
              onClick={onAddClick}
              className="flex items-center gap-2 px-4 py-2.5 bg-aura-teal text-white rounded-2xl shadow-lg shadow-aura-teal/20 hover:bg-aura-teal-dark hover:-translate-y-0.5 transition-all text-xs font-black tracking-tight"
            >
              <Plus size={14} />
              <span className="hidden lg:inline">Add Entry</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UAppToolbar;
