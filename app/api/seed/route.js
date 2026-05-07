import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Listing from '@/models/Listing'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

const DEMO_LISTINGS = [
  { name:'Royal Blue Silk Saree', brand:'Nalli', category:'saree', size:'Free Size', condition:'excellent', description:'Stunning royal blue silk saree with gold zari border. Perfect for weddings and festive occasions. Includes matching blouse piece.', rentalPricePerDay:800, securityDeposit:5000, imageUrl:'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=500&fit=crop' },
  { name:'Designer Lehenga Choli', brand:'Anita Dongre', category:'lehenga', size:'M', condition:'new', description:'Gorgeous pink lehenga with intricate thread embroidery. Comes with matching dupatta. Perfect for sangeet or wedding ceremonies.', rentalPricePerDay:1500, securityDeposit:8000, imageUrl:'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400&h=500&fit=crop' },
  { name:'Classic Black Tuxedo', brand:'Raymond', category:'suit', size:'L', condition:'excellent', description:'Sleek black tuxedo perfect for formal events, galas, and black-tie weddings. Includes matching bow tie and pocket square.', rentalPricePerDay:1000, securityDeposit:6000, imageUrl:'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=500&fit=crop' },
  { name:'Embroidered Kurta Set', brand:'Manyavar', category:'kurta', size:'L', condition:'good', description:'Traditional embroidered kurta with matching churidar. Elegant choice for festive occasions and family functions.', rentalPricePerDay:500, securityDeposit:2500, imageUrl:'https://images.unsplash.com/photo-1620912189865-1e8a33da4c65?w=400&h=500&fit=crop' },
  { name:'Cocktail Evening Dress', brand:'Marks & Spencer', category:'dress', size:'S', condition:'excellent', description:'Elegant navy blue cocktail dress with ruffle detailing. Perfect for evening parties, receptions, and corporate events.', rentalPricePerDay:700, securityDeposit:3500, imageUrl:'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=500&fit=crop' },
  { name:'Bridal Banarasi Saree', brand:'Ekaya', category:'saree', size:'Free Size', condition:'new', description:'Authentic Banarasi silk saree with traditional gold motifs. A timeless bridal choice that photographs beautifully.', rentalPricePerDay:2000, securityDeposit:12000, imageUrl:'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&h=500&fit=crop' },
  { name:'Bandhgala Sherwani', brand:'Manyavar', category:'suit', size:'XL', condition:'excellent', description:'Regal maroon bandhgala sherwani with antique gold buttons. Perfect for groom\'s family functions, baraat and receptions.', rentalPricePerDay:1200, securityDeposit:7000, imageUrl:'https://images.unsplash.com/photo-1622557850710-2cb8cd4a7374?w=400&h=500&fit=crop' },
  { name:'Indo-Western Fusion Jacket', brand:'FabIndia', category:'jacket', size:'M', condition:'good', description:'Versatile block-printed nehru jacket that pairs with both western and ethnic outfits. Great for casual festive wear.', rentalPricePerDay:400, securityDeposit:2000, imageUrl:'https://images.unsplash.com/photo-1516826957135-700dedea698c?w=400&h=500&fit=crop' },
  { name:'Party Wear Gown', brand:'W', category:'dress', size:'S', condition:'excellent', description:'Floor-length wine red gown with subtle sequin work at the neckline. Ideal for sangeet, receptions and parties.', rentalPricePerDay:1100, securityDeposit:5500, imageUrl:'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400&h=500&fit=crop' },
  { name:'Bollywood Style Sharara', brand:'Kalki Fashion', category:'dress', size:'M', condition:'new', description:'Vibrant orange sharara suit with mirror work. Turn heads at any mehendi or cocktail function!', rentalPricePerDay:900, securityDeposit:4500, imageUrl:'https://images.unsplash.com/photo-1585399059897-09e3bf57bab3?w=400&h=500&fit=crop' },
]

export async function GET() {
  try {
    await connectDB()
    const count = await Listing.countDocuments()
    if (count > 0) {
      return NextResponse.json({ message: 'Already seeded', count })
    }
    let demoUser = await User.findOne({ email: 'demo@wearshare.in' })
    if (!demoUser) {
      const hash = await bcrypt.hash('demo123456', 10)
      demoUser = await User.create({ name:'WearShare Demo', email:'demo@wearshare.in', password:hash, phone:'+91 9876543210' })
    }
    const listings = DEMO_LISTINGS.map(l => ({
      ...l, ownerId: demoUser._id.toString(), ownerName: demoUser.name,
      available: true, availableFrom: new Date(),
      availableUntil: new Date(Date.now() + 365*24*60*60*1000),
    }))
    await Listing.insertMany(listings)
    return NextResponse.json({ success: true, message: `Seeded ${listings.length} listings!` })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
