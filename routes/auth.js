const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../logger');
const redisClient = require('../redisClient');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           description: The user's email
 *         password:
 *           type: string
 *           description: The user's password
 */

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: The authentication managing API
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: The JWT token and user id
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 userId:
 *                   type: string
 *       400:
 *         description: Invalid email or password
 *       500:
 *         description: Server error
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      logger.warn('Invalid email or password');
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    await redisClient.set(user._id.toString(), token, {
      EX: 3600 // Expira en 1 hora
    });

    logger.info('User logged in successfully');
    res.json({ token, userId: user._id });
  } catch (err) {
    logger.error('Server error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log out a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid token or user not found
 *       500:
 *         description: Server error
 */
router.post('/logout', async (req, res) => {
  const { email, token } = req.body;

  try {
    const storedToken = await redisClient.get(email);
    if (storedToken === token) {
      const result = await redisClient.del(email);
      if (result === 1) {
        logger.info('User logged out successfully');
        res.json({ message: 'bye bye' });
      } else {
        logger.warn('User not found in Redis');
        res.status(400).json({ message: 'User not found' });
      }
    } else {
      logger.warn('Invalid token');
      res.status(400).json({ message: 'Invalid token' });
    }
  } catch (err) {
    logger.error('Server error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
