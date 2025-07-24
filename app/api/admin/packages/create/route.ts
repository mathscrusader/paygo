// File: app/api/admin/packages/create/route.ts

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    // Log incoming body for debugging
    const body = await request.json()
    console.log('Create package payload:', body)

    // 1. Authenticate and authorize
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse and validate input
    const { key, name, description = '', price } = body
    if (!key || !name || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: key, name, price' },
        { status: 400 }
      )
    }

    // 3. Prevent duplicate keys
    const { data: existing, error: selectErr } = await supabase
      .from('UpgradeLevel')
      .select('id')
      .eq('key', key)
      .limit(1)
    if (selectErr) {
      console.error('Error checking existing package:', selectErr)
      return NextResponse.json(
        { error: 'Database error during duplicate check' },
        { status: 500 }
      )
    }
    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: `Package with key '${key}' already exists.` },
        { status: 409 }
      )
    }

    // 4. Insert new package and return inserted record
    const { data: newPackage, error: insertErr } = await supabase
      .from('UpgradeLevel')
      .insert({ key, name, description, price })
      .select()
      .single()

    if (insertErr) {
      console.error('Failed to create package:', insertErr)
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    // 5. Return created record
    return NextResponse.json({ package: newPackage }, { status: 201 })

  } catch (err: any) {
    console.error('Unhandled error in create package route:', err)
    return NextResponse.json(
      { error: err.message ?? 'Internal Server Error' },
      { status: 500 }
    )
  }
}
