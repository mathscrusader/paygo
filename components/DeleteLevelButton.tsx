"use client";
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function DeleteLevelButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this level?')) return;
    setLoading(true);
    const res = await fetch('/api/admin/levels/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setLoading(false);
    if (res.ok) router.refresh();
    else alert((await res.json()).error || 'Delete failed');
  };

  return (
    <Button
      variant="destructive"
      onClick={handleDelete}
      disabled={loading}
      className="h-8"
    >
      {loading ? 'Deleting…' : 'Delete'}
    </Button>
  );
}