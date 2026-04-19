const { Traveler, Host } = require('../models/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { uploadToGridFS } = require('../services/gridfsService');
const { logControllerError } = require('../utils/logger');

// Get user counts
exports.getUserCounts = catchAsync(async (req, res) => {
  const travelerCount = await Traveler.countDocuments({ accountType: 'traveller' });
  const hostCount = await Host.countDocuments({ accountType: 'host' });
  
  res.json({ success: true, travelerCount, hostCount });
});

// Get new customers
exports.getNewCustomers = catchAsync(async (req, res) => {
  const travelers = await Traveler.find({ accountType: 'traveller' })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name email accountType createdAt profilePhoto')
    .lean();

  const hosts = await Host.find({ accountType: 'host' })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name email accountType createdAt profilePhoto')
    .lean();

  const allCustomers = [...travelers, ...hosts]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  const formattedCustomers = allCustomers.map(customer => ({
    id: customer._id,
    name: customer.name || 'Unknown User',
    email: customer.email,
    accountType: customer.accountType === 'traveller' ? 'Traveler' : 'Host',
    joinedDate: customer.createdAt ? 
      new Date(customer.createdAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      }) : 'Recently',
    avatar: customer.profilePhoto || 
      (customer.accountType === 'traveller' ? 
        'https://ui-avatars.com/api/?name=' + encodeURIComponent(customer.name || 'User') + '&background=4e73df&color=fff' :
        'https://ui-avatars.com/api/?name=' + encodeURIComponent(customer.name || 'Host') + '&background=1cc88a&color=fff'
      ),
    isNew: customer.createdAt ? 
      (Date.now() - new Date(customer.createdAt).getTime()) < (7 * 24 * 60 * 60 * 1000) : true
  }));

  res.json({ 
    success: true,
    data: formattedCustomers,
    count: formattedCustomers.length,
    summary: {
      travelersCount: travelers.length,
      hostsCount: hosts.length,
      totalNewCustomers: formattedCustomers.length
    }
  });
});

// Get all users (admin only)
exports.getAllUsers = catchAsync(async (req, res) => {
  const { accountType } = req.query;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  let filter = {};
  if (accountType) filter.accountType = accountType;

  // Optimized: Use limit, skip, select and lean
  const travelersPromise = Traveler.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('-password')
    .lean();

  const hostsPromise = Host.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('-password')
    .lean();

  const [travelers, hosts] = await Promise.all([travelersPromise, hostsPromise]);
  
  const travelerTotal = await Traveler.countDocuments(filter);
  const hostTotal = await Host.countDocuments(filter);

  const processedTravelers = travelers.map(t => ({
    ...t,
    profilePhoto: t.profilePhoto ? `/api/images/${t.profilePhoto}` : null
  }));

  const processedHosts = hosts.map(h => ({
    ...h,
    profilePhoto: h.profilePhoto ? `/api/images/${h.profilePhoto}` : null
  }));

  res.json({
    success: true,
    total: travelerTotal + hostTotal,
    page,
    pages: Math.ceil((travelerTotal + hostTotal) / limit),
    data: {
      travelers: processedTravelers,
      hosts: processedHosts
    }
  });
});

// Get all hosts
exports.getHosts = catchAsync(async (req, res) => {
  const hosts = await Host.find({}).lean();
  
  // Get room counts for each host
  const Room = require('../models/Room');
  const roomCounts = await Room.aggregate([
    { $group: { _id: "$email", count: { $sum: 1 } } }
  ]);

  const countsMap = {};
  roomCounts.forEach(rc => countsMap[rc._id] = rc.count);

  hosts.forEach(h => h.roomCount = countsMap[h.email] || 0);

  res.json(hosts);
});

// Get user by email
exports.getUserByEmail = catchAsync(async (req, res, next) => {
  const { email } = req.params;
  
  const user = await Traveler.findOne({ email }) || await Host.findOne({ email });
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      accountType: user.accountType,
      profilePhoto: user.profilePhoto,
      createdAt: user.createdAt
    }
  });
});

// Update user profile
exports.updateProfile = catchAsync(async (req, res, next) => {
  const updates = {};
  
  if (req.body.name) updates.name = req.body.name;
  if (req.file) {
    const fileId = await uploadToGridFS(req.file);
    updates.profilePhoto = fileId;
  }

  if (Object.keys(updates).length === 0) {
    return next(new AppError('No updates provided', 400));
  }

  let user;
  if (req.user.accountType === 'traveller') {
    user = await Traveler.findByIdAndUpdate(req.user._id, updates, { new: true });
  } else {
    user = await Host.findByIdAndUpdate(req.user._id, updates, { new: true });
  }

  res.json({
    success: true,
    message: 'Profile updated',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      accountType: user.accountType,
      profilePhoto: user.profilePhoto
    }
  });
});

// Traveler specific actions
exports.toggleLikedRoom = catchAsync(async (req, res, next) => {
  if (req.user.accountType !== 'traveller') {
    return next(new AppError('Traveler only', 403));
  }

  const { roomId, action } = req.body;
  const traveler = await Traveler.findById(req.user._id);
  
  if (!traveler) {
    return next(new AppError('Traveler not found', 404));
  }

  traveler.likedRooms = traveler.likedRooms || [];
  
  if (action === 'add' && !traveler.likedRooms.includes(roomId)) {
    traveler.likedRooms.push(roomId);
  } else if (action === 'remove') {
    traveler.likedRooms = traveler.likedRooms.filter(id => id !== roomId);
  } else {
    return next(new AppError('Invalid action', 400));
  }

  await traveler.save();
  res.json({ success: true, likedRooms: traveler.likedRooms });
});

exports.getLikedRooms = catchAsync(async (req, res, next) => {
  if (req.user.accountType !== 'traveller') {
    return next(new AppError('Traveler only', 403));
  }
  
  const traveler = await Traveler.findById(req.user._id);
  res.json({ success: true, likedRooms: traveler?.likedRooms || [] });
});

exports.addViewedRoom = catchAsync(async (req, res, next) => {
  if (req.user.accountType !== 'traveller') {
    return next(new AppError('Traveler only', 403));
  }
  
  const { roomId } = req.body;
  if (!roomId) {
    return next(new AppError('roomId required', 400));
  }

  const traveler = await Traveler.findById(req.user._id);
  traveler.viewedRooms = traveler.viewedRooms || [];
  traveler.viewedRooms = traveler.viewedRooms.filter(r => r.roomId !== roomId);
  traveler.viewedRooms.unshift({ roomId, viewedAt: new Date() });
  
  if (traveler.viewedRooms.length > 50) {
    traveler.viewedRooms.pop();
  }

  await traveler.save();
  res.json({ success: true, viewedRooms: traveler.viewedRooms });
});

exports.getViewedRooms = catchAsync(async (req, res, next) => {
  if (req.user.accountType !== 'traveller') {
    return next(new AppError('Traveler only', 403));
  }
  
  const traveler = await Traveler.findById(req.user._id);
  res.json({ success: true, viewedRooms: traveler?.viewedRooms || [] });
});

exports.clearHistory = catchAsync(async (req, res, next) => {
  if (req.user.accountType !== 'traveller') {
    return next(new AppError('Traveler only', 403));
  }
  
  const traveler = await Traveler.findById(req.user._id);
  traveler.viewedRooms = [];
  await traveler.save();
  
  res.json({ success: true, message: 'History cleared successfully' });
});
exports.getNewCustomers = catchAsync(async (req, res) => {
  try {
    const travelers = await Traveler.find({ accountType: 'traveller' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email accountType createdAt profilePhoto')
      .lean();

    const hosts = await Host.find({ accountType: 'host' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email accountType createdAt profilePhoto')
      .lean();

    const allCustomers = [...travelers, ...hosts]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4);

    const formattedCustomers = allCustomers.map(customer => ({
      id: customer._id,
      name: customer.name || 'Unknown User',
      email: customer.email,
      accountType: customer.accountType === 'traveller' ? 'traveller' : 'host',
      joinedDate: customer.createdAt ? 
        new Date(customer.createdAt).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric'
        }) : 'Recently',
      avatar: customer.profilePhoto || 
        (customer.accountType === 'traveller' ? 
          'https://ui-avatars.com/api/?name=' + encodeURIComponent(customer.name || 'User') + '&background=4e73df&color=fff' :
          'https://ui-avatars.com/api/?name=' + encodeURIComponent(customer.name || 'Host') + '&background=1cc88a&color=fff'
        ),
      isNew: customer.createdAt ? 
        (Date.now() - new Date(customer.createdAt).getTime()) < (7 * 24 * 60 * 60 * 1000) : true
    }));

    res.json({ 
      success: true,
      data: formattedCustomers,
      count: formattedCustomers.length,
      summary: {
        travelersCount: travelers.length,
        hostsCount: hosts.length,
        totalNewCustomers: formattedCustomers.length
      }
    });
  } catch (error) {
    console.error('Error in getNewCustomers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch new customers',
      data: [] 
    });
  }
});