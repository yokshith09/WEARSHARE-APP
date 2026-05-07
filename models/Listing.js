import mongoose from 'mongoose'

const ListingSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ownerName: { type: String },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, required: true },
  subcategory: { type: String, default: '' },
  brand: { type: String, default: '' },
  size: { type: String, required: true },
  condition: { type: String, required: true },
  listingType: { type: String, enum: ['rent', 'buy'], default: 'rent' },
  gender: { type: String, enum: ['men', 'women', 'kids', 'unisex'], default: 'unisex' },
  rentalPricePerDay: { type: Number, default: 0 },
  buyPrice: { type: Number, default: 0 },
  securityDeposit: { type: Number, default: 0 },
  imageUrl: { type: String, default: '' },
  imageData: { type: String, default: '' },
  available: { type: Boolean, default: true },
  availableFrom: { type: String },
  availableUntil: { type: String },
  wishlistCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.models.Listing || mongoose.model('Listing', ListingSchema)
