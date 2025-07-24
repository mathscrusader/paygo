// 2️⃣ Edit Page: `/app/admin/levels/edit/[id]/page.tsx`

"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';

export default function EditLevelPage() {
  const router = useRouter();
  const { id } = useParams();
  const [form, setForm] = useState({ key: '', name: '', price: '', icon: '', color: '', bgColor: '', borderColor: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('upgradelevel')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        setError(error.message);
      } else if (data) {
        setForm({
          key: data.key,
          name: data.name,
          price: data.price.toString(),
          icon: data.icon || '',
          color: data.color || '',
          bgColor: data.bgColor || '',
          borderColor: data.borderColor || ''
        });
      }
    }
    load();
  }, [id]);

  function onChange(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/admin/levels/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          key: form.key,
          name: form.name,
          price: Number(form.price),
          icon: form.icon,
          color: form.color,
          bgColor: form.bgColor,
          borderColor: form.borderColor
        })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      router.push('/admin/levels');
    } catch (err:any) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Edit Upgrade Level</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <Input placeholder="Key" value={form.key} onChange={onChange('key')} />
        <Input placeholder="Name" value={form.name} onChange={onChange('name')} />
        <Input placeholder="Price" type="number" value={form.price} onChange={onChange('price')} />
        <Input placeholder="Icon" value={form.icon} onChange={onChange('icon')} />
        <Input placeholder="Color class" value={form.color} onChange={onChange('color')} />
        <Input placeholder="BG color class" value={form.bgColor} onChange={onChange('bgColor')} />
        <Input placeholder="Border color class" value={form.borderColor} onChange={onChange('borderColor')} />
        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          Update Level
        </Button>
      </form>
    </div>
  );
}
