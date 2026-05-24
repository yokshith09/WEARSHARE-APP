import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
      .update(body)
      .digest('hex')

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity
      const orderId = payment.order_id
      
      // Update DB Order status to 'paid'
      const { error } = await supabaseAdmin
        .from('bookings')
        .update({ 
          payment_status: 'paid',
          payment_id: payment.id,
          status: 'confirmed'
        })
        .eq('order_id', orderId)

      if (error) {
        console.error('Webhook DB Error:', error)
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
      }
      
      // Razorpay Route transfer is handled automatically if we attached it to the order
      // during order creation (`orders.create` with `transfers` array).
      // So no explicit transfer initiation code is needed here.
    }

    return NextResponse.json({ status: 'ok' })
  } catch (err) {
    console.error('Webhook Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
