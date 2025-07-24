// app/api/user/payid/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase';
import { generatePayId } from '@/lib/utils/generatePayId';

export async function POST(request: Request) {
  // 1. Ensure user is authenticated
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Generate new Pay ID
  const payId = generatePayId();

  // 3. Update user record in Supabase
  const { data, error } = await supabase
    .from('User')
    .update({ payId })
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error('Error assigning Pay ID:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 4. Return the new Pay ID
  return NextResponse.json({ payId: data.payId });
}
