// scripts/list-columns.ts

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function listColumns(table: string) {
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_schema', 'public')
    .eq('table_name', table)

  if (error) {
    console.error(`Error fetching columns for ${table}:`, error.message)
    return
  }

  console.log(`\nColumns in ${table}:`)
  console.log(data!.map((c) => c.column_name).join(', '))
}

async function main() {
  for (const table of ['User', 'Transaction', 'Bank', 'PaymentMethod']) {
    await listColumns(table)
  }
}

main().catch(console.error)
