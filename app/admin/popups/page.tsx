// app/admin/popups/page.tsx
import Link from "next/link"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { ArrowLeft } from "lucide-react"

export default async function PopupsPage() {
  const { data: popups, error } = await supabaseAdmin
    .from("popups")
    .select("*")
    .order("start_at", { ascending: false })

  if (error) {
    console.error("Error fetching popups:", error)
    return <p className="p-6 text-red-600">Error loading popups.</p>
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] pb-12">
      <header className="bg-gradient-to-r from-[#34296B] to-[#4B3A8C] text-white p-5 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto flex items-center">
          <Link
            href="/admin"
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-transform hover:-rotate-6"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="ml-4 text-2xl font-bold">Manage Popups</h1>
        </div>
      </header>

      <main className="container mx-auto p-6 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#34296B]">All Popups</h2>
          <Link
            href="/admin/popups/new"
            className="px-4 py-2 bg-gradient-to-r from-[#34296B] to-[#4B3A8C] text-white rounded-lg"
          >
            + New Popup
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f0f2ff]">
              <tr>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Start</th>
                <th className="p-3 text-left">End</th>
                <th className="p-3 text-center">Duration</th>
                <th className="p-3 text-center">Max/User</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {popups.map((p) => (
                <tr key={p.id} className="border-t hover:bg-[#f9f9ff]">
                  <td className="p-3">{p.title}</td>
                  <td className="p-3">{new Date(p.start_at).toLocaleString()}</td>
                  <td className="p-3">{new Date(p.end_at).toLocaleString()}</td>
                  <td className="p-3 text-center">{p.duration_minutes}m</td>
                  <td className="p-3 text-center">{p.max_displays_per_user}</td>
                  <td className="p-3 text-center space-x-2">
                    <Link
                      href={`/admin/popups/${p.id}/edit`}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/admin/popups/${p.id}/delete`}
                      className="px-2 py-1 bg-red-100 text-red-800 rounded"
                    >
                      Delete
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
