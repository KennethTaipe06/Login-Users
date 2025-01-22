const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../logger');
const redisClient = require('../redisClient');

const loginUser = async (req, res) => {
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
};

module.exports = {
  loginUser
};
