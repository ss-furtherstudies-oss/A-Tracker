
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://phioknruxrssialuhlbd.supabase.co';
const supabaseAnonKey = 'sb_publishable_5mGTyK1tiT3FUFvVEiF3_Q_lfEBeJPC';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectIGCSEData() {
  console.log('Fetching students to inspect IGCSE subject names...');
  
  const { data, error } = await supabase
    .from('students')
    .select('id, academicData');

  if (error) {
    console.error('Error fetching data:', error.message);
    return;
  }

  const subjectCounts = {};
  const matchingSamples = [];

  data.forEach(student => {
    const igcse = student.academicData?.igcse || [];
    igcse.forEach(entry => {
      const subject = entry.subject || 'UNDEFINED';
      subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
      
      const upper = subject.toUpperCase();
      if (upper.includes('0606') || upper.includes('AMA') || upper.includes('ADD') || upper.includes('MATH')) {
        matchingSamples.push({
          studentId: student.id,
          rawSubject: entry.subject,
          grade: entry.grade
        });
      }
    });
  });

  console.log('\n--- Unique IGCSE Subject Names Found in DB ---');
  Object.entries(subjectCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => {
      console.log(`${count.toString().padStart(4)} x "${name}"`);
    });

  console.log('\n--- Samples matching "AMA/0606/Math" ---');
  matchingSamples.slice(0, 20).forEach(s => {
    console.log(`Student ${s.studentId.substring(0,8)}: "${s.rawSubject}" (Grade: ${s.grade})`);
  });
}

inspectIGCSEData();
