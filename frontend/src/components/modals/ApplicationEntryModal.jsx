import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Search, Save, MapPin, GraduationCap, BookOpen, AlertTriangle, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQS } from '../../context/QSContext';
import { useStudents } from '../../context/StudentContext';
import { LOCATION_MAP, REVERSE_LOCATION_MAP, normalizeCountry } from '../../constants/uapp';

const QUALIFICATION_SUGGESTIONS = ['BSc', 'PhD', 'BBA', 'LLB', 'BA', 'BEng', 'MBChB', 'MSc', 'MA'];

const ApplicationEntryRow = ({
  entry,
  index,
  onChange,
  onRemove,
  allLocations,
  overallData,
  findUniversityByName,
  isEdit,
  canRemove
}) => {
  const [uniSearch, setUniSearch] = useState(entry.university || '');
  const [showUniDropdown, setShowUniDropdown] = useState(false);
  const [uniWarning, setUniWarning] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (entry.university !== uniSearch) {
      setUniSearch(entry.university || '');
    }
  }, [entry.university]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUniDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredUniversities = useMemo(() => {
    if (!entry.location) return [];
    const normalizedEntryLoc = normalizeCountry(entry.location);
    let filtered = overallData.filter(u => normalizeCountry(u.location) === normalizedEntryLoc);
    if (uniSearch) {
      const term = uniSearch.toLowerCase();
      filtered = filtered.filter(u => u.university.toLowerCase().includes(term));
    }
    return filtered.slice(0, 100);
  }, [entry.location, uniSearch, overallData]);

  useEffect(() => {
    if (entry.university && !uniWarning) {
      const match = findUniversityByName(entry.university);
      if (!match) setUniWarning(true);
      else setUniWarning(false);
    }
  }, [entry.university, findUniversityByName]);

  const cellClasses = `w-full min-h-[54px] px-2 py-2 text-[13px] border border-gray-200 focus:ring-1 focus:ring-aura-teal/50 focus:border-aura-teal transition-all outline-none text-slateBlue-800 placeholder-gray-300 flex items-center relative z-10 ${entry.is_final ? 'bg-transparent' : 'bg-white'}`;
  const areaClasses = `w-full min-h-[54px] px-2 py-2 text-[13px] border border-gray-200 focus:ring-1 focus:ring-aura-teal/50 focus:border-aura-teal transition-all outline-none text-slateBlue-800 placeholder-gray-300 resize-y leading-tight overflow-auto relative z-10 ${entry.is_final ? 'bg-transparent' : 'bg-white'}`;

  return (
    <div className={`grid grid-cols-[50px_1fr_1fr_90px_80px_1fr_120px_60px_32px] gap-1 items-stretch group relative transition-colors duration-200 ${entry.is_final ? 'bg-aura-teal/10' : ''}`}>
      <select
        value={entry.location}
        onChange={(e) => {
          onChange(index, { ...entry, location: e.target.value, university: '' });
          setUniSearch('');
        }}
        className={`${cellClasses} appearance-none rounded-l-lg`}
      >
        <option value=""></option>
        {allLocations.map((loc, idx) => (
          <option key={idx} value={loc} disabled={loc === '------'}>
            {Object.keys(LOCATION_MAP).find(key => LOCATION_MAP[key] === loc) || loc}
          </option>
        ))}
      </select>

      <div className="relative" ref={dropdownRef}>
        <textarea
          rows={1}
          value={uniSearch}
          onChange={(e) => {
            setUniSearch(e.target.value);
            onChange(index, { ...entry, university: e.target.value });
            setShowUniDropdown(true);
            setUniWarning(false);
          }}
          onFocus={() => setShowUniDropdown(true)}
          placeholder={entry.location ? "University..." : ""}
          disabled={!entry.location}
          className={`${areaClasses} ${!entry.location && 'opacity-50'}`}
        />
        {showUniDropdown && (uniSearch || entry.location) && (
          <div className="absolute z-50 w-[250px] mt-1 -left-2 bg-white border border-gray-100 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
            {filteredUniversities.length > 0 ? (
              filteredUniversities.map((uni, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    onChange(index, { ...entry, university: uni.university });
                    setUniSearch(uni.university);
                    setShowUniDropdown(false);
                    setUniWarning(false);
                  }}
                  className="px-3 py-2 text-[12px] font-medium text-slateBlue-800 hover:bg-slateBlue-50 cursor-pointer border-b border-gray-50 last:border-0 truncate"
                >
                  {uni.university}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-xs text-gray-400 italic">No matches.</div>
            )}
          </div>
        )}
        {uniWarning && entry.university && (
           <p className="absolute -bottom-4 left-1 text-[9px] font-bold text-amber-600 flex items-center gap-0.5 whitespace-nowrap">
             <AlertTriangle size={8} /> Not in QS Rankings
           </p>
        )}
      </div>

      <textarea
        rows={1}
        value={entry.program}
        onChange={(e) => onChange(index, { ...entry, program: e.target.value })}
        className={areaClasses}
      />

      <div className="relative">
        <input
          type="text"
          list={`quali-sugg-${index}`}
          value={entry.qualification}
          onChange={(e) => onChange(index, { ...entry, qualification: e.target.value })}
          className={cellClasses}
        />
        <datalist id={`quali-sugg-${index}`}>
          {QUALIFICATION_SUGGESTIONS.map(s => <option key={s} value={s} />)}
        </datalist>
      </div>

      <select
        value={entry.has_offer ? 'Y' : 'N'}
        onChange={(e) => onChange(index, { ...entry, has_offer: e.target.value === 'Y' })}
        className={`${cellClasses} appearance-none`}
      >
        <option value="N">Pending</option>
        <option value="Y">Offer</option>
      </select>

      <div className="relative group/cond">
        <textarea
          rows={1}
          value={entry.condition}
          onChange={(e) => onChange(index, { ...entry, condition: e.target.value })}
          className={areaClasses}
        />
        {(entry.condition?.toLowerCase() === 'rej' || entry.condition?.toLowerCase() === 'wait') && (
          <div className="absolute z-30 bottom-full left-0 mb-1 bg-white border border-gray-100 rounded-lg shadow-xl py-1 animate-in slide-in-from-top-1 duration-200">
             <button
               onClick={() => onChange(index, { ...entry, condition: entry.condition.toLowerCase() === 'rej' ? 'Rejected' : 'Waitlist' })}
               className="w-full px-4 py-1.5 text-left text-[11px] font-bold text-aura-teal hover:bg-aura-teal/5 transition-colors"
             >
               Click to use: <span className="underline">{entry.condition.toLowerCase() === 'rej' ? 'Rejected' : 'Waitlist'}</span>
             </button>
          </div>
        )}
      </div>

      <select
        value={entry.decision}
        onChange={(e) => onChange(index, { ...entry, decision: e.target.value })}
        className={`${cellClasses} appearance-none`}
      >
        <option value=""></option>
        <option value="Firmly accept">Firmly accept</option>
        <option value="Insurance">Insurance</option>
        <option value="Declined">Declined</option>
        <option value="Withdrawn">Withdrawn</option>
      </select>

      <button
        onClick={() => onChange(index, { ...entry, is_final: !entry.is_final })}
        className={`h-9 w-full flex items-center justify-center transition-all border-y border-r border-gray-200 rounded-r-lg ${
          entry.is_final 
            ? 'bg-aura-teal text-white font-black' 
            : 'bg-white text-gray-300 hover:bg-gray-50'
        }`}
      >
        <div className={`w-2 h-2 rounded-full ${entry.is_final ? 'bg-white' : 'bg-gray-200'}`}></div>
      </button>

      <div className="flex items-center justify-center h-9 pl-1">
        {canRemove ? (
          <button 
            onClick={() => onRemove(index)}
            className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100"
            title="Remove Entry"
          >
            <Trash2 size={14} />
          </button>
        ) : <div className="w-6 h-6"></div>}
      </div>
    </div>
  );
};

const ApplicationEntryModal = ({ isOpen, onClose, onSave, initialStudent = null, initialApplications = null, onPrev, onNext }) => {
  const { students } = useStudents();
  const { overallData, findUniversityByName } = useQS();
  
  const [selectedStudent, setSelectedStudent] = useState(initialStudent);
  
  const createEmptyEntry = () => ({
    id: null,
    location: '',
    university: '',
    program: '',
    qualification: '',
    has_offer: false,
    condition: '',
    decision: '',
    is_final: false
  });

  const [entries, setEntries] = useState([createEmptyEntry()]);
  const [deletedIds, setDeletedIds] = useState([]);
  const isEdit = initialApplications && initialApplications.length > 0;

  useEffect(() => {
    let initialArr = [];
    if (initialApplications && initialApplications.length > 0) {
      initialArr = initialApplications.map(app => ({
        id: app.id,
        location: LOCATION_MAP[app.country] || app.country || '',
        university: app.university || '',
        program: app.program || '',
        qualification: app.quali || '',
        has_offer: app.has_offer === true || String(app.status || '').toUpperCase() === 'OFFER',
        condition: app.condition || '',
        decision: app.decision || '',
        is_final: app.is_final || false
      }));
    }

    const targetLength = Math.max(5, initialArr.length + 1);
    while (initialArr.length < targetLength) {
      initialArr.push(createEmptyEntry());
    }
    
    setEntries(initialArr);
    setDeletedIds([]);
  }, [initialApplications]);
  
  const [isSaving, setIsSaving] = useState(false);

  const allLocations = useMemo(() => {
    const locations = [...new Set(overallData.map(u => u.location))].sort();
    const priority = Object.values(LOCATION_MAP);
    const others = locations.filter(l => !priority.includes(l) && l !== '------');
    return [...priority, '------', ...others];
  }, [overallData]);

  useEffect(() => {
    if (initialStudent) {
      setSelectedStudent(initialStudent);
    }
  }, [initialStudent]);

  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return [];
    const term = studentSearch.toLowerCase();
    return students.filter(s => 
      s.student_num.toLowerCase().includes(term) ||
      (s.name_en || s.person?.name_en || '').toLowerCase().includes(term) ||
      (s.name_zh || s.person?.name_zh || '').toLowerCase().includes(term)
    ).slice(0, 10);
  }, [students, studentSearch]);

  const [alertMessage, setAlertMessage] = useState(null);

  if (!isOpen) return null;

  const handleEntryChange = (index, updatedEntry) => {
    const newEntries = [...entries];
    newEntries[index] = updatedEntry;
    if (updatedEntry.is_final) {
       newEntries.forEach((e, i) => { if(i !== index) e.is_final = false; });
    }
    setEntries(newEntries);
  };

  const handleAddRow = () => {
    setEntries([...entries, createEmptyEntry()]);
  };

  const handleRemoveRow = (index) => {
    const entryToRemove = entries[index];
    if (entryToRemove.id) {
      setDeletedIds(prev => [...prev, entryToRemove.id]);
    }
    const newEntries = entries.filter((_, i) => i !== index);
    if (newEntries.length === 0) newEntries.push(createEmptyEntry());
    setEntries(newEntries);
  };



  const handleSave = async () => {
    if (!selectedStudent) {
      setAlertMessage("Please select a student.");
      return;
    }

    const validEntries = [];
    for (const e of entries) {
       if (!e.location && !e.university && !e.program && !e.qualification) continue;
       if (!e.location) {
          setAlertMessage("All filled entries must have a Location.");
          return;
       }
       validEntries.push({
         ...(e.id ? { id: e.id } : {}),
         student_id: selectedStudent.id,
         country: REVERSE_LOCATION_MAP[e.location] || e.location,
         university: e.university || '',
         program: e.program,
         quali: e.qualification,
         condition: e.condition,
         decision: e.decision,
         is_final: e.is_final,
         has_offer: e.has_offer,
         status: e.has_offer ? 'OFFER' : 
                 (e.decision && e.decision.toLowerCase().includes('declined') ? 'REJECTED' : 
                 (e.decision && e.decision.toLowerCase().includes('withdrawn') ? 'WITHDRAWN' : 
                 (e.decision && e.decision.toLowerCase().includes('wait') ? 'WAITLIST' : 'PENDING')))
       });
    }

    setIsSaving(true);
    try {
      const success = await onSave(validEntries, deletedIds);
      if (success) {
        onClose();
      }
    } catch (err) {
      console.error(err);
      setAlertMessage("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slateBlue-800/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#F0FCFB] w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-[2rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 relative">
        
        {/* Custom Alert Toast */}
        {alertMessage && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-4 duration-300">
            <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-4 border border-white/10 min-w-[350px]">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center shrink-0 shadow-lg">
                <AlertTriangle size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-black leading-tight">Notification</p>
                <p className="text-[12px] font-medium text-gray-300">{alertMessage}</p>
              </div>
              <button 
                onClick={() => setAlertMessage(null)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>
          </div>
        )}
        {/* Fixed Top Section: Header + Student Info */}
        <div className="bg-[#F0FCFB] shrink-0 z-50">
          <div className="px-6 sm:px-10 py-4 sm:py-5 flex items-center justify-between border-b border-aura-teal/10">
            {selectedStudent ? (
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[2rem] bg-gradient-to-br from-aura-teal to-serene-indigo flex items-center justify-center text-white font-black text-xl sm:text-2xl shadow-xl shadow-aura-teal/20 shrink-0">
                   {(selectedStudent.name_en || selectedStudent.person?.name_en)?.charAt(0) || 'S'}
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-black text-slateBlue-900 leading-tight">
                     {isEdit ? 'Editing U-App' : 'Add U-App'}
                  </h2>
                  <div className="space-y-2">
                     <div className="text-aura-teal font-black text-2xl sm:text-3xl leading-none">
                       {selectedStudent.name_en || selectedStudent.person?.name_en}
                       {(selectedStudent.other_name || selectedStudent.person?.other_name) && `, ${selectedStudent.other_name || selectedStudent.person?.other_name}`}
                       {(selectedStudent.name_zh || selectedStudent.person?.name_zh) && (
                         <span className="ml-2 font-bold text-lg sm:text-xl opacity-70">
                           ({selectedStudent.name_zh || selectedStudent.person?.name_zh})
                         </span>
                       )}
                     </div>
                     <div className="flex flex-wrap items-center gap-3">
                       <span className="text-gray-400 font-bold text-[11px] bg-gray-100 px-3 py-1 rounded-xl uppercase tracking-widest">
                         #{selectedStudent.student_num}
                       </span>
                       <span className="text-serene-indigo font-bold text-[11px] bg-serene-indigo/10 px-3 py-1 rounded-xl uppercase tracking-widest">
                         Class of {selectedStudent.grad_year}
                       </span>
                     </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-aura-teal to-aura-teal/40 flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0">
                  <BookOpen size={20} />
                </div>
                <h2 className="text-lg font-bold text-slateBlue-800 leading-tight">Add U-App</h2>
              </div>
            )}
            
            <div className="flex items-center gap-4">
              {/* Navigation Arrows */}
              {selectedStudent && (onPrev || onNext) && (
                <div className="flex items-center gap-2 bg-white/50 p-1.5 rounded-2xl border border-aura-teal/10 shadow-sm mr-4">
                  <button 
                    onClick={onPrev}
                    disabled={!onPrev}
                    className="w-12 h-12 flex items-center justify-center hover:bg-aura-teal/10 rounded-xl text-aura-teal transition-all disabled:opacity-10 disabled:pointer-events-none active:scale-90"
                    title="Previous Student"
                  >
                    <ChevronLeft size={28} strokeWidth={3} />
                  </button>
                  <div className="w-[1px] h-6 bg-aura-teal/10"></div>
                  <button 
                    onClick={onNext}
                    disabled={!onNext}
                    className="w-12 h-12 flex items-center justify-center hover:bg-aura-teal/10 rounded-xl text-aura-teal transition-all disabled:opacity-10 disabled:pointer-events-none active:scale-90"
                    title="Next Student"
                  >
                    <ChevronRight size={28} strokeWidth={3} />
                  </button>
                </div>
              )}

              <button onClick={onClose} className="p-2 sm:p-3 hover:bg-gray-100 rounded-full text-gray-400 hover:text-slateBlue-800 hover:rotate-90 transition-all shrink-0">
                <X size={28} />
              </button>
            </div>
          </div>

          {!selectedStudent && (
            <div className="px-6 py-6 border-b border-aura-teal/5 bg-[#F0FCFB]">
              <div className="relative max-w-xl mx-auto">
                <Search size={16} className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setShowStudentDropdown(true);
                  }}
                  onFocus={() => setShowStudentDropdown(true)}
                  placeholder="Search student by Name or ID..."
                  className="w-full pl-9 pr-10 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-aura-teal/50 focus:border-aura-teal outline-none font-bold text-slateBlue-800 shadow-sm"
                />
                {studentSearch && (
                  <button
                    onClick={() => { setStudentSearch(''); setShowStudentDropdown(false); }}
                    className="absolute right-3 top-3 text-gray-300 hover:text-gray-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
                {showStudentDropdown && studentSearch && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => { setSelectedStudent(s); setShowStudentDropdown(false); setStudentSearch(''); }}
                          className="px-4 py-2 hover:bg-slateBlue-50 cursor-pointer border-b border-gray-50 last:border-0 flex justify-between items-center"
                        >
                          <div>
                            <p className="text-sm font-bold text-slateBlue-800">{s.name_en || s.person?.name_en}</p>
                            <p className="text-[10px] text-gray-400">{s.student_num}</p>
                          </div>
                        </div>
                      ))
                    ) : <div className="px-4 py-3 text-xs text-gray-400 italic">No students found.</div>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area: Flex-1 for Table */}
        <div className="flex-1 overflow-hidden flex flex-col bg-[#F0FCFB]">
          {selectedStudent && (
            <div className="flex-1 flex flex-col min-h-0 px-6 pt-2 pb-4">
              <div className="flex items-center justify-between mb-2">
                {!isEdit && (
                  <button 
                    onClick={() => setSelectedStudent(null)}
                    className="text-[11px] font-black text-aura-teal uppercase tracking-widest hover:underline flex items-center gap-2"
                  >
                    <Search size={14} /> Change Student
                  </button>
                )}
              </div>

              {/* Table Container - Fixed Header + Scrollable Body */}
              <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm min-h-0">
                <div className="overflow-x-auto custom-scrollbar overflow-y-hidden shrink-0">
                  <div className="min-w-[850px]">
                    {/* Header Row - TRULY FROZEN - Tiffany Blue */}
                    <div className="grid grid-cols-[50px_1fr_1fr_90px_80px_1fr_120px_60px_32px] gap-1 px-5 pt-4 pb-5 bg-[#F0FCFB] border-b border-gray-100 shadow-sm z-30">
                      <div className="text-[9px] font-black text-slateBlue-400 uppercase tracking-widest pl-2">Loc *</div>
                      <div className="text-[9px] font-black text-slateBlue-400 uppercase tracking-widest pl-2">University *</div>
                      <div className="text-[9px] font-black text-slateBlue-400 uppercase tracking-widest pl-2">Program</div>
                      <div className="text-[9px] font-black text-slateBlue-400 uppercase tracking-widest text-center">Quali.</div>
                      <div className="text-[9px] font-black text-slateBlue-400 uppercase tracking-widest text-center">Offer</div>
                      <div className="text-[9px] font-black text-slateBlue-400 uppercase tracking-widest pl-2">Conditions</div>
                      <div className="text-[9px] font-black text-slateBlue-400 uppercase tracking-widest pl-2">Decision</div>
                      <div className="text-[9px] font-black text-slateBlue-400 uppercase tracking-widest text-center">Final</div>
                      <div></div>
                    </div>
                  </div>
                </div>

                {/* Scrollable Body Container */}
                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                   <div className="overflow-x-auto custom-scrollbar">
                     <div className="min-w-[850px] p-4 pb-48 space-y-1.5 px-5 relative">
                        {entries.map((entry, index) => (
                          <ApplicationEntryRow
                            key={entry.id || `temp-${index}`}
                            index={index}
                            entry={entry}
                            onChange={handleEntryChange}
                            onRemove={handleRemoveRow}
                            allLocations={allLocations}
                            overallData={overallData}
                            findUniversityByName={findUniversityByName}
                            isEdit={isEdit}
                            canRemove={entries.length > 1}
                          />
                        ))}
                        <div className="px-1 pt-4 pb-2">
                          <button
                            onClick={handleAddRow}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slateBlue-50/50 text-slateBlue-600 font-black text-[12px] uppercase tracking-widest rounded-xl hover:bg-slateBlue-100 transition-all border-2 border-dashed border-slateBlue-200 hover:border-slateBlue-300"
                          >
                            <Plus size={16} strokeWidth={3} /> Add Another Row
                          </button>
                        </div>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#F0FCFB] border-t border-aura-teal/10 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-gray-400 font-bold">Total entries: {entries.filter(e => e.id || e.university || e.program || e.location).length}</p>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleAddRow}
              className="px-5 py-2 text-[12px] font-bold text-aura-teal hover:bg-aura-teal/10 rounded-lg transition-all flex items-center gap-1.5"
            >
              <Plus size={14} strokeWidth={3} /> ADD ROW
            </button>
            <button 
              onClick={onClose}
              className="px-5 py-2 text-[11px] font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-all"
            >
              CANCEL
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving || !selectedStudent}
              className={`flex items-center gap-2 px-6 py-2 bg-aura-teal text-white font-bold text-[12px] rounded-lg shadow-md transition-all ${isSaving || !selectedStudent ? 'opacity-70 cursor-not-allowed' : 'hover:bg-teal-500 active:scale-95'}`}
            >
              <Save size={14} /> {isSaving ? 'SAVING...' : (isEdit ? 'UPDATE ENTRY' : 'SAVE ALL')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationEntryModal;
