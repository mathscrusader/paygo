"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft } from 'lucide-react'

export default function NewUserPage() {
  const router = useRouter()
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'USER' 
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    const { error } = await supabase.auth.admin.createUser({
      email: form.email,
      password: form.password,
      user_metadata: { name: form.name, role: form.role },
      email_confirm: true,
    })
    if (!error) router.push('/admin/users')
    else alert(error.message)
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 pb-24">
      {/* 3D Floating Header */}
      <header className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-5 sticky top-0 z-50 shadow-2xl border-b-4 border-purple-400/30">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold tracking-wide">Add New User</h1>
        </div>
      </header>

      <main className="p-4 max-w-md mx-auto">
        {/* 3D Form Card */}
        <div className="bg-white/90 rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50">
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6">User Information</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="mt-1 p-3 border border-gray-300 rounded-xl w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="mt-1 p-3 border border-gray-300 rounded-xl w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  className="mt-1 p-3 border border-gray-300 rounded-xl w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User Role</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="mt-1 p-3 border border-gray-300 rounded-xl w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="USER">Standard User</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`w-full py-3 px-4 rounded-xl shadow-lg transition-all ${
                  isSubmitting 
                    ? 'bg-indigo-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl hover:-translate-y-0.5'
                } text-white font-medium`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating User...
                  </span>
                ) : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 3D Floating Bottom Navigation */}
      <nav className="fixed bottom-4 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 flex justify-around p-2">
        <button 
          onClick={() => router.push('/admin')}
          className="flex flex-col items-center p-2 text-gray-500 hover:bg-gray-50 rounded-xl transition-all"
        >
          <span className="text-2xl">📊</span>
          <span className="text-xs mt-1 font-medium">Dashboard</span>
        </button>
        <button 
          onClick={() => router.push('/admin/users')}
          className="flex flex-col items-center p-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
        >
          <span className="text-2xl">👥</span>
          <span className="text-xs mt-1 font-medium">Users</span>
        </button>
        <button 
          onClick={() => router.push('/admin/history')}
          className="flex flex-col items-center p-2 text-gray-500 hover:bg-gray-50 rounded-xl transition-all"
        >
          <span className="text-2xl">🕒</span>
          <span className="text-xs mt-1 font-medium">History</span>
        </button>
      </nav>
    </div>
  )
}