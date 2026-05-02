import React, { useState, useMemo, useRef } from 'react';
import { Search, Upload, Download, TrendingUp, TrendingDown, Minus, X, Globe, BookOpen, Plus, Edit2, Save, RotateCcw } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { useQS } from '../context/QSContext';
import { useAuth } from '../context/AuthContext';
import { useVirtualScroll } from '../utils/useVirtual';

const QSRankings = () => {
  const { overallData, updateQSData, subjectData } = useQS();
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState('overall'); // 'overall' | 'subject'
  const [searchTerm, setSearchTerm] = useState('');
  const [importMsg, setImportMsg] = useState(null);
  const [subjectFilter, setSubjectFilter] = useState('All');

  // Inline editing state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ university: '', rank_latest: '' });

  const containerRef = useRef(null);
  const ITEM_HEIGHT = 41;

  const currentData = activeTab === 'overall' ? overallData : subjectData;

  const subjects = useMemo(() => {
    const s = new Set(subjectData.map(r => r.subject).filter(Boolean));
    return ['All', ...Array.from(s).sort()];
  }, [subjectData]);

  const filteredData = useMemo(() => {
    let result = currentData;
    if (activeTab === 'subject' && subjectFilter !== 'All') {
      result = result.filter(r => r.subject === subjectFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r =>
        r.university.toLowerCase().includes(term) ||
        r.location.toLowerCase().includes(term) ||
        String(r.rank_latest).includes(term)
      );
    }
    return [...result].sort((a, b) => {
      const aRank = a.rank_latest;
      const bRank = b.rank_latest;
      if (aRank === null && bRank === null) return 0;
      if (aRank === null) return 1;
      if (bRank === null) return -1;
      return aRank - bRank;
    });
  }, [currentData, searchTerm, activeTab, subjectFilter]);

  const { startIndex, endIndex, paddingTop, paddingBottom } = useVirtualScroll({
    containerRef,
    itemHeight: ITEM_HEIGHT,
    itemCount: filteredData.length,
    overscan: 15
  });

  const visibleData = filteredData.slice(startIndex, endIndex);

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditForm({ university: row.university, rank_latest: row.rank_latest ?? '' });
  };

  const handleSaveEdit = async (row) => {
    const updated = {
      ...row,
      university: editForm.university.trim(),
      rank_latest: editForm.rank_latest === '' ? null : parseInt(editForm.rank_latest)
    };
    
    const res = await updateQSData([updated]);
    if (res.success) {
      setEditingId(null);
      setImportMsg({ type: 'success', text: 'Updated university details successfully.' });
    } else {
      setImportMsg({ type: 'error', text: `Failed to update: ${res.error}` });
    }
    setTimeout(() => setImportMsg(null), 3000);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const allRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        if (allRows.length < 3) {
          setImportMsg({ type: 'warn', text: 'The file does not contain enough rows.' });
          return;
        }

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

        if (headerRowIdx < 0) {
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

        if (headerRowIdx < 0) headerRowIdx = 1;

        const headerRow = allRows[headerRowIdx];
        const yearCols = [];

        for (let c = 0; c < headerRow.length; c++) {
          const cell = String(headerRow[c] || '').trim();
          if (/^20\d{2}$/.test(cell)) {
            yearCols.push({ col: c, year: parseInt(cell) });
          }
        }

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

        if (rankLatestCol < 0) {
          rankLatestCol = 1;
          rankPrevCol = 2;
          const cellB = String(headerRow[1] || '').trim();
          const cellC = String(headerRow[2] || '').trim();
          if (/20\d{2}/.test(cellB)) latestYearLabel = cellB.match(/20\d{2}/)[0];
          if (/20\d{2}/.test(cellC)) prevYearLabel = cellC.match(/20\d{2}/)[0];
        }

        if (institutionCol < 0) institutionCol = 3;

        const dataStartRow = headerRowIdx + 1;
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
            change = rankPrev - rankLatest;
          }

          parsed.push({
            rank_latest: rankLatest,
            rank_prev: rankPrev,
            change,
            university,
            location: locationCol >= 0 ? String(row[locationCol] || '').trim() : '',
            subject: subjectCol >= 0 ? String(row[subjectCol] || '').trim() : ''
          });
        }

        if (parsed.length === 0) {
          setImportMsg({ type: 'warn', text: 'No valid ranking entries found. Check the Excel layout.' });
          return;
        }

        setImportMsg({ type: 'info', text: 'Saving data to cloud...' });
        
        updateQSData(parsed).then(res => {
          if (res.success) {
            setImportMsg({ type: 'success', text: `Successfully synced ${parsed.length} entries to cloud rankings.` });
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
    if (s.includes('-')) {
      const parts = s.split('-').map(Number);
      return Math.round((parts[0] + parts[1]) / 2);
    }
    const n = parseInt(s);
    return isNaN(n) ? null : n;
  };

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
    const name = window.prompt("Enter university name to manually add:");
    if (name && name.trim()) {
      const newUni = {
        university: name.trim(),
        rank_latest: null,
        rank_prev: null,
        location: '',
        subject: activeTab === 'subject' ? subjectFilter : ''
      };
      const res = await updateQSData([newUni]);
      if (res.success) setImportMsg({ type: 'success', text: `Added ${name.trim()}.` });
      else setImportMsg({ type: 'error', text: `Error: ${res.error}` });
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
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(toRows(sortByRank(overallData))), 'QS_Overall');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(toRows(sortByRank(subjectData))), 'QS_By_Subject');
    XLSX.writeFile(wb, `QS_Rankings_Backup_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const ChangeIndicator = ({ change }) => {
    if (change === null || change === undefined) return <span className="text-gray-300">—</span>;
    if (change > 0) return <span className="flex items-center gap-1 text-emerald-600 font-bold"><TrendingUp size={14} strokeWidth={3} /> +{change}</span>;
    if (change < 0) return <span className="flex items-center gap-1 text-red-500 font-bold"><TrendingDown size={14} strokeWidth={3} /> {change}</span>;
    return <span className="flex items-center gap-1 text-gray-400 font-bold"><Minus size={14} strokeWidth={3} /> 0</span>;
  };

  const yearLatestLabel = currentData[0]?.yearLatest || 'Latest';
  const yearPrevLabel = currentData[0]?.yearPrev || 'Previous';

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-0">
      <div className="shrink-0 z-40 bg-slateBlue-100 pb-4">
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-t-super border border-gray-100 border-b-0 gap-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="flex bg-slateBlue-100/50 p-1 rounded-super">
              <button onClick={() => { setActiveTab('overall'); setSubjectFilter('All'); }} className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-super transition-all ${activeTab === 'overall' ? 'bg-white text-aura-teal shadow-sm' : 'text-gray-500 hover:text-slateBlue-800'}`}><Globe size={14} /> Overall</button>
              <button onClick={() => setActiveTab('subject')} className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-super transition-all ${activeTab === 'subject' ? 'bg-white text-aura-teal shadow-sm' : 'text-gray-500 hover:text-slateBlue-800'}`}><BookOpen size={14} /> By Subject</button>
            </div>
            {activeTab === 'subject' && subjects.length > 1 && (
              <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="appearance-none px-4 py-2 text-xs font-bold text-slateBlue-800 bg-slateBlue-100/50 rounded-super border border-transparent focus:border-aura-teal outline-none cursor-pointer max-w-[200px]">
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            <div className="relative w-full sm:w-80 group">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-aura-teal" />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-24 py-2 w-full text-sm border border-gray-200 rounded-super focus:ring-2 focus:ring-aura-teal/20 bg-slateBlue-100/50 transition-all font-medium" />
              <div className="absolute right-3 top-2 flex items-center gap-2">
                {searchTerm && <button onClick={() => setSearchTerm('')} className="p-1 text-gray-400 hover:text-aura-teal"><X size={14} strokeWidth={3} /></button>}
                <span className="text-[10px] font-black text-aura-teal bg-white border border-aura-teal/20 px-2 py-0.5 rounded uppercase">{filteredData.length} results</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {role === 'ADMIN' && (
              <>
                <button onClick={handleBackupQSList} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slateBlue-800 bg-white border border-gray-200 rounded-super hover:bg-gray-50 shadow-sm"><Download size={14} /> BACKUP</button>
                <button onClick={handleAddManual} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slateBlue-800 bg-white border border-gray-200 rounded-super hover:bg-gray-50 shadow-sm"><Plus size={14} /> ADD</button>
                <label className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-aura-teal rounded-super hover:opacity-90 shadow-sm cursor-pointer"><Upload size={14} /> UPLOAD<input type="file" accept=".xlsx, .xls" onChange={handleImport} className="hidden" /></label>
              </>
            )}
          </div>
        </div>
      </div>

      {importMsg && (
        <div className={`flex items-center justify-between px-4 py-3 rounded-super text-sm font-bold shadow-sm border ${importMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : importMsg.type === 'warn' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          <span>{importMsg.text}</span>
          <button onClick={() => setImportMsg(null)} className="ml-4 hover:opacity-70"><X size={14} /></button>
        </div>
      )}

      <div className="flex-1 min-h-0 bg-white rounded-super shadow-sm border border-gray-100 overflow-hidden w-full relative flex flex-col">
        <div ref={containerRef} className="flex-1 overflow-auto relative">
          <table className="min-w-full text-left text-xs text-slateBlue-800 border-collapse table-fixed">
            <thead className="sticky top-0 z-30 bg-slateBlue-800 text-white">
              <tr className="uppercase font-black text-[10px] tracking-widest h-[40px]">
                <th className="px-3 py-2 w-16 text-center">{yearLatestLabel}</th>
                <th className="px-3 py-2 w-16 text-center">{yearPrevLabel}</th>
                <th className="px-3 py-2 w-20 text-center">Change</th>
                {activeTab === 'subject' && <th className="px-3 py-2 w-40">Subject</th>}
                <th className="px-3 py-2 w-96">University</th>
                <th className="px-3 py-2 w-16 text-center">Abbr</th>
                <th className="px-3 py-2">Location</th>
                {role === 'ADMIN' && <th className="px-3 py-2 w-24 text-center sticky right-0 bg-slateBlue-800 z-40">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paddingTop > 0 && <tr style={{ height: `${paddingTop}px` }}><td colSpan={activeTab === 'subject' ? 9 : 8} /></tr>}
              {visibleData.length > 0 ? (
                visibleData.map((row, idx) => {
                  const isEditing = editingId === row.id;
                  return (
                    <tr key={row.id} className={`border-b border-gray-50 hover:bg-slate-100 transition-colors h-[41px] ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                      <td className="px-3 py-2 text-center">
                        {isEditing ? (
                          <input type="text" value={editForm.rank_latest} onChange={e => setEditForm({...editForm, rank_latest: e.target.value})} className="w-12 px-1 py-0.5 border border-aura-teal rounded focus:outline-none text-center font-black" />
                        ) : (
                          <span className={`font-black text-sm ${row.rank_latest && row.rank_latest <= 10 ? 'text-aura-teal' : row.rank_latest && row.rank_latest <= 50 ? 'text-serene-indigo' : 'text-slateBlue-800'}`}>
                            {row.rank_latest ?? 'N.A.'}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center text-gray-400 font-bold">{row.rank_prev ?? 'N.A.'}</td>
                      <td className="px-3 py-2 text-center"><ChangeIndicator change={row.change} /></td>
                      {activeTab === 'subject' && <td className="px-3 py-2 text-gray-500 font-semibold truncate">{row.subject}</td>}
                      <td className="px-3 py-2 font-bold text-slateBlue-800 truncate" title={row.university}>
                        {isEditing ? (
                          <input type="text" value={editForm.university} onChange={e => setEditForm({...editForm, university: e.target.value})} className="w-full px-2 py-0.5 border border-aura-teal rounded focus:outline-none" />
                        ) : (
                          row.university
                        )}
                      </td>
                      <td className="px-3 py-2 text-center font-black text-gray-500">{toAbbr(row.location)}</td>
                      <td className="px-3 py-2 text-gray-500 font-semibold truncate">{row.location}</td>
                      {role === 'ADMIN' && (
                        <td className={`px-3 py-2 text-center sticky right-0 z-10 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                          {isEditing ? (
                            <div className="flex justify-center gap-1">
                              <button onClick={() => handleSaveEdit(row)} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded" title="Save"><Save size={14} /></button>
                              <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded" title="Cancel"><RotateCcw size={14} /></button>
                            </div>
                          ) : (
                            <button onClick={() => startEdit(row)} className="p-1 text-slateBlue-400 hover:text-aura-teal hover:bg-aura-teal/5 rounded transition-all" title="Edit"><Edit2 size={14} /></button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={activeTab === 'subject' ? 9 : 8} className="px-4 py-12 text-center text-gray-400 font-bold">No results found.</td></tr>
              )}
              {paddingBottom > 0 && <tr style={{ height: `${paddingBottom}px` }}><td colSpan={activeTab === 'subject' ? 9 : 8} /></tr>}
            </tbody>
          </table>
        </div>
        {filteredData.length > 0 && (
          <div className="px-4 py-3 bg-slateBlue-100/20 border-t border-gray-100 flex items-center justify-between text-[11px] font-bold text-gray-400">
            <span>Showing {filteredData.length} of {currentData.length} universities</span>
            <span>Top 10: {currentData.filter(r => r.rank_latest && r.rank_latest <= 10).length} • Top 50: {currentData.filter(r => r.rank_latest && r.rank_latest <= 50).length} • Top 100: {currentData.filter(r => r.rank_latest && r.rank_latest <= 100).length}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default QSRankings;
