import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/authOptions"
import { getRequestContext, recordSecurityEvent } from '@/lib/security-events'

const BOOKING_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const STATUS_TRANSITIONS = {
  requested: new Set(['approved', 'declined']),
  pending: new Set(['approved', 'active', 'declined']),
  confirmed: new Set(['approved', 'active', 'declined']),
  approved: new Set(['picked_up', 'declined']),
  active: new Set(['picked_up', 'completed', 'maintenance']),
  picked_up: new Set(['returned', 'maintenance']),
  returned: new Set([]),
  completed: new Set([]),
  maintenance: new Set(['returned', 'completed']),
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
    const { ip, userAgent } = getRequestContext(request)
    const { bookingId, deliveryStatus, pickupLocation, pickupTime, returnLocation } = await request.json()

    if (typeof bookingId !== 'string' || !BOOKING_ID_PATTERN.test(bookingId)) {
      return NextResponse.json({ error: 'Invalid booking request' }, { status: 400 })
    }

    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('id, lender_id, listing_id, status, payment_status, payment_id, total_amount, refund_status, refund_id')
      .eq('id', bookingId)
      .single()

    if (fetchError || !booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    if (booking.lender_id !== session.user.id) {
      await recordSecurityEvent({
        eventType: 'booking.status.forbidden',
        severity: 'warning',
        actorId: session.user.id,
        ip,
        userAgent,
        metadata: { bookingId },
      })
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const update = {}

    if (deliveryStatus !== undefined) {
      if (typeof deliveryStatus !== 'string') {
        return NextResponse.json({ error: 'Invalid booking status' }, { status: 400 })
      }

      const allowedStatuses = STATUS_TRANSITIONS[booking.status]
      if (!allowedStatuses?.has(deliveryStatus)) {
        await recordSecurityEvent({
          eventType: 'booking.status.invalid_transition',
          severity: 'warning',
          actorId: session.user.id,
          ip,
          userAgent,
          metadata: { bookingId, currentStatus: booking.status, requestedStatus: deliveryStatus },
        })
        return NextResponse.json({ error: 'Invalid booking status transition' }, { status: 409 })
      }

      if (deliveryStatus === 'declined' && booking.payment_status === 'paid') {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
          return NextResponse.json({ error: 'Refunds are not configured' }, { status: 500 })
        }

        if (!booking.payment_id) {
          return NextResponse.json({ error: 'Missing payment reference for refund' }, { status: 400 })
        }

        if (booking.refund_status === 'refunded') {
          const { error: finalizeError } = await supabaseAdmin
            .from('bookings')
            .update({ status: 'declined' })
            .eq('id', bookingId)

          if (finalizeError) throw finalizeError

          const { error: listingError } = await supabaseAdmin
            .from('listings')
            .update({ available: true })
            .eq('id', booking.listing_id)

          if (listingError) throw listingError

          return NextResponse.json({ success: true, refunded: true, refundId: booking.refund_id || null })
        }

        if (booking.refund_status === 'refund_pending') {
          return NextResponse.json({ error: 'Refund already in progress' }, { status: 409 })
        }

        const { error: reservationError } = await supabaseAdmin
          .from('bookings')
          .update({ refund_status: 'refund_pending' })
          .eq('id', bookingId)
          .eq('refund_status', booking.refund_status)

        if (reservationError) throw reservationError

        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        })

        try {
          const refund = await razorpay.payments.refund(String(booking.payment_id), {
            amount: Math.round(Number(booking.total_amount || 0) * 100),
            receipt: `booking-${bookingId}-refund`,
            notes: {
              bookingId,
              lenderId: session.user.id,
              reason: 'lender_declined_paid_booking',
            },
          })

          const { error: refundUpdateError } = await supabaseAdmin
            .from('bookings')
            .update({
              status: 'declined',
              refund_status: 'refunded',
              refund_id: refund.id,
              refund_amount: refund.amount,
            })
            .eq('id', bookingId)

          if (refundUpdateError) throw refundUpdateError

          const { error: listingError } = await supabaseAdmin
            .from('listings')
            .update({ available: true })
            .eq('id', booking.listing_id)

          if (listingError) throw listingError

          await recordSecurityEvent({
            eventType: 'booking.refund.issued',
            severity: 'warning',
            actorId: session.user.id,
            ip,
            userAgent,
            metadata: {
              bookingId,
              refundId: refund.id,
              amount: refund.amount,
            },
          })

          return NextResponse.json({ success: true, refunded: true, refundId: refund.id })
        } catch (refundError) {
          await supabaseAdmin
            .from('bookings')
            .update({ refund_status: 'refund_failed' })
            .eq('id', bookingId)

          await recordSecurityEvent({
            eventType: 'booking.refund.failed',
            severity: 'critical',
            actorId: session.user.id,
            ip,
            userAgent,
            metadata: {
              bookingId,
              message: refundError?.message || 'unknown_refund_error',
            },
          })

          throw refundError
        }
      }

      update.status = deliveryStatus
      if (deliveryStatus === 'picked_up') update.fulfillment_status = 'picked_up'
      if (deliveryStatus === 'returned') update.fulfillment_status = 'returned'
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

    if (deliveryStatus === 'returned' || deliveryStatus === 'completed' || deliveryStatus === 'declined') {
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
