import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Listing from '@/models/Listing';
import { listings } from '@/lib/listings';

export async function GET() {
  await connectDB();
  
  try {
    await Listing.deleteMany({});
    await User.deleteMany({ email: { $regex: '@example.com$' } });

    for (const item of listings) {
      const email = `${item.lister.replace(/\s+/g, '').replace('.', '').toLowerCase()}@example.com`;
      let user = await User.findOne({ email });
      
      if (!user) {
        user = await User.create({
          name: item.lister,
          email,
          password: 'password123',
          rating: item.rating,
          totalReviews: item.reviews,
          isVerified: item.verified,
          address: item.area + ', ' + item.city
        });
      }

      const genderMap = {
        'Sherwani': 'men',
        'Kurta': 'men',
        'Lehenga': 'women',
        'Saree': 'women',
        'Anarkali': 'women',
        'Gown': 'women'
      };
      
      const gender = genderMap[item.category] || 'unisex';

      await Listing.create({
        ownerId: user._id,
        ownerName: user.name,
        name: item.title,
        description: `Premium ${item.title} available for rent in ${item.area}. Perfect for ${item.occasion}s. Distance: ${item.distanceKm}km. Fit Score: ${item.fitScore}.`,
        category: gender, 
        subcategory: item.category,
        brand: 'Premium Designer',
        size: item.size,
        condition: 'Like New',
        listingType: 'rent',
        gender: gender,
        rentalPricePerDay: item.pricePerDay,
        buyPrice: item.retailPrice,
        securityDeposit: item.deposit,
        imageUrl: typeof item.image === 'string' ? item.image : item.image?.src || '',
        available: true,
      });
    }

    return NextResponse.json({ success: true, message: `Database seeded successfully with ${listings.length} items!` });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
