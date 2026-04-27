
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://phioknruxrssialuhlbd.supabase.co';
const supabaseAnonKey = 'sb_publishable_5mGTyK1tiT3FUFvVEiF3_Q_lfEBeJPC';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
  const { data, error } = await supabase
    .from('students')
    .select('id, academicData, igcse_score')
    .limit(100);

  if (error) {
    console.error('Error:', error);
    return;
  }

  const subjectsFound = new Set();
  data.forEach(s => {
    const igcseData = s.academicData?.igcse || [];
    igcseData.forEach(d => {
      subjectsFound.add(d.subject);
      if (d.subject && (d.subject.includes('0606') || d.subject.includes('AMA'))) {
        console.log(`Found in student ${s.id}:`, d);
      }
    });
  });

  console.log('Unique subjects found in igcse:', Array.from(subjectsFound));
}

checkData();
