import mongoose from 'mongoose'

const CartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  items: [{
    listingId: String,
    name: String,
    rentalPricePerDay: Number,
    securityDeposit: Number,
    size: String,
    brand: String,
    ownerId: String,
    ownerName: String,
    days: { type: Number, default: 1 }
  }],
  updatedAt: { type: Date, default: Date.now }
})

export default mongoose.models.Cart || mongoose.model('Cart', CartSchema)
