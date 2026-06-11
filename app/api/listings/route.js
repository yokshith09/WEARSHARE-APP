import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/authOptions"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const size = searchParams.get('size')
    const search = searchParams.get('search') || searchParams.get('q')
    const minPrice = searchParams.get('min_price')
    const maxPrice = searchParams.get('max_price')
    const listingType = searchParams.get('listingType')
    const gender = searchParams.get('gender')
    const occasion = searchParams.get('occasion')
    const city = searchParams.get('city')
    const pincode = searchParams.get('pincode')
    const userOnly = searchParams.get('user') || searchParams.get('mine')

    const session = await getServerSession(authOptions)

    let query = supabaseAdmin
      .from('listings')
      .select(`
        *,
        owner:users!owner_id (
          id,
          name,
          is_verified,
          rating
        )
      `)
      .eq('available', true)
      .order('created_at', { ascending: false })
      .limit(50)

    if (userOnly && session?.user?.id) {
      query = query.eq('owner_id', session.user.id)
    }
    if (category) query = query.ilike('category', `%${category}%`)
    if (size) query = query.eq('size', size)
    if (listingType) query = query.eq('listing_type', listingType) // Need to ensure schema has this if used
    if (gender) query = query.eq('gender', gender) // Need to ensure schema has this if used
    if (occasion) query = query.ilike('occasion', `%${occasion}%`)
    if (city) query = query.ilike('city', `%${city}%`)
    if (pincode) query = query.ilike('pincode', `%${pincode}%`)
    if (minPrice) query = query.gte('rental_price_per_day', Number(minPrice))
    if (maxPrice) query = query.lte('rental_price_per_day', Number(maxPrice))
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%,city.ilike.%${search}%,pincode.ilike.%${search}%`)
    }

    const { data: listings, error } = await query

    if (error) throw error

    // Map Supabase relational data to match the expected frontend structure
    const mappedListings = listings.map(l => ({
      _id: l.id,
      id: l.id,
      name: l.title,
      title: l.title,
      description: l.description,
      category: l.category,
      occasion: l.occasion,
      gender: l.gender,
      listingType: l.listing_type,
      size: l.size,
      condition: l.condition,
      rentalPricePerDay: l.rental_price_per_day,
      pricePerDay: l.rental_price_per_day,
      securityDeposit: l.security_deposit,
      deposit: l.security_deposit,
      imageUrl: l.image_url,
      photoUrls: l.photo_urls || (l.image_url ? [l.image_url] : []),
      image: l.image_url,
      city: l.city,
      pincode: l.pincode,
      area: l.area,
      retailPrice: l.retail_price,
      available: l.available,
      ownerId: l.owner ? {
        _id: l.owner.id,
        name: l.owner.name,
        isVerified: l.owner.is_verified,
        rating: l.owner.rating
      } : null,
      lister: l.owner?.name
    }))

    return NextResponse.json(mappedListings)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    const photoUrls = Array.isArray(data.photoUrls) ? data.photoUrls.filter(Boolean).slice(0, 6) : []
    const imageUrl = data.imageUrl || photoUrls[0] || data.imageData || data.image

    if (!data.name && !data.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!imageUrl) {
      return NextResponse.json({ error: 'At least one listing photo is required' }, { status: 400 })
    }

    if (data.imageData && data.imageData.length > 3 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large. Please use an image under 2MB.' }, { status: 400 })
    }

    const { data: listing, error } = await supabaseAdmin
      .from('listings')
      .insert({
        owner_id: session.user.id,
        title: data.name || data.title,
        description: data.description,
        category: data.category,
        occasion: data.occasion,
        gender: data.gender,
        listing_type: data.listingType,
        size: data.size,
        condition: data.condition || 'Good',
        rental_price_per_day: data.rentalPricePerDay || data.pricePerDay || 0,
        security_deposit: data.securityDeposit || data.deposit || 0,
        image_url: imageUrl,
        photo_urls: photoUrls.length ? photoUrls : [imageUrl],
        city: data.city || null,
        pincode: data.pincode,
        area: data.area,
        retail_price: data.retailPrice || null,
        availability_calendar: data.availabilityCalendar || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, id: listing.id }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
