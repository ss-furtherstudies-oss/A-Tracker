import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://phioknruxrssialuhlbd.supabase.co';
const supabaseAnonKey = 'sb_publishable_5mGTyK1tiT3FUFvVEiF3_Q_lfEBeJPC';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
