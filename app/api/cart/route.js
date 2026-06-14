import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/authOptions"

export async function GET(request) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Find or create cart
  let { data: cart, error: cartLookupError } = await supabaseAdmin
    .from('carts')
    .select('id')
    .eq('user_id', session.user.id)
    .maybeSingle()

  if (cartLookupError) {
    return NextResponse.json({ error: cartLookupError.message }, { status: 500 })
  }

  if (!cart) {
    const { data: newCart, error: createCartError } = await supabaseAdmin
      .from('carts')
      .insert({ user_id: session.user.id })
      .select('id')
      .single()
    if (createCartError) {
      return NextResponse.json({ error: createCartError.message }, { status: 500 })
    }
    cart = newCart
  }

  if (!cart) return NextResponse.json({ items: [] })

  const { data: cartItems } = await supabaseAdmin
    .from('cart_items')
    .select(`
      days,
      rental_start,
      rental_end,
      listing_id,
      listings (
        id,
        title,
        rental_price_per_day,
        security_deposit,
        size,
        category,
        owner_id,
        image_url
      )
    `)
    .eq('cart_id', cart.id)

  const formattedItems = (cartItems || []).map(item => ({
    listingId: item.listing_id,
    name: item.listings?.title,
    rentalPricePerDay: item.listings?.rental_price_per_day,
    securityDeposit: item.listings?.security_deposit,
    imageUrl: item.listings?.image_url,
    size: item.listings?.size,
    category: item.listings?.category,
    days: item.days,
    rentalStart: item.rental_start,
    rentalEnd: item.rental_end,
    ownerId: item.listings?.owner_id
  }))

  return NextResponse.json({ items: formattedItems })
}

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { listingId, days, rentalStart, rentalEnd } = await request.json()

  const { data: listing, error: listingError } = await supabaseAdmin
    .from('listings')
    .select('id, owner_id')
    .eq('id', listingId)
    .single()

  if (listingError || !listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (listing.owner_id === session.user.id) {
    return NextResponse.json({ error: 'You cannot rent your own listing' }, { status: 400 })
  }

  // Find or create cart
  let { data: cart, error: cartLookupError } = await supabaseAdmin
    .from('carts')
    .select('id')
    .eq('user_id', session.user.id)
    .maybeSingle()

  if (cartLookupError) {
    return NextResponse.json({ error: cartLookupError.message }, { status: 500 })
  }

  if (!cart) {
    const { data: newCart, error: createCartError } = await supabaseAdmin
      .from('carts')
      .insert({ user_id: session.user.id })
      .select('id')
      .single()
    if (createCartError) {
      return NextResponse.json({ error: createCartError.message }, { status: 500 })
    }
    cart = newCart
  }

  // Upsert cart item
  const { error: upsertError } = await supabaseAdmin
    .from('cart_items')
    .upsert(
      {
        cart_id: cart.id,
        listing_id: listingId,
        days: days || 1,
        rental_start: rentalStart || null,
        rental_end: rentalEnd || null,
      },
      { onConflict: 'cart_id,listing_id' }
    )

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const listingId = searchParams.get('listingId')

  const { data: cart } = await supabaseAdmin
    .from('carts')
    .select('id')
    .eq('user_id', session.user.id)
    .maybeSingle()

  if (cart && listingId) {
    await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id)
      .eq('listing_id', listingId)
  }

  return NextResponse.json({ success: true })
}
