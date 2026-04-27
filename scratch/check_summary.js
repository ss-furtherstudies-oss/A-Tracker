
const https = require('https');

const url = 'https://phioknruxrssialuhlbd.supabase.co/rest/v1/students?select=id,igcse_score';
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
      const scoresFound = [];

      data.forEach(student => {
        const score = student.igcse_score || '';
        if (score.toUpperCase().includes('AMA') || score.includes('0606')) {
          scoresFound.push({ id: student.id, score });
        }
      });

      console.log(`--- Students with AMA/0606 in igcse_score (${scoresFound.length} found) ---`);
      scoresFound.forEach(s => {
        console.log(`Student ${s.id.substring(0,8)}: "${s.score}"`);
      });
    } catch (e) {
      console.error('Error:', e.message);
    }
  });
});
