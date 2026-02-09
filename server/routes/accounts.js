const express = require('express');
const Account = require('../models/Account');
const Customer = require('../models/Customer');
const { protect } = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// GET /api/accounts
router.get('/', protect, async (req, res) => {
  try {
    const { search, status, type, page = 1, limit = 20 } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { accountId: { $regex: search, $options: 'i' } },
        { cifId: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) query.status = status;
    if (type) query.accountType = type;

    const total = await Account.countDocuments(query);
    const accounts = await Account.find(query)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: accounts.length,
      total,
      pages: Math.ceil(total / limit),
      data: accounts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/accounts/:accountId
router.get('/:accountId', protect, async (req, res) => {
  try {
    const account = await Account.findOne({ accountId: req.params.accountId });
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    res.json({ success: true, data: account });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/accounts/customer/:cifId
router.get('/customer/:cifId', protect, async (req, res) => {
  try {
    const accounts = await Account.find({ cifId: req.params.cifId });
    res.json({ success: true, data: accounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/accounts
router.post('/', protect, async (req, res) => {
  try {
    const { cifId, accountType, initialDeposit, nominee } = req.body;

    const customer = await Customer.findOne({ cifId });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found with this CIF ID' });
    }

    const minDeposit = 5000;
    if (!initialDeposit || initialDeposit < minDeposit) {
      return res.status(400).json({
        success: false,
        message: `Minimum initial deposit is ₹${minDeposit}`
      });
    }

    const account = await Account.create({
      cifId,
      accountType,
      branchCode: req.user.branchCode,
      balance: mongoose.Types.Decimal128.fromString(initialDeposit.toString()),
      openedBy: req.user.userId,
      nominee
    });

    res.status(201).json({ success: true, data: account });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/accounts/:accountId/status
router.put('/:accountId/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const account = await Account.findOneAndUpdate(
      { accountId: req.params.accountId },
      { status },
      { new: true, runValidators: true }
    );
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    res.json({ success: true, data: account });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
