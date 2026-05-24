import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/authOptions"

export async function GET(request) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: wishlists, error } = await supabaseAdmin
      .from('wishlists')
      .select(`
        listing_id,
        listings (*)
      `)
      .eq('user_id', session.user.id)

    if (error) throw error

    // Map to the expected frontend structure
    const formattedWishlist = wishlists.map(w => w.listings).filter(Boolean)
    return NextResponse.json({ wishlist: formattedWishlist })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { listingId } = await request.json()
    const { error } = await supabaseAdmin
      .from('wishlists')
      .insert({ user_id: session.user.id, listing_id: listingId })

    // Ignore unique constraint errors (already in wishlist)
    if (error && error.code !== '23505') throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listingId')

    if (listingId) {
      const { error } = await supabaseAdmin
        .from('wishlists')
        .delete()
        .eq('user_id', session.user.id)
        .eq('listing_id', listingId)

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
