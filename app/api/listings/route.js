import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Listing from '@/models/Listing'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

export async function GET(request) {
  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const size = searchParams.get('size')
    const search = searchParams.get('search')
    const minPrice = searchParams.get('min_price')
    const maxPrice = searchParams.get('max_price')
    const userOnly = searchParams.get('user')

    const token = getTokenFromRequest(request)
    const decoded = token ? verifyToken(token) : null

    let query = { available: true }
    if (userOnly && decoded) query = { ownerId: decoded.userId }
    if (category) query.category = category
    if (size) query.size = size
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ]
    if (minPrice || maxPrice) {
      query.rentalPricePerDay = {}
      if (minPrice) query.rentalPricePerDay.$gte = Number(minPrice)
      if (maxPrice) query.rentalPricePerDay.$lte = Number(maxPrice)
    }

    const listings = await Listing.find(query).sort({ createdAt: -1 }).limit(50)
    return NextResponse.json(listings)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const token = getTokenFromRequest(request)
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const data = await request.json()

    // Validate image size (rough check for base64)
    if (data.imageData && data.imageData.length > 3 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large. Please use an image under 2MB.' }, { status: 400 })
    }

    const listing = await Listing.create({
      ...data,
      ownerId: decoded.userId,
      ownerName: decoded.name
    })
    return NextResponse.json({ success: true, id: listing._id }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
