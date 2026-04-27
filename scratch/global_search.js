
const https = require('https');

const url = 'https://phioknruxrssialuhlbd.supabase.co/rest/v1/students?select=*';
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
    const upper = body.toUpperCase();
    ['0606', 'AMA', 'ADDITIONAL', 'ADD MATH'].forEach(term => {
      console.log(`Term ${term}: ${upper.split(term).length - 1} occurrences`);
    });
    
    if (upper.includes('0606')) {
        console.log('\n--- Context for 0606 ---');
        const idx = upper.indexOf('0606');
        console.log(body.substring(idx - 100, idx + 100));
    }
    if (upper.includes('AMA')) {
        console.log('\n--- Context for AMA ---');
        const idx = upper.indexOf('AMA');
        console.log(body.substring(idx - 100, idx + 100));
    }
  });
});
