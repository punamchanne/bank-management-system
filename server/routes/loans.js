const express = require('express');
const Loan = require('../models/Loan');
const Customer = require('../models/Customer');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/loans
router.get('/', protect, async (req, res) => {
  try {
    const { cifId, status, loanType, page = 1, limit = 20 } = req.query;
    let query = {};

    if (cifId) query.cifId = cifId;
    if (status) query.status = status;
    if (loanType) query.loanType = loanType;

    const total = await Loan.countDocuments(query);
    const loans = await Loan.find(query)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: loans.length,
      total,
      pages: Math.ceil(total / limit),
      data: loans
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/loans/:loanId
router.get('/:loanId', protect, async (req, res) => {
  try {
    const loan = await Loan.findOne({ loanId: req.params.loanId });
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
    res.json({ success: true, data: loan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/loans
router.post('/', protect, async (req, res) => {
  try {
    const { cifId, loanType, amount, tenureYears, interestRate, remarks } = req.body;

    const customer = await Customer.findOne({ cifId });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const loan = await Loan.create({
      cifId,
      loanType,
      amount,
      tenureYears,
      interestRate: interestRate || 8.5,
      branchCode: req.user.branchCode,
      processedBy: req.user.userId,
      remarks
    });

    res.status(201).json({ success: true, data: loan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/loans/calculate-emi
router.post('/calculate-emi', protect, async (req, res) => {
  try {
    const { amount, tenureYears, interestRate = 8.5 } = req.body;

    const P = parseFloat(amount);
    const R = interestRate / 12 / 100;
    const N = tenureYears * 12;

    if (!P || !N) {
      return res.status(400).json({ success: false, message: 'Amount and tenure required' });
    }

    const emi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
    const totalPayable = emi * N;
    const totalInterest = totalPayable - P;

    res.json({
      success: true,
      data: {
        emi: parseFloat(emi.toFixed(2)),
        totalPayable: parseFloat(totalPayable.toFixed(2)),
        totalInterest: parseFloat(totalInterest.toFixed(2)),
        principal: P,
        tenure: N,
        rate: interestRate
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/loans/:loanId/status
router.put('/:loanId/status', protect, authorize('Admin', 'Manager'), async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const loan = await Loan.findOneAndUpdate(
      { loanId: req.params.loanId },
      { status, remarks },
      { new: true, runValidators: true }
    );
    if (!loan) return res.status(404).json({ success: false, message: 'Loan not found' });
    res.json({ success: true, data: loan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
