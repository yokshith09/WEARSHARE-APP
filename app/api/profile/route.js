import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/authOptions"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: profile, error } = await supabaseAdmin
      .from('users')
      .select('id,name,email,address,image,is_verified,rating,role,measurements')
      .eq('id', session.user.id)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json({
      id: session.user.id,
      name: profile?.name || session.user.name || '',
      email: profile?.email || session.user.email || '',
      address: profile?.address || '',
      image: profile?.image || session.user.image || '',
      isVerified: Boolean(profile?.is_verified),
      rating: profile?.rating || 4.5,
      role: profile?.role || 'renter',
      measurements: profile?.measurements || {},
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(request) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const data = await request.json()
    const { data: currentProfile } = await supabaseAdmin
      .from('users')
      .select('name,email,address,measurements')
      .eq('id', session.user.id)
      .maybeSingle()

    const { error } = await supabaseAdmin
      .from('users')
      .upsert({
        id: session.user.id,
        name: data.name ?? currentProfile?.name ?? session.user.name ?? null,
        email: data.email ?? currentProfile?.email ?? session.user.email ?? null,
        address: data.address ?? currentProfile?.address ?? null,
        measurements: data.measurements ?? currentProfile?.measurements ?? {},
      }, { onConflict: 'id' })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
