const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Driver = require('../models/driverModel');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    console.log("Auth Header:", authHeader); // DEBUG

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    const token = authHeader.split(' ')[1];

    console.log("Token received:", token); // DEBUG

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("JWT SECRET:", process.env.JWT_SECRET);

    console.log("Decoded:", decoded); // DEBUG

    let account;

    if (decoded.role === 'driver') {
      account = await Driver.findById(decoded.id);
    } else {
      account = await User.findById(decoded.id).select('-password');
    }

    if (!account) {
      return res.status(401).json({ msg: 'Account not found' });
    }

    req.user = {
      id: account._id,
      role: decoded.role
    };

    next();

  } catch (err) {
    console.error('Auth error:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};