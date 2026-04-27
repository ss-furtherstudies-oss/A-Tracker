
const https = require('https');

const url = 'https://phioknruxrssialuhlbd.supabase.co/rest/v1/students?select=id,academicData';
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
      data.forEach(s => {
        const igcse = s.academicData?.igcse || [];
        const maCount = igcse.filter(d => d.subject === 'MA').length;
        if (maCount > 1) {
          console.log(`Student ${s.id.substring(0,8)} has ${maCount} MA entries in IGCSE. Grades: ${igcse.filter(d => d.subject === 'MA').map(d => d.grade).join(', ')}`);
        }
      });
    } catch (e) {
      console.error('Error:', e.message);
    }
  });
});
