// File: app/admin/packages/edit/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function EditPackagePage() {
  const router = useRouter()
  const params = useParams()
  const [form, setForm] = useState({ key: '', name: '', description: '', price: '' })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`/api/admin/packages/${params.id}`)
      const body = await res.json()
      if (res.ok) {
        setForm({
          key: body.package.key,
          name: body.package.name,
          description: body.package.description,
          price: String(body.package.price)
        })
      }
    }
    fetchData()
  }, [params.id])

  function onChange(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const res = await fetch(`/api/admin/packages/update/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: form.key,
          name: form.name,
          description: form.description,
          price: Number(form.price)
        })
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error)
      router.push('/admin/packages')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Edit Package</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <Input placeholder="Key" value={form.key} onChange={onChange('key')} className="h-12" />
        <Input placeholder="Name" value={form.name} onChange={onChange('name')} className="h-12" />
        <Textarea placeholder="Description" value={form.description} onChange={onChange('description')} rows={3} className="h-24" />
        <Input placeholder="Price" type="number" value={form.price} onChange={onChange('price')} className="h-12" />
        <div className="flex space-x-2">
          <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-14">Save</Button>
          <Button type="button" onClick={() => router.push('/admin/packages')} className="flex-1 bg-gray-300 hover:bg-gray-400 text-black h-14">Cancel</Button>
        </div>
      </form>
    </div>
  )
}


