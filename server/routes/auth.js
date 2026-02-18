const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '24h' });
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { userId, password, branchCode } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ success: false, message: 'Please provide User ID and password' });
    }

    const user = await User.findOne({ userId: userId.toUpperCase() }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (branchCode && user.branchCode !== branchCode.toUpperCase() && user.role !== 'Admin') {
      return res.status(401).json({ success: false, message: 'Branch code mismatch' });
    }

    const { role } = req.body;
    if (role && user.role !== role) {
      return res.status(401).json({ success: false, message: 'Role mismatch' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        role: user.role,
        branchCode: user.branchCode,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      userId: req.user.userId,
      name: req.user.name,
      role: req.user.role,
      branchCode: req.user.branchCode,
      email: req.user.email
    }
  });
});

// POST /api/auth/register (Admin only)
router.post('/register', protect, authorize('Admin'), async (req, res) => {
  try {
    const { userId, password, name, email, role, branchCode } = req.body;

    const existingUser = await User.findOne({ userId: userId.toUpperCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User ID already exists' });
    }

    const user = await User.create({
      userId: userId.toUpperCase(),
      password,
      name,
      email,
      role,
      branchCode: branchCode.toUpperCase()
    });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        role: user.role,
        branchCode: user.branchCode
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
