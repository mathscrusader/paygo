// File: app/admin/packages/new/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function NewPackagePage() {
  const router = useRouter()
  const [form, setForm] = useState({ 
    key: '', 
    name: '', 
    description: '', 
    price: '' 
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function onChange(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    if (!form.key || !form.name || !form.price) {
      setError('Key, Name, and Price are required.')
      setIsSubmitting(false)
      return
    }

    try {
      const res = await fetch('/api/admin/packages/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: form.key,
          name: form.name,
          description: form.description,
          price: Number(form.price)
        })
      })
      
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Failed to create package')
      }

      router.push('/admin/packages')
    } catch (err: any) {
      setError(err.message)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-purple-50 pb-16">
      {/* Header */}
      <header className="bg-purple-700 text-white p-4 shadow-md">
        <div className="container mx-auto flex items-center">
          <Link href="/admin/packages" className="mr-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold">New Package</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-900 mb-1">Package Key *</label>
              <Input
                placeholder="silver"
                value={form.key}
                onChange={onChange('key')}
                className="h-12 border-purple-200 focus:border-purple-500 focus:ring-purple-500 placeholder:text-gray-300"
              />
              <p className="text-xs text-gray-400 mt-1">Unique identifier (lowercase, no spaces)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-900 mb-1">Package Name *</label>
              <Input
                placeholder="Silver Level"
                value={form.name}
                onChange={onChange('name')}
                className="h-12 border-purple-200 focus:border-purple-500 focus:ring-purple-500 placeholder:text-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-900 mb-1">Description</label>
              <Textarea
                placeholder="Describe what this package includes..."
                value={form.description}
                onChange={onChange('description')}
                rows={3}
                className="border-purple-200 focus:border-purple-500 focus:ring-purple-500 placeholder:text-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-900 mb-1">Price (₦) *</label>
              <Input
                placeholder="7500"
                type="number"
                value={form.price}
                onChange={onChange('price')}
                className="h-12 border-purple-200 focus:border-purple-500 focus:ring-purple-500 placeholder:text-gray-300"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className={`w-full h-14 text-white ${isSubmitting ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'}`}
            >
              {isSubmitting ? 'Creating Package...' : 'Create Package'}
            </Button>
          </form>
        </div>
      </main>

      {/* Consistent Bottom Navigation for all devices */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-purple-100 flex justify-around p-2">
        <Link href="/admin" className="flex flex-col items-center text-purple-700 p-1">
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs md:text-sm mt-0.5">Dashboard</span>
        </Link>
        <Link href="/admin/packages" className="flex flex-col items-center text-purple-700 font-bold p-1">
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span className="text-xs md:text-sm mt-0.5">Packages</span>
        </Link>
        <Link href="/admin/payid" className="flex flex-col items-center text-purple-700 p-1">
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-xs md:text-sm mt-0.5">Pay IDs</span>
        </Link>
      </nav>
    </div>
  )
}