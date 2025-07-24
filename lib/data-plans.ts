// lib/data-plans.ts
import { supabase } from "@/lib/supabase"

export async function fetchDataPlans() {
  const { data, error } = await supabase
    .from("data_plans")
    .select("id, network_code, size_label, size_mb, duration_label, duration_days, base_price_naira, sort_order")
    .eq("is_active", true)
    .order("network_code", { ascending: true })
    .order("sort_order", { ascending: true })

  if (error) throw error
  return data
}
