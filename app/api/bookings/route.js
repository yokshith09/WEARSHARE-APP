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

    const normalizeStatus = (status) => {
      if (status === 'pending') return 'requested'
      if (status === 'confirmed') return 'approved'
      if (status === 'active') return 'picked_up'
      if (status === 'completed') return 'returned'
      return status || 'requested'
    }

    // Map to expected frontend keys
    const formatBooking = (b) => {
      const status = normalizeStatus(b.status)
      return {
        _id: b.id,
        id: b.id,
        listingId: b.listing_id,
        listingName: b.listings?.title || b.listingName,
        listingImage: b.listings?.image_url || b.listingImage,
        listingCategory: b.listings?.category,
        listingSize: b.listings?.size,
        pickupLocation: b.pickup_location,
        pickupTime: b.pickup_time,
        returnLocation: b.return_location,
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
        status,
        deliveryStatus: status,
        createdAt: b.created_at,
      }
    }

    return NextResponse.json({ 
      rentals: rentals.map(formatBooking), 
      lending: lending.map(formatBooking) 
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
