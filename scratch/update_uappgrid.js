const fs = require('fs');
const path = 'd:\\Kimi\\2026.04.01 A-Tracker\\frontend\\src\\pages\\UAppGrid.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add exportModal state
content = content.replace(
  "const [importMsg, setImportMsg] = useState(null);",
  "const [importMsg, setImportMsg] = useState(null);\n  const [exportModal, setExportModal] = useState({ isOpen: false, type: null });"
);

// 2. Replace handleExportTemplate and handleDownloadAll with executeExport
const exportFuncsRegex = /\/\/ Generate Flat Excel Template[\s\S]+?const handleDownloadAll = \(\) => \{[\s\S]+?XLSX\.writeFile\(wb, `Atracker_UApp_Backup_\$\{new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]\}\.xlsx`\);\n  \};/m;

const executeExportStr = `  const executeExport = (type, targetYear) => {
    const headers = [
      'Grad Year', 'Student ID', 'Class', 'English Name', 'Chinese Name', 'Other Name',
      'Country', 'University', 'Program', 'Quali',
      'Offer Type', 'Conditions', 'Decision', 'Final Destination'
    ];

    // Strict filtering by graduation year and sort alphabetically by name
    const targetStudents = data
      .filter(s => targetYear === 'All' || String(s.grad_year) === String(targetYear))
      .sort((a, b) => {
        const nameA = (a.person.name_en || '').trim().toLowerCase();
        const nameB = (b.person.name_en || '').trim().toLowerCase();
        return nameA.localeCompare(nameB);
      });

    let sheetData;
    let filename;

    if (type === 'FULL') {
      const rows = [];
      targetStudents.forEach(s => {
        if (s.applications.length === 0) {
          rows.push([
            s.grad_year, s.student_num, '', s.person.name_en, s.person.name_zh, s.person.other_name,
            '', '', '', '', '', '', '', ''
          ]);
        } else {
          s.applications.forEach(app => {
            rows.push([
              s.grad_year, s.student_num, '', s.person.name_en, s.person.name_zh, s.person.other_name,
              app.country, app.university, app.program, app.quali,
              app.has_offer ? 'Y' : 'N', app.condition, app.decision, app.is_final ? 'Y' : 'N'
            ]);
          });
        }
      });
      sheetData = [headers, ...rows];
      filename = targetYear === 'All' ? \`Full_UApp_Data_All_\${new Date().toISOString().split('T')[0]}.xlsx\` : \`Full_UApp_Data_\${targetYear}_\${new Date().toISOString().split('T')[0]}.xlsx\`;
    } else {
      const rows = targetStudents.map(s => [
        s.grad_year, s.student_num, '', s.person.name_en, s.person.name_zh, s.person.other_name,
        '', '', '', '', '', '', '', ''
      ]);
      if (rows.length === 0) {
         const defaultRow = new Array(headers.length).fill('');
         sheetData = [headers, defaultRow, defaultRow, defaultRow, defaultRow, defaultRow];
      } else {
         sheetData = [headers, ...rows];
      }
      filename = targetYear === 'All' ? \`Template_UApp.xlsx\` : \`Template_UApp_\${targetYear}.xlsx\`;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    ws['!views'] = [{ state: "frozen", xSplit: 0, ySplit: 1 }];
    ws['!cols'] = headers.map(h => {
      if (h === 'English Name' || h === 'Student ID') return { wch: 20 };
      if (h === 'University' || h === 'Program' || h === 'Final Destination' || h === 'Conditions') return { wch: 30 };
      if (h === 'Grad Year' || h === 'Country') return { wch: 12 };
      return { wch: 15 };
    });

    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[cellAddress]) ws[cellAddress] = { t: 's', v: '' };
      ws[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFFFF" } },
        fill: { fgColor: { rgb: type === 'FULL' ? "FF334155" : "FF475569" } },
        alignment: { vertical: "center", horizontal: "center" }
      };
    }

    XLSX.utils.book_append_sheet(wb, ws, "U-App Data");
    XLSX.writeFile(wb, filename);
    setExportModal({ isOpen: false, type: null });
  };`;

content = content.replace(exportFuncsRegex, executeExportStr);

// 3. Update buttons
content = content.replace(
  /onClick=\{handleDownloadAll\}/g,
  "onClick={() => setExportModal({ isOpen: true, type: 'FULL' })}"
);
content = content.replace(
  /onClick=\{handleExportTemplate\}/g,
  "onClick={() => setExportModal({ isOpen: true, type: 'TEMPLATE' })}"
);

// 4. Update importXL responsiveness and arraybuffer
content = content.replace(
  /reader\.onload = \(evt\) => \{\s+try \{\s+const wb = XLSX\.read\(evt\.target\.result, \{ type: 'binary' \}\);/m,
  `reader.onload = (evt) => {
      setLocalLoading(true);
      setTimeout(() => {
        try {
          const data = new Uint8Array(evt.target.result);
          const wb = XLSX.read(data, { type: 'array' });`
);

content = content.replace(
  /reader\.readAsBinaryString\(file\);/g,
  "reader.readAsArrayBuffer(file);"
);

content = content.replace(
  /processImportData\(rows\);\s+\} catch \(err\) \{/m,
  `processImportData(rows);
        } catch (err) {
          console.error('Import error:', err);
          setImportMsg({ type: 'error', text: \`Import failed: \${err.message}\` });
          setLocalLoading(false);
          setTimeout(() => setImportMsg(null), 5000);
        }
      }, 50); // Timeout allows UI to show loading state`
);

// We need to also remove the old catch block which is now handled inside setTimeout
content = content.replace(
  /\} catch \(err\) \{\s+console\.error\('Import error:', err\);\s+setImportMsg\(\{ type: 'error', text: `Import failed: \$\{err\.message\}` \}\);\s+setTimeout\(\(\) => setImportMsg\(null\), 5000\);\s+\}\s+\};\s+reader\.readAsArrayBuffer\(file\);/m,
  `    };
    reader.readAsArrayBuffer(file);`
);

// 5. Add TemplateYearModal at bottom and its usage
const modalUsage = `
      {/* Template Year Selection Modal */}
      {exportModal.isOpen && (
        <TemplateYearModal
          type={exportModal.type}
          onClose={() => setExportModal({ isOpen: false, type: null })}
          onConfirm={(year) => executeExport(exportModal.type, year)}
          availableYears={gradYears}
        />
      )}
    </div>
  );
};`;

content = content.replace(
  /\s+<\/div>\s+<\/div>\s+\);\s+\};\s+export default UAppGrid;/m,
  modalUsage + `\n
const TemplateYearModal = ({ type, onClose, onConfirm, availableYears }) => {
  const [selectedYear, setSelectedYear] = useState('All');
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <div className="bg-[#f0f7ff] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-blue-100">
        <div className="p-6">
          <h3 className="text-xl font-black text-slateBlue-800 mb-2">
            {type === 'FULL' ? 'Export Full Data' : 'Export Template'}
          </h3>
          <p className="text-sm text-gray-500 mb-6 font-medium">
            {type === 'FULL' ? 'Select a year to download a full data backup.' : 'Configure your template download.'}
          </p>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Year</label>
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full px-4 py-3 bg-white border border-blue-100 rounded-xl font-bold text-slateBlue-800 outline-none">
                {availableYears.map(year => <option key={year} value={year}>{year === 'All' ? 'All Years' : year}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={onClose} className="flex-1 px-4 py-3 text-sm font-black text-gray-500 bg-white border border-gray-200 rounded-xl active:scale-95">CANCEL</button>
              <button onClick={() => onConfirm(selectedYear)} className="flex-1 px-4 py-3 text-sm font-black text-white bg-aura-teal rounded-xl shadow-lg shadow-aura-teal/20 active:scale-95">DOWNLOAD</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UAppGrid;`
);


fs.writeFileSync(path, content, 'utf8');
console.log('Done');
