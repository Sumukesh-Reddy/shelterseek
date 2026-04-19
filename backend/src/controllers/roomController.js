const Room = require('../models/Room');
const { Traveler, Host } = require('../models/User/index');
const Booking = require('../models/Booking');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const { replicateToTravelerDB } = require('../services/replicationService');

// Get all rooms with filtering and pagination
exports.getAllRooms = catchAsync(async (req, res) => {
  let userId = null;
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'myjwtsecret');
      const user = await Traveler.findById(decoded.id).select('_id accountType email').lean() || 
                   await Host.findById(decoded.id).select('_id accountType email').lean();
      if (user) userId = user._id.toString();
    } catch (err) {
      console.log('Invalid token:', err.message);
    }
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  let query = {
    $or: [{ status: /verified/i }, { status: /approved/i }]
  };

  if (!userId) {
    query.booking = { $ne: true };
  } else {
    const user = await Traveler.findById(userId).select('email accountType').lean() || 
                 await Host.findById(userId).select('email accountType').lean();
                 
    if (user && user.accountType === 'host') {
      query = {
        $or: [
          { email: user.email },
          {
            $and: [
              { $or: [{ status: /verified/i }, { status: /approved/i }] },
              {
                $or: [
                  { booking: { $ne: true } },
                  { bookedBy: userId }
                ]
              }
            ]
          }
        ]
      };
    } else {
      query = {
        $and: [
          { $or: [{ status: /verified/i }, { status: /approved/i }] },
          {
            $or: [
              { booking: { $ne: true } },
              { bookedBy: userId }
            ]
          }
        ]
      };
    }
  }

  // SEARCH FILTERS
  const { location, minPrice, maxPrice, roomType, propertyType, amenities } = req.query;

  if (location) {
    query.location = { $regex: location, $options: 'i' };
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  if (roomType) query.roomType = roomType;
  if (propertyType) query.propertyType = propertyType;
  
  if (amenities) {
    const amenitiesList = Array.isArray(amenities) ? amenities : amenities.split(',');
    query.amenities = { $all: amenitiesList };
  }

  // SORTING
  let sortOption = { createdAt: -1 };
  if (req.query.sort === 'price_asc') sortOption = 'price';
  if (req.query.sort === 'price_desc') sortOption = '-price';
  if (req.query.sort === 'newest') sortOption = '-createdAt';
  if (req.query.sort === 'oldest') sortOption = 'createdAt';

  // Optimize: Use projection to fetch only needed fields
  const rooms = await Room.find(query)
    .sort(sortOption)
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Room.countDocuments(query);

  // OPTIMIZATION: Batch fetch hosts to avoid N+1 queries
  const hostNames = [...new Set(rooms.map(r => r.name).filter(Boolean))];
  const hosts = await Host.find({ name: { $in: hostNames } })
    .select('name email profilePhoto')
    .lean();

  const hostMap = new Map(hosts.map(h => [h.name, h]));

  const processed = rooms.map((room) => {
    const images = room.images?.map(img => {
      if (typeof img === 'object' && img.$oid) {
        return `/api/images/${img.$oid}`;
      }
      return img;
    }) || [];

    const coordinates = room.coordinates || { lat: 13.0827, lng: 80.2707 };

    const unavailableDates = room.unavailableDates?.map(date => {
      if (date?.$date) {
        return new Date(date.$date).toISOString().split('T')[0];
      }
      return date instanceof Date ? date.toISOString().split('T')[0] : date;
    }) || [];

    // Get host info from map (Optimized)
    const hostInfo = hostMap.get(room.name);
    let hostEmail = room.email || hostInfo?.email || '';
    let hostImage = room.hostImage || hostInfo?.profilePhoto || null;
    let hostGender = room.hostGender || '';

    return {
      _id: room._id?.toString(),
      id: room._id?.toString(),
      name: room.name || 'Unknown',
      title: room.title || 'Untitled',
      description: room.description || '',
      price: room.price || 0,
      location: room.location || '',
      coordinates,
      roomLocation: room.roomLocation || '',
      transportDistance: room.transportDistance || '',
      images,
      amenities: room.amenities || [],
      unavailableDates,
      propertyType: room.propertyType || '',
      capacity: room.capacity || 0,
      roomType: room.roomType || '',
      bedrooms: room.bedrooms || 0,
      beds: room.beds || 0,
      roomSize: room.roomSize || 'Medium',
      foodFacility: room.foodFacility || '',
      discount: room.discount || 0,
      maxdays: room.maxdays || 10,
      likes: room.likes || 0,
      reviews: room.reviews || [],
      booking: room.booking || false,
      bookedBy: room.bookedBy || null,
      isBookedByMe: userId ? room.bookedBy?.toString() === userId : false,
      status: room.status || 'pending',
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      email: hostEmail,
      hostGender,
      hostImage,
      yearsWithUs: room.yearsWithUs || 0
    };
  });

  res.json({
    status: 'success',
    count: processed.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: processed
  });
});

// Get room by ID
exports.getRoomById = catchAsync(async (req, res, next) => {
  const room = await Room.findById(req.params.id).lean();
  
  if (!room) {
    return next(new AppError('Room not found', 404));
  }

  res.json({
    status: 'success',
    data: room
  });
});

// Get rooms by host email
exports.getRoomsByHostEmail = catchAsync(async (req, res) => {
  const { email } = req.params;
  const rooms = await Room.find({ email }).lean();
  res.json({ roomCount: rooms.length, rooms });
});

// Get room counts and stats
exports.getRoomCounts = catchAsync(async (req, res) => {
  const totalRooms = await Room.countDocuments({
    $or: [{ status: /verified/i }, { status: /approved/i }]
  });

  const availableRooms = await Room.countDocuments({
    $or: [{ status: /verified/i }, { status: /approved/i }],
    booking: { $ne: true }
  });

  const totalBookedRooms = await Booking.countDocuments({
    bookingStatus: /confirmed/i
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  const thisMonthBooked = await Booking.countDocuments({
    bookingStatus: /confirmed/i,
    checkIn: { $gte: startOfMonth }
  });

  const thisWeekBooked = await Booking.countDocuments({
    bookingStatus: /confirmed/i,
    checkIn: { $gte: startOfWeek }
  });

  const roomsByStatus = await Room.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);

  const popularRoomTypes = await Room.aggregate([
    { $match: { $or: [{ status: /verified/i }, { status: /approved/i }] } },
    { $group: { _id: "$roomType", count: { $sum: 1 }, avgPrice: { $avg: "$price" } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);

  res.json({
    success: true,
    counts: {
      total: totalRooms,
      available: availableRooms,
      booked: totalBookedRooms,
      thisMonthBooked,
      thisWeekBooked
    },
    byStatus: roomsByStatus,
    popularTypes: popularRoomTypes,
    lastUpdated: new Date().toISOString()
  });
});

// Update room booking status
exports.updateRoomBooking = catchAsync(async (req, res, next) => {
  const { booking = true } = req.body;
  const room = await Room.findById(req.params.roomId);
  
  if (!room) {
    return next(new AppError('Room not found', 404));
  }

  room.booking = booking;
  await room.save();

  res.json({ 
    success: true, 
    message: `Room ${booking ? 'booked' : 'freed'}`, 
    room: { _id: room._id, booking: room.booking } 
  });
});

// Update listing status (admin/host)
exports.updateListingStatus = catchAsync(async (req, res) => {
  const { listingId } = req.params;
  const { status } = req.body;
  
  if (!listingId || !status) {
    return res.status(400).json({ 
      success: false, 
      message: 'Listing ID and status are required' 
    });
  }

  const statusMap = {
    'pending': 'pending',
    'Approved': 'verified',
    'Rejected': 'rejected',
    'verified': 'verified',
    'rejected': 'rejected',
    'approved': 'verified'
  };
  
  const mappedStatus = statusMap[status] || status;
  const updatePayload = {
    status: mappedStatus,
    statusUpdatedAt: new Date()
  };

  if (mappedStatus === 'verified' || mappedStatus === 'rejected') {
    updatePayload.reviewedAt = new Date();
    updatePayload.reviewedBy = {
      userId: String(req.user?._id || req.user?.id || ''),
      name: req.user?.name || '',
      email: req.user?.email || '',
      accountType: req.user?.accountType || '',
      department: req.user?.department || ''
    };
  }

  const room = await Room.findByIdAndUpdate(listingId, updatePayload, { new: true });

  if (!room) {
    return res.status(404).json({ 
      success: false, 
      message: 'Listing not found' 
    });
  }

  // Replicate to traveler DB if status is verified
  if (mappedStatus === 'verified') {
    await replicateToTravelerDB(room);
  }

  res.json({
    success: true,
    message: `Listing ${mappedStatus === 'verified' ? 'approved' : mappedStatus === 'rejected' ? 'rejected' : 'updated'} successfully`,
    data: { 
      listing: room,
      _id: room._id,
      status: room.status
    }
  });
});
