import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
      <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
      <h2 className="text-xl font-semibold">Verifying payment...</h2>
    </div>
  )
}
