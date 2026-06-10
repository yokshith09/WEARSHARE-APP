import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/authOptions"

const BOOKING_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const STATUS_TRANSITIONS = {
  pending: new Set(['active', 'declined']),
  confirmed: new Set(['active']),
  active: new Set(['completed', 'maintenance']),
  maintenance: new Set(['completed']),
}

function optionalText(value, maxLength) {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  return trimmed && trimmed.length <= maxLength ? trimmed : null
}

export async function PUT(request) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { bookingId, deliveryStatus, pickupLocation, pickupTime, returnLocation } = await request.json()

    if (typeof bookingId !== 'string' || !BOOKING_ID_PATTERN.test(bookingId)) {
      return NextResponse.json({ error: 'Invalid booking request' }, { status: 400 })
    }

    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('id, lender_id, listing_id, status, payment_status')
      .eq('id', bookingId)
      .single()

    if (fetchError || !booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    if (booking.lender_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const update = {}

    if (deliveryStatus !== undefined) {
      if (typeof deliveryStatus !== 'string') {
        return NextResponse.json({ error: 'Invalid booking status' }, { status: 400 })
      }

      const allowedStatuses = STATUS_TRANSITIONS[booking.status]
      if (!allowedStatuses?.has(deliveryStatus)) {
        return NextResponse.json({ error: 'Invalid booking status transition' }, { status: 409 })
      }

      if (deliveryStatus === 'declined' && booking.payment_status === 'paid') {
        return NextResponse.json(
          { error: 'Paid bookings must be refunded before they can be declined' },
          { status: 409 }
        )
      }

      update.status = deliveryStatus
    }

    const normalizedPickupLocation = optionalText(pickupLocation, 500)
    const normalizedReturnLocation = optionalText(returnLocation, 500)
    if (normalizedPickupLocation === null || normalizedReturnLocation === null) {
      return NextResponse.json({ error: 'Invalid location details' }, { status: 400 })
    }
    if (normalizedPickupLocation !== undefined) update.pickup_location = normalizedPickupLocation
    if (normalizedReturnLocation !== undefined) update.return_location = normalizedReturnLocation

    if (pickupTime !== undefined && pickupTime !== null && pickupTime !== '') {
      const parsedPickupTime = new Date(pickupTime)
      if (Number.isNaN(parsedPickupTime.getTime())) {
        return NextResponse.json({ error: 'Invalid pickup time' }, { status: 400 })
      }
      update.pickup_time = parsedPickupTime.toISOString()
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid changes supplied' }, { status: 400 })
    }

    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update(update)
      .eq('id', bookingId)

    if (updateError) throw updateError

    if (deliveryStatus === 'completed' || deliveryStatus === 'declined') {
      const { error: listingError } = await supabaseAdmin
        .from('listings')
        .update({ available: true })
        .eq('id', booking.listing_id)

      if (listingError) throw listingError
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Failed to update booking status', err)
    return NextResponse.json({ error: 'Unable to update booking' }, { status: 500 })
  }
}
