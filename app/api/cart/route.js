import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Cart from '@/models/Cart'
import Listing from '@/models/Listing'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

export async function GET(request) {
  const token = getTokenFromRequest(request)
  const decoded = verifyToken(token)
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const cart = await Cart.findOne({ userId: decoded.userId })
  return NextResponse.json({ items: cart?.items || [] })
}

export async function POST(request) {
  const token = getTokenFromRequest(request)
  const decoded = verifyToken(token)
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { listingId, days } = await request.json()
  const listing = await Listing.findById(listingId)
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const item = {
    listingId: listingId,
    name: listing.name,
    rentalPricePerDay: listing.rentalPricePerDay,
    securityDeposit: listing.securityDeposit,
    size: listing.size,
    brand: listing.brand,
    ownerId: listing.ownerId.toString(),
    ownerName: listing.ownerName,
    days: days || 1
  }

  let cart = await Cart.findOne({ userId: decoded.userId })
  if (cart) {
    const idx = cart.items.findIndex(i => i.listingId === listingId)
    if (idx >= 0) {
      cart.items[idx].days = days || 1
    } else {
      cart.items.push(item)
    }
    cart.updatedAt = new Date()
    await cart.save()
  } else {
    cart = await Cart.create({ userId: decoded.userId, items: [item] })
  }

  return NextResponse.json({ success: true, items: cart.items })
}

export async function DELETE(request) {
  const token = getTokenFromRequest(request)
  const decoded = verifyToken(token)
  if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { searchParams } = new URL(request.url)
  const listingId = searchParams.get('listingId')

  await Cart.updateOne({ userId: decoded.userId }, { $pull: { items: { listingId } } })
  return NextResponse.json({ success: true })
}
