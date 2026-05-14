import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { 
      paymentId, orderId, signature, rentalStart, 
      listingId, days,
      deliveryDetails, returnDetails, pickupDetails, collectDetails 
    } = await request.json()

    // Verify Razorpay signature
    const body = orderId + '|' + paymentId
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body)
      .digest('hex')

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
    }

    let itemsToProcess = []
    
    if (listingId) {
      const { data: listing, error } = await supabaseAdmin
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .single()

      if (error || !listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
      
      itemsToProcess = [{
        listing_id: listingId,
        days: parseInt(days) || 1,
        listings: listing
      }]
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
          listing_id,
          days,
          listings (*)
        `)
        .eq('cart_id', cart.id)

      if (!cartItems || !cartItems.length) {
        return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
      }
      itemsToProcess = cartItems
    }

    const { data: renter } = await supabaseAdmin
      .from('users')
      .select('name, phone')
      .eq('id', session.user.id)
      .single()

    const startDate = new Date(rentalStart)
    const bookings = []

    for (const item of itemsToProcess) {
      if (!item.listings) continue

      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + item.days)

      const subtotal = item.listings.rental_price_per_day * item.days
      const platformFee = Math.round((subtotal + item.listings.security_deposit) * 0.05)
      const total = subtotal + item.listings.security_deposit + platformFee

      // Create booking
      const { data: booking, error: bookingError } = await supabaseAdmin
        .from('bookings')
        .insert({
          listing_id: item.listing_id,
          renter_id: session.user.id,
          lender_id: item.listings.owner_id,
          rental_start: startDate.toISOString().split('T')[0],
          rental_end: endDate.toISOString().split('T')[0],
          days: item.days,
          rental_price: subtotal,
          security_deposit: item.listings.security_deposit,
          total_amount: total,
          status: 'confirmed',
          payment_id: paymentId,
          order_id: orderId
        })
        .select()
        .single()

      if (bookingError) {
        console.error("Booking Error:", bookingError)
        continue
      }
      
      bookings.push(booking)

      // Mark listing as unavailable
      await supabaseAdmin
        .from('listings')
        .update({ available: false })
        .eq('id', item.listing_id)
    }

    // Clear cart if we processed the cart
    if (!listingId) {
      const { data: cart } = await supabaseAdmin
        .from('carts')
        .select('id')
        .eq('user_id', session.user.id)
        .single()

      if (cart) {
        await supabaseAdmin
          .from('cart_items')
          .delete()
          .eq('cart_id', cart.id)
      }
    }

    return NextResponse.json({ success: true, bookings: bookings.length })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
