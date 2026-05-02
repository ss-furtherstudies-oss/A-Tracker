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
  canEdit,
  resultsCount = 0
}) => {
  return (
    <div className="sticky top-0 z-40 bg-[#f8fafc] pt-2 pb-1">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-[1.5rem] shadow-sm border border-gray-100">
        {/* Left Group */}
      <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
        {/* Year Filter */}
        <div className="relative group shrink-0">
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="appearance-none pl-4 pr-10 h-[40px] bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-aura-teal/20 outline-none transition-all text-sm font-black text-slateBlue-800 cursor-pointer min-w-[90px]"
          >
            {gradYears.map((y) => (
              <option key={y} value={y}>{y === 'All' ? 'Years' : y}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-aura-teal transition-colors" />
        </div>

        {/* Search Bar with Count */}
        <div className="flex items-center gap-3">
          <div className="relative group w-64 lg:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400 group-focus-within:text-aura-teal transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-10 h-[40px] border border-gray-100 rounded-2xl bg-white shadow-sm focus:ring-2 focus:ring-aura-teal/20 focus:border-aura-teal outline-none transition-all text-sm font-semibold text-slateBlue-800 placeholder:text-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-aura-teal transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {searchTerm && (
            <span className="text-[11px] font-black text-aura-teal bg-aura-teal/10 px-3 py-1.5 rounded-xl uppercase tracking-widest whitespace-nowrap">
              {resultsCount} found
            </span>
          )}
        </div>

        {/* Final Only Toggle */}
        <button
          onClick={() => setFilterFinalOnly(!filterFinalOnly)}
          className={`shrink-0 px-4 h-[40px] flex items-center justify-center rounded-2xl text-xs font-black tracking-tight border transition-all ${
            filterFinalOnly
              ? 'bg-aura-teal border-aura-teal text-white shadow-lg shadow-aura-teal/20'
              : 'bg-white border-gray-100 text-gray-400 hover:border-aura-teal/30 hover:text-aura-teal'
          }`}
        >
          Final Destinations Only
        </button>
      </div>

      {/* Right Group */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
        {canEdit && (
          <button
            onClick={onClearClick}
            className="w-[40px] h-[40px] flex items-center justify-center bg-white border border-gray-100 text-red-400 rounded-2xl shadow-sm hover:border-red-200 hover:text-red-500 transition-all"
            title="Clear All Application Data"
          >
            <Trash2 size={16} />
          </button>
        )}

        <button
          onClick={onExportClick}
          className="flex items-center justify-center gap-2 px-4 h-[40px] bg-slateBlue-800 text-white rounded-2xl shadow-lg shadow-slateBlue-900/20 hover:bg-slateBlue-900 hover:-translate-y-0.5 transition-all text-xs font-black tracking-tight"
        >
          <Download size={14} />
          <span className="hidden lg:inline">Export</span>
        </button>

        {canEdit && (
          <>
            <button
              onClick={onImportClick}
              className="flex items-center justify-center gap-2 px-4 h-[40px] bg-white border border-gray-100 text-slateBlue-600 rounded-2xl shadow-sm hover:border-aura-teal/30 hover:text-aura-teal transition-all text-xs font-black tracking-tight"
              title="Bulk Import from Excel"
            >
              <Upload size={14} />
              <span className="hidden lg:inline">Import</span>
            </button>
          </>
        )}
      </div>
    </div>
    </div>
  );
};

export default UAppToolbar;
