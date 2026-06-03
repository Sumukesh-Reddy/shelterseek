const jwt = require('jsonwebtoken');
const { Traveler, Host, Manager } = require('../models/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { sendOTPEmail, sendPasswordResetEmail } = require('../services/emailService');
const { logControllerError } = require('../utils/logger');

// OTP store (in production, use Redis)
const otpStore = {};
const verifiedEmails = new Set();

// Generate JWT Token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'myjwtsecret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '90d'
  });
};

// Send OTP
exports.sendOTP = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new AppError('Email required', 400));
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 };

  const isProd = process.env.NODE_ENV === 'production';

  try {
    await sendOTPEmail(email, otp);
    res.json({ success: true, message: 'OTP sent successfully!' });
  } catch (error) {
    if (!isProd) {
      // In development, return OTP in response
      return res.json({ success: true, message: 'OTP generated (dev)', otp });
    }
    return next(new AppError(`Failed to send OTP: ${error.message}`, 500));
  }
});

// Verify OTP
exports.verifyOTP = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;
  const data = otpStore[email];

  if (!data || Date.now() > data.expires) {
    delete otpStore[email];
    return next(new AppError('OTP expired or invalid', 400));
  }

  if (data.otp === otp) {
    delete otpStore[email];
    verifiedEmails.add(email);
    return res.json({ success: true, message: 'OTP verified!' });
  }

  return next(new AppError('Invalid OTP', 400));
});

// Register
exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password, accountType } = req.body;

  if (!name || !email || !password || !accountType) {
    return next(new AppError('All fields required', 400));
  }

  if (!verifiedEmails.has(email)) {
    return next(new AppError('Please verify OTP first', 400));
  }

  // Check if user exists
  const exists = await Traveler.findOne({ email }) || await Host.findOne({ email });
  if (exists) {
    return next(new AppError('User already exists', 400));
  }

  const userData = {
    name, email, password,
    accountType: accountType === 'host' ? 'host' : 'traveller',
    isVerified: true
  };

  const user = accountType === 'host' 
    ? new Host(userData) 
    : new Traveler(userData);
  
  await user.save();
  verifiedEmails.delete(email);

  const token = signToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Signup successful!',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      accountType: user.accountType
    }
  });
});

// Login
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Email & password required', 400));
  }

  let user = await Traveler.findOne({ email }).select('+password') ||
             await Host.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password))) {
    return next(new AppError('Invalid credentials', 401));
  }

  const token = signToken(user._id);

  const userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    accountType: user.accountType
  };

  if (user.accountType === 'traveller') {
    userData.likedRooms = user.likedRooms || [];
    userData.viewedRooms = user.viewedRooms || [];
  }

  res.json({ 
    success: true, 
    message: 'Login successful', 
    token, 
    user: userData 
  });
});

// Forgot Password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new AppError('Email required', 400));
  }

  const user = await Traveler.findOne({ email }) || await Host.findOne({ email }) || await Manager.findOne({ email });
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const resetToken = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15);
  user.resetToken = resetToken;
  user.resetTokenExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?email=${encodeURIComponent(email)}&token=${resetToken}`;

  if (process.env.NODE_ENV !== 'production') {
    console.log(`DEV RESET LINK: ${resetLink}`);
    return res.json({ success: true, message: 'Check console for link', resetLink });
  }

  try {
    await sendPasswordResetEmail(email, resetLink);
    res.json({ success: true, message: 'Reset email sent' });
  } catch (error) {
    return next(new AppError('Failed to send reset email', 500));
  }
});

// Reset Password
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { email, token, newPassword } = req.body;
  
  if (!email || !token || !newPassword || newPassword.length < 8) {
    return next(new AppError('Invalid input', 400));
  }

  const user = await Traveler.findOne({ 
    email, 
    resetToken: token, 
    resetTokenExpires: { $gt: Date.now() } 
  }) || await Host.findOne({ 
    email, 
    resetToken: token, 
    resetTokenExpires: { $gt: Date.now() } 
  }) || await Manager.findOne({ 
    email, 
    resetToken: token, 
    resetTokenExpires: { $gt: Date.now() } 
  });

  if (!user) {
    return next(new AppError('Invalid or expired token', 400));
  }

  user.password = newPassword;
  user.resetToken = undefined;
  user.resetTokenExpires = undefined;
  await user.save();

  res.json({ success: true, message: 'Password reset successful' });
});

// Logout
exports.logout = (req, res) => {
  req.logout(() => {});
  req.session.destroy();
  res.json({ success: true, message: 'Logged out' });
};

// Get Profile
exports.getProfile = (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      accountType: req.user.accountType,
      profilePhoto: req.user.profilePhoto
    }
  });
};