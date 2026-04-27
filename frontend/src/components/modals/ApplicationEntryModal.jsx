import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Save, MapPin, GraduationCap, BookOpen, AlertTriangle, Plus } from 'lucide-react';
import { useQS } from '../../context/QSContext';
import { useStudents } from '../../context/StudentContext';

const QUALIFICATION_SUGGESTIONS = ['BSc', 'PhD', 'BBA', 'LLB', 'BA', 'BEng', 'MBChB', 'MSc', 'MA'];

const LOCATION_MAP = {
  'HK': 'Hong Kong SAR, China',
  'UK': 'United Kingdom',
  'US': 'United States of America',
  'AU': 'Australia',
  'CN': 'China (Mainland)',
  'TW': 'Taiwan',
  'JP': 'Japan'
};

const REVERSE_LOCATION_MAP = Object.entries(LOCATION_MAP).reduce((acc, [k, v]) => {
  acc[v] = k;
  return acc;
}, {});

const ApplicationEntryModal = ({ isOpen, onClose, onSave, initialStudent = null, initialApplication = null }) => {
  const { students } = useStudents();
  const { overallData, findUniversityByName } = useQS();
  
  const [selectedStudent, setSelectedStudent] = useState(initialStudent);
  const [formData, setFormData] = useState({
    location: '',
    university: '',
    program: '',
    qualification: '',
    is_final: false
  });
  
  const isEdit = !!initialApplication;

  useEffect(() => {
    if (initialApplication) {
      setFormData({
        location: LOCATION_MAP[initialApplication.country] || initialApplication.country || '',
        university: initialApplication.university || '',
        program: initialApplication.program || '',
        qualification: initialApplication.quali || '',
        is_final: initialApplication.is_final || false
      });
      setUniSearch(initialApplication.university || '');
    } else {
      setFormData({
        location: '',
        university: '',
        program: '',
        qualification: '',
        is_final: false
      });
      setUniSearch('');
    }
  }, [initialApplication]);
  
  const [uniSearch, setUniSearch] = useState('');
  const [showUniDropdown, setShowUniDropdown] = useState(false);
  const [uniWarning, setUniWarning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Filtered universities based on location and search
  const filteredUniversities = useMemo(() => {
    if (!formData.location) return [];
    
    let filtered = overallData.filter(u => u.location === formData.location);
    
    if (uniSearch) {
      const term = uniSearch.toLowerCase();
      filtered = filtered.filter(u => 
        u.university.toLowerCase().includes(term)
      );
    }
    
    return filtered.slice(0, 100); // Limit to 100 for performance
  }, [formData.location, uniSearch, overallData]);

  // All unique locations from QS data
  const allLocations = useMemo(() => {
    const locations = [...new Set(overallData.map(u => u.location))].sort();
    // Move priority locations to front
    const priority = Object.values(LOCATION_MAP);
    const others = locations.filter(l => !priority.includes(l));
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

  if (!isOpen) return null;

  const handleSave = async () => {
    const finalUniversity = formData.university || uniSearch;
    const isExistingOffer = initialApplication?.has_offer === true || String(initialApplication?.status || '').toUpperCase() === 'OFFER';
    
    if (!selectedStudent || !finalUniversity || !formData.location) {
      alert("Please fill in all required fields (Location, University).");
      return;
    }

    // Validate university against QS Ranking
    const match = findUniversityByName(finalUniversity);
    if (!match && !uniWarning) {
      setUniWarning(true);
      return;
    }

    setIsSaving(true);
    try {
      const entry = {
        student_id: selectedStudent.id,
        country: REVERSE_LOCATION_MAP[formData.location] || formData.location,
        university: finalUniversity,
        program: formData.program,
        quali: formData.qualification,
        is_final: formData.is_final,
        has_offer: isExistingOffer,
        status: isExistingOffer ? 'OFFER' : 'PENDING'
      };
      
      if (isEdit) entry.id = initialApplication.id;
      
      const success = await onSave(entry);
      if (success) {
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slateBlue-800/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 relative">
        
        {/* Header */}
        <div className="px-8 py-6 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-aura-teal to-aura-teal/40 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-aura-teal/20 overflow-hidden shrink-0">
              <Plus size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slateBlue-800 leading-tight">{isEdit ? 'Edit Entry' : 'Add New Entry'}</h2>
              <p className="text-sm text-gray-400 font-medium">{isEdit ? 'Update university application details' : 'Create a new undergraduate application record'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-slateBlue-800"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 custom-scrollbar">
          
          {/* Student Selection / Info */}
          <div className="space-y-4">
            <h3 className="font-bold text-slateBlue-800 flex items-center gap-2 text-sm">
              <GraduationCap size={16} className="text-aura-teal"/> Student Information
            </h3>
            
            {!selectedStudent ? (
              <div className="relative group">
                <Search size={16} className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-aura-teal transition-colors" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setShowStudentDropdown(true);
                  }}
                  onFocus={() => setShowStudentDropdown(true)}
                  placeholder="Search student by Name or ID..."
                  className="w-full pl-10 pr-3 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-aura-teal/20 focus:border-aura-teal transition-all outline-none font-bold text-slateBlue-800"
                />
                {showStudentDropdown && studentSearch && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2 duration-200">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((s, idx) => (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedStudent(s);
                            setShowStudentDropdown(false);
                            setStudentSearch('');
                          }}
                          className="px-4 py-3 hover:bg-slateBlue-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-bold text-slateBlue-800">{s.name_en || s.person?.name_en}</p>
                              <p className="text-[10px] font-bold text-gray-400">{s.student_num}</p>
                            </div>
                            <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded">GRAD {s.grad_year}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-xs text-gray-400 font-medium italic">No students found.</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative group">
                <div className="grid grid-cols-2 gap-4 bg-slateBlue-50/50 p-6 rounded-[2rem] border border-slateBlue-100 relative overflow-hidden">
                  <button 
                    onClick={() => setSelectedStudent(null)}
                    className="absolute top-4 right-4 text-[10px] font-black text-aura-teal uppercase tracking-widest hover:underline"
                  >
                    Change Student
                  </button>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Student ID</label>
                    <p className="font-mono font-bold text-serene-indigo">{selectedStudent.student_num}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Year of Grad</label>
                    <p className="font-bold text-slateBlue-800">{selectedStudent.grad_year}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">English Name</label>
                    <p className="font-bold text-slateBlue-800">{selectedStudent.name_en || selectedStudent.person?.name_en}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Chinese Name</label>
                    <p className="font-bold text-slateBlue-800">{selectedStudent.name_zh || selectedStudent.person?.name_zh || '-'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent"></div>

          {/* Application Details */}
          <div className="space-y-6">
            <h3 className="font-bold text-slateBlue-800 flex items-center gap-2 text-sm">
              <BookOpen size={16} className="text-aura-teal"/> Application Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Location */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-1">
                  <MapPin size={14} /> Location <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.location}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, location: e.target.value, university: '' }));
                    setUniSearch('');
                  }}
                  className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-aura-teal/20 focus:border-aura-teal transition-all outline-none font-bold text-slateBlue-800 appearance-none shadow-sm"
                >
                  <option value="">Select Location...</option>
                  {allLocations.map((loc, idx) => (
                    <option key={idx} value={loc} disabled={loc === '------'}>
                      {Object.keys(LOCATION_MAP).find(key => LOCATION_MAP[key] === loc) || loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* University */}
              <div className="space-y-2 relative">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-1">
                  <GraduationCap size={14} /> University <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.university || uniSearch}
                    onChange={(e) => {
                      setUniSearch(e.target.value);
                      setFormData(prev => ({ ...prev, university: '' }));
                      setShowUniDropdown(true);
                      setUniWarning(false);
                    }}
                    onFocus={() => setShowUniDropdown(true)}
                    placeholder={formData.location ? "Search university..." : "Select location first"}
                    disabled={!formData.location}
                    className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-aura-teal/20 focus:border-aura-teal transition-all outline-none font-bold text-slateBlue-800 shadow-sm"
                  />
                  {showUniDropdown && (uniSearch || formData.location) && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2 duration-200">
                      {filteredUniversities.length > 0 ? (
                        filteredUniversities.map((uni, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, university: uni.university }));
                              setUniSearch(uni.university);
                              setShowUniDropdown(false);
                            }}
                            className="px-4 py-3 text-sm font-medium text-slateBlue-800 hover:bg-slateBlue-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                          >
                            <div className="flex justify-between items-center">
                              <span>{uni.university}</span>
                              <span className="text-[10px] font-black text-aura-teal bg-aura-teal/10 px-2 py-0.5 rounded">QS #{uni.rank_latest}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-xs text-gray-400 font-medium italic">
                          {uniSearch ? `"${uniSearch}" not found. Press Enter to use anyway.` : "No universities found for this location."}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {uniWarning && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 animate-in slide-in-from-top-2">
                    <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] font-bold text-red-700">University not in QS Ranking</p>
                      <p className="text-[10px] text-red-600/70 font-medium">This university will be marked for admin resolution. Do you still want to add it?</p>
                      <button 
                        onClick={() => {
                          setFormData(prev => ({ ...prev, university: uniSearch }));
                          setUniWarning(false);
                          // We'll proceed in handleSave
                        }}
                        className="mt-2 text-[10px] font-black text-red-700 uppercase tracking-wider hover:underline"
                      >
                        Yes, Add Anyway
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Program & Qualification */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Program Name</label>
                <input
                  type="text"
                  value={formData.program}
                  onChange={(e) => setFormData(prev => ({ ...prev, program: e.target.value }))}
                  placeholder="e.g. Computer Science"
                  className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-aura-teal/20 focus:border-aura-teal transition-all outline-none font-bold text-slateBlue-800 shadow-sm"
                />
              </div>

              <div className="space-y-2 relative">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Qualification</label>
                <input
                  type="text"
                  list="qualification-suggestions"
                  value={formData.qualification}
                  onChange={(e) => setFormData(prev => ({ ...prev, qualification: e.target.value }))}
                  placeholder="e.g. BSc"
                  className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-aura-teal/20 focus:border-aura-teal transition-all outline-none font-bold text-slateBlue-800 shadow-sm"
                />
                <datalist id="qualification-suggestions">
                  {QUALIFICATION_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>
            </div>

            {/* Final Destination Toggle */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setFormData(prev => ({ ...prev, is_final: !prev.is_final }))}
                className={`w-10 h-6 rounded-full transition-all relative ${formData.is_final ? 'bg-aura-teal' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_final ? 'left-5' : 'left-1'}`}></div>
              </button>
              <span className="text-xs font-bold text-slateBlue-800">Set as Final Destination</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-white border-t border-gray-100 flex items-center justify-end gap-3 sticky bottom-0">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all outline-none"
          >
            DISCARD
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-8 py-2.5 bg-aura-teal text-white font-bold text-xs rounded-xl shadow-xl shadow-aura-teal/20 transition-all outline-none ${isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-teal-500 active:scale-95'}`}
          >
            <Save size={16} /> {isSaving ? 'SAVING...' : (isEdit ? 'UPDATE ENTRY' : 'ADD ENTRY')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationEntryModal;
