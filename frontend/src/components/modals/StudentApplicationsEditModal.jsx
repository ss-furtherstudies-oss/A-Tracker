import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, GraduationCap, Check } from 'lucide-react';
import ApplicationEntryModal from './ApplicationEntryModal';
import { useStudents } from '../../context/StudentContext';

const StudentApplicationsEditModal = ({ isOpen, onClose, student, onUpdateApp, onDeleteApp, onAddApp }) => {
  const [editingApp, setEditingApp] = useState(null);
  const [isAddingApp, setIsAddingApp] = useState(false);

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6 bg-slateBlue-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slateBlue-50 w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-[3rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 border border-white/20">
        
        {/* Header Section */}
        <div className="px-10 py-8 flex items-center justify-between bg-white border-b border-gray-100 rounded-t-[3rem]">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-aura-teal to-serene-indigo flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-aura-teal/20 relative overflow-hidden group">
               {(student.name_en || student.person?.name_en)?.charAt(0) || 'S'}
               <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slateBlue-900 leading-tight">Editing U-App</h2>
              <div className="flex items-center gap-4 mt-1.5">
                <span className="text-xs font-black text-aura-teal bg-aura-teal/10 px-2.5 py-1 rounded-lg">ID: {student.student_num}</span>
                <span className="text-xs font-black text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
                  {student.name_en || student.person?.name_en} 
                  {(student.name_zh || student.person?.name_zh) && ` (${student.name_zh || student.person?.name_zh})`}
                </span>
                <span className="text-xs font-black text-serene-indigo bg-serene-indigo/10 px-2.5 py-1 rounded-lg">CLASS OF {student.grad_year}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-slateBlue-900 hover:rotate-90"
          >
            <X size={28} />
          </button>
        </div>

        {/* Applications List */}
        <div className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-slateBlue-800 uppercase tracking-widest flex items-center gap-2">
              <GraduationCap size={18} className="text-aura-teal" /> University Applications ({student.applications?.length || 0})
            </h3>
            <button 
              onClick={() => setIsAddingApp(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-aura-teal text-white font-black text-[11px] rounded-2xl hover:bg-teal-500 transition-all shadow-lg shadow-aura-teal/20 active:scale-95 uppercase tracking-wider"
            >
              <Plus size={14} strokeWidth={3} /> Add New Entry
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {student.applications && student.applications.length > 0 ? (
              student.applications.map((app) => (
                <div key={app.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                   {app.is_final && (
                     <div className="absolute top-0 right-0 px-4 py-1.5 bg-aura-teal text-white text-[10px] font-black rounded-bl-2xl uppercase tracking-widest flex items-center gap-1.5">
                       <Check size={10} strokeWidth={4} /> Final Destination
                     </div>
                   )}
                   
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                         <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 font-black text-xs border border-gray-100 group-hover:bg-aura-teal/5 group-hover:border-aura-teal/20 group-hover:text-aura-teal transition-colors">
                            {app.country || '??'}
                         </div>
                         <div>
                            <h4 className="font-black text-slateBlue-900 text-lg group-hover:text-aura-teal transition-colors">{app.university}</h4>
                            <p className="text-sm text-gray-500 font-bold">{app.program} <span className="text-gray-300 mx-2">•</span> {app.quali}</p>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                         <button 
                           onClick={() => setEditingApp(app)}
                           className="p-3 text-gray-400 hover:text-aura-teal hover:bg-aura-teal/5 rounded-2xl transition-all"
                         >
                            <Edit2 size={20} />
                         </button>
                         <button 
                           onClick={() => {
                             if(window.confirm("Are you sure you want to delete this application entry?")) {
                               onDeleteApp(student.id, app.id);
                             }
                           }}
                           className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                         >
                            <Trash2 size={20} />
                         </button>
                      </div>
                   </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                   <GraduationCap size={32} />
                </div>
                <p className="text-gray-400 font-bold">No application records found for this student.</p>
                <button 
                  onClick={() => setIsAddingApp(true)}
                  className="mt-4 text-aura-teal font-black text-sm hover:underline uppercase tracking-widest"
                >
                   Add your first entry
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-6 bg-slateBlue-900 border-t border-slateBlue-800 rounded-b-[3rem] flex items-center justify-between">
           <p className="text-xs text-slateBlue-300 font-bold italic">* Changes are saved immediately when updating entries</p>
           <button 
             onClick={onClose}
             className="px-8 py-3 bg-white text-slateBlue-900 font-black text-xs rounded-2xl hover:bg-gray-100 transition-all active:scale-95 shadow-xl uppercase tracking-widest"
           >
             Close Manager
           </button>
        </div>
      </div>

      {/* Sub-modals for Adding/Editing */}
      {(isAddingApp || editingApp) && (
        <ApplicationEntryModal
          isOpen={true}
          onClose={() => {
            setIsAddingApp(false);
            setEditingApp(null);
          }}
          initialStudent={student}
          initialApplication={editingApp}
          onSave={async (entry) => {
            if (editingApp) {
               return await onUpdateApp(student.id, editingApp.id, entry);
            } else {
               return await onAddApp(entry);
            }
          }}
        />
      )}
    </div>
  );
};

export default StudentApplicationsEditModal;
