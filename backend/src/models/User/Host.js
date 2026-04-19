const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Booking sub-schema
const bookingSubSchema = new mongoose.Schema({
  bookingId: { type: String, required: true },
  roomId: { type: String, required: true },
  roomTitle: { type: String, required: true },
  travelerId: { type: String, required: true },
  travelerName: { type: String, required: true },
  travelerEmail: { type: String, required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  days: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['confirmed', 'pending', 'cancelled', 'completed', 'checked_in', 'checked_out'],
    default: 'confirmed'
  },
  bookedAt: { type: Date, default: Date.now },
  guests: { type: Number, default: 1 },
  guestDetails: [{
    guestName: String,
    guestAge: Number,
    guestGender: String,
    guestContact: String,
    govtIdType: String,
    govtIdNumber: String
  }],
  specialRequests: { type: String, default: '' },
  transactionId: { type: String }
}, { _id: false });

// Host Schema
const hostSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    match: [/.+\@.+\..+/, 'Please enter a valid email']
  },
  password: { type: String, minlength: 8, select: false },
  googleId: { type: String, default: null },
  otp: { type: String, default: null },
  otpExpiresAt: { type: Date, default: null },
  isVerified: { type: Boolean, default: false },
  resetToken: { type: String, default: null },
  resetTokenExpires: { type: Date, default: null },
  accountType: { type: String, enum: ['traveller', 'host'], default: 'host' },
  profilePhoto: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  online: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  propertyDetails: { type: Object, default: {} },
  hostBookings: [bookingSubSchema]
}, { collection: 'LoginData' });

// DATABASE OPTIMIZATION: Indexing
hostSchema.index({ name: 'text', email: 'text' }, { weights: { name: 10, email: 5 } });
hostSchema.index({ email: 1 });
hostSchema.index({ accountType: 1, createdAt: -1 });
hostSchema.index({ googleId: 1 }, { sparse: true });
hostSchema.index({ resetToken: 1 }, { sparse: true });

// Hash password middleware
hostSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Password comparison method
hostSchema.methods.correctPassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

const Host = mongoose.model('Host', hostSchema);

module.exports = Host;