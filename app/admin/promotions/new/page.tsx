// app/admin/promotions/new/page.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export default function NewPromotionPage() {
  async function createPromotion(formData: FormData) {
    'use server'
    const title       = formData.get('title')?.toString()       || ''
    const slug        = formData.get('slug')?.toString()        || ''
    const description = formData.get('description')?.toString() || ''
    const image_url   = formData.get('image_url')?.toString()   || ''
    const link_url    = formData.get('link_url')?.toString()    || ''
    const content     = formData.get('content')?.toString()     || ''
    const start_date  = formData.get('start_date')?.toString()  || null
    const end_date    = formData.get('end_date')?.toString()    || null
    const is_active   = formData.get('is_active') === 'on'

    const { error } = await supabaseAdmin
      .from('promotions')
      .insert([{
        title,
        slug,
        description,
        image_url,
        link_url,
        content,
        start_date: start_date || undefined,
        end_date:   end_date   || undefined,
        is_active,
      }])

    if (error) console.error('Error creating promotion:', error)
    redirect('/admin/promotions')
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Add Promotion</h1>
      <form
        action={createPromotion}
        className="space-y-4 bg-white p-4 rounded shadow"
      >
        <div>
          <label htmlFor="title" className="block mb-1 font-medium">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <div>
          <label htmlFor="slug" className="block mb-1 font-medium">
            Slug
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <div>
          <label htmlFor="description" className="block mb-1 font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <div>
          <label htmlFor="image_url" className="block mb-1 font-medium">
            Image URL
          </label>
          <input
            id="image_url"
            name="image_url"
            type="text"
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <div>
          <label htmlFor="link_url" className="block mb-1 font-medium">
            Link URL
          </label>
          <input
            id="link_url"
            name="link_url"
            type="text"
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <div>
          <label htmlFor="content" className="block mb-1 font-medium">
            Content
          </label>
          <textarea
            id="content"
            name="content"
            rows={4}
            className="w-full border px-2 py-1 rounded"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_date" className="block mb-1 font-medium">
              Start Date
            </label>
            <input
              id="start_date"
              name="start_date"
              type="date"
              className="w-full border px-2 py-1 rounded"
            />
          </div>
          <div>
            <label htmlFor="end_date" className="block mb-1 font-medium">
              End Date
            </label>
            <input
              id="end_date"
              name="end_date"
              type="date"
              className="w-full border px-2 py-1 rounded"
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="is_active"
            name="is_active"
            type="checkbox"
            defaultChecked
            className="mr-2"
          />
          <label htmlFor="is_active" className="font-medium">
            Active
          </label>
        </div>

        <div className="flex space-x-2">
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500"
          >
            Save
          </button>
          <Link href="/admin/promotions">
            <button
              type="button"
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
          </Link>
        </div>
      </form>
    </div>
  )
}
