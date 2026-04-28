import React, { useState, useRef } from 'react';
import { Download, Copy, Check, ChevronDown } from 'lucide-react';

export const Card = ({ children, className = '', title, icon: Icon, headerExtra }) => {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef(null);

  const handleAction = () => {
    const svg = cardRef.current.querySelector('svg');
    const table = cardRef.current.querySelector('table');

    if (svg) {
      try {
        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(svg);
        
        if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
            source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
            source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
        }

        const fullSource = '<?xml version="1.0" standalone="no"?>\r\n' + source;
        const blob = new Blob([fullSource], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.href = url;
        link.download = `${title || 'chart'}.svg`.replace(/\s+/g, '_');
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("SVG Export failed:", err);
      }
    } else if (table) {
      const rows = Array.from(table.querySelectorAll('tr'));
      const text = rows.map(row => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        return cells.map(cell => cell.innerText.replace(/\n/g, ' ').trim()).join('\t');
      }).join('\n');
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div ref={cardRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible relative group flex flex-col h-full">
      {title && (
        <div className="px-5 py-2.5 border-b border-gray-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {Icon && <Icon size={18} className="text-slateBlue-600" />}
            <h3 className="text-[14px] font-black text-slateBlue-800 uppercase tracking-widest">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
             {headerExtra}
             <button 
               onClick={handleAction}
               className="p-1.5 hover:bg-slateBlue-50 rounded-lg transition-all text-gray-400 hover:text-aura-teal"
               title="Download/Copy"
             >
               {copied ? <Check size={14} className="text-emerald-500" /> : (cardRef.current?.querySelector('svg') ? <Download size={14} /> : <Copy size={14} />)}
             </button>
          </div>
        </div>
      )}
      <div className={`grow bg-white rounded-b-2xl ${className}`}>
        {children}
      </div>
    </div>
  );
};

export const MetricCard = ({ title, value, icon: Icon, color }) => (
  <Card className="p-4">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10 shrink-0`}>
        <Icon className={`${color.replace('bg-', 'text-')}`} size={24} />
      </div>
      <div className="flex flex-col justify-center">
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{title}</p>
        <h3 className="text-2xl font-black text-slateBlue-800 mt-0.5 leading-none">{value}</h3>
      </div>
    </div>
  </Card>
);

export const StackedTooltip = ({ active, payload, label, isNumericGrades }) => {
  if (!active || !payload || !payload.length) return null;
  const items = [...payload].reverse();
  const cols = isNumericGrades ? 'grid-cols-3' : (items.length > 8 ? 'grid-cols-5' : 'grid-cols-4');
  
  const studentCount = payload[0].payload.studentCount;
  const totalCount = payload[0].payload.totalCount || payload[0].payload.count;

  return (
    <div className="bg-white/95 backdrop-blur-sm p-2 rounded-xl shadow-2xl border border-gray-100 min-w-[120px] pointer-events-none">
      <div className="text-[10px] font-black text-gray-400 mb-1.5 border-b border-gray-100 pb-1 flex justify-between uppercase tracking-tighter gap-3">
        <span>Cohort {label}</span>
        <span className="text-aura-teal">
          {studentCount ? `${studentCount} Students (${totalCount} Grades)` : `${totalCount} Results`}
        </span>
      </div>
      <div className={`grid ${cols} gap-x-2 gap-y-1.5`}>
        {items.map((entry) => {
          const rawCount = entry.payload.rawCounts?.[entry.name];
          return (
            <div key={entry.name} className="flex flex-col items-center leading-none">
              <span className="text-[10px] font-black uppercase mb-0.5" style={{ color: entry.fill }}>{entry.name}</span>
              <span className="text-[11px] font-bold text-slateBlue-800">{entry.value}%</span>
              {rawCount !== undefined && (
                <span className="text-[8px] text-gray-400 font-bold mt-0.5">({rawCount})</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
