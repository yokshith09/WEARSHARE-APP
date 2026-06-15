import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/authOptions"
import { apiLimiter } from '@/lib/rate-limit'
import { setAvailabilityLock } from '@/lib/redis'

export async function POST(request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    await apiLimiter.check(5, ip);
  } catch (error) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const session = await getServerSession(authOptions)
  if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { rentalStart, listingId, days } = await request.json()
    
    let subtotal = 0
    let deposit = 0
    let listerId = null
    let maxRentalDays = days || 1
    
    if (listingId) {
      const { data: listing, error } = await supabaseAdmin
        .from('listings')
        .select('owner_id, rental_price_per_day, security_deposit')
        .eq('id', listingId)
        .single()

      if (error || !listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
      
      subtotal = listing.rental_price_per_day * (days || 1)
      deposit = listing.security_deposit || 0
      listerId = listing.owner_id
    } else {
      // Cart logic simplified for now, as usually it's single item checkout in peer-to-peer
      const { data: cart } = await supabaseAdmin
        .from('carts')
        .select('id')
        .eq('user_id', session.user.id)
        .single()

      if (!cart) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })

      const { data: cartItems } = await supabaseAdmin
        .from('cart_items')
        .select(`
          days,
          rental_start,
          rental_end,
          listings (
            owner_id,
            rental_price_per_day,
            security_deposit
          )
        `)
        .eq('cart_id', cart.id)

      if (!cartItems || !cartItems.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
      
      subtotal = cartItems.reduce((s, i) => s + (i.listings.rental_price_per_day * i.days), 0)
      deposit = cartItems.reduce((s, i) => s + i.listings.security_deposit, 0)
      maxRentalDays = Math.max(...cartItems.map((i) => i.days || 1))
      listerId = cartItems[0].listings.owner_id // Note: Simplified for single item
    }

    const platformFee = Math.round((subtotal + deposit) * 0.05)
    const totalAmount = subtotal + deposit + platformFee
    const listerEarnings = Math.round(subtotal * 0.85) // 85% goes to Lister

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: 'Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET before accepting payments.' },
        { status: 503 }
      )
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    })

    const lockItems = []
    if (listingId) {
      const start = rentalStart || new Date().toISOString().split('T')[0]
      const end = start
      lockItems.push({ listingId, start, end })
    } else {
      const { data: cart } = await supabaseAdmin
        .from('carts')
        .select('id')
        .eq('user_id', session.user.id)
        .single()
      const { data: cartItemsForLocks } = cart ? await supabaseAdmin
        .from('cart_items')
        .select('listing_id, rental_start, rental_end')
        .eq('cart_id', cart.id) : { data: [] }
      for (const item of cartItemsForLocks || []) {
        lockItems.push({
          listingId: item.listing_id,
          start: item.rental_start || new Date().toISOString().split('T')[0],
          end: item.rental_end || item.rental_start || new Date().toISOString().split('T')[0],
        })
      }
    }

    for (const item of lockItems) {
      const locked = await setAvailabilityLock(`booking-lock:${item.listingId}:${item.start}:${item.end}`)
      if (!locked) {
        return NextResponse.json({ error: 'Those dates are being checked out by another renter. Please try another date.' }, { status: 409 })
      }
    }

    // Prepare Razorpay transfer using Route
    // We get the lister's account id from user table
    const { data: lister } = await supabaseAdmin
      .from('users')
      .select('razorpay_account_id')
      .eq('id', listerId)
      .single()

    const transfers = lister && lister.razorpay_account_id ? [
      {
        account: lister.razorpay_account_id,
        amount: Math.round(listerEarnings * 100), // paise
        currency: 'INR',
        notes: {
          name: 'WearShare Payout'
        },
        linked_account_notes: ['name'],
        on_hold: 1, // hold until item returned
        on_hold_until: Math.floor(Date.now() / 1000) + (maxRentalDays * 24 * 60 * 60) + (24 * 60 * 60) // Hold until return + 1 day
      }
    ] : undefined

    const orderOptions = {
      amount: Math.round(totalAmount * 100), // paise
      currency: 'INR',
      notes: { userId: session.user.id, rentalStart, listingId: listingId || '', days: days || '' }
    }
    
    if (transfers) {
      orderOptions.transfers = transfers
    }

    const order = await razorpay.orders.create(orderOptions)

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      rentalStart: rentalStart || lockItems[0]?.start || new Date().toISOString()
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
