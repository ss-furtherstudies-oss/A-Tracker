import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, GraduationCap, BookOpen, Layers, Award, User, Calendar, Smartphone, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import classNames from 'classnames';
import { IGCSE_SUBJECTS, IAS_SUBJECTS, IAL_SUBJECTS, IGCSE_BOARDS, IAS_BOARDS, IAL_BOARDS, SUBJECT_FULL_NAMES } from '../../constants/subjects';

const AcademicSection = ({ title, boards, subjectsMap, data, icon: Icon, onUpdate, defaultBoard, separatorConfig = {} }) => {
  const addRow = () => {
    onUpdate([...data, { board: defaultBoard || boards[0], subject: '', grade: '', value: '' }]);
  };

  const removeRow = (index) => {
    onUpdate(data.filter((_, i) => i !== index));
  };

  const updateRow = (index, field, val) => {
    const updated = [...data];
    updated[index][field] = val;
    onUpdate(updated);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-aura-teal/10 rounded-xl text-aura-teal">
            <Icon size={20} />
          </div>
          <h3 className="font-bold text-slateBlue-800 uppercase tracking-tight">{title}</h3>
        </div>
        <button 
          onClick={addRow}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-aura-teal bg-aura-teal/5 hover:bg-aura-teal/10 rounded-lg transition-all"
        >
          <Plus size={14} /> ADD SUBJECT
        </button>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-12 gap-3 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          <div className="col-span-3">Exam Board</div>
          <div className="col-span-4">Subject</div>
          <div className="col-span-2 text-center">Grade</div>
          <div className="col-span-2 text-center">UMS / %</div>
          <div className="col-span-1"></div>
        </div>

        {data.map((row, idx) => {
          const availableSubjects = subjectsMap[row.board] || [];
          const separatorIndex = separatorConfig[row.board];
          return (
            <div key={idx} className="grid grid-cols-12 gap-3 items-center group">
              <div className="col-span-3">
                <select
                  value={row.board}
                  onChange={(e) => updateRow(idx, 'board', e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-aura-teal/20 transition-all appearance-none outline-none font-medium truncate text-slateBlue-800"
                >
                  <option value="">Select Board...</option>
                  {boards.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="col-span-4">
                {row.board === 'Other' ? (
                  <input
                    type="text"
                    placeholder="Subject name"
                    value={row.subject}
                    onChange={(e) => updateRow(idx, 'subject', e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-aura-teal/20 outline-none text-slateBlue-800"
                  />
                ) : (
                  <select
                    value={row.subject}
                    onChange={(e) => updateRow(idx, 'subject', e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-aura-teal/20 transition-all appearance-none outline-none truncate text-slateBlue-800"
                  >
                    <option value="">Choose Subject...</option>
                    {availableSubjects.map((s, i) => (
                      <React.Fragment key={s}>
                        {separatorIndex === i && (
                          <option value={`__sep_${row.board}_${i}`} disabled>
                            ------
                          </option>
                        )}
                        <option value={s}>
                          {SUBJECT_FULL_NAMES[s] ? `${SUBJECT_FULL_NAMES[s]} (${s})` : s}
                        </option>
                      </React.Fragment>
                    ))}
                  </select>
                )}
              </div>
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="e.g. A*"
                  value={row.grade}
                  onChange={(e) => updateRow(idx, 'grade', e.target.value)}
                  className="w-full h-10 text-center text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-aura-teal/20 outline-none text-slateBlue-800"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="Score"
                  value={row.value}
                  onChange={(e) => updateRow(idx, 'value', e.target.value)}
                  className="w-full h-10 text-center text-xs bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-aura-teal/20 outline-none text-slateBlue-800"
                />
              </div>
              <div className="col-span-1 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => removeRow(idx)}
                  className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors outline-none"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
        {data.length === 0 && (
          <div className="py-8 text-center text-gray-300 text-xs italic">No subjects added yet.</div>
        )}
      </div>
    </div>
  );
};

const StudentEditModal = ({ student, onClose, onSave }) => {
  const getSafeDate = (dateVal) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    name_en: student?.name_en || student?.person?.name_en || '',
    name_zh: student?.name_zh || student?.person?.name_zh || '',
    other_name: student?.other_name || student?.person?.other_name || '',
    gender: student?.gender || student?.person?.gender || 'MALE',
    dob: getSafeDate(student?.dob || student?.person?.dob),
    phone: student?.phone || student?.person?.phone || '',
    social_media: student?.social_media || student?.person?.social_media_urls?.ig || '',
    profile_picture: student?.profile_picture || student?.person?.profile_picture || '',
    grad_year: student?.grad_year || '',
    student_num: student?.student_num || '',
    
    igcse: student?.academicData?.igcse?.length > 0 ? student.academicData.igcse : Array.from({ length: 5 }, () => ({ board: 'CIE', subject: '', grade: '', value: '' })),
    ias: student?.academicData?.ias?.length > 0 ? student.academicData.ias : Array.from({ length: 5 }, () => ({ board: 'Pearson Edexcel', subject: '', grade: '', value: '' })),
    ial: student?.academicData?.ial?.length > 0 ? student.academicData.ial : Array.from({ length: 5 }, () => ({ board: 'Pearson Edexcel', subject: '', grade: '', value: '' })),
    ielts: student?.academicData?.ielts || { reading: '', writing: '', listening: '', speaking: '', overall: '' },
    status: student?.status || 'ENROLLED'
  });

  const [saveError, setSaveError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdate = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleIeltsChange = (key, val) => {
    setFormData(prev => ({
      ...prev,
      ielts: { ...prev.ielts, [key]: val }
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slateBlue-800/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 relative">
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-aura-teal/5 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-serene-indigo/5 blur-3xl rounded-full -ml-32 -mb-32 pointer-events-none"></div>

        {/* Modal Header */}
        <div className="px-8 py-6 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-aura-teal to-aura-teal/40 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-aura-teal/20 overflow-hidden shrink-0">
              {formData.profile_picture ? (
                <img src={formData.profile_picture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                formData.name_en?.[0] || 'S'
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slateBlue-800 leading-tight">
                {formData.name_en ? `Editing Profile - ${formData.name_en}` : 'New Student Profile'}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-slateBlue-800"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Form Area */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 custom-scrollbar">
          
          {/* Error Banner */}
          {saveError && (
            <div className="mx-8 mt-8 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-bold flex items-start gap-3">
              <div className="p-1 bg-red-100 rounded-lg shrink-0 mt-0.5">
                <X size={14} className="text-red-500" />
              </div>
              <div>
                <p className="text-red-800 uppercase tracking-widest text-[10px] mb-1">Failed to save</p>
                <p>{saveError}</p>
              </div>
            </div>
          )}

          {/* Basic Details Section */}
          <div className="space-y-3">
            <h3 className="font-bold text-slateBlue-800 flex items-center gap-2 text-sm"><User size={16} className="text-aura-teal"/> Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                  Student ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.student_num}
                  onChange={(e) => handleUpdate('student_num', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-aura-teal/20 focus:border-aura-teal transition-all outline-none font-mono font-bold text-serene-indigo uppercase shadow-sm"
                  placeholder="STU-XXXXX"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                  English Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name_en}
                  onChange={(e) => handleUpdate('name_en', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-aura-teal/20 focus:border-aura-teal transition-all outline-none font-bold text-slateBlue-800 shadow-sm"
                  placeholder="English Name"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Chinese Name</label>
                <input
                  type="text"
                  value={formData.name_zh}
                  onChange={(e) => handleUpdate('name_zh', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-aura-teal/20 focus:border-aura-teal transition-all outline-none font-bold text-slateBlue-800 shadow-sm"
                  placeholder="Chinese Name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Other Name</label>
                <input
                  type="text"
                  value={formData.other_name}
                  onChange={(e) => handleUpdate('other_name', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-aura-teal/20 focus:border-aura-teal transition-all outline-none font-bold text-slateBlue-800 shadow-sm"
                  placeholder="Other Name"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleUpdate('gender', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-aura-teal/20 focus:border-aura-teal transition-all outline-none font-bold text-slateBlue-800 appearance-none shadow-sm"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Date of Birth</label>
                <div className="relative group">
                  <Calendar className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-aura-teal transition-colors" size={16} />
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => handleUpdate('dob', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-aura-teal/20 focus:border-aura-teal transition-all outline-none font-bold text-slateBlue-800 shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Graduation Year</label>
                <div className="relative group">
                  <GraduationCap className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-aura-teal transition-colors" size={16} />
                  <input
                    type="number"
                    value={formData.grad_year}
                    onChange={(e) => handleUpdate('grad_year', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-aura-teal/20 focus:border-aura-teal transition-all outline-none font-bold text-slateBlue-800 shadow-sm"
                    placeholder="2026"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Mobile Phone</label>
                <div className="relative group">
                  <Smartphone className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-aura-teal transition-colors" size={16} />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleUpdate('phone', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-aura-teal/20 focus:border-aura-teal transition-all outline-none font-bold text-slateBlue-800 shadow-sm"
                    placeholder="+852 1234 5678"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Social Media (IG Link)</label>
                <div className="relative group">
                  <LinkIcon className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-aura-teal transition-colors" size={16} />
                  <input
                    type="url"
                    value={formData.social_media}
                    onChange={(e) => handleUpdate('social_media', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-aura-teal/20 focus:border-aura-teal transition-all outline-none font-bold text-slateBlue-800 shadow-sm"
                    placeholder="Instagram URL"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Profile Picture</label>
                <div className="relative group">
                  <div className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-aura-teal transition-colors pointer-events-none">
                    <ImageIcon size={16} />
                  </div>
                  <label className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl hover:bg-slateBlue-50 hover:border-aura-teal/30 transition-all font-bold text-aura-teal shadow-sm cursor-pointer flex items-center">
                    <span className="truncate flex-1">{formData.profile_picture ? 'Image Selected (Click to change)' : 'Upload New Photo...'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpdate('profile_picture', URL.createObjectURL(file));
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Enrollment Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleUpdate('status', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-aura-teal/20 focus:border-aura-teal transition-all outline-none font-bold text-slateBlue-800 appearance-none shadow-sm"
                >
                  <option value="ENROLLED">Studying</option>
                  <option value="GRADUATED">Graduated</option>
                  <option value="WITHDRAWN">Withdrawn</option>
                </select>
              </div>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

          {/* Academic Data Sections */}
          <div className="grid grid-cols-1 gap-8">
            <AcademicSection 
              title="IGCSE / GCSE" 
              boards={IGCSE_BOARDS}
              subjectsMap={IGCSE_SUBJECTS} 
              data={formData.igcse} 
              icon={BookOpen}
              defaultBoard="CIE"
              separatorConfig={{ CIE: 11, "Pearson Edexcel": 2 }}
              onUpdate={(val) => handleUpdate('igcse', val)}
            />

            <AcademicSection 
              title="IAS Data" 
              boards={IAS_BOARDS}
              subjectsMap={IAS_SUBJECTS} 
              data={formData.ias} 
              icon={Layers}
              defaultBoard="Pearson Edexcel"
              onUpdate={(val) => handleUpdate('ias', val)}
            />

            <AcademicSection 
              title="IAL / GCEAL Data" 
              boards={IAL_BOARDS}
              subjectsMap={IAL_SUBJECTS} 
              data={formData.ial} 
              icon={Award}
              defaultBoard="Pearson Edexcel"
              onUpdate={(val) => handleUpdate('ial', val)}
            />
            
            {/* IELTS Section */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-serene-indigo/10 rounded-xl text-serene-indigo">
                  <Award size={20} />
                </div>
                <h3 className="font-bold text-slateBlue-800 uppercase tracking-tight">IELTS Score</h3>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
                {['Reading', 'Writing', 'Listening', 'Speaking', 'Overall'].map(part => (
                  <div key={part} className="space-y-2">
                    <label className="text-sm font-black text-slateBlue-800 uppercase tracking-widest pl-1">{part}</label>
                    <input
                      type="text"
                      className="w-full h-12 text-center font-bold text-slateBlue-800 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-serene-indigo/20 transition-all outline-none shadow-sm"
                      placeholder="0.0"
                      value={formData.ielts[part.toLowerCase()]}
                      onChange={(e) => handleIeltsChange(part.toLowerCase(), e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-8 py-6 bg-white border-t border-gray-100 flex items-center justify-end gap-3 sticky bottom-0">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all outline-none"
          >
            DISCARD
          </button>
          <button 
            onClick={async () => {
              setSaveError(null);
              setIsSaving(true);
              try {
                const result = await onSave(formData);
                if (result?.success === false) {
                   setSaveError(result.error);
                } else {
                   onClose();
                }
              } catch(err) {
                 setSaveError(err.message);
              } finally {
                 setIsSaving(false);
              }
            }}
            disabled={isSaving}
            className={`flex items-center gap-2 px-8 py-2.5 bg-aura-teal text-white font-bold text-xs rounded-xl shadow-xl shadow-aura-teal/20 transition-all outline-none ${isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-teal-500 active:scale-95'}`}
          >
            <Save size={16} /> {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentEditModal;
