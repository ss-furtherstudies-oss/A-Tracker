import React, { useState, useMemo, useRef } from 'react';
import { Search, Upload, Download, TrendingUp, TrendingDown, Minus, X, Globe, BookOpen, Plus } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { useQS } from '../context/QSContext';
import { useAuth } from '../context/AuthContext';

const QSRankings = () => {
  const { overallData, updateQSData, subjectData, setSubjectData } = useQS();
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState('overall'); // 'overall' | 'subject'
  const [searchTerm, setSearchTerm] = useState('');
  const [importMsg, setImportMsg] = useState(null);
  const [subjectFilter, setSubjectFilter] = useState('All');

  const headerScrollRef = useRef(null);
  const bodyScrollRef = useRef(null);

  const handleBodyScroll = (e) => {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  const currentData = activeTab === 'overall' ? overallData : subjectData;

  // Extract unique subjects for the subject tab filter
  const subjects = useMemo(() => {
    const s = new Set(subjectData.map(r => r.subject).filter(Boolean));
    return ['All', ...Array.from(s).sort()];
  }, [subjectData]);

  // Filtered data based on search and subject filter
  const filteredData = useMemo(() => {
    let result = currentData;

    // Subject filter (only for subject tab)
    if (activeTab === 'subject' && subjectFilter !== 'All') {
      result = result.filter(r => r.subject === subjectFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r =>
        r.university.toLowerCase().includes(term) ||
        r.location.toLowerCase().includes(term) ||
        String(r.rank_latest).includes(term)
      );
    }

    // Sort by rank ASC, but put nulls at the end
    return [...result].sort((a, b) => {
      const aRank = a.rank_latest;
      const bRank = b.rank_latest;

      if (aRank === null && bRank === null) return 0;
      if (aRank === null) return 1;
      if (bRank === null) return -1;

      return aRank - bRank;
    });
  }, [currentData, searchTerm, activeTab, subjectFilter]);

  // Smart QS Excel parser — handles multi-row merged headers
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];

        // Read as raw array of arrays to handle merged/multi-row headers
        const allRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        if (allRows.length < 3) {
          setImportMsg({ type: 'warn', text: 'The file does not contain enough rows.' });
          return;
        }

        // --- Step 1: Find the header row by scanning for keywords ---
        let headerRowIdx = -1;
        let institutionCol = -1;
        let rankLatestCol = -1;
        let rankPrevCol = -1;
        let locationCol = -1;
        let subjectCol = -1;
        let latestYearLabel = 'Latest';
        let prevYearLabel = 'Previous';

        for (let r = 0; r < Math.min(allRows.length, 10); r++) {
          const row = allRows[r];
          for (let c = 0; c < row.length; c++) {
            const cell = String(row[c] || '').toLowerCase().trim();
            if (cell.includes('institution') || cell === 'name') {
              headerRowIdx = r;
              institutionCol = c;
            }
            if (cell.includes('location') || cell.includes('country') || cell.includes('region')) {
              locationCol = c;
            }
            if (cell.includes('subject') || cell.includes('discipline') || cell.includes('field') || cell.includes('topic')) {
              subjectCol = c;
            }
          }
          if (headerRowIdx >= 0) break;
        }

        // If no "Institution" header found, try fallback: assume col D (index 3) is institution
        if (headerRowIdx < 0) {
          // Look for first row with a year pattern like "2026" in early columns
          for (let r = 0; r < Math.min(allRows.length, 10); r++) {
            const row = allRows[r];
            for (let c = 0; c < Math.min(row.length, 5); c++) {
              const cell = String(row[c] || '').trim();
              if (/^20\d{2}$/.test(cell)) {
                headerRowIdx = r;
                break;
              }
            }
            if (headerRowIdx >= 0) break;
          }
        }

        // Fallback defaults matching the QS screenshot layout
        if (headerRowIdx < 0) headerRowIdx = 1; // row 2 in the screenshot (0-indexed)

        // --- Step 2: Detect rank year columns from the header row ---
        const headerRow = allRows[headerRowIdx];
        const yearCols = [];

        for (let c = 0; c < headerRow.length; c++) {
          const cell = String(headerRow[c] || '').trim();
          // Match year patterns like "2026", "2025"
          if (/^20\d{2}$/.test(cell)) {
            yearCols.push({ col: c, year: parseInt(cell) });
          }
          // Also check for "Rank" keyword with a year nearby
          if (cell.toLowerCase().includes('rank') && institutionCol < 0) {
            // The column before might be a year
          }
        }

        // Sort by year descending to get latest first
        yearCols.sort((a, b) => b.year - a.year);

        if (yearCols.length >= 2) {
          rankLatestCol = yearCols[0].col;
          rankPrevCol = yearCols[1].col;
          latestYearLabel = String(yearCols[0].year);
          prevYearLabel = String(yearCols[1].year);
        } else if (yearCols.length === 1) {
          rankLatestCol = yearCols[0].col;
          latestYearLabel = String(yearCols[0].year);
        }

        // If no year columns found, fall back to positional detection (QS format: B=latest, C=prev)
        if (rankLatestCol < 0) {
          // Column B (index 1) = latest rank, Column C (index 2) = previous rank
          rankLatestCol = 1;
          rankPrevCol = 2;

          // Try to extract year labels from the header row
          const cellB = String(headerRow[1] || '').trim();
          const cellC = String(headerRow[2] || '').trim();
          if (/20\d{2}/.test(cellB)) latestYearLabel = cellB.match(/20\d{2}/)[0];
          if (/20\d{2}/.test(cellC)) prevYearLabel = cellC.match(/20\d{2}/)[0];
        }

        // Institution column fallback: D = index 3
        if (institutionCol < 0) institutionCol = 3;

        // --- Step 3: Parse data rows ---
        const dataStartRow = headerRowIdx + 1;
        // If there's a sub-header row (row 3 in QS format), skip it
        const firstDataRow = allRows[dataStartRow];
        const firstCellCheck = String(firstDataRow?.[rankLatestCol] || '').trim();
        const actualStart = /^\d+$/.test(firstCellCheck) ? dataStartRow : dataStartRow + 1;

        const parsed = [];

        for (let r = actualStart; r < allRows.length; r++) {
          const row = allRows[r];
          const university = String(row[institutionCol] || '').trim();
          if (!university) continue;

          const rankLatest = parseRank(row[rankLatestCol]);
          const rankPrev = rankPrevCol >= 0 ? parseRank(row[rankPrevCol]) : null;

          let change = null;
          if (rankLatest !== null && rankPrev !== null) {
            change = rankPrev - rankLatest; // positive = improved
          }

          parsed.push({
            id: `qs-${r}-${Date.now()}`,
            rank_latest: rankLatest,
            rank_prev: rankPrev,
            change,
            university,
            location: locationCol >= 0 ? String(row[locationCol] || '').trim() : '',
            subject: subjectCol >= 0 ? String(row[subjectCol] || '').trim() : '',
            yearLatest: latestYearLabel,
            yearPrev: prevYearLabel
          });
        }

        if (parsed.length === 0) {
          setImportMsg({ type: 'warn', text: 'No valid ranking entries found. Check the Excel layout.' });
          return;
        }

        // Prepare data for Supabase (clean up keys)
        const toSave = parsed.map(p => ({
          university: p.university,
          rank_latest: p.rank_latest,
          rank_prev: p.rank_prev,
          location: p.location,
          subject: p.subject
        }));

        setImportMsg({ type: 'info', text: 'Saving data to cloud...' });
        
        updateQSData(toSave).then(res => {
          if (res.success) {
            setImportMsg({ type: 'success', text: `Successfully synced ${parsed.length} entries to cloud rankings.` });
            if (subjectCol >= 0 && parsed.some(p => p.subject)) {
              setActiveTab('subject');
            } else {
              setActiveTab('overall');
            }
          } else {
            setImportMsg({ type: 'error', text: `Sync failed: ${res.error}` });
          }
          setTimeout(() => setImportMsg(null), 5000);
        });

      } catch (err) {
        console.error('QS Import error:', err);
        setImportMsg({ type: 'error', text: `Import failed: ${err.message}` });
        setTimeout(() => setImportMsg(null), 5000);
      }
    };
    reader.readAsBinaryString(file);
  };

  const parseRank = (val) => {
    if (val === null || val === undefined || val === '') return null;
    const s = String(val).trim().replace(/[+=,]/g, '');
    // Handle ranges like "601-650"
    if (s.includes('-')) {
      const parts = s.split('-').map(Number);
      return Math.round((parts[0] + parts[1]) / 2);
    }
    const n = parseInt(s);
    return isNaN(n) ? null : n;
  };

  // Country to abbreviation mapping
  const toAbbr = (location) => {
    if (!location) return '';
    const loc = location.toLowerCase().trim();
    const map = {
      'china (mainland)': 'CN', 'china': 'CN', 'mainland china': 'CN',
      'hong kong sar': 'HK', 'hong kong': 'HK',
      'united kingdom': 'UK', 'uk': 'UK',
      'united states': 'US', 'united states of america': 'US', 'usa': 'US',
      'canada': 'CA', 'australia': 'AU', 'new zealand': 'NZ',
      'japan': 'JP', 'south korea': 'KR', 'korea, south': 'KR', 'republic of korea': 'KR',
      'singapore': 'SG', 'taiwan': 'TW', 'taiwan, china': 'TW',
      'germany': 'DE', 'france': 'FR', 'italy': 'IT', 'spain': 'ES',
      'netherlands': 'NL', 'switzerland': 'CH', 'sweden': 'SE',
      'denmark': 'DK', 'norway': 'NO', 'finland': 'FI', 'ireland': 'IE',
      'belgium': 'BE', 'austria': 'AT', 'portugal': 'PT', 'greece': 'GR',
      'russia': 'RU', 'brazil': 'BR', 'india': 'IN', 'mexico': 'MX',
      'south africa': 'ZA', 'turkey': 'TR', 'saudi arabia': 'SA',
      'united arab emirates': 'AE', 'malaysia': 'MY', 'thailand': 'TH',
      'indonesia': 'ID', 'philippines': 'PH', 'vietnam': 'VN',
      'argentina': 'AR', 'chile': 'CL', 'colombia': 'CO', 'egypt': 'EG',
      'israel': 'IL', 'poland': 'PL', 'czech republic': 'CZ', 'czechia': 'CZ',
      'hungary': 'HU', 'romania': 'RO',
      'macau sar': 'MO', 'macau': 'MO', 'macao': 'MO',
    };
    return map[loc] || location.substring(0, 2).toUpperCase();
  };

  const handleAddManual = async () => {
    const name = window.prompt("Enter university name to manually add to Rankings (It will be assigned an N.A. rank):");
    if (name && name.trim()) {
      const newUni = {
        university: name.trim(),
        rank_latest: null,
        rank_prev: null,
        location: '',
        subject: activeTab === 'subject' ? subjectFilter : ''
      };
      
      const res = await updateQSData([newUni]);
      if (res.success) {
        setImportMsg({ type: 'success', text: `Added ${name.trim()} to cloud rankings.` });
      } else {
        setImportMsg({ type: 'error', text: `Failed to add university: ${res.error}` });
      }
      setTimeout(() => setImportMsg(null), 5000);
    }
  };

  const handleBackupQSList = () => {
    const sortByRank = (rows) =>
      [...rows].sort((a, b) => {
        const aRank = a.rank_latest;
        const bRank = b.rank_latest;
        if (aRank === null && bRank === null) return 0;
        if (aRank === null) return 1;
        if (bRank === null) return -1;
        return aRank - bRank;
      });

    const toRows = (rows) =>
      rows.map((r) => ({
        University: r.university || '',
        Latest_Rank: r.rank_latest ?? '',
        Previous_Rank: r.rank_prev ?? '',
        Location: r.location || '',
        Subject: r.subject || ''
      }));

    const wb = XLSX.utils.book_new();
    const overallSheet = XLSX.utils.json_to_sheet(toRows(sortByRank(overallData)));
    XLSX.utils.book_append_sheet(wb, overallSheet, 'QS_Overall');

    const subjectSheet = XLSX.utils.json_to_sheet(toRows(sortByRank(subjectData)));
    XLSX.utils.book_append_sheet(wb, subjectSheet, 'QS_By_Subject');

    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `QS_Rankings_Backup_${today}.xlsx`);
  };

  const ChangeIndicator = ({ change }) => {
    if (change === null || change === undefined) return <span className="text-gray-300">—</span>;
    if (change > 0) return (
      <span className="flex items-center gap-1 text-emerald-600 font-bold">
        <TrendingUp size={14} strokeWidth={3} /> +{change}
      </span>
    );
    if (change < 0) return (
      <span className="flex items-center gap-1 text-red-500 font-bold">
        <TrendingDown size={14} strokeWidth={3} /> {change}
      </span>
    );
    return (
      <span className="flex items-center gap-1 text-gray-400 font-bold">
        <Minus size={14} strokeWidth={3} /> 0
      </span>
    );
  };

  // Derive year labels from data
  const yearLatestLabel = currentData[0]?.yearLatest || 'Latest';
  const yearPrevLabel = currentData[0]?.yearPrev || 'Previous';

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-0">
      {/* 1. STATIONARY CONTROL BAR (Tabs/Search) */}
      <div className="shrink-0 z-40 bg-slateBlue-100 pb-4">
        {/* 1. Control Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-t-super border border-gray-100 border-b-0 gap-4 shadow-sm">
          {/* Left: Tab Buttons + Search */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Tab Toggle */}
            <div className="flex bg-slateBlue-100/50 p-1 rounded-super">
              <button
                onClick={() => { setActiveTab('overall'); setSubjectFilter('All'); }}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-super transition-all ${
                  activeTab === 'overall'
                    ? 'bg-white text-aura-teal shadow-sm'
                    : 'text-gray-500 hover:text-slateBlue-800'
                }`}
              >
                <Globe size={14} /> Overall
              </button>
              <button
                onClick={() => setActiveTab('subject')}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-super transition-all ${
                  activeTab === 'subject'
                    ? 'bg-white text-aura-teal shadow-sm'
                    : 'text-gray-500 hover:text-slateBlue-800'
                }`}
              >
                <BookOpen size={14} /> By Subject
              </button>
            </div>

            {/* Subject Filter (only visible on subject tab) */}
            {activeTab === 'subject' && subjects.length > 1 && (
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="appearance-none px-4 py-2 text-xs font-bold text-slateBlue-800 bg-slateBlue-100/50 rounded-super hover:bg-slateBlue-100 transition-all border border-transparent focus:border-aura-teal outline-none focus:ring-2 focus:ring-aura-teal/20 cursor-pointer max-w-[200px]"
              >
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}

            {/* Search */}
            <div className="relative w-full sm:w-80 group">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-aura-teal transition-colors" />
              <input
                type="text"
                placeholder="Search university, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-24 py-2 w-full text-sm border border-gray-200 rounded-super focus:outline-none focus:ring-2 focus:ring-aura-teal/20 bg-slateBlue-100/50 transition-all font-medium"
              />
              <div className="absolute right-3 top-2 flex items-center gap-2">
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="p-1 text-gray-400 hover:text-aura-teal transition-colors"
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                )}
                <span className="text-[10px] font-black text-aura-teal bg-white border border-aura-teal/20 px-2 py-0.5 rounded shadow-sm whitespace-nowrap uppercase tracking-widest">
                  {filteredData.length} results
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {role === 'ADMIN' && (
              <>
                <button
                  onClick={handleBackupQSList}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slateBlue-800 bg-white border border-gray-200 rounded-super hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                >
                  <Download size={14} /> BACKUP QS LIST
                </button>
                <button 
                  onClick={handleAddManual}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slateBlue-800 bg-white border border-gray-200 rounded-super hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                >
                  <Plus size={14} /> ADD UNIVERSITY
                </button>
                <label className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-aura-teal rounded-super hover:opacity-90 transition-all shadow-sm cursor-pointer active:scale-95">
                  <Upload size={14} /> UPLOAD QS DATA
                  <input type="file" accept=".xlsx, .xls" onChange={handleImport} className="hidden" />
                </label>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Import Toast */}
      {importMsg && (
        <div className={`flex items-center justify-between px-4 py-3 rounded-super text-sm font-bold shadow-sm border ${
          importMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
          importMsg.type === 'warn' ? 'bg-amber-50 text-amber-700 border-amber-200' :
          'bg-red-50 text-red-700 border-red-200'
        }`}>
          <span>{importMsg.text}</span>
          <button onClick={() => setImportMsg(null)} className="ml-4 hover:opacity-70 transition-opacity">
            <X size={14} />
          </button>
        </div>
      )}

      {/* 2. TABLE CONTENT: Grid with Sticky Header */}
      <div className="flex-1 min-h-0 bg-white rounded-super shadow-sm border border-gray-100 overflow-hidden w-full relative flex flex-col">
        <div className="flex-1 overflow-auto relative">
          <table className="min-w-full text-left text-xs text-slateBlue-800 border-collapse table-fixed">
            <thead className="sticky top-0 z-30 bg-slateBlue-800 text-white">
              <tr className="uppercase font-black text-[9px] tracking-widest h-[40px]">
                <th className="px-3 py-2 w-16 text-center">{yearLatestLabel}</th>
                <th className="px-3 py-2 w-16 text-center">{yearPrevLabel}</th>
                <th className="px-3 py-2 w-20 text-center">Change</th>
                {activeTab === 'subject' && <th className="px-3 py-2 w-40">Subject</th>}
                <th className="px-3 py-2 w-96">University</th>
                <th className="px-3 py-2 w-16 text-center">Abbr</th>
                <th className="px-3 py-2">Location</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((row, idx) => (
                  <tr key={row.id} className={`border-b border-gray-50 hover:bg-slate-100 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`font-black text-sm ${
                        row.rank_latest !== null && row.rank_latest <= 10 ? 'text-aura-teal' :
                        row.rank_latest !== null && row.rank_latest <= 50 ? 'text-serene-indigo' :
                        row.rank_latest !== null && row.rank_latest <= 100 ? 'text-slateBlue-800' :
                        'text-gray-500'
                      }`}>
                        {row.rank_latest !== null ? row.rank_latest : 'N.A.'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center text-gray-400 font-bold">
                      {row.rank_prev !== null ? row.rank_prev : 'N.A.'}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <ChangeIndicator change={row.change} />
                    </td>
                    {activeTab === 'subject' && (
                      <td className="px-3 py-2.5 text-gray-500 font-semibold">{row.subject}</td>
                    )}
                    <td className="px-3 py-2.5 font-bold text-slateBlue-800 truncate max-w-[384px]" title={row.university}>{row.university}</td>
                    <td className="px-3 py-2.5 text-center font-black text-gray-500">{toAbbr(row.location)}</td>
                    <td className="px-3 py-2.5 text-gray-500 font-semibold">{row.location}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={activeTab === 'subject' ? 8 : 7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Globe size={40} className="text-gray-200" />
                      <div className="text-gray-400 font-bold text-sm">
                        {currentData.length === 0
                          ? `No ${activeTab} QS ranking data loaded yet.`
                          : 'No results match your search.'}
                      </div>
                      {currentData.length === 0 && (
                        <p className="text-gray-400 text-xs max-w-md leading-relaxed">
                          Upload your QS World Rankings Excel file using the button above.
                          The system will auto-detect the ranking columns, university names, and locations.
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Stats */}
        {filteredData.length > 0 && (
          <div className="px-4 py-3 bg-slateBlue-100/20 border-t border-gray-100 flex items-center justify-between text-[11px] font-bold text-gray-400">
            <span>Showing {filteredData.length} of {currentData.length} universities</span>
            <span>
              Top 10: {currentData.filter(r => r.rank_latest && r.rank_latest <= 10).length} •
              Top 50: {currentData.filter(r => r.rank_latest && r.rank_latest <= 50).length} •
              Top 100: {currentData.filter(r => r.rank_latest && r.rank_latest <= 100).length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default QSRankings;
