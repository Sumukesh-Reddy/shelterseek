// routes/bookingRoutes.js
const express = require('express');
const bookingController = require('../controllers/bookingController');
const { authenticateToken, roleMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Booking management API
 */

/**
 * @swagger
 * /api/bookings/summary:
 *   get:
 *     summary: Get booking summary
 *     tags: [Bookings]
 *     responses:
 *       200:
 *         description: Booking summary data
 */
// Public stats routes - NO AUTHENTICATION REQUIRED
router.get('/summary', bookingController.getBookingSummary);

/**
 * @swagger
 * /api/bookings/summarys:
 *   get:
 *     summary: Get booking summary (duplicate)
 *     tags: [Bookings]
 *     responses:
 *       200:
 *         description: Booking summary data
 */
router.get('/summarys', bookingController.getBookingSummary);

/**
 * @swagger
 * /api/bookings/stats:
 *   get:
 *     summary: Get booking statistics
 *     tags: [Bookings]
 *     responses:
 *       200:
 *         description: Booking stats data
 */
router.get('/stats', bookingController.getBookingStats);

/**
 * @swagger
 * /api/bookings/revenue:
 *   get:
 *     summary: Get revenue statistics
 *     tags: [Bookings]
 *     responses:
 *       200:
 *         description: Revenue stats data
 */
router.get('/revenue', bookingController.getRevenueStats);

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roomId:
 *                 type: string
 *               checkIn:
 *                 type: string
 *                 format: date
 *               checkOut:
 *                 type: string
 *                 format: date
 *               days:
 *                 type: number
 *               totalCost:
 *                 type: number
 *               hostEmail:
 *                 type: string
 *               guests:
 *                 type: number
 *             example:
 *               roomId: "60d21b4667d0d8992e610c85"
 *               checkIn: "2026-04-10"
 *               checkOut: "2026-04-15"
 *               days: 5
 *               totalCost: 500
 *               hostEmail: "alice@example.com"
 *               guests: 2
 *     responses:
 *       201:
 *         description: Booking created
 */
// Protected routes
router.post('/',
  authenticateToken,
  roleMiddleware.travelerOnly,
  bookingController.createBooking
);

/**
 * @swagger
 * /api/bookings/history:
 *   get:
 *     summary: Get traveler booking history
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of previous bookings for traveler
 */
router.get('/history',
  authenticateToken,
  roleMiddleware.travelerOnly,
  bookingController.getTravelerBookings
);

/**
 * @swagger
 * /api/bookings/host:
 *   get:
 *     summary: Get host bookings
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings for host's properties
 */
router.get('/host',
  authenticateToken,
  roleMiddleware.hostOnly,
  bookingController.getHostBookings
);

/**
 * @swagger
 * /api/bookings/analytics/host:
 *   get:
 *     summary: Get host analytics
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Host analytics data
 */
router.get('/analytics/host',
  authenticateToken,
  roleMiddleware.hostOnly,
  bookingController.getHostAnalytics
);

/**
 * @swagger
 * /api/bookings/traveler/{email}:
 *   get:
 *     summary: Get bookings by traveler email
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of bookings for given traveler
 */
router.get('/traveler/:email',
  authenticateToken,
  roleMiddleware.adminOnly,
  bookingController.getBookingsByTravelerEmail
);

router.get('/:id',
  authenticateToken,
  bookingController.getBookingById
);

router.patch('/:id/status',
  authenticateToken,
  bookingController.updateBookingStatus
);

module.exports = router;