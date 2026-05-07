import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { signToken } from '@/lib/auth'

export async function POST(request) {
  try {
    await connectDB()
    const { email, password } = await request.json()
    const lowerEmail = email.toLowerCase()

    const user = await User.findOne({ email: lowerEmail })
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000)

    user.otp = otp
    user.otpExpiry = otpExpiry
    await user.save()

    const { sendOTP } = await import('@/lib/email')
    await sendOTP(lowerEmail, otp)

    return NextResponse.json({ requireOtp: true, message: 'OTP sent to email', email: lowerEmail })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
