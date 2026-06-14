import { NextResponse } from 'next/server'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/authOptions"
import { sendBookingConfirmationEmail } from '@/lib/notifications'

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
    let expectedTotalAmount = 0
    
    if (listingId) {
      const { data: listing, error } = await supabaseAdmin
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .single()

      if (error || !listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
      if (listing.owner_id === session.user.id) {
        return NextResponse.json({ error: 'You cannot rent your own listing' }, { status: 400 })
      }
      
      itemsToProcess = [{
        listing_id: listingId,
        days: parseInt(days) || 1,
        listings: listing
      }]

      const subtotal = listing.rental_price_per_day * (parseInt(days) || 1)
      const platformFee = Math.round((subtotal + listing.security_deposit) * 0.05)
      expectedTotalAmount = subtotal + listing.security_deposit + platformFee
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
          rental_start,
          rental_end,
          listings (*)
        `)
        .eq('cart_id', cart.id)

      if (!cartItems || !cartItems.length) {
        return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
      }
      itemsToProcess = cartItems
      expectedTotalAmount = cartItems.reduce((sum, item) => {
        const subtotal = item.listings.rental_price_per_day * item.days
        const platformFee = Math.round((subtotal + item.listings.security_deposit) * 0.05)
        return sum + subtotal + item.listings.security_deposit + platformFee
      }, 0)
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: 'Razorpay keys are not configured.' }, { status: 500 })
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    const order = await razorpay.orders.fetch(orderId)
    const orderUserId = order?.notes?.userId

    if (orderUserId !== session.user.id) {
      return NextResponse.json({ error: 'Payment order does not belong to this user.' }, { status: 400 })
    }

    if (Number(order.amount) !== Math.round(expectedTotalAmount * 100)) {
      return NextResponse.json({ error: 'Payment amount does not match the booking total.' }, { status: 400 })
    }

    const { data: renter } = await supabaseAdmin
      .from('users')
      .select('name, email')
      .eq('id', session.user.id)
      .single()

    const startDate = new Date(rentalStart)
    const bookings = []

    for (const item of itemsToProcess) {
      if (!item.listings) continue

      const itemStartDate = item.rental_start ? new Date(item.rental_start) : startDate
      const endDate = item.rental_end ? new Date(item.rental_end) : new Date(itemStartDate)
      if (!item.rental_end) endDate.setDate(endDate.getDate() + item.days - 1)

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
          rental_start: itemStartDate.toISOString().split('T')[0],
          rental_end: endDate.toISOString().split('T')[0],
          days: item.days,
          rental_price: subtotal,
          security_deposit: item.listings.security_deposit,
          total_amount: total,
          status: 'approved',
          payment_status: 'paid',
          fulfillment_status: 'pending',
          lister_earnings: Math.round(subtotal * 0.85),
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

      await sendBookingConfirmationEmail({
        to: renter?.email,
        renterName: renter?.name,
        listingName: item.listings.title,
        rentalStart: booking.rental_start,
        rentalEnd: booking.rental_end,
        totalAmount: Number(booking.total_amount || 0),
      }).catch((emailError) => console.error("Booking email error:", emailError))

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
