import React, { useState, useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker
} from 'react-simple-maps';
import { X } from 'lucide-react';

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-50m.json";

const topoJsonCountryMap = {
  'United States of America': 'United States',
  'Hong Kong': 'Hong Kong SAR',
  'China': 'China Mainland',
  'United Kingdom': 'United Kingdom',
  'Taiwan': 'Taiwan',
  'Singapore': 'Singapore',
  'Japan': 'Japan',
  'Australia': 'Australia',
  'Canada': 'Canada',
  'Netherlands': 'Netherlands',
  'Germany': 'Germany',
};

const COUNTRY_COORDS = {
  'United Kingdom': [ -3.4359, 55.3780 ], // [lng, lat]
  'Hong Kong SAR':  [ 114.1694, 22.3193 ],
  'United States':  [ -95.7129, 37.0902 ],
  'Australia':      [ 133.7751, -25.2744 ],
  'Canada':         [ -106.3468, 56.1304 ],
  'Singapore':      [ 103.8198, 1.3521 ],
  'Netherlands':    [ 5.2913, 52.1326 ],
  'Japan':          [ 138.2529, 36.2048 ],
  'Germany':        [ 10.4515, 51.1657 ],
  'China Mainland': [ 104.1954, 35.8617 ],
  'Taiwan':         [ 120.9605, 23.6978 ],
};

export const WorldMap = ({ students }) => {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [sliceMode, setSliceMode] = useState('year'); // 'year', 'uni', 'program'

  const studentsByCountryFlat = useMemo(() => {
    const map = {};
    students.forEach(s => {
      if (!map[s.country]) map[s.country] = [];
      map[s.country].push(s);
    });
    return map;
  }, [students]);

  const getInternalCountryName = (geoName) => {
    if (studentsByCountryFlat[geoName]) return geoName;
    const mappedName = topoJsonCountryMap[geoName];
    if (mappedName && studentsByCountryFlat[mappedName]) return mappedName;
    return null;
  };

  const handleCountryClick = (countryName) => {
    if (countryName) setSelectedCountry(countryName);
  };

  return (
    <div className="w-full h-[450px] bg-[#f8fafc] rounded-2xl overflow-hidden relative border border-gray-100 flex items-center justify-center group font-sans">
      
      {/* Map scale adjusted to 180 so Canada and South America are both perfectly visible without being clipped. */}
      <ComposableMap 
        projectionConfig={{ scale: 180, center: [0, 10] }} 
        width={800}
        height={400}
        className="w-full h-full focus:outline-none"
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const countryName = getInternalCountryName(geo.properties.name);
              const hasStudents = !!countryName;
              const isHovered = hoveredCountry === countryName && hasStudents;
              const isSelected = selectedCountry === countryName;

              let fill = "#e2e8f0";
              let stroke = "#cbd5e1";
              let strokeWidth = 0.5;
              let filter = "none";

              if (hasStudents) {
                fill = "#6366f1"; // Indigo
                stroke = "#ffffff";
                strokeWidth = 0.5;
              }

              if (isSelected) {
                 fill = "#14b8a6"; // Teal
                 strokeWidth = 1;
              } else if (isHovered) {
                 fill = "#8b5cf6";
                 strokeWidth = 2; 
                 filter = "drop-shadow(0px 4px 6px rgba(139, 92, 246, 0.4))";
              }

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={() => hasStudents && setHoveredCountry(countryName)}
                  onMouseLeave={() => setHoveredCountry(null)}
                  onClick={() => handleCountryClick(countryName)}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  style={{
                    default: { outline: 'none', transition: 'all 0.2s ease', filter },
                    hover: { outline: 'none', transition: 'all 0.2s ease', filter, cursor: hasStudents ? 'pointer' : 'default' },
                    pressed: { outline: 'none' },
                  }}
                />
              );
            })
          }
        </Geographies>

        {/* Render a marker for each active country so tiny places like HK and SG are visible and clickable */}
        {Object.keys(studentsByCountryFlat).map((country) => {
           const coords = COUNTRY_COORDS[country];
           if (!coords) return null;
           const isHovered = hoveredCountry === country;
           const isSelected = selectedCountry === country;
           
           return (
             <Marker 
               key={country} 
               coordinates={coords}
               onMouseEnter={() => setHoveredCountry(country)}
               onMouseLeave={() => setHoveredCountry(null)}
               onClick={() => handleCountryClick(country)}
               className="cursor-pointer"
             >
               <circle 
                 r={isSelected ? 6 : (isHovered ? 5 : 4)} 
                 fill={isSelected ? "#14b8a6" : (isHovered ? "#8b5cf6" : "#4f46e5")} 
                 stroke="#ffffff" 
                 strokeWidth={1.5} 
                 className="transition-all duration-300"
                 style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.2))" }}
               />
               {(isHovered || isSelected) && (
                 <text
                   textAnchor="middle"
                   y={-10}
                   style={{ fontFamily: "inherit", fill: "#1e293b", fontSize: "10px", fontWeight: 800 }}
                 >
                   {country}
                 </text>
               )}
             </Marker>
           );
        })}
      </ComposableMap>

      {/* Box Prompt Simulation (Centered Modal) */}
      {selectedCountry && (
        <div 
          className="absolute inset-0 z-20 flex items-center justify-center bg-slateBlue-800/20 backdrop-blur-sm p-4 animate-in fade-in duration-200 cursor-pointer"
          onClick={() => setSelectedCountry(null)}
        >
          <div 
            className="bg-white shadow-2xl rounded-2xl border border-gray-100 flex flex-col overflow-hidden w-full max-w-3xl max-h-[85%] animate-in zoom-in-95 duration-200 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-slateBlue-50 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h3 className="font-black text-slateBlue-800 text-sm uppercase tracking-widest flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-aura-teal"></span>
                 {selectedCountry}
              </h3>
              
              <div className="flex bg-white rounded-lg p-0.5 border border-gray-200 shadow-sm ml-auto mr-4">
                <button 
                  onClick={() => setSliceMode('year')}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-colors ${sliceMode === 'year' ? 'bg-slateBlue-800 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  By Year
                </button>
                <button 
                  onClick={() => setSliceMode('uni')}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-colors ${sliceMode === 'uni' ? 'bg-slateBlue-800 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  By Uni
                </button>
                <button 
                  onClick={() => setSliceMode('program')}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-colors ${sliceMode === 'program' ? 'bg-slateBlue-800 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  By Program
                </button>
              </div>

              <button 
                onClick={() => setSelectedCountry(null)} 
                className="p-1 text-gray-400 hover:text-slateBlue-800 hover:bg-white rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto grow custom-scrollbar space-y-4">
               {(() => {
                 const list = studentsByCountryFlat[selectedCountry] || [];
                 const grouped = {};
                 
                 list.forEach(s => {
                   let key = '';
                   if (sliceMode === 'year') key = s.year || 'Unknown Year';
                   else if (sliceMode === 'uni') key = s.uni || 'Unknown University';
                   else if (sliceMode === 'program') key = s.program || 'Unknown Program';
                   
                   if (!grouped[key]) grouped[key] = [];
                   grouped[key].push(s);
                 });

                 let sortedEntries;
                 if (sliceMode === 'year') {
                   sortedEntries = Object.entries(grouped).sort((a,b) => b[0].localeCompare(a[0])); // Year descending
                 } else {
                   sortedEntries = Object.entries(grouped).sort((a,b) => a[0].localeCompare(b[0])); // Alphabetical
                 }

                 return sortedEntries.map(([groupKey, groupList]) => (
                   <div key={groupKey} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                     <div className="px-3 py-2 bg-slate-50 border-b border-gray-100">
                       <span className="font-black text-sm text-slateBlue-800">{groupKey}</span>
                       <span className="text-xs text-gray-400 font-bold ml-2">({groupList.length} Students)</span>
                     </div>
                     <div className="overflow-x-auto w-full">
                       <table className="w-full text-left border-collapse text-xs">
                         <tbody className="divide-y divide-gray-50 bg-white">
                           {[...groupList].sort((a, b) => a.name.localeCompare(b.name)).map((s, i) => (
                             <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                               {sliceMode === 'year' && (
                                 <>
                                   <td className="py-1.5 px-3 font-bold text-slateBlue-800 align-top whitespace-nowrap w-[26%]">{s.name}</td>
                                   <td className="py-1.5 px-3 font-bold text-serene-indigo align-top break-words whitespace-normal leading-tight w-[37%]">{s.program}</td>
                                   <td className="py-1.5 px-3 font-bold text-aura-teal align-top break-words whitespace-normal leading-tight w-[37%]">{s.uni}</td>
                                 </>
                               )}
                               {sliceMode === 'uni' && (
                                 <>
                                   <td className="py-1.5 px-3 font-bold text-slateBlue-800 align-top whitespace-nowrap w-[26%]">{s.name}</td>
                                   <td className="py-1.5 px-3 font-bold text-serene-indigo align-top break-words whitespace-normal leading-tight w-[54%]">{s.program}</td>
                                   <td className="py-1.5 px-3 font-bold text-gray-400 align-top whitespace-nowrap w-[20%] text-right">{s.year}</td>
                                 </>
                               )}
                               {sliceMode === 'program' && (
                                 <>
                                   <td className="py-1.5 px-3 font-bold text-slateBlue-800 align-top whitespace-nowrap w-[26%]">{s.name}</td>
                                   <td className="py-1.5 px-3 font-bold text-aura-teal align-top break-words whitespace-normal leading-tight w-[54%]">{s.uni}</td>
                                   <td className="py-1.5 px-3 font-bold text-gray-400 align-top whitespace-nowrap w-[20%] text-right">{s.year}</td>
                                 </>
                               )}
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   </div>
                 ));
               })()}
            </div>
          </div>
        </div>
      )}

      {/* Floating tooltip for hover (only when no modal is open) */}
      {hoveredCountry && !selectedCountry && (
        <div className="absolute bottom-4 left-4 pointer-events-none bg-slateBlue-800 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg animate-in fade-in zoom-in duration-200">
           {hoveredCountry} — Click to view
        </div>
      )}
    </div>
  );
};
