import React, { useMemo, useRef, useState } from 'react';
import { X, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx-js-style';
import { useQS } from '../context/QSContext';
import { useStudents } from '../context/StudentContext';
import { useAuth } from '../context/AuthContext';
import * as db from '../lib/supabaseService';
import { useVirtualScroll } from '../utils/useVirtual';
import ResolveUniversitiesModal from '../components/modals/ResolveUniversitiesModal';
import ApplicationEntryModal from '../components/modals/ApplicationEntryModal';
import UAppToolbar from '../components/uapp/UAppToolbar';
import UAppRow from '../components/uapp/UAppRow';
import { ImportConflictModal, TemplateYearModal } from '../components/uapp/UAppModals';
import { useUAppImport } from '../hooks/useUAppImport';
import { REVERSE_LOCATION_MAP } from '../constants/uapp';

const UAppGrid = () => {
  const { role } = useAuth();
  const { findUniversityByName, addCustomMapping } = useQS();
  const {
    students: sharedStudents,
    uappData,
    loading,
    updateApplication,
    addApplications,
    upsertApplications,
    upsertStudents,
    deleteApplication,
    clearAllApplications,
    refreshData
  } = useStudents();

  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [selectedStudentForEntry, setSelectedStudentForEntry] = useState(null);

  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [selectedStudentForApps, setSelectedStudentForApps] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('All');
  const [filterFinalOnly, setFilterFinalOnly] = useState(false);
  const [importMsg, setImportMsg] = useState(null);

  const containerRef = useRef(null);
  const canEditApplications = role === 'ADMIN';

  const data = useMemo(() => {
    const appsByStudent = new Map();
    uappData.forEach((app) => {
      if (!app.student_id) return;
      if (!appsByStudent.has(app.student_id)) appsByStudent.set(app.student_id, []);
      appsByStudent.get(app.student_id).push(app);
    });

    return sharedStudents.map((s) => {
      const apps = appsByStudent.get(s.id) || [];
      // Sort: Final Destination -> Location -> University Name -> Offer
      apps.sort((a, b) => {
        if (a.is_final !== b.is_final) return a.is_final ? -1 : 1;
        const locA = a.country || '';
        const locB = b.country || '';
        if (locA !== locB) return locA.localeCompare(locB);
        const uniA = a.university || '';
        const uniB = b.university || '';
        if (uniA !== uniB) return uniA.localeCompare(uniB);
        const offerA = a.has_offer || a.status === 'OFFER';
        const offerB = b.has_offer || b.status === 'OFFER';
        if (offerA !== offerB) return offerA ? -1 : 1;
        return Number(a.id) - Number(b.id); // Fallback to ID for complete stability
      });
      const finalApp = apps.find((a) => a.is_final === true);
      return {
        id: s.id,
        student_num: s.student_num,
        grad_year: String(s.grad_year || ''),
        person: {
          name_en: s.name_en || s.person?.name_en || '',
          name_zh: s.name_zh || s.person?.name_zh || '',
          other_name: s.other_name || s.person?.other_name || ''
        },
        final_dest_uni: finalApp?.university || '',
        final_dest_prog: finalApp?.program || '',
        final_dest_cond: finalApp?.condition || '',
        last_update: s.updated_at || '',
        as_grades: s.ias_score || '',
        applications: apps
      };
    });
  }, [sharedStudents, uappData]);

  const gradYears = useMemo(() => {
    const years = new Set(data.map((s) => s.grad_year).filter((y) => y && y !== '0'));
    return ['All', ...Array.from(years).sort().reverse()];
  }, [data]);

  const filteredData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return data
      .filter((s) => {
        if (yearFilter !== 'All' && s.grad_year !== yearFilter) return false;
        if (filterFinalOnly && !s.final_dest_uni) return false;
        if (!term) return true;
        const inName = `${s.person.name_en} ${s.person.name_zh}`.toLowerCase().includes(term);
        const inApps = s.applications.some((a) => {
          if (filterFinalOnly && !a.is_final) return false;
          const u = String(a.university || '').toLowerCase();
          const p = String(a.program || '').toLowerCase();
          return u.includes(term) || p.includes(term);
        });
        return inName || inApps;
      })
      .sort((a, b) => {
        if (a.grad_year !== b.grad_year) return Number(b.grad_year) - Number(a.grad_year);
        return (a.person.name_en || '').localeCompare(b.person.name_en || '');
      });
  }, [data, searchTerm, yearFilter, filterFinalOnly]);

  const ITEM_HEIGHT = 56;
  const { startIndex, endIndex, paddingTop, paddingBottom } = useVirtualScroll({
    containerRef,
    itemHeight: ITEM_HEIGHT,
    itemCount: filteredData.length,
    overscan: 10
  });

  const visibleData = filteredData.slice(startIndex, endIndex);

  const showToast = (type, text) => {
    setImportMsg({ type, text });
    setTimeout(() => setImportMsg(null), 4000);
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to delete ALL application data? This action cannot be undone.')) {
      const result = await clearAllApplications();
      if (result?.success) {
        showToast('success', 'All application data has been cleared.');
        await refreshData();
      } else {
        showToast('error', `Clear data failed: ${result?.error || 'Unknown error'}`);
      }
    }
  };

  const {
    exportModal, setExportModal,
    resolvingUnies,
    pendingImport,
    conflictIndex,
    isMergingAllConflicts,
    importInputRef,
    executeExport,
    handleImportXL,
    handleResolveOneRow,
    handleFinishResolve,
    handleCloseResolveModal,
    advanceConflict,
    handleConflictMerge,
    handleConflictImportAll,
    handleConflictMergeAll
  } = useUAppImport({
    data, sharedStudents, uappData, findUniversityByName, addCustomMapping, upsertStudents, upsertApplications, addApplications, refreshData, showToast
  });

  const handleSaveEntry = async (entryOrEntries, deletedIds = []) => {
    if (!canEditApplications) return false;
    const entries = Array.isArray(entryOrEntries) ? entryOrEntries : [entryOrEntries];
    
    try {
      let finalEntry = entries.find(e => e.is_final);
      
      // If setting a final entry, clear existing finals
      if (finalEntry) {
        const student_id = finalEntry.student_id;
        const apps = uappData.filter((a) => a.student_id === student_id && !entries.some(e => e.id === a.id) && a.is_final && !deletedIds.includes(a.id));
        for (const app of apps) await updateApplication(student_id, app.id, { is_final: false });
      }

      // Handle Deletions sequentially to avoid potential database locks
      for (const id of deletedIds) {
        const appToDelete = uappData.find(a => a.id === id);
        if (appToDelete) {
           const result = await deleteApplication(appToDelete.student_id, id);
           if (!result.success) throw new Error(`Delete failed: ${result.error}`);

           if (appToDelete.is_final && !finalEntry) {
              await Promise.race([
                db.updateStudentById(appToDelete.student_id, { university_dest: null, program_dest: null, quali: null }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
              ]).catch(err => console.warn('Student update timeout:', err));
           }
        }
      }

      const toAdd = entries.filter(e => !e.id);
      
      // OPTIMIZATION: Only update rows that have actually changed
      const toUpdate = entries.filter(e => {
        if (!e.id) return false;
        const original = uappData.find(a => a.id === e.id);
        if (!original) return true;
        
        // Match the initialization logic in ApplicationEntryModal exactly
        const originalStatus = String(original.status || '').toUpperCase();
        const originalHasOffer = !!original.has_offer || originalStatus === 'OFFER';
        
        // Modal sends has_offer as boolean and status as 'OFFER'/'PENDING'
        const hasOfferChanged = originalHasOffer !== !!e.has_offer;

        const hasChanged = 
          (original.country || '') !== (REVERSE_LOCATION_MAP[e.location] || e.location || '') ||
          (original.university || '') !== (e.university || '') ||
          (original.program || '') !== (e.program || '') ||
          (original.quali || '') !== (e.quali || '') ||
          (original.condition || '') !== (e.condition || '') ||
          (original.decision || '') !== (e.decision || '') ||
          !!original.is_final !== !!e.is_final ||
          hasOfferChanged;
          
        return hasChanged;
      });

      // Handle Updates concurrently
      const updatePromises = toUpdate.map(async (entry) => {
        const { id, student_id, ...updates } = entry;
        const result = await updateApplication(student_id, id, updates);
        if (!result.success) throw new Error(`Update failed: ${result.error}`);
        return result;
      });
      await Promise.all(updatePromises);

      if (toAdd.length > 0) {
        const result = await addApplications(toAdd);
        if (!result.success) throw new Error(`Add failed: ${result.error}`);
      }

      // Fetch data with a timeout in case the select query hangs
      await Promise.race([
        refreshData(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
      ]).catch(err => console.warn('Refresh data timeout:', err));
      
      showToast('success', entries.length > 1 || deletedIds.length > 0 ? 'Applications saved.' : (entries[0] && entries[0].id ? 'Application updated.' : 'Application added.'));
      return true;
    } catch (err) { 
      console.error('[SAVE_ENTRY] Error:', err); 
      showToast('error', err.message || 'Save failed.'); 
      return false; 
    }
  };

  return (
    <div className="space-y-4">
      <UAppToolbar
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        yearFilter={yearFilter} setYearFilter={setYearFilter}
        gradYears={gradYears} filterFinalOnly={filterFinalOnly}
        setFilterFinalOnly={setFilterFinalOnly}
        onImportClick={() => importInputRef.current?.click()}
        onExportClick={() => setExportModal({ isOpen: true, type: 'FULL' })}
        onAddClick={() => { setEditingEntry(null); setSelectedStudentForEntry(null); setIsEntryModalOpen(true); }}
        onClearClick={handleClearAll}
        canEdit={canEditApplications}
        resultsCount={filteredData.length}
      />
      <input ref={importInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImportXL} className="hidden" />

      {importMsg && (
        <div className={`fixed top-6 right-6 z-[1000] flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold shadow-2xl border ${
          importMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 
          importMsg.type === 'warn' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <span>{importMsg.text}</span>
          <button onClick={() => setImportMsg(null)} className="hover:opacity-70 transition-opacity"><X size={16} /></button>
        </div>
      )}

      <ImportConflictModal
        conflict={pendingImport?.conflicts[conflictIndex]}
        index={conflictIndex}
        total={pendingImport?.conflicts.length}
        isMergingAll={isMergingAllConflicts}
        onSkip={advanceConflict}
        onMerge={handleConflictMerge}
        onMergeAll={handleConflictMergeAll}
        onImportAll={handleConflictImportAll}
      />

      <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden w-full">
        <div 
          ref={containerRef}
          className="overflow-auto max-h-[70vh]"
        >
          <table className="w-full text-left text-xs text-slateBlue-800 border-collapse">
            <thead>
              <tr className="bg-slateBlue-800 text-white uppercase font-black text-[10px] tracking-widest sticky top-0 z-30 shadow-sm">
                <th className="px-3 py-2.5 w-10 text-center">#</th>
                <th className="px-3 py-2.5 w-20 text-center">Year</th>
                <th className="px-3 py-2.5 w-28">Student ID</th>
                <th className="px-3 py-2.5 w-48">Name</th>
                <th className="px-2 py-2.5 w-12 text-center">QS</th>
                <th className="px-3 py-2.5 w-64">Final Uni</th>
                <th className="px-3 py-2.5 w-64">Final Program</th>
                <th className="px-3 py-2.5 w-20 text-center">Stats</th>
                <th className="px-3 py-2.5 w-16 text-center">Act</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paddingTop > 0 && <tr style={{ height: `${paddingTop}px` }} aria-hidden="true"><td colSpan="9" /></tr>}
              {loading ? (
                <tr><td colSpan="9" className="px-4 py-16 text-center text-gray-400 font-bold">Loading applications...</td></tr>
              ) : visibleData.length > 0 ? (
                visibleData.map((student, i) => (
                  <UAppRow
                    key={student.id || (startIndex + i)} 
                    student={student} 
                    index={startIndex + i}
                    onViewApplications={(s) => {
                      setSelectedStudentForApps(s);
                      setIsAppModalOpen(true);
                    }}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-4 py-24 text-center">
                    <div className="flex flex-col items-center text-gray-300">
                      <FileSpreadsheet size={56} className="mb-4 opacity-20" />
                      <p className="text-lg font-bold tracking-tight">No application records found.</p>
                    </div>
                  </td>
                </tr>
              )}
              {paddingBottom > 0 && <tr style={{ height: `${paddingBottom}px` }} aria-hidden="true"><td colSpan="9" /></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <ApplicationEntryModal
        isOpen={isEntryModalOpen} onClose={() => setIsEntryModalOpen(false)}
        onSave={handleSaveEntry} initialStudent={selectedStudentForEntry} initialApplications={editingEntry ? [editingEntry] : null}
      />

      {exportModal.isOpen && (
        <TemplateYearModal
          type={exportModal.type} onClose={() => setExportModal({ isOpen: false, type: null })}
          onConfirm={(year) => executeExport(exportModal.type, year)} availableYears={gradYears}
        />
      )}

      {isAppModalOpen && selectedStudentForApps && (
        <ApplicationEntryModal
          isOpen={true}
          onClose={() => { setIsAppModalOpen(false); setSelectedStudentForApps(null); }}
          onSave={async (entries, deletedIds) => {
             const success = await handleSaveEntry(entries, deletedIds);
             if (success) {
               setIsAppModalOpen(false); 
               setSelectedStudentForApps(null);
             }
             return success;
          }}
          initialStudent={selectedStudentForApps}
          initialApplications={selectedStudentForApps.applications}
        />
      )}

      <ResolveUniversitiesModal
        isOpen={resolvingUnies.length > 0}
        onClose={handleCloseResolveModal}
        unmappedNames={resolvingUnies}
        onResolveRow={handleResolveOneRow}
        onFinish={handleFinishResolve}
      />
    </div>
  );
};

export default UAppGrid;
