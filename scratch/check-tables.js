
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

async function check() {
  const { data, error } = await supabase.rpc('get_tables')
  console.log(data)
}
check()
