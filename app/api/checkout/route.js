import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Cart from '@/models/Cart'

export async function POST(request) {
  const token = getTokenFromRequest(request)
  const decoded = verifyToken(token)
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await connectDB()
    const cart = await Cart.findOne({ userId: decoded.userId })
    if (!cart || !cart.items.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })

    const { rentalStart } = await request.json()

    const subtotal = cart.items.reduce((s, i) => s + i.rentalPricePerDay * i.days, 0)
    const deposit = cart.items.reduce((s, i) => s + i.securityDeposit, 0)
    const platformFee = Math.round((subtotal + deposit) * 0.05)
    const totalAmount = subtotal + deposit + platformFee

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    })

    const order = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // paise
      currency: 'INR',
      notes: { userId: decoded.userId, rentalStart }
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
