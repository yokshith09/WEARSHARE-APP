import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/authOptions"

export async function GET(request) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: rentals, error: rentalsError } = await supabaseAdmin
      .from('bookings')
      .select('*, listings(*)')
      .eq('renter_id', session.user.id)
      .order('created_at', { ascending: false })

    if (rentalsError) throw rentalsError

    const { data: lending, error: lendingError } = await supabaseAdmin
      .from('bookings')
      .select('*, listings(*)')
      .eq('lender_id', session.user.id)
      .order('created_at', { ascending: false })

    if (lendingError) throw lendingError

    // Map to expected frontend keys
    const formatBooking = (b) => ({
      _id: b.id,
      id: b.id,
      listingId: b.listing_id,
      listingName: b.listings?.title || b.listingName,
      listingImage: b.listings?.image_url || b.listingImage,
      lenderId: b.lender_id,
      renterId: b.renter_id,
      days: b.days,
      rentalStart: b.rental_start,
      rentalEnd: b.rental_end,
      rentalPrice: b.rental_price,
      securityDeposit: b.security_deposit,
      totalAmount: b.total_amount,
      listerEarnings: b.lister_earnings,
      paymentStatus: b.payment_status,
      fulfillmentStatus: b.fulfillment_status,
      refundStatus: b.refund_status,
      refundId: b.refund_id,
      refundAmount: b.refund_amount,
      status: b.status,
      deliveryStatus: b.status, // temporary map if delivery isn't explicit
      createdAt: b.created_at,
    })

    return NextResponse.json({ 
      rentals: rentals.map(formatBooking), 
      lending: lending.map(formatBooking) 
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
