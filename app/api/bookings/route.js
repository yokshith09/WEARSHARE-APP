import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Booking from '@/models/Booking'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

export async function GET(request) {
  const token = getTokenFromRequest(request)
  const decoded = verifyToken(token)
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const rentals = await Booking.find({ renterId: decoded.userId }).sort({ createdAt: -1 })
  const lending = await Booking.find({ lenderId: decoded.userId }).sort({ createdAt: -1 })
  return NextResponse.json({ rentals, lending })
}
