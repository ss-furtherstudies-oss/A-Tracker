
const https = require('https');

const url = 'https://phioknruxrssialuhlbd.supabase.co/rest/v1/students?select=id,igcse_score,academicData';
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
        const scoreStr = s.igcse_score || '';
        if (!scoreStr || scoreStr === '-') return;
        
        // Parse "5A*, 3A" -> 5 + 3 = 8
        const parts = scoreStr.split(',');
        let totalInScore = 0;
        parts.forEach(p => {
          const m = p.trim().match(/^(\d+)/);
          if (m) totalInScore += parseInt(m[1]);
          else if (p.trim().length > 0) totalInScore += 1;
        });

        const totalInData = (s.academicData?.igcse || []).length;
        if (totalInScore > totalInData) {
          console.log(`Student ${s.id.substring(0,8)}: Summary has ${totalInScore} grades, but Data has only ${totalInData}. Summary: "${scoreStr}"`);
        }
      });
    } catch (e) {
      console.error('Error:', e.message);
    }
  });
});
