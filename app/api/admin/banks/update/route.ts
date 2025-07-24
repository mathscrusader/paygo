// File: app/api/admin/banks/update/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PUT(request: Request) {
  try {
    const {
      id,
      name,
      accountnumber,
      accountname,
      logo,
      status,
      statuscolor,
    } = await request.json();

    const { error } = await supabase
      .from('Bank')
      .update({
        name,
        accountnumber,
        accountname,
        logo,
        status,
        statuscolor,
      })
      .eq('id', id);

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Bank account updated successfully' }, { status: 200 });
  } catch (err: any) {
    console.error('PUT /api/admin/banks/update error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
