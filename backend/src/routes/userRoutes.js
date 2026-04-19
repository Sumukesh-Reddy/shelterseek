// routes/userRoutes.js
const express = require('express');
const userController = require('../controllers/userController');
const chatController = require('../controllers/chatController');
const { authenticateToken, roleMiddleware } = require('../middleware/authMiddleware');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management API
 */

/**
 * @swagger
 * /api/users/counts:
 *   get:
 *     summary: Get user counts
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: User counts
 */
router.get('/counts', cacheMiddleware(3600), userController.getUserCounts);

/**
 * @swagger
 * /api/users/new-customers:
 *   get:
 *     summary: Get new customers
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of new customers
 */
router.get('/new-customers', cacheMiddleware(3600), userController.getNewCustomers);  

/**
 * @swagger
 * /api/users/hosts:
 *   get:
 *     summary: Get all hosts
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of hosts
 */
router.get('/hosts', cacheMiddleware(1800), userController.getHosts);

// Search users (must be before /:email wildcard)
router.get('/search', authenticateToken, chatController.searchUsers);

/**
 * @swagger
 * /api/users/{email}:
 *   get:
 *     summary: Get user by email
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile
 */
router.get('/:email', userController.getUserByEmail);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 */
router.get('/', authenticateToken, roleMiddleware.adminOnly, cacheMiddleware(300), userController.getAllUsers);

/**
 * @swagger
 * /api/users/traveler/liked-rooms:
 *   post:
 *     summary: Toggle liked room (Traveler only)
 *     tags: [Users]
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
 *               action:
 *                 type: string
 *                 enum: [add, remove]
 *             example:
 *               roomId: "60d21b4667d0d8992e610c85"
 *               action: "add"
 *     responses:
 *       200:
 *         description: Room liked/unliked status toggled
 */
router.post('/traveler/liked-rooms', 
  authenticateToken, 
  roleMiddleware.travelerOnly, 
  userController.toggleLikedRoom
);

/**
 * @swagger
 * /api/users/traveler/liked-rooms:
 *   get:
 *     summary: Get liked rooms for a traveler
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of liked rooms
 */
router.get('/traveler/liked-rooms', 
  authenticateToken, 
  roleMiddleware.travelerOnly, 
  userController.getLikedRooms
);

/**
 * @swagger
 * /api/users/traveler/viewed-rooms:
 *   post:
 *     summary: Add to viewed rooms
 *     tags: [Users]
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
 *             example:
 *               roomId: "60d21b4667d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Room added to viewed
 */
// Viewed rooms
router.post('/traveler/viewed-rooms', 
  authenticateToken, 
  roleMiddleware.travelerOnly, 
  userController.addViewedRoom
);

/**
 * @swagger
 * /api/users/traveler/viewed-rooms:
 *   get:
 *     summary: Get viewed rooms history
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of recently viewed rooms
 */
router.get('/traveler/viewed-rooms', 
  authenticateToken, 
  roleMiddleware.travelerOnly, 
  userController.getViewedRooms
);

/**
 * @swagger
 * /api/users/traveler/clear-history:
 *   post:
 *     summary: Clear viewed rooms history
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: History cleared
 */
// Clear history
router.post('/traveler/clear-history', 
  authenticateToken, 
  roleMiddleware.travelerOnly, 
  userController.clearHistory
);

/**
 * @swagger
 * /api/users/profile:
 *   patch:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePhoto:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated
 */
// Profile update
router.patch('/profile', 
  authenticateToken, 
  upload.single('profilePhoto'),
  userController.updateProfile
);

module.exports = router;