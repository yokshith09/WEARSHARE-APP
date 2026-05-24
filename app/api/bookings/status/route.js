import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/authOptions"

export async function PUT(request) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { bookingId, deliveryStatus, pickupLocation, pickupTime, returnLocation } = await request.json()

    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('id, lender_id, renter_id, listing_id')
      .eq('id', bookingId)
      .single()

    if (fetchError || !booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    // Only lender or renter can update
    if (booking.lender_id !== session.user.id && booking.renter_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const update = {}
    if (deliveryStatus) update.status = deliveryStatus // Assuming 'status' handles this
    if (pickupLocation) update.pickup_location = pickupLocation
    if (pickupTime) update.pickup_time = pickupTime
    if (returnLocation) update.return_location = returnLocation

    // If returned, mark listing as available again
    if (deliveryStatus === 'returned') {
      await supabaseAdmin
        .from('listings')
        .update({ available: true })
        .eq('id', booking.listing_id)
      
      update.status = 'completed'
    }

    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update(update)
      .eq('id', bookingId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
