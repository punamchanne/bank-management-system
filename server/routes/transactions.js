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
      if (startDate && startDate !== 'undefined' && !isNaN(new Date(startDate))) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate && endDate !== 'undefined' && !isNaN(new Date(endDate))) {
        query.createdAt.$lte = new Date(endDate + 'T23:59:59');
      }
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 30;

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort('-createdAt')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      success: true,
      count: transactions.length,
      total,
      pages: Math.ceil(total / limit),
      data: transactions
    });
  } catch (error) {
    console.error('Error in GET /api/transactions:', error);
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

    const isPending = req.user.role === 'Clerk';
    const status = isPending ? 'Pending' : 'Success';
    let newBalance = parseFloat(account.balance.toString());

    if (!isPending) {
      newBalance += parseFloat(amount);
      account.balance = mongoose.Types.Decimal128.fromString(newBalance.toFixed(2));
      await account.save();
    }

    const transaction = await Transaction.create({
      accountId,
      type: 'Deposit',
      mode: mode || 'Cash',
      amount: mongoose.Types.Decimal128.fromString(amount.toString()),
      description,
      chequeNumber,
      chequeBank: req.body.chequeBank,
      chequeBranch: req.body.chequeBranch,
      chequeDate: req.body.chequeDate ? new Date(req.body.chequeDate) : undefined,
      chequeStatus: mode === 'Cheque' ? 'Received' : 'N/A',
      status,
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

    const isPending = req.user.role === 'Clerk';
    const status = isPending ? 'Pending' : 'Success';
    let newBalance = currentBalance;

    if (!isPending) {
      newBalance -= parseFloat(amount);
      account.balance = mongoose.Types.Decimal128.fromString(newBalance.toFixed(2));
      await account.save();
    }

    const transaction = await Transaction.create({
      accountId,
      type: 'Withdrawal',
      mode: mode || 'Cash',
      amount: mongoose.Types.Decimal128.fromString(amount.toString()),
      description,
      status,
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

    const isPending = req.user.role === 'Clerk';
    const status = isPending ? 'Pending' : 'Success';
    let newSenderBalance = senderBalance;
    let newReceiverBalance = parseFloat(receiverAccount.balance.toString());

    if (!isPending) {
      newSenderBalance -= parseFloat(amount);
      senderAccount.balance = mongoose.Types.Decimal128.fromString(newSenderBalance.toFixed(2));
      await senderAccount.save();

      newReceiverBalance += parseFloat(amount);
      receiverAccount.balance = mongoose.Types.Decimal128.fromString(newReceiverBalance.toFixed(2));
      await receiverAccount.save();
    }

    const transaction = await Transaction.create({
      accountId,
      beneficiaryAccountId,
      type: 'Transfer',
      mode: mode || 'NEFT',
      amount: mongoose.Types.Decimal128.fromString(amount.toString()),
      description,
      status,
      branchCode: req.user.branchCode,
      performedBy: req.user.userId
    });

    res.status(201).json({
      success: true,
      data: transaction,
      senderBalance: newSenderBalance,
      receiverBalance: newReceiverBalance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/transactions/:id/status
router.put('/:id/status', protect, async (req, res) => {
  try {
    if (req.user.role !== 'Manager' && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to approve transactions' });
    }

    const { status } = req.body; // 'Success' or 'Rejected'
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Transaction is not pending' });
    }

    if (status === 'Rejected') {
      transaction.status = 'Rejected';
      await transaction.save();
      return res.json({ success: true, data: transaction });
    }

    if (status === 'Success') {
      // Process logic based on type
      if (transaction.type === 'Deposit') {
        const account = await Account.findOne({ accountId: transaction.accountId });
        if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

        const currentBalance = parseFloat(account.balance.toString());
        const amount = parseFloat(transaction.amount.toString());
        account.balance = mongoose.Types.Decimal128.fromString((currentBalance + amount).toFixed(2));
        await account.save();

      } else if (transaction.type === 'Withdrawal') {
        const account = await Account.findOne({ accountId: transaction.accountId });
        if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

        const currentBalance = parseFloat(account.balance.toString());
        const amount = parseFloat(transaction.amount.toString());

        if (currentBalance < amount) {
          return res.status(400).json({ success: false, message: 'Insufficient balance for approval' });
        }

        account.balance = mongoose.Types.Decimal128.fromString((currentBalance - amount).toFixed(2));
        await account.save();

      } else if (transaction.type === 'Transfer') {
        const senderAccount = await Account.findOne({ accountId: transaction.accountId });
        const receiverAccount = await Account.findOne({ accountId: transaction.beneficiaryAccountId });

        if (!senderAccount || !receiverAccount) {
          return res.status(404).json({ success: false, message: 'One or both accounts not found' });
        }

        const senderBalance = parseFloat(senderAccount.balance.toString());
        const receiverBalance = parseFloat(receiverAccount.balance.toString());
        const amount = parseFloat(transaction.amount.toString());

        if (senderBalance < amount) {
          return res.status(400).json({ success: false, message: 'Insufficient sender balance for approval' });
        }

        senderAccount.balance = mongoose.Types.Decimal128.fromString((senderBalance - amount).toFixed(2));
        await senderAccount.save();

        receiverAccount.balance = mongoose.Types.Decimal128.fromString((receiverBalance + amount).toFixed(2));
        await receiverAccount.save();
      }

      transaction.status = 'Success';
      await transaction.save();
      return res.json({ success: true, data: transaction });
    }

    return res.status(400).json({ success: false, message: 'Invalid status' });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
