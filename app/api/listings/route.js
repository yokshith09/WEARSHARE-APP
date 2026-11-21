import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from "@/lib/authOptions"
import { calculatePincodeDistanceKm, isValidPincode } from "@/lib/geo"

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
    const originPincode = searchParams.get('originPincode') || searchParams.get('pincode')
    const maxRadiusParam = searchParams.get('maxRadius') || searchParams.get('radius')
    const maxRadius = maxRadiusParam && !isNaN(Number(maxRadiusParam)) ? Number(maxRadiusParam) : null
    const userOnly = searchParams.get('user') || searchParams.get('mine')

    const limitParam = parseInt(searchParams.get('limit') || '50', 10)
    const limit = Math.min(Math.max(isNaN(limitParam) ? 50 : limitParam, 1), 50)

    let session = null
    if (userOnly) {
      session = await getServerSession(authOptions)
    }

    let query = supabaseAdmin
      .from('listings')
      .select(`
        id,
        title,
        description,
        category,
        occasion,
        gender,
        listing_type,
        size,
        condition,
        rental_price_per_day,
        security_deposit,
        retail_price,
        image_url,
        photo_urls,
        city,
        area,
        pincode,
        available,
        created_at,
        owner:users!owner_id (
          id,
          name,
          is_verified,
          rating
        )
      `)
      .eq('available', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (userOnly && session?.user?.id) {
      query = query.eq('owner_id', session.user.id)
    }
    if (category && category.toLowerCase() !== 'all') query = query.ilike('category', `%${category}%`)
    if (size && size.toLowerCase() !== 'all') query = query.eq('size', size)
    if (listingType && listingType.toLowerCase() !== 'all') query = query.eq('listing_type', listingType)
    if (gender && gender.toLowerCase() !== 'all') query = query.ilike('gender', `%${gender}%`)
    if (occasion && occasion.toLowerCase() !== 'all') query = query.ilike('occasion', `%${occasion}%`)
    if (city && city.toLowerCase() !== 'all') query = query.ilike('city', `%${city}%`)
    // Only apply strict SQL pincode filter if originPincode is NOT being used for distance calculation
    if (!originPincode && searchParams.get('pincode')?.trim()) {
      query = query.ilike('pincode', `%${searchParams.get('pincode').trim()}%`)
    }
    if (minPrice) query = query.gte('rental_price_per_day', Number(minPrice))
    if (maxPrice) query = query.lte('rental_price_per_day', Number(maxPrice))
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%,city.ilike.%${search}%,pincode.ilike.%${search}%`)
    }

    let mappedListings = [];

    try {
      const { data: listings, error } = await query;
      if (!error && Array.isArray(listings) && listings.length > 0) {
        mappedListings = listings.map(l => {
          const distanceKm = originPincode && l.pincode ? calculatePincodeDistanceKm(originPincode, l.pincode) : null;
          return {
            _id: l.id,
            id: l.id,
            name: l.title,
            title: l.title,
            description: l.description,
            category: l.category,
            occasion: l.occasion,
            gender: l.gender || 'Unisex',
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
            distanceKm,
            retailPrice: l.retail_price,
            available: l.available,
            ownerId: l.owner ? {
              _id: l.owner.id,
              name: l.owner.name,
              isVerified: l.owner.is_verified,
              rating: l.owner.rating
            } : null,
            lister: l.owner?.name
          };
        });
      }
    } catch (dbErr) {
      console.warn('[Listings API] Supabase query warning:', dbErr.message);
    }

    // If user's own items were requested, return what we found in DB
    if (userOnly) {
      return NextResponse.json(mappedListings);
    }

    // Fallback to catalogue listings if database has 0 matching items
    if (mappedListings.length === 0) {
      const { listings: catalogListings } = await import('@/lib/listings');
      let filteredCatalog = catalogListings;

      if (category && category.toLowerCase() !== 'all') {
        filteredCatalog = filteredCatalog.filter(l => l.category.toLowerCase().includes(category.toLowerCase()));
      }
      if (gender && gender.toLowerCase() !== 'all') {
        filteredCatalog = filteredCatalog.filter(l => (l.gender || 'Unisex').toLowerCase() === gender.toLowerCase() || l.gender === 'Unisex');
      }
      if (occasion && occasion.toLowerCase() !== 'all') {
        filteredCatalog = filteredCatalog.filter(l => l.occasion.toLowerCase().includes(occasion.toLowerCase()));
      }
      if (size && size.toLowerCase() !== 'all') {
        filteredCatalog = filteredCatalog.filter(l => l.size === size);
      }
      if (city && city.toLowerCase() !== 'all') {
        filteredCatalog = filteredCatalog.filter(l => l.city.toLowerCase().includes(city.toLowerCase()));
      }
      if (!originPincode && searchParams.get('pincode')) {
        filteredCatalog = filteredCatalog.filter(l => String(l.pincode || '').includes(searchParams.get('pincode')));
      }
      if (search) {
        const s = search.toLowerCase();
        filteredCatalog = filteredCatalog.filter(l =>
          l.title.toLowerCase().includes(s) ||
          l.category.toLowerCase().includes(s) ||
          l.occasion.toLowerCase().includes(s) ||
          (l.area && l.area.toLowerCase().includes(s))
        );
      }

      mappedListings = filteredCatalog.map(l => {
        const distanceKm = originPincode && l.pincode ? calculatePincodeDistanceKm(originPincode, l.pincode) : null;
        return {
          _id: l.id,
          id: l.id,
          name: l.title,
          title: l.title,
          description: `${l.occasion} wear available for rent in ${l.area}, ${l.city}`,
          category: l.category,
          occasion: l.occasion,
          gender: l.gender || 'Unisex',
          size: l.size,
          condition: 'Like New',
          rentalPricePerDay: l.pricePerDay,
          pricePerDay: l.pricePerDay,
          securityDeposit: l.deposit,
          deposit: l.deposit,
          imageUrl: l.image,
          photoUrls: [l.image],
          image: l.image,
          city: l.city,
          area: l.area,
          pincode: l.pincode,
          distanceKm,
          retailPrice: l.retailPrice,
          available: true,
          ownerId: {
            _id: 'owner-sample',
            name: l.lister,
            isVerified: l.verified,
            rating: l.rating
          },
          lister: l.lister
        };
      });
    }

    let results = mappedListings;
    let autoExpanded = false;

    // Radius filter with auto-expansion fallback
    if (originPincode && maxRadius && maxRadius < 999) {
      const withinRadius = mappedListings.filter(l => typeof l.distanceKm === 'number' && l.distanceKm <= maxRadius);
      if (withinRadius.length > 0) {
        results = withinRadius;
      } else {
        // Auto-expand so user is not stuck with empty results
        autoExpanded = true;
        results = mappedListings;
      }
    }

    // Sort by proximity when originPincode is specified
    if (originPincode) {
      results.sort((a, b) => {
        if (typeof a.distanceKm === 'number' && typeof b.distanceKm === 'number') {
          return a.distanceKm - b.distanceKm;
        }
        if (typeof a.distanceKm === 'number') return -1;
        if (typeof b.distanceKm === 'number') return 1;
        return 0;
      });
    }

    const response = NextResponse.json(results);
    if (autoExpanded) {
      response.headers.set('x-wearshare-auto-expanded', 'true');
    }
    return response;
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
