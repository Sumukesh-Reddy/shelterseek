const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const path = require('path');
const mkdirp = require('mkdirp');
const http = require('http');

const { errorLogger } = require('./utils/logger');
const { initializeConnections } = require('./config/database');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./middleware/errorMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiChatRoutes = require('./routes/aiChatRoutes');
const imageRoutes = require('./routes/imageRoutes');
const managerRoutes = require('./routes/managerRoutes');
const financeRoutes = require('./routes/financeRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const contactRoutes = require('./routes/contactRoutes');

// Swagger setup
const setupSwagger = require('./config/swagger');

const app = express();
const server = http.createServer(app);

// Create uploads directory
const uploadsDir = path.join(__dirname, '../public/uploads');
mkdirp.sync(uploadsDir);

// ========== SOCKET.IO SETUP - MUST BE FIRST ==========
const { Server } = require('socket.io');
const setupSocket = require('./sockets/chatSocket');

console.log('🔌 Initializing Socket.IO...');

const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type"]
  },
  path: '/socket.io/',
  transports: ['polling', 'websocket'], // Polling first, then websocket
  allowEIO3: true,
  serveClient: false,
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
  maxHttpBufferSize: 1e6,
  allowUpgrades: true,
  cookie: false
});

// Initialize Socket.IO
setupSocket(io);
app.set('io', io);

console.log('✅ Socket.IO initialized');

// ========== DATABASE CONNECTIONS ==========
initializeConnections();

// ========== MIDDLEWARE ==========
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({ 
  origin: function (origin, callback) {
    // Allow all origins for now to prevent CORS issues
    callback(null, true);
  }, 
  credentials: true,
  exposedHeaders: ['X-Cache'] // Allow frontend to see the cache status
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

// Logging
const logDirectory = path.join(__dirname, '../logs');
mkdirp.sync(logDirectory);

const accessLogStream = require('rotating-file-stream').createStream('access.log', {
  interval: '1d',
  path: logDirectory,
});
app.use(morgan('combined', { stream: accessLogStream }));

// Error logging middleware
app.use(errorLogger);

// Static files
app.use('/uploads', express.static(uploadsDir));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Initialize Swagger
setupSwagger(app);

// ========== ROUTES ==========
app.use('/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiChatRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/managers', managerRoutes);
app.use('/auth/manager', managerRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/contact", contactRoutes);

// Health check and Cache management
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Get system health status
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System status including database and cache
 */
app.get('/health', async (req, res) => {
  const { redisClient } = require('./middleware/cacheMiddleware');
  const redisStatus = redisClient && redisClient.isReady ? 'Connected' : 'Disconnected';
  
  res.status(200).json({ 
    success: true, 
    status: 'UP',
    database: global.hostAdminConnection ? 'Connected' : 'Connecting...',
    cache: redisStatus,
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`
  });
});

/**
 * @swagger
 * /api/cache/flush:
 *   get:
 *     summary: Flush all Redis cache
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *       500:
 *         description: Redis not available or error clearing cache
 */
app.get('/api/cache/flush', async (req, res) => {
  const { redisClient } = require('./middleware/cacheMiddleware');
  if (!redisClient || !redisClient.isReady) {
    return res.status(500).json({ success: false, message: 'Redis not available' });
  }
  
  try {
    await redisClient.flushAll();
    res.json({ success: true, message: 'Cache cleared successfully! Next request will be slow (MongoDB).' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Test routes
app.get('/api/test/traveler-only', 
  require('./middleware/authMiddleware').authenticateToken, 
  require('./middleware/authMiddleware').roleMiddleware.travelerOnly, 
  (req, res) => {
    res.json({ success: true, message: 'Welcome traveler!', user: req.user.email });
});

app.get('/api/test/host-only', 
  require('./middleware/authMiddleware').authenticateToken, 
  require('./middleware/authMiddleware').roleMiddleware.hostOnly, 
  (req, res) => {
    res.json({ success: true, message: 'Welcome host!', user: req.user.email });
});

app.get('/api/test/admin-only', 
  require('./middleware/authMiddleware').authenticateToken, 
  require('./middleware/authMiddleware').roleMiddleware.adminOnly, 
  (req, res) => {
    res.json({ success: true, message: 'Welcome admin!', user: req.user.email });
});

app.get('/debug-env', (req, res) => {
  res.json({
    EMAIL_USER: process.env.EMAIL_USER || 'Not set',
    EMAIL_PASS: process.env.EMAIL_PASS ? `Set (${process.env.EMAIL_PASS.length} chars)` : 'Not set',
    NODE_ENV: process.env.NODE_ENV,
    MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
    FRONTEND_URL: process.env.FRONTEND_URL || 'Not set',
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not set',
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set',
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? `Set (${process.env.CLOUDINARY_API_SECRET.length} chars)` : 'Not set',
    MONGODB_READY: !!global.hostAdminConnection
  });
});

app.get('/api/new-customers', (req, res) => {
  res.json({ success: true, data: [] });
});

app.get('/api/recent-activities', (req, res) => {
  res.json({ success: true, data: [] });
});

app.get('/api/revenue', (req, res) => {
  res.json({ success: true, totalRevenue: 0, thisMonthRevenue: 0, thisWeekRevenue: 0 });
});

app.all('*', (req, res, next) => {
  if (req.originalUrl.includes('/socket.io/')) {
    return res.status(404).end();
  }
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use(globalErrorHandler);

module.exports = app;
