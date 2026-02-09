const express = require('express');
const Customer = require('../models/Customer');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/customers
router.get('/', protect, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { cifId: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
          { mobile: { $regex: search, $options: 'i' } },
          { pan: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: customers.length,
      total,
      pages: Math.ceil(total / limit),
      data: customers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/customers/:cifId
router.get('/:cifId', protect, async (req, res) => {
  try {
    const customer = await Customer.findOne({ cifId: req.params.cifId });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/customers
router.post('/', protect, async (req, res) => {
  try {
    const { name, dob, aadhar, pan, address, mobile, email } = req.body;

    const existingPan = await Customer.findOne({ pan: pan.toUpperCase() });
    if (existingPan) {
      return res.status(400).json({ success: false, message: 'Customer with this PAN already exists' });
    }

    const customer = await Customer.create({
      name,
      dob,
      aadhar,
      pan: pan.toUpperCase(),
      address,
      mobile,
      email,
      branchCode: req.user.branchCode,
      createdBy: req.user.userId
    });

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/customers/:cifId
router.put('/:cifId', protect, async (req, res) => {
  try {
    const { name, address, mobile, email } = req.body;
    const customer = await Customer.findOneAndUpdate(
      { cifId: req.params.cifId },
      { name, address, mobile, email },
      { new: true, runValidators: true }
    );
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
