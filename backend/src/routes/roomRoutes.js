const { cacheMiddleware } = require('../middleware/cacheMiddleware');
const express = require('express');
const roomController = require('../controllers/roomController');
const hostController = require('../controllers/hostController');
const { authenticateToken, roleMiddleware } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const AppError = require('../utils/appError');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Rooms
 *   description: Room and Listing management API
 */

// ========== PUBLIC ROUTES (No Authentication Required) ==========

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: Get all rooms
 *     tags: [Rooms]
 *     parameters:
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: price
 *         schema:
 *           type: number
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of rooms
 */
router.get('/', cacheMiddleware(300), roomController.getAllRooms);

/**
 * @swagger
 * /api/rooms/count:
 *   get:
 *     summary: Get room counts by status
 *     tags: [Rooms]
 *     responses:
 *       200:
 *         description: Object containing room counts
 */
router.get('/count', cacheMiddleware(3600), roomController.getRoomCounts);

/**
 * @swagger
 * /api/rooms/host/{email}:
 *   get:
 *     summary: Get rooms by host email
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of rooms for host
 */
router.get('/host/:email', roomController.getRoomsByHostEmail);

router.get('/images/:id', hostController.getImage);

// ✅ IMPORTANT: Listings routes - These MUST be defined here
/**
 * @swagger
 * /api/rooms/listings:
 *   get:
 *     summary: Get all listings (public)
 *     tags: [Rooms]
 *     responses:
 *       200:
 *         description: List of all listings
 */
router.get('/listings', cacheMiddleware(300), hostController.getListings);

/**
 * @swagger
 * /api/rooms/listings/{id}:
 *   get:
 *     summary: Get single listing by ID
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Single listing object
 */
router.get('/listings/:id', hostController.getListingById);

// ========== PROTECTED ROUTES (Host Only) ==========

/**
 * @swagger
 * /api/rooms/listings:
 *   post:
 *     summary: Create a new listing
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *               location: { type: string }
 *               images: { type: array, items: { type: string, format: binary } }
 *     responses:
 *       201:
 *         description: Listing created
 */
router.post('/listings',
  authenticateToken,
  roleMiddleware.hostOnly,
  (req, res, next) => {
    upload.array('images', 12)(req, res, (err) => {
      if (err) return next(new AppError(err.message || 'Image upload failed', 400));
      next();
    });
  },
  hostController.createListing
);

/**
 * @swagger
 * /api/rooms/listings/{id}:
 *   put:
 *     summary: Update an existing listing
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Listing updated
 */
router.put('/listings/:id',
  authenticateToken,
  roleMiddleware.hostOnly,
  (req, res, next) => {
    upload.array('images', 12)(req, res, (err) => {
      if (err) return next(new AppError(err.message || 'Image upload failed', 400));
      next();
    });
  },
  hostController.updateListing
);

/**
 * @swagger
 * /api/rooms/listings/{listingId}/status:
 *   patch:
 *     summary: Update listing status (Admin/Manager/Host)
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               status: { type: string, enum: [pending, verified, rejected] }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/listings/:listingId/status',
  authenticateToken,
  (req, res, next) => {
    const isListingsManager =
      req.user.accountType === 'manager' &&
      String(req.user.department || '').trim().toLowerCase() === 'listings';

    if (req.user.accountType === 'host' || req.user.accountType === 'admin' || isListingsManager) {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Access denied' });
  },
  roomController.updateListingStatus
);

/**
 * @swagger
 * /api/rooms/listings/{id}:
 *   delete:
 *     summary: Delete a listing
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Listing deleted
 */
router.delete('/listings/:id',
  authenticateToken,
  (req, res, next) => {
    const isListingsManager =
      req.user.accountType === 'manager' &&
      String(req.user.department || '').trim().toLowerCase() === 'listings';

    if (req.user.accountType === 'host' || req.user.accountType === 'admin' || isListingsManager) {
      return next();
    }
    return res.status(403).json({ success: false, message: 'Access denied' });
  },
  hostController.deleteListing
);

/**
 * @swagger
 * /api/rooms/{roomId}/book:
 *   put:
 *     summary: Toggle room booking status
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booking status toggled
 */
router.put('/:roomId/book',
  authenticateToken,
  roleMiddleware.travelerOnly,
  roomController.updateRoomBooking
);

/**
 * @swagger
 * /api/rooms/listings/{listingId}/qr:
 *   get:
 *     summary: Generate QR code for listing
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: QR code image
 */
router.get('/:listingId/qr',
  authenticateToken,
  roleMiddleware.hostOnly,
  hostController.generateQRCode
);

router.get('/listings/:listingId/qr',
    authenticateToken,
    roleMiddleware.hostOnly,
    hostController.generateQRCode
  );

module.exports = router;
