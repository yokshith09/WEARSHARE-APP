import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/authOptions"
import { getListing } from '@/lib/listings'

// Simple regex to check if string is a valid UUID
const isUUID = (str) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

export async function GET(request, { params }) {
  try {
    // If it's not a UUID, it's one of our static seeded demo listings
    if (!isUUID(params.id)) {
      const demoListing = getListing(params.id);
      if (demoListing) return NextResponse.json(demoListing);
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { data: listing, error } = await supabaseAdmin
      .from('listings')
      .select(`
        *,
        owner:users!owner_id (
          id,
          name,
          is_verified,
          rating,
          image
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return NextResponse.json({ error: 'Not found' }, { status: 404 })
      throw error
    }

    // Map to expected structure
    const mappedListing = {
      _id: listing.id,
      id: listing.id,
      name: listing.title,
      title: listing.title,
      description: listing.description,
      category: listing.category,
      occasion: listing.occasion,
      gender: listing.gender,
      listingType: listing.listing_type,
      size: listing.size,
      condition: listing.condition,
      rentalPricePerDay: listing.rental_price_per_day,
      pricePerDay: listing.rental_price_per_day,
      securityDeposit: listing.security_deposit,
      deposit: listing.security_deposit,
      imageUrl: listing.image_url,
      photoUrls: listing.photo_urls || (listing.image_url ? [listing.image_url] : []),
      image: listing.image_url,
      city: listing.city,
      pincode: listing.pincode,
      area: listing.area,
      retailPrice: listing.retail_price,
      available: listing.available,
      ownerId: listing.owner ? {
        _id: listing.owner.id,
        name: listing.owner.name,
        isVerified: listing.owner.is_verified,
        rating: listing.owner.rating,
        avatar: listing.owner.image
      } : null,
      lister: listing.owner?.name
    }

    return NextResponse.json(mappedListing)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const { data: listing, error: fetchError } = await supabaseAdmin
      .from('listings')
      .select('owner_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (listing.owner_id !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error: deleteError } = await supabaseAdmin
      .from('listings')
      .delete()
      .eq('id', params.id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
