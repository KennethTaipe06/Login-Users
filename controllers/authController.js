const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../logger');
const redisClient = require('../redisClient');
const bcrypt = require('bcryptjs');

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn('Invalid credentials');
      return res.status(400).json({ message: 'Invalid credentials' });
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
};

module.exports = {
  loginUser
};
