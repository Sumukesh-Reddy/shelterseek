// src/config/database.js
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

// DATABASE OPTIMIZATION: Connection pooling and timeouts
const connectionOptions = {
  maxPoolSize: 10,
  minPoolSize: 2,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  w: 'majority'
};

const initializeConnections = () => {
  console.log('🔄 Initializing database connections...');

  // Host_Admin connection
  global.hostAdminConnection = mongoose.createConnection(process.env.HOST_ADMIN_URI, connectionOptions);

  global.hostAdminConnection.on('connected', () => {
    console.log('✅ Connected to Host_Admin database');
    try {
      global.gfsBucket = new GridFSBucket(global.hostAdminConnection.db, { bucketName: 'images' });
      console.log('✅ GridFS bucket initialized for Host_Admin');
    } catch (err) {
      console.error('❌ Error initializing GridFS bucket:', err);
    }
    
    // Drop the problematic id index if it exists
    setTimeout(async () => {
      try {
        const db = global.hostAdminConnection.db;
        const collection = db.collection('RoomData');
        
        // Use listIndexes to get indexes
        const indexList = await collection.listIndexes().toArray();
        const hasIdIndex = indexList.some(idx => idx.name === 'id_1');
        
        if (hasIdIndex) {
          console.log('🔄 Dropping problematic id_1 index from RoomData...');
          await collection.dropIndex('id_1');
          console.log('✅ Successfully dropped id_1 index');
        }
      } catch (err) {
        if (!err.message?.includes('index not found')) {
          console.warn('⚠️ Note during index management:', err.message);
        }
      }
    }, 1500);
  });

  global.hostAdminConnection.on('connecting', () => {
    console.log('🔄 Connecting to Host_Admin database...');
  });

  global.hostAdminConnection.on('error', (err) => {
    console.error('❌ Host_Admin DB connection error:', err.message);
  });

  global.hostAdminConnection.on('disconnected', () => {
    console.warn('⚠️ Host_Admin DB connection disconnected');
  });

  // Admin_Traveler connection
  global.adminTravelerConnection = mongoose.createConnection(process.env.ADMIN_TRAVELER_URI, connectionOptions);

  global.adminTravelerConnection.on('connected', () => {
    console.log('✅ Connected to Admin_Traveler database');
  });

  global.adminTravelerConnection.on('connecting', () => {
    console.log('🔄 Connecting to Admin_Traveler database...');
  });

  global.adminTravelerConnection.on('error', (err) => {
    console.error('❌ Admin_Traveler DB connection error:', err.message);
  });

  // Payment DB connection
  global.paymentConnection = mongoose.createConnection(process.env.PAYMENT_DB_URI, connectionOptions);

  global.paymentConnection.on('connected', () => {
    console.log('✅ Connected to Payment/Booking database');
  });

  global.paymentConnection.on('connecting', () => {
    console.log('🔄 Connecting to Payment/Booking database...');
  });

  global.paymentConnection.on('error', (err) => {
    console.error('❌ Payment/Booking DB connection error:', err.message);
  });

  console.log('🔄 All database connection initialization started');
};

module.exports = { initializeConnections };