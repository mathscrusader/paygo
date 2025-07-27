import { supabase } from "@/lib/supabase"

export async function syncClientTransactions(userId: string) {
  const raw = localStorage.getItem("paygo-transactions")
  if (!raw) return { synced: 0, skipped: 0 }

  let parsed: any[]
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { synced: 0, skipped: 0 }
  }

  // Filter: only airtime/data & not yet synced
  const transactionsToSync = parsed.filter((tx: any) => {
    const isData = tx.description?.toLowerCase().startsWith("data purchase")
    const isAirtime = !isData
    return (
      (isData || isAirtime) &&
      !tx.synced // we'll mark it after sync
    )
  })

  if (transactionsToSync.length === 0) return { synced: 0, skipped: parsed.length }

  // Prepare for insert
  const toInsert = transactionsToSync.map(tx => ({
    userId,
    type: tx.type,
    category: tx.description?.toLowerCase().startsWith("data purchase")
      ? "data"
      : "airtime",
    description: tx.description,
    amount: tx.amount,
    original_amount: tx.original_amount || null,
    discount_percent: tx.discount_percent || null,
    date: new Date(tx.date).toISOString(),
    meta: { id: tx.id },
  }))

  const { error, data } = await supabase
    .from("ClientTransaction")
    .insert(toInsert)

  if (!error) {
    // Mark synced in localStorage
    const updated = parsed.map(tx => {
      const matched = transactionsToSync.find(t => t.id === tx.id)
      return matched ? { ...tx, synced: true } : tx
    })
    localStorage.setItem("paygo-transactions", JSON.stringify(updated))
  }

  return {
    synced: toInsert.length,
    skipped: parsed.length - toInsert.length,
    error: error?.message || null,
  }
}
