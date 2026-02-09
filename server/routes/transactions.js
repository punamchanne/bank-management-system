const express = require('express');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const { protect } = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// GET /api/transactions
router.get('/', protect, async (req, res) => {
  try {
    const { accountId, type, mode, status, startDate, endDate, page = 1, limit = 30 } = req.query;
    let query = {};

    if (accountId) query.accountId = accountId;
    if (type) query.type = type;
    if (mode) query.mode = mode;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59');
    }

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: transactions.length,
      total,
      pages: Math.ceil(total / limit),
      data: transactions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/transactions/deposit
router.post('/deposit', protect, async (req, res) => {
  try {
    const { accountId, amount, mode, description, chequeNumber } = req.body;

    const account = await Account.findOne({ accountId, status: 'Active' });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Active account not found' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const currentBalance = parseFloat(account.balance.toString());
    const newBalance = currentBalance + parseFloat(amount);

    account.balance = mongoose.Types.Decimal128.fromString(newBalance.toFixed(2));
    await account.save();

    const transaction = await Transaction.create({
      accountId,
      type: 'Deposit',
      mode: mode || 'Cash',
      amount: mongoose.Types.Decimal128.fromString(amount.toString()),
      description,
      chequeNumber,
      chequeStatus: mode === 'Cheque' ? 'Received' : 'N/A',
      status: 'Success',
      branchCode: req.user.branchCode,
      performedBy: req.user.userId
    });

    res.status(201).json({ success: true, data: transaction, newBalance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/transactions/withdraw
router.post('/withdraw', protect, async (req, res) => {
  try {
    const { accountId, amount, mode, description } = req.body;

    const account = await Account.findOne({ accountId, status: 'Active' });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Active account not found' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const currentBalance = parseFloat(account.balance.toString());
    if (currentBalance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    const newBalance = currentBalance - parseFloat(amount);
    account.balance = mongoose.Types.Decimal128.fromString(newBalance.toFixed(2));
    await account.save();

    const transaction = await Transaction.create({
      accountId,
      type: 'Withdrawal',
      mode: mode || 'Cash',
      amount: mongoose.Types.Decimal128.fromString(amount.toString()),
      description,
      status: 'Success',
      branchCode: req.user.branchCode,
      performedBy: req.user.userId
    });

    res.status(201).json({ success: true, data: transaction, newBalance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/transactions/transfer
router.post('/transfer', protect, async (req, res) => {
  try {
    const { accountId, beneficiaryAccountId, amount, mode, description } = req.body;

    if (accountId === beneficiaryAccountId) {
      return res.status(400).json({ success: false, message: 'Cannot transfer to the same account' });
    }

    const senderAccount = await Account.findOne({ accountId, status: 'Active' });
    if (!senderAccount) {
      return res.status(404).json({ success: false, message: 'Sender account not found or inactive' });
    }

    const receiverAccount = await Account.findOne({ accountId: beneficiaryAccountId, status: 'Active' });
    if (!receiverAccount) {
      return res.status(404).json({ success: false, message: 'Beneficiary account not found or inactive' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const senderBalance = parseFloat(senderAccount.balance.toString());
    if (senderBalance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // Debit sender
    senderAccount.balance = mongoose.Types.Decimal128.fromString((senderBalance - amount).toFixed(2));
    await senderAccount.save();

    // Credit receiver
    const receiverBalance = parseFloat(receiverAccount.balance.toString());
    receiverAccount.balance = mongoose.Types.Decimal128.fromString((receiverBalance + amount).toFixed(2));
    await receiverAccount.save();

    const transaction = await Transaction.create({
      accountId,
      beneficiaryAccountId,
      type: 'Transfer',
      mode: mode || 'NEFT',
      amount: mongoose.Types.Decimal128.fromString(amount.toString()),
      description,
      status: 'Success',
      branchCode: req.user.branchCode,
      performedBy: req.user.userId
    });

    res.status(201).json({
      success: true,
      data: transaction,
      senderBalance: senderBalance - amount,
      receiverBalance: receiverBalance + amount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
