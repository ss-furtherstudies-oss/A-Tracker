import React, { useRef } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { SortableHeader } from '../ui/TableBadges';
import { StudentRow } from './StudentRow';
import { useVirtualScroll } from '../../utils/useVirtual';

export const StudentsTable = ({
  filteredStudents,
  sortConfig,
  requestSort,
  role,
  handleEdit,
  handleDelete,
  findRankByName
}) => {
  const containerRef = useRef(null);
  const ITEM_HEIGHT = 54; // Estimated row height

  const { startIndex, endIndex, paddingTop, paddingBottom } = useVirtualScroll({
    containerRef,
    itemHeight: ITEM_HEIGHT,
    itemCount: filteredStudents.length,
    overscan: 10
  });

  const visibleStudents = filteredStudents.slice(startIndex, endIndex);

  return (
    <div className="bg-white rounded-b-[1.5rem] shadow-sm border border-gray-100 border-t-0 overflow-hidden w-full relative">
      <div 
        ref={containerRef}
        className="overflow-auto max-h-[70vh] relative"
      >
        <table className="min-w-full text-left text-xs text-slateBlue-800 border-collapse table-fixed">
          <thead>
            <tr className="bg-slateBlue-800 border-b border-slateBlue-900 text-white uppercase font-black text-[10px] tracking-widest sticky top-0 z-30 shadow-sm transition-all">
              <SortableHeader label="Year" sortKey="grad_year" config={sortConfig} requestSort={requestSort} className="w-[50px] text-center" />
              <th className="px-3 py-2.5 w-[50px] text-center">Status</th>
              <SortableHeader label="Student ID" sortKey="student_num" config={sortConfig} requestSort={requestSort} className="w-[80px] text-center" />
              <SortableHeader label="Name" sortKey="name" config={sortConfig} requestSort={requestSort} className="w-[280px]" />
              <SortableHeader label="IGCSE" sortKey="igcse_score" config={sortConfig} requestSort={requestSort} className="w-[90px] text-center" />
              <SortableHeader label="IAS" sortKey="ias_score" config={sortConfig} requestSort={requestSort} className="w-[90px] text-center" />
              <SortableHeader label="IAL" sortKey="alevel_score" config={sortConfig} requestSort={requestSort} className="w-[90px] text-center" />
              <SortableHeader label="IELTS" sortKey="ielts_score" config={sortConfig} requestSort={requestSort} className="w-[50px] text-center" />
              <SortableHeader label="QS" sortKey="qs" config={sortConfig} requestSort={requestSort} className="w-[50px] text-center" />
              <SortableHeader label="University" sortKey="university_dest" config={sortConfig} requestSort={requestSort} className="w-[350px] min-w-[350px]" />
              <th className="px-3 py-2.5 w-[50px] text-center">Quali</th>
              <th className="px-3 py-2.5 w-[350px] min-w-[350px]">Program</th>
              {role === 'ADMIN' && <th className="px-4 py-2.5 w-[100px] text-center sticky right-0 bg-slateBlue-800 z-30 shadow-[-4px_0_10_rgba(0,0,0,0.3)]">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paddingTop > 0 && <tr style={{ height: `${paddingTop}px` }} aria-hidden="true"><td colSpan="13" /></tr>}
            {visibleStudents.length > 0 ? visibleStudents.map((s, i) => (
              <StudentRow 
                key={s.id || (startIndex + i)} 
                s={s} 
                idx={startIndex + i} 
                role={role} 
                handleEdit={handleEdit} 
                handleDelete={handleDelete} 
                findRankByName={findRankByName} 
              />
            )) : (
              <tr>
                <td colSpan="13" className="px-4 py-24 text-center">
                  <div className="flex flex-col items-center text-gray-300">
                    <FileSpreadsheet size={64} className="mb-4 opacity-10" />
                    <p className="text-lg font-bold tracking-tight">No student records found.</p>
                    <p className="text-sm mt-1">Try adding a new student or generating dummy data.</p>
                  </div>
                </td>
              </tr>
            )}
            {paddingBottom > 0 && <tr style={{ height: `${paddingBottom}px` }} aria-hidden="true"><td colSpan="13" /></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};
