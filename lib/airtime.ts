// lib/airtime.ts
import { supabase } from "@/lib/supabase"

export async function fetchAirtimeData() {
  // 1. Networks
  const { data: networks, error: netErr } = await supabase
    .from("airtime_networks")
    .select("id, code, name")
    .eq("is_active", true)
    .order("name", { ascending: true })
  if (netErr) throw netErr

  // 2. Denominations
  const { data: denoms, error: denomErr } = await supabase
    .from("airtime_denominations")
    .select("id, network_id, base_amount_naira, cashback_naira, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
  if (denomErr) throw denomErr

  return { networks, denominations: denoms }
}
