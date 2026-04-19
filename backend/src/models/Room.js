const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: String,
  email: String,
  title: String,
  description: String,
  price: Number,
  location: String,
  coordinates: { lat: Number, lng: Number },
  propertyType: String,
  capacity: Number,
  roomType: String,
  bedrooms: Number,
  beds: Number,
  maxdays: Number,
  roomSize: String,
  roomLocation: String,
  transportDistance: String,
  hostGender: String,
  foodFacility: String,
  status: { 
    type: String, 
    set: v => v ? v.toString().toLowerCase() : 'pending', 
    default: 'pending' 
  },
  statusUpdatedAt: { type: Date, default: null },
  reviewedAt: { type: Date, default: null },
  reviewedBy: {
    userId: { type: String, default: null },
    name: { type: String, default: null },
    email: { type: String, default: null },
    accountType: { type: String, default: null },
    department: { type: String, default: null }
  },
  booking: { type: Boolean, default: false },
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Traveler', default: null },
  discount: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  unavailableDates: [Date],
  amenities: [String],
  images: [String],
  reviews: [Object],
  createdAt: { type: Date, default: Date.now }
}, { collection: 'RoomData' });

// DATABASE OPTIMIZATION: Indexing
roomSchema.index({ status: 1, createdAt: -1 });
roomSchema.index({ location: 'text', title: 'text', description: 'text' });
roomSchema.index({ price: 1 });
roomSchema.index({ capacity: 1, roomType: 1 });


// Drop the problematic 'id' index if it exists
roomSchema.post('init', async function() {
  try {
    const indexes = await this.collection.getIndexes();
    if (indexes.id_1) {
      console.log('🔄 Dropping problematic id index...');
      await this.collection.dropIndex('id_1');
      console.log('✅ Dropped id_1 index');
    }
  } catch (err) {
    // Index might not exist, that's OK
  }
});

// Initialize Room model - check if global connection exists
let Room;
let connectionInitialized = false;

if (global.hostAdminConnection) {
  try {
    Room = global.hostAdminConnection.model('RoomData', roomSchema);
    connectionInitialized = true;
    console.log('✅ Room model initialized with global.hostAdminConnection');
  } catch (err) {
    if (err.name === 'OverwriteModelError') {
      Room = global.hostAdminConnection.model('RoomData');
      connectionInitialized = true;
    }
  }
}

// If global connection not available, create fallback
if (!connectionInitialized) {
  if (process.env.NODE_ENV === 'test' || !process.env.HOST_ADMIN_URI) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn('⚠️ HOST_ADMIN_URI not found, Room model might not work correctly');
    }
    // Create a mock/empty schema for testing if no connection can be made
    try {
      Room = mongoose.model('RoomData', roomSchema);
    } catch (err) {
      if (err.name === 'OverwriteModelError') {
        Room = mongoose.model('RoomData');
      }
    }
  } else {
    console.warn('⚠️ global.hostAdminConnection not immediately available, creating fallback connection');
    const fallbackConnection = mongoose.createConnection(process.env.HOST_ADMIN_URI, {
      retryWrites: true,
      w: 'majority'
    });
    
    fallbackConnection.on('connected', () => {
      console.log('✅ Fallback Room connection established');
    });
    
    fallbackConnection.on('error', (err) => {
      console.error('❌ Fallback Room connection error:', err);
    });
    
    try {
      Room = fallbackConnection.model('RoomData', roomSchema);
    } catch (err) {
      if (err.name === 'OverwriteModelError') {
        Room = fallbackConnection.model('RoomData');
      } else {
        console.error('❌ Error creating fallback Room model:', err);
      }
    }
  }
}

module.exports = Room;
