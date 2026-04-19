// src/controllers/chatController.js
const mongoose = require('mongoose');
const { Traveler, Host } = require('../models/User');
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Get or create direct chat room
exports.getOrCreateRoom = catchAsync(async (req, res) => {
  const { participantId } = req.body;

  if (!participantId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Participant ID is required' 
    });
  }

  // Validate ObjectIds
  if (!mongoose.Types.ObjectId.isValid(participantId)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid participant ID format' 
    });
  }

  const currentUserModel = req.user.accountType === 'traveller' ? 'Traveler' : 'Host';
  
  let participant = await Traveler.findById(participantId);
  let participantModel = 'Traveler';
  
  if (!participant) {
    participant = await Host.findById(participantId);
    participantModel = 'Host';
  }
  
  if (!participant) {
    return res.status(404).json({ 
      success: false, 
      message: 'Participant not found' 
    });
  }

  // Check if room already exists
  let room = await ChatRoom.findOne({
    isGroup: false,
    participants: { 
      $all: [req.user._id, participantId],
      $size: 2 
    }
  });

  if (!room) {
    room = await ChatRoom.create({
      participants: [req.user._id, participantId],
      participantModels: [currentUserModel, participantModel],
      isGroup: false
    });
    console.log('✅ Created new chat room:', room._id);
  }

  // Get room with populated data
  room = await ChatRoom.findById(room._id);
  
  // Get participant details
  const participants = [];
  
  const currentUser = currentUserModel === 'Traveler' 
    ? await Traveler.findById(req.user._id).select('name email profilePhoto online lastSeen')
    : await Host.findById(req.user._id).select('name email profilePhoto online lastSeen');
  
  const otherParticipant = participantModel === 'Traveler'
    ? await Traveler.findById(participantId).select('name email profilePhoto online lastSeen')
    : await Host.findById(participantId).select('name email profilePhoto online lastSeen');
  
  participants.push({
    _id: req.user._id,
    name: currentUser?.name || 'Unknown',
    email: currentUser?.email || '',
    profilePhoto: currentUser?.profilePhoto || null,
    online: currentUser?.online || false,
    lastSeen: currentUser?.lastSeen || new Date()
  });
  
  participants.push({
    _id: participantId,
    name: otherParticipant?.name || 'Unknown',
    email: otherParticipant?.email || '',
    profilePhoto: otherParticipant?.profilePhoto || null,
    online: otherParticipant?.online || false,
    lastSeen: otherParticipant?.lastSeen || new Date()
  });

  const roomWithDetails = {
    ...room.toObject(),
    participants
  };

  res.json({ success: true, room: roomWithDetails });
});

// Get user's chat rooms
exports.getUserRooms = catchAsync(async (req, res) => {
  const rooms = await ChatRoom.find({ 
    participants: req.user._id 
  })
  .populate('lastMessage')
  .sort({ updatedAt: -1 });

  const roomsWithParticipants = await Promise.all(rooms.map(async (room) => {
    const participants = [];
    
    for (let i = 0; i < room.participants.length; i++) {
      const participantId = room.participants[i];
      const modelType = room.participantModels?.[i] || 'Traveler';
      
      let participant;
      if (modelType === 'Traveler') {
        participant = await Traveler.findById(participantId)
          .select('name email profilePhoto online lastSeen');
      } else {
        participant = await Host.findById(participantId)
          .select('name email profilePhoto online lastSeen');
      }
      
      if (participant) {
        participants.push({
          _id: participantId,
          name: participant.name || 'Unknown',
          email: participant.email || '',
          profilePhoto: participant.profilePhoto || null,
          online: participant.online || false,
          lastSeen: participant.lastSeen || new Date()
        });
      }
    }
    
    const unreadCount = await Message.countDocuments({
      roomId: room._id,
      sender: { $ne: req.user._id },
      read: false
    });
    
    return {
      ...room.toObject(),
      participants,
      unreadCount
    };
  }));

  res.json({ 
    success: true, 
    rooms: roomsWithParticipants 
  });
});

// Delete chat room
exports.deleteRoom = catchAsync(async (req, res) => {
  const { roomId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid room ID format' 
    });
  }

  const room = await ChatRoom.findById(roomId);
  if (!room) {
    return res.status(404).json({ 
      success: false, 
      message: 'Room not found' 
    });
  }

  const isParticipant = room.participants.some(p => p.toString() === req.user._id.toString());
  if (!isParticipant) {
    return res.status(403).json({ 
      success: false, 
      message: 'Not authorized to delete this room' 
    });
  }

  // Delete all messages in the room
  await Message.deleteMany({ roomId });
  
  // Delete the room
  await ChatRoom.findByIdAndDelete(roomId);

  res.json({ 
    success: true, 
    message: 'Chat deleted successfully' 
  });
});

// Get messages for a room
exports.getMessages = catchAsync(async (req, res) => {
  const { roomId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid room ID format' 
    });
  }

  const room = await ChatRoom.findOne({
    _id: roomId,
    participants: req.user._id
  });

  if (!room) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied' 
    });
  }

  const messages = await Message.find({ 
    roomId, 
    deleted: false 
  })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ createdAt: 1 });

  const messagesWithSenders = await Promise.all(messages.map(async (msg) => {
    let sender;
    if (msg.senderModel === 'Traveler') {
      sender = await Traveler.findById(msg.sender).select('name profilePhoto');
    } else {
      sender = await Host.findById(msg.sender).select('name profilePhoto');
    }
    
    return {
      ...msg.toObject(),
      sender: {
        _id: msg.sender,
        name: sender?.name || 'Unknown',
        profilePhoto: sender?.profilePhoto || null
      }
    };
  }));

  // Mark messages as read
  await Message.updateMany(
    {
      roomId,
      sender: { $ne: req.user._id },
      read: false
    },
    { 
      $set: { 
        read: true, 
        readAt: new Date() 
      } 
    }
  );

  res.json({
    success: true,
    messages: messagesWithSenders,
    page,
    total: await Message.countDocuments({ 
      roomId, 
      deleted: false 
    })
  });
});

// Search users for chat - Optimized with Full Text Search
exports.searchUsers = catchAsync(async (req, res) => {
  const { query } = req.query;

  if (!query || query.trim().length < 2) {
    return res.json({ success: true, users: [] });
  }

  const searchTerm = query.trim();
  
  // Use Full-Text Search index for high performance
  const [travelers, hosts] = await Promise.all([
    Traveler.find(
      { 
        $text: { $search: searchTerm },
        _id: { $ne: req.user._id }
      },
      { score: { $meta: "textScore" } }
    )
    .sort({ score: { $meta: "textScore" } })
    .select('name email profilePhoto online lastSeen accountType')
    .limit(15)
    .lean(),

    Host.find(
      { 
        $text: { $search: searchTerm },
        _id: { $ne: req.user._id }
      },
      { score: { $meta: "textScore" } }
    )
    .sort({ score: { $meta: "textScore" } })
    .select('name email profilePhoto online lastSeen accountType')
    .limit(15)
    .lean()
  ]);

  // Fallback to regex if no results (for partial matches like "sum" matching "sumukesh")
  let finalTravelers = travelers;
  let finalHosts = hosts;

  if (travelers.length === 0 && hosts.length === 0) {
    const regex = new RegExp(searchTerm, 'i');
    [finalTravelers, finalHosts] = await Promise.all([
      Traveler.find({
        _id: { $ne: req.user._id },
        $or: [{ name: regex }, { email: regex }]
      }).select('name email profilePhoto online lastSeen accountType').limit(10).lean(),
      Host.find({
        _id: { $ne: req.user._id },
        $or: [{ name: regex }, { email: regex }]
      }).select('name email profilePhoto online lastSeen accountType').limit(10).lean()
    ]);
  }

  const seenIds = new Set();
  const seenEmails = new Set();
  
  const users = [...finalTravelers, ...finalHosts]
    .map(user => ({
      _id: user._id.toString(),
      name: user.name || 'Unknown User',
      email: user.email || '',
      profilePhoto: user.profilePhoto || null,
      online: user.online || false,
      lastSeen: user.lastSeen || new Date(),
      accountType: user.accountType
    }))
    .filter(user => {
      if (user._id === req.user._id.toString()) return false;
      if (seenIds.has(user._id)) return false;
      
      const email = user.email.toLowerCase();
      if (email && seenEmails.has(email)) return false;
      
      seenIds.add(user._id);
      if (email) seenEmails.add(email);
      
      return true;
    })
    .slice(0, 20);

  res.json({ 
    success: true, 
    users, 
    count: users.length 
  });
});

// Send test message
exports.sendTestMessage = catchAsync(async (req, res) => {
  const { content, roomId } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid room ID format' 
    });
  }

  const message = await Message.create({
    sender: req.user._id,
    senderModel: req.user.accountType === 'traveller' ? 'Traveler' : 'Host',
    content,
    type: 'text',
    roomId
  });
  
  console.log('✅ Test message saved:', message._id);
  
  res.json({ 
    success: true, 
    message 
  });
});

exports.getHostAnalytics = catchAsync(async (req, res, next) => {
    if (req.user.accountType !== 'host') {
      return next(new AppError('Only hosts can access host analytics', 403));
    }
  
    const bookings = await Booking.find({
      hostEmail: req.user.email,
      paymentStatus: 'completed',
      bookingStatus: { $in: ['confirmed', 'completed', 'checked_out'] }
    }).sort({ bookedAt: -1 }).lean();
  
    const currentDate = new Date();
    const monthlyData = [];
  
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0, 23, 59, 59);
  
      const monthBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.bookedAt);
        return bookingDate >= monthStart && bookingDate <= monthEnd;
      });
  
      const monthEarnings = monthBookings.reduce((sum, booking) => sum + booking.totalCost, 0);
  
      monthlyData.unshift({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        bookings: monthBookings.length,
        earnings: monthEarnings
      });
    }
  
    const totalBookings = bookings.length;
    const totalEarnings = bookings.reduce((sum, booking) => sum + booking.totalCost, 0);
    const avgEarningsPerBooking = totalBookings > 0 ? totalEarnings / totalBookings : 0;
  
    res.json({
      success: true,
      analytics: {
        totalBookings,
        totalEarnings,
        avgEarningsPerBooking,
        monthlyData
      }
    });
  });