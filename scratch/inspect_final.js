
const https = require('https');
const fs = require('fs');

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
      const subjectCounts = {};
      const matching = [];

      data.forEach(student => {
        const igcse = student.academicData?.igcse || [];
        igcse.forEach(entry => {
          const subject = entry.subject || 'UNDEFINED';
          subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
          
          const upper = subject.toUpperCase();
          if (upper.includes('0606') || upper.includes('AMA') || upper.includes('ADD') || upper.includes('MATH')) {
            matching.push({
              id: student.id,
              subject: entry.subject,
              grade: entry.grade
            });
          }
        });
      });

      console.log('--- Unique IGCSE Subjects ---');
      Object.entries(subjectCounts).sort((a,b) => b[1] - a[1]).forEach(([k,v]) => {
        console.log(`${v.toString().padStart(4)} x "${k}"`);
      });

      console.log('\n--- Math-related matches ---');
      matching.forEach(m => {
        console.log(`Student ${m.id.substring(0,8)}: "${m.subject}" (Grade: ${m.grade})`);
      });
    } catch (e) {
      console.error('Error parsing JSON:', e.message);
      console.log('Body snippet:', body.substring(0, 100));
    }
  });
}).on('error', (e) => {
  console.error('Error fetching data:', e.message);
});
