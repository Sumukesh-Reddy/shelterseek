const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  travelerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Traveler', required: true },
  travelerName: { type: String, required: true },
  travelerEmail: { type: String, required: true },
  guests: { type: Number, default: 1 },
  guestDetails: [{
    guestName: { type: String, required: true },
    guestAge: Number,
    guestGender: String,
    guestContact: String,
    govtIdType: String,
    govtIdNumber: String
  }],
  roomId: { type: String, required: true },
  roomTitle: { type: String, required: true },
  hostId: { type: String, required: true },
  hostEmail: { type: String, required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  days: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  paymentDetails: {
    paymentMethod: { type: String, default: 'credit_card' },
    cardLastFour: String,
    cardType: String,
    transactionId: { type: String, unique: true },
    paymentGateway: { type: String, default: 'razorpay' },
    paymentDate: { type: Date, default: Date.now }
  },
  bookingStatus: { 
    type: String, 
    enum: ['confirmed', 'pending', 'cancelled', 'completed', 'checked_in', 'checked_out'],
    default: 'confirmed'
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  bookedAt: { type: Date, default: Date.now },
  specialRequests: { type: String, default: '' },
  cancellationReason: String,
  cancellationDate: Date,
  refundAmount: { type: Number, default: 0 },
  actualCheckIn: Date,
  actualCheckOut: Date,
  reviewSubmitted: { type: Boolean, default: false },
  rating: { type: Number, min: 1, max: 5 },
  reviewComment: String
}, { timestamps: true });

// Indexes for performance
bookingSchema.index({ travelerId: 1, bookedAt: -1 });
bookingSchema.index({ hostId: 1, bookedAt: -1 });
bookingSchema.index({ roomId: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ 'paymentDetails.transactionId': 1 });

// Create model with paymentConnection
let Booking;
if (global.paymentConnection) {
  Booking = global.paymentConnection.model('Booking', bookingSchema);
} else {
  if (process.env.NODE_ENV === 'test' || !process.env.PAYMENT_DB_URI) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('⚠️ PAYMENT_DB_URI not found, Booking model might not work correctly');
    }
    try {
      Booking = mongoose.model('Booking', bookingSchema);
    } catch (err) {
      if (err.name === 'OverwriteModelError') {
        Booking = mongoose.model('Booking');
      }
    }
  } else {
    // Fallback connection
    const connection = mongoose.createConnection(process.env.PAYMENT_DB_URI);
    Booking = connection.model('Booking', bookingSchema);
  }
}

module.exports = Booking;
module.exports.schema = bookingSchema;