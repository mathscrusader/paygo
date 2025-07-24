import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, key, name, price, icon, color, bgColor, borderColor } = await request.json();
  const { data, error } = await supabase
    .from('upgradelevel')
    .update({ key, name, price, icon, color, bgColor, borderColor })
    .eq('id', id)
    .single();

  if (error) {
    console.error('Update level error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ level: data });
}
