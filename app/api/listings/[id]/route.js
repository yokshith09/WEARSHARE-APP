import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Listing from '@/models/Listing'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

export async function GET(request, { params }) {
  try {
    await connectDB()
    const listing = await Listing.findById(params.id)
    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(listing)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const token = getTokenFromRequest(request)
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const listing = await Listing.findById(params.id)
    if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (listing.ownerId.toString() !== decoded.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await Listing.findByIdAndDelete(params.id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
