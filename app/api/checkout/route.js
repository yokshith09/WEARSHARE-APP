import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { apiLimiter } from '@/lib/rate-limit'

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

    if (listingId) {
      const { data: listing, error } = await supabaseAdmin
        .from('listings')
        .select('rental_price_per_day, security_deposit')
        .eq('id', listingId)
        .single()

      if (error || !listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
      
      subtotal = listing.rental_price_per_day * (days || 1)
      deposit = listing.security_deposit || 0
    } else {
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
          listings (
            rental_price_per_day,
            security_deposit
          )
        `)
        .eq('cart_id', cart.id)

      if (!cartItems || !cartItems.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
      
      subtotal = cartItems.reduce((s, i) => s + (i.listings.rental_price_per_day * i.days), 0)
      deposit = cartItems.reduce((s, i) => s + i.listings.security_deposit, 0)
    }

    const platformFee = Math.round((subtotal + deposit) * 0.05)
    const totalAmount = subtotal + deposit + platformFee

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || ''
    })

    const order = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // paise
      currency: 'INR',
      notes: { userId: session.user.id, rentalStart, listingId: listingId || '', days: days || '' }
    })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      rentalStart
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
