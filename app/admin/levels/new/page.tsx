// app/admin/levels/new/page.tsx
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function NewLevelPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    key: '', name: '', price: '', icon: '', color: '', bgColor: '', borderColor: ''
  });
  const [error, setError] = useState<string | null>(null);

  function onChange(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // validate
    if (!form.key || !form.name || !form.price) {
      setError('Key, Name and Price are required');
      return;
    }
    try {
      const res = await fetch('/api/admin/levels/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: Number(form.price)
        })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      router.push('/admin/levels');
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">New Upgrade Level</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <Input placeholder="Key (e.g. silver)" value={form.key} onChange={onChange('key')} />
        <Input placeholder="Name (e.g. Silver Level)" value={form.name} onChange={onChange('name')} />
        <Input placeholder="Price" value={form.price} onChange={onChange('price')} type="number" />
        <Input placeholder="Icon (component name)" value={form.icon} onChange={onChange('icon')} />
        <Input placeholder="Color class" value={form.color} onChange={onChange('color')} />
        <Input placeholder="BG color class" value={form.bgColor} onChange={onChange('bgColor')} />
        <Input placeholder="Border color class" value={form.borderColor} onChange={onChange('borderColor')} />
        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white">
          Create Level
        </Button>
      </form>
    </div>
  );
}