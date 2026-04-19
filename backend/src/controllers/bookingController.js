const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { Traveler, Host } = require('../models/User/index');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { sendBookingConfirmationEmail } = require('../services/emailService');

// Helper to generate date range
const generateDateRange = (startDate, endDate) => {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(start);
  
  while (current <= end) {
    dates.push(new Date(current).toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

// Create booking
exports.createBooking = catchAsync(async (req, res, next) => {
  const { 
    roomId, checkIn, checkOut, days, totalCost, hostEmail, 
    guests = 1, guestDetails = [], specialRequests = '', paymentDetails = {}
  } = req.body;

  if (!roomId || !checkIn || !checkOut || !days || !totalCost) {
    return next(new AppError('Missing required fields', 400));
  }

  const room = await Room.findById(roomId);
  if (!room) {
    return next(new AppError('Room not found', 404));
  }

  if (guests > room.capacity) {
    return next(new AppError(`Maximum capacity is ${room.capacity} guests`, 400));
  }

  // Check for existing booking
  const existingBooking = await Booking.findOne({
    roomId,
    $or: [{
      checkIn: { $lte: new Date(checkOut) },
      checkOut: { $gte: new Date(checkIn) }
    }],
    bookingStatus: { $in: ['confirmed', 'pending', 'checked_in'] }
  });

  if (existingBooking) {
    return next(new AppError('Room already booked for selected dates', 400));
  }

  const transactionId = paymentDetails.transactionId || 
    `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

  const booking = new Booking({
    travelerId: req.user._id,
    travelerName: req.user.name,
    travelerEmail: req.user.email,
    roomId,
    roomTitle: room.title || room.name,
    hostId: room._id.toString(),
    hostEmail: hostEmail || room.email,
    checkIn: new Date(checkIn),
    checkOut: new Date(checkOut),
    days,
    totalCost,
    guests,
    guestDetails: guestDetails.map(guest => ({
      guestName: guest.guestName,
      guestAge: guest.guestAge ? parseInt(guest.guestAge) : undefined,
      guestGender: guest.guestGender,
      guestContact: guest.guestContact,
      govtIdType: guest.govtIdType,
      govtIdNumber: guest.govtIdNumber
    })),
    paymentDetails: {
      paymentMethod: paymentDetails.paymentMethod || 'credit_card',
      cardLastFour: paymentDetails.cardLastFour,
      cardType: paymentDetails.cardType,
      transactionId,
      paymentGateway: paymentDetails.paymentGateway || 'razorpay',
      paymentDate: new Date()
    },
    bookingStatus: 'confirmed',
    paymentStatus: 'completed',
    specialRequests,
    bookedAt: new Date()
  });

  await booking.save();

  // Update room
  await Room.findByIdAndUpdate(roomId, {
    booking: true,
    bookedBy: req.user._id,
    $addToSet: { unavailableDates: { $each: generateDateRange(checkIn, checkOut) } }
  });

  // Update traveler's bookings array
  const traveler = await Traveler.findById(req.user._id);
  if (traveler) {
    if (!traveler.bookings) traveler.bookings = [];
    
    traveler.bookings.unshift({
      bookingId: booking.bookingId || booking._id.toString(),
      roomId,
      roomTitle: room.title || room.name,
      hostId: room._id.toString(),
      hostEmail: hostEmail || room.email,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      days,
      totalCost,
      status: 'confirmed',
      bookedAt: new Date(),
      guests,
      guestDetails,
      paymentStatus: 'completed',
      paymentMethod: paymentDetails.paymentMethod || 'credit_card',
      transactionId,
      specialRequests
    });
    
    if (traveler.bookings.length > 100) {
      traveler.bookings = traveler.bookings.slice(0, 100);
    }
    
    await traveler.save();
  }

  // Update host's bookings array
  if (room.email) {
    const host = await Host.findOne({ email: room.email });
    if (host) {
      if (!host.hostBookings) host.hostBookings = [];
      
      host.hostBookings.unshift({
        bookingId: booking.bookingId || booking._id.toString(),
        roomId,
        roomTitle: room.title || room.name,
        travelerId: req.user._id,
        travelerName: req.user.name,
        travelerEmail: req.user.email,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        days,
        totalCost,
        status: 'confirmed',
        bookedAt: new Date(),
        guests,
        guestDetails,
        specialRequests,
        transactionId
      });
      
      if (host.hostBookings.length > 100) {
        host.hostBookings = host.hostBookings.slice(0, 100);
      }
      
      await host.save();
    }
  }

  // Send confirmation email
  try {
    await sendBookingConfirmationEmail(req.user.email, {
      bookingId: booking.bookingId || booking._id,
      roomTitle: room.title || room.name,
      checkIn,
      checkOut,
      totalCost,
      transactionId
    });
  } catch (emailErr) {
    console.error('Failed to send confirmation email:', emailErr);
  }

  res.json({ 
    success: true, 
    message: 'Booking confirmed successfully!', 
    bookingId: booking.bookingId || booking._id,
    transactionId,
    booking: {
      id: booking._id,
      bookingId: booking.bookingId || booking._id,
      roomTitle: booking.roomTitle,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      totalCost: booking.totalCost
    }
  });
});

// Get traveler booking history
exports.getTravelerBookings = catchAsync(async (req, res, next) => {
  if (req.user.accountType !== 'traveller') {
    return next(new AppError('Only travelers can access booking history', 403));
  }

  const bookings = await Booking.find({ travelerId: req.user._id })
    .sort({ bookedAt: -1 })
    .lean();

  res.json({
    success: true,
    count: bookings.length,
    bookings
  });
});

// Get host bookings
exports.getHostBookings = catchAsync(async (req, res, next) => {
  if (req.user.accountType !== 'host') {
    return next(new AppError('Only hosts can access host bookings', 403));
  }

  const bookings = await Booking.find({ hostEmail: req.user.email })
    .sort({ bookedAt: -1 })
    .lean();

  res.json({
    success: true,
    count: bookings.length,
    bookings
  });
});

// Get booking by traveler email
exports.getBookingsByTravelerEmail = catchAsync(async (req, res) => {
  const { email } = req.params;
  
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  const bookings = await Booking.find({ travelerEmail: email })
    .sort({ bookedAt: -1 })
    .lean();

  const traveler = await Traveler.findOne({ email }).lean();

  res.json({
    success: true,
    traveler: traveler ? {
      name: traveler.name,
      email: traveler.email,
      accountType: traveler.accountType,
      joinedAt: traveler.createdAt
    } : null,
    bookings: bookings.map(booking => ({
      bookingId: booking.bookingId || booking._id.toString(),
      transactionId: booking.paymentDetails?.transactionId || 'N/A',
      roomTitle: booking.roomTitle || 'Untitled Room',
      roomId: booking.roomId,
      hostEmail: booking.hostEmail,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      days: booking.days || 1,
      totalCost: booking.totalCost || 0,
      guests: booking.guests || 1,
      bookingStatus: booking.bookingStatus || 'pending',
      paymentStatus: booking.paymentStatus || 'pending',
      paymentMethod: booking.paymentDetails?.paymentMethod || 'N/A',
      specialRequests: booking.specialRequests || '',
      bookedAt: booking.bookedAt,
      guestDetails: booking.guestDetails || []
    })),
    count: bookings.length,
    totalSpent: bookings.reduce((sum, b) => sum + (b.totalCost || 0), 0)
  });
});

// Get booking summary (admin)
exports.getBookingSummary = catchAsync(async (req, res) => {
  const bookings = await Booking.find({
    bookingStatus: { $in: ['confirmed', 'checked_in', 'completed'] }
  }).lean();

  const summary = bookings.map(b => ({
    _id: b._id,
    transactionId: b.paymentDetails?.transactionId || b._id,
    userName: b.travelerName || 'Unknown',
    userEmail: b.travelerEmail || '',
    roomTitle: b.roomTitle || 'N/A',
    checkIn: b.checkIn || null,
    checkOut: b.checkOut || null,
    totalCost: Number(b.totalCost ?? 0),
    amount: Number(b.totalCost ?? 0),
    cardType: b.paymentDetails?.cardType || 'Not specified',
  }));

  res.json({
    success: true,
    totalBookings: summary.length,
    bookings: summary,
  });
});

// Get booking stats - Optimized with Aggregation
exports.getBookingStats = catchAsync(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Weekly start (Monday)
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const stats = await Booking.aggregate([
    {
      $match: {
        bookingStatus: { $in: ['confirmed', 'checked_in', 'completed'] }
      }
    },
    {
      $facet: {
        total: [{ $count: "count" }],
        thisMonth: [
          { $match: { bookedAt: { $gte: startOfMonth } } },
          { $count: "count" }
        ],
        thisWeek: [
          { $match: { bookedAt: { $gte: startOfWeek } } },
          { $count: "count" }
        ]
      }
    }
  ]);

  const result = {
    total: stats[0].total[0]?.count || 0,
    thisMonth: stats[0].thisMonth[0]?.count || 0,
    thisWeek: stats[0].thisWeek[0]?.count || 0
  };

  res.json({ 
    success: true,
    ...result,
    count: result.total,
    dateRange: {
      weekStart: startOfWeek.toISOString(),
      monthStart: startOfMonth.toISOString(),
      currentDate: now.toISOString()
    }
  });
});

// Get revenue stats - Optimized with Aggregation
exports.getRevenueStats = catchAsync(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const stats = await Booking.aggregate([
    {
      $match: {
        paymentStatus: 'completed',
        bookingStatus: { $in: ['confirmed', 'checked_in', 'completed'] }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalCost" },
        count: { $sum: 1 },
        thisMonthRevenue: {
          $sum: {
            $cond: [{ $gte: ["$bookedAt", startOfMonth] }, "$totalCost", 0]
          }
        },
        thisWeekRevenue: {
          $sum: {
            $cond: [{ $gte: ["$bookedAt", startOfWeek] }, "$totalCost", 0]
          }
        },
        todayRevenue: {
          $sum: {
            $cond: [{ $gte: ["$bookedAt", startOfToday] }, "$totalCost", 0]
          }
        }
      }
    }
  ]);

  const result = stats[0] || {
    totalRevenue: 0,
    thisMonthRevenue: 0,
    thisWeekRevenue: 0,
    todayRevenue: 0,
    count: 0
  };

  res.json({ 
    success: true,
    totalRevenue: result.totalRevenue, 
    thisMonthRevenue: result.thisMonthRevenue, 
    thisWeekRevenue: result.thisWeekRevenue,
    todayRevenue: result.todayRevenue,
    currency: 'INR',
    bookingCount: result.count,
    averageBookingValue: result.count > 0 ? result.totalRevenue / result.count : 0
  });
});

// Get host analytics
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

// Get single booking by ID
exports.getBookingById = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id).lean();

  if (!booking) {
    return next(new AppError('Booking not found', 404));
  }

  // Authorization check: Only traveler, host, or admin can view
  const isTraveler = booking.travelerId?.toString() === req.user._id.toString();
  const isHost = booking.hostEmail === req.user.email;
  const isAdmin = req.user.accountType === 'admin';

  if (!isTraveler && !isHost && !isAdmin) {
    return next(new AppError('Unauthorized to view this booking', 403));
  }

  res.json({
    success: true,
    booking
  });
});

// Update booking status
exports.updateBookingStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  
  if (!status) {
    return next(new AppError('Status is required', 400));
  }

  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    { bookingStatus: status },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Booking status updated successfully',
    booking
  });
});