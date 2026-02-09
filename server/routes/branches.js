const express = require('express');
const Branch = require('../models/Branch');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/branches
router.get('/', protect, async (req, res) => {
  try {
    const branches = await Branch.find().sort('branchCode');
    res.json({ success: true, data: branches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/branches
router.post('/', protect, authorize('Admin'), async (req, res) => {
  try {
    const branch = await Branch.create(req.body);
    res.status(201).json({ success: true, data: branch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/branches/:branchCode
router.put('/:branchCode', protect, authorize('Admin'), async (req, res) => {
  try {
    const branch = await Branch.findOneAndUpdate(
      { branchCode: req.params.branchCode },
      req.body,
      { new: true, runValidators: true }
    );
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
    res.json({ success: true, data: branch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
