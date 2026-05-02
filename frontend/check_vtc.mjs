import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
const envFile = fs.readFileSync(envPath, 'utf8');

let supabaseUrl = '';
let supabaseAnonKey = '';

envFile.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseAnonKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDB() {
  const { data, error } = await supabase
    .from('qs_rankings')
    .select('university')
    .in('university', [
      'VTC (Vocational Training Council)',
      '宮崎國際大學 Miyazaki International University',
      'University of South Australia',
      'Rhode Island School of Design'
    ]);

  if (error) {
    console.error("Error fetching:", error);
  } else {
    console.log("Found matching universities in qs_rankings:");
    console.log(data);
  }
}

checkDB();
