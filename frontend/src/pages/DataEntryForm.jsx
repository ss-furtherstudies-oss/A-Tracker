import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ImagePlus, Save, ArrowLeft } from 'lucide-react';
import classNames from 'classnames';
import { useStudents } from '../context/StudentContext';

// Simple Academic Block Template
const AcademicRow = ({ index }) => (
  <div className="flex flex-wrap gap-2 items-center bg-slateBlue-100 p-2 rounded-lg hover:shadow-deep transition-all duration-300">
    <input placeholder="Subject" className="text-sm p-1 flex-1 border border-gray-200 rounded outline-none" />
    <input placeholder="Grade" className="text-sm p-1 w-16 border border-gray-200 rounded outline-none" />
    <input placeholder="UMS" className="text-sm p-1 w-16 border border-gray-200 rounded outline-none" />
    <input placeholder="Exam Board" className="text-sm p-1 w-24 border border-gray-200 rounded outline-none" />
  </div>
);

const DataEntryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { students, upsertStudents } = useStudents();
  const [formData, setFormData] = useState({
    name_en: '', name_zh: '', gender: 'MALE', dob: '', phone: '', national_id: '',
    igcse_score: '', ias_score: '', alevel_score: '', ielts_score: '',
    status: 'ENROLLED'
  });

  useEffect(() => {
    if (isEdit && students.length > 0) {
      const student = students.find(s => s.id === id);
      if (student) {
        setFormData({
          ...formData,
          name_en: student.person?.name_en || student.name_en || '',
          name_zh: student.person?.name_zh || student.name_zh || '',
          gender: student.person?.gender || student.gender || 'MALE',
          dob: (student.person?.dob || student.dob) ? (student.person?.dob || student.dob).split('T')[0] : '',
          phone: student.person?.phone || student.phone || '',
          national_id: student.person?.national_id || student.national_id || '',
          igcse_score: student.igcse_score || '',
          ias_score: student.ias_score || '',
          alevel_score: student.alevel_score || '',
          ielts_score: student.ielts_score || '',
          status: student.status || 'ENROLLED'
        });
      }
    }
  }, [id, isEdit, students]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async () => {
    // Save using Context (Supabase)
    try {
      const studentToSave = {
        ...formData,
        entry_term: '2026',
      };
      
      if (isEdit) studentToSave.id = id;

      const result = await upsertStudents([studentToSave]);
      if(result.success) {
        navigate('/students');
      }
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
         <button onClick={() => navigate(-1)} className="flex items-center text-slateBlue-800 hover:text-aura-teal transition-colors">
            <ArrowLeft size={18} className="mr-1" /> Back
         </button>
         <button onClick={handleSave} className="flex items-center bg-aura-teal hover:bg-teal-500 text-white font-medium py-2 px-6 rounded-super shadow-sm transition-all focus:ring-2 focus:ring-teal-400 focus:outline-none">
            <Save size={16} className="mr-2" /> Save Profile
         </button>
      </div>

      <div className="super-ellipse-card p-8">
        <h2 className="text-xl font-bold bg-gradient-to-r from-aura-teal to-serene-indigo bg-clip-text text-transparent border-b border-gray-100 pb-2 mb-6">
          {isEdit ? 'Edit Profile' : 'Add New Student'}
        </h2>
        
        <div className="flex flex-col md:flex-row gap-8 text-[13px]">
          {/* Avatar Upload (Squircle) */}
          <div className="shrink-0 flex flex-col items-center">
            <div className="w-32 h-32 bg-slateBlue-100 rounded-[2.5rem] flex items-center justify-center text-gray-400 group cursor-pointer hover:bg-slateBlue-200 transition-colors relative shadow-inner overflow-hidden border border-gray-200">
               <ImagePlus size={32} className="group-hover:scale-110 transition-transform" />
               <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <span className="text-[11px] text-gray-500 mt-3 font-bold uppercase tracking-wider">Student Photo</span>
          </div>

          <div className="flex-1 space-y-5">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                   <label className="text-[11px] font-bold text-gray-400 mb-1.5 block uppercase tracking-widest">Name (English)</label>
                   <input name="name_en" value={formData.name_en} onChange={handleChange} className="w-full text-[14px] font-semibold p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-4 focus:ring-aura-teal/5 focus:border-aura-teal focus:outline-none transition-all shadow-inner" />
                </div>
                <div>
                   <label className="text-[11px] font-bold text-gray-400 mb-1.5 block uppercase tracking-widest">Name (Chinese)</label>
                   <input name="name_zh" value={formData.name_zh} onChange={handleChange} className="w-full text-[14px] font-semibold p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-4 focus:ring-aura-teal/5 focus:border-aura-teal focus:outline-none transition-all shadow-inner" />
                </div>
                <div>
                   <label className="text-[11px] font-bold text-gray-400 mb-1.5 block uppercase tracking-widest">Date of Birth</label>
                   <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full text-[14px] font-semibold p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-4 focus:ring-aura-teal/5 focus:border-aura-teal focus:outline-none transition-all shadow-inner" />
                </div>
                <div>
                   <label className="text-[11px] font-bold text-gray-400 mb-1.5 block uppercase tracking-widest">Gender</label>
                   <div className="flex space-x-3">
                     <button className={classNames("flex-1 text-[13px] py-2.5 rounded-lg font-bold border transition-all active:scale-95 shadow-sm", formData.gender === 'MALE' ? 'bg-serene-indigo text-white border-serene-indigo shadow-serene-indigo/20' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50')} onClick={() => setFormData({...formData, gender: 'MALE'})}>Male</button>
                     <button className={classNames("flex-1 text-[13px] py-2.5 rounded-lg font-bold border transition-all active:scale-95 shadow-sm", formData.gender === 'FEMALE' ? 'bg-pink-500 text-white border-pink-500 shadow-pink-500/20' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50')} onClick={() => setFormData({...formData, gender: 'FEMALE'})}>Female</button>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="super-ellipse-card p-10">
        <h2 className="text-xl font-bold bg-gradient-to-r from-aura-teal to-serene-indigo bg-clip-text text-transparent border-b border-gray-100 pb-3 mb-8">Academic & University</h2>
        
        <div className="space-y-8">
           <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 pt-8 border-t border-gray-100">
              <div>
                <label className="text-[11px] font-bold text-gray-400 mb-1.5 block uppercase tracking-widest text-center">IGCSE</label>
                <input name="igcse_score" value={formData.igcse_score} onChange={handleChange} placeholder="8A* 1A" className="w-full text-center text-[15px] font-mono font-bold p-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-aura-teal focus:outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-400 mb-1.5 block uppercase tracking-widest text-center">IAS</label>
                <input name="ias_score" value={formData.ias_score} onChange={handleChange} placeholder="4a" className="w-full text-center text-[15px] font-mono font-bold p-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-aura-teal focus:outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-400 mb-1.5 block uppercase tracking-widest text-center">IAL/GCEAL</label>
                <input name="alevel_score" value={formData.alevel_score} onChange={handleChange} placeholder="3A* 1A" className="w-full text-center text-[15px] font-mono font-bold p-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-aura-teal focus:outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-aura-teal mb-1.5 block uppercase tracking-widest text-center">IELTS Overall</label>
                <input name="ielts_score" value={formData.ielts_score} onChange={handleChange} placeholder="8.0" className="w-full text-center text-[18px] font-black text-aura-teal p-2.5 bg-teal-50/50 border-2 border-aura-teal/20 rounded-lg focus:border-aura-teal focus:outline-none" />
              </div>
           </div>
        </div>
      </div>

    </div>
  );
};

export default DataEntryForm;
