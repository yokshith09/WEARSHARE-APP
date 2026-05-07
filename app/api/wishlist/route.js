import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

export async function GET(request) {
    const token = getTokenFromRequest(request)
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await connectDB()
    const user = await User.findById(decoded.userId).populate('wishlist')
    return NextResponse.json({ wishlist: user?.wishlist || [] })
}

export async function POST(request) {
    const token = getTokenFromRequest(request)
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { listingId } = await request.json()
    await connectDB()
    await User.findByIdAndUpdate(decoded.userId, { $addToSet: { wishlist: listingId } })
    return NextResponse.json({ success: true })
}

export async function DELETE(request) {
    const token = getTokenFromRequest(request)
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listingId')
    await connectDB()
    await User.findByIdAndUpdate(decoded.userId, { $pull: { wishlist: listingId } })
    return NextResponse.json({ success: true })
}
