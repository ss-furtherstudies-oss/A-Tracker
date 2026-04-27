
const https = require('https');

const url = 'https://phioknruxrssialuhlbd.supabase.co/rest/v1/students?select=academicData';
const options = {
  headers: {
    'apikey': 'sb_publishable_5mGTyK1tiT3FUFvVEiF3_Q_lfEBeJPC',
    'Authorization': 'Bearer sb_publishable_5mGTyK1tiT3FUFvVEiF3_Q_lfEBeJPC'
  }
};

https.get(url, options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      const stats = { igcse: {}, ias: {}, ial: {} };

      data.forEach(s => {
        ['igcse', 'ias', 'ial'].forEach(key => {
          (s.academicData?.[key] || []).forEach(entry => {
            const subj = entry.subject || 'UNDEFINED';
            stats[key][subj] = (stats[key][subj] || 0) + 1;
          });
        });
      });

      for (const section in stats) {
        console.log(`\n--- ${section.toUpperCase()} Subjects ---`);
        Object.entries(stats[section]).sort((a,b) => b[1] - a[1]).forEach(([k,v]) => {
          console.log(`${v.toString().padStart(4)} x "${k}"`);
        });
      }
    } catch (e) {
      console.error('Error:', e.message);
    }
  });
});
