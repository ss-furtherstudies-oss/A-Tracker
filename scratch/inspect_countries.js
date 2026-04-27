
import { createClient } from '@supabase/supabase-client'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function inspect() {
  const { data, error } = await supabase
    .from('qs_rankings')
    .select('country')
    .limit(1000)
  
  if (error) {
    console.error(error)
    return
  }

  const countries = [...new Set(data.map(d => d.country))].sort()
  console.log(JSON.stringify(countries))
}

inspect()
