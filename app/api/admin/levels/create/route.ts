// app/api/admin/levels/create/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { key, name, price, icon, color, bgColor, borderColor } = await request.json();

  const { data, error } = await supabase
    .from('UpgradeLevel')
    .insert([{ key, name, price, icon, color, bgColor, borderColor }]);

  if (error) {
    console.error('Create level error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ level: data[0] });
}