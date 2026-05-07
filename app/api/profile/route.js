import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

export async function PUT(request) {
  const token = getTokenFromRequest(request)
  const decoded = verifyToken(token)
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const data = await request.json()
  await User.findByIdAndUpdate(decoded.userId, {
    name: data.name,
    phone: data.phone,
    address: data.address
  })
  return NextResponse.json({ success: true })
}
