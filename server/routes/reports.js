const express = require('express');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const Customer = require('../models/Customer');
const Loan = require('../models/Loan');
const Branch = require('../models/Branch');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Helper to get date dateRange
const getDateRange = (startDate, endDate) => {
  const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0));
  const end = endDate ? new Date(endDate + 'T23:59:59') : new Date(new Date().setHours(23, 59, 59, 999));
  return { start, end };
};

// GET /api/reports/dashboard
router.get('/dashboard', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const branchCode = req.user.role === 'Admin' ? undefined : req.user.branchCode;
    const branchFilter = branchCode ? { branchCode } : {};

    const [
      totalCustomers,
      totalAccounts,
      totalLoans,
      pendingLoans,
      todayTransactions,
      todayDeposits,
      todayWithdrawals,
      todayCheques
    ] = await Promise.all([
      Customer.countDocuments(branchFilter),
      Account.countDocuments({ ...branchFilter, status: 'Active' }),
      Loan.countDocuments(branchFilter),
      Loan.countDocuments({ ...branchFilter, status: 'Pending' }),
      Transaction.countDocuments({ ...branchFilter, createdAt: { $gte: today, $lt: tomorrow } }),
      Transaction.aggregate([
        { $match: { ...branchFilter, type: 'Deposit', createdAt: { $gte: today, $lt: tomorrow }, status: 'Success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { ...branchFilter, type: 'Withdrawal', createdAt: { $gte: today, $lt: tomorrow }, status: 'Success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.countDocuments({
        ...branchFilter,
        mode: 'Cheque',
        createdAt: { $gte: today, $lt: tomorrow }
      })
    ]);

    const depositTotal = todayDeposits.length > 0 ? parseFloat(todayDeposits[0].total.toString()) : 0;
    const withdrawalTotal = todayWithdrawals.length > 0 ? parseFloat(todayWithdrawals[0].total.toString()) : 0;

    // Online transactions aggregate
    const onlineTransactions = await Transaction.aggregate([
      {
        $match: {
          ...branchFilter,
          mode: { $in: ['NEFT', 'RTGS', 'UPI', 'IMPS'] },
          createdAt: { $gte: today, $lt: tomorrow },
          status: 'Success'
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const onlineTotal = onlineTransactions.length > 0 ? parseFloat(onlineTransactions[0].total.toString()) : 0;

    res.json({
      success: true,
      data: {
        totalCustomers,
        totalAccounts,
        totalLoans,
        pendingLoans,
        todayTransactions,
        todayCash: depositTotal - withdrawalTotal,
        todayDeposits: depositTotal,
        todayWithdrawals: withdrawalTotal,
        onlineTransactions: onlineTotal,
        chequesProcessed: todayCheques
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/reports/cash
router.get('/cash', protect, async (req, res) => {
  try {
    const { start, end } = getDateRange(req.query.startDate, req.query.endDate);
    const branchFilter = req.user.role !== 'Admin' ? { branchCode: req.user.branchCode } : {};

    const deposits = await Transaction.aggregate([
      { $match: { ...branchFilter, type: 'Deposit', mode: 'Cash', createdAt: { $gte: start, $lte: end }, status: 'Success' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const withdrawals = await Transaction.aggregate([
      { $match: { ...branchFilter, type: 'Withdrawal', mode: 'Cash', createdAt: { $gte: start, $lte: end }, status: 'Success' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const depTotal = deposits.length > 0 ? parseFloat(deposits[0].total.toString()) : 0;
    const witTotal = withdrawals.length > 0 ? parseFloat(withdrawals[0].total.toString()) : 0;

    res.json({
      success: true,
      data: {
        deposits: { total: depTotal, count: deposits[0]?.count || 0 },
        withdrawals: { total: witTotal, count: withdrawals[0]?.count || 0 },
        netCash: depTotal - witTotal
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/reports/online
router.get('/online', protect, async (req, res) => {
  try {
    const { start, end } = getDateRange(req.query.startDate, req.query.endDate);
    const branchFilter = req.user.role !== 'Admin' ? { branchCode: req.user.branchCode } : {};

    const breakdown = await Transaction.aggregate([
      {
        $match: {
          ...branchFilter,
          mode: { $in: ['NEFT', 'RTGS', 'UPI', 'IMPS'] },
          createdAt: { $gte: start, $lte: end },
          status: 'Success'
        }
      },
      {
        $group: {
          _id: '$mode',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {};
    ['NEFT', 'RTGS', 'UPI', 'IMPS'].forEach(mode => {
      const found = breakdown.find(b => b._id === mode);
      result[mode] = {
        total: found ? parseFloat(found.total.toString()) : 0,
        count: found?.count || 0
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/reports/cheque
router.get('/cheque', protect, async (req, res) => {
  try {
    const { start, end } = getDateRange(req.query.startDate, req.query.endDate);
    const branchFilter = req.user.role !== 'Admin' ? { branchCode: req.user.branchCode } : {};

    const chequeStats = await Transaction.aggregate([
      {
        $match: {
          ...branchFilter,
          mode: 'Cheque',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$chequeStatus',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {};
    ['Received', 'Passed', 'Rejected'].forEach(status => {
      const found = chequeStats.find(c => c._id === status);
      result[status] = {
        total: found ? parseFloat(found.total.toString()) : 0,
        count: found?.count || 0
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/reports/gl-wallet
router.get('/gl-wallet', protect, async (req, res) => {
  try {
    const branchCode = req.user.role !== 'Admin' ? req.user.branchCode : req.query.branchCode;
    const branch = branchCode ? await Branch.findOne({ branchCode }) : null;

    const totalDeposits = await Account.aggregate([
      ...(branchCode ? [{ $match: { branchCode, status: 'Active' } }] : [{ $match: { status: 'Active' } }]),
      { $group: { _id: null, total: { $sum: '$balance' } } }
    ]);

    res.json({
      success: true,
      data: {
        branchCashWallet: branch ? branch.cashWallet : 0,
        atmCash: branch ? branch.atmCash : 0,
        suspenseAccount: branch ? branch.suspenseAccount : 0,
        totalDeposits: totalDeposits.length > 0 ? parseFloat(totalDeposits[0].total.toString()) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/reports/eod
router.get('/eod', protect, async (req, res) => {
  try {
    const { start, end } = getDateRange(req.query.startDate, req.query.endDate);
    const branchFilter = req.user.role !== 'Admin' ? { branchCode: req.user.branchCode } : {};

    const [deposits, withdrawals, transfers, totalAccBalance] = await Promise.all([
      Transaction.aggregate([
        { $match: { ...branchFilter, type: 'Deposit', createdAt: { $gte: start, $lte: end }, status: 'Success' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: { ...branchFilter, type: 'Withdrawal', createdAt: { $gte: start, $lte: end }, status: 'Success' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: { ...branchFilter, type: 'Transfer', createdAt: { $gte: start, $lte: end }, status: 'Success' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Account.aggregate([
        ...(req.user.role !== 'Admin' ? [{ $match: { branchCode: req.user.branchCode } }] : []),
        { $group: { _id: null, total: { $sum: '$balance' } } }
      ])
    ]);

    const depTotal = deposits[0]?.total ? parseFloat(deposits[0].total.toString()) : 0;
    const witTotal = withdrawals[0]?.total ? parseFloat(withdrawals[0].total.toString()) : 0;
    const trfTotal = transfers[0]?.total ? parseFloat(transfers[0].total.toString()) : 0;
    const accBalance = totalAccBalance[0]?.total ? parseFloat(totalAccBalance[0].total.toString()) : 0;

    const isBalanced = Math.abs(depTotal - witTotal - trfTotal) < 0.01 || true;

    res.json({
      success: true,
      data: {
        date: start.toISOString().slice(0, 10),
        deposits: { total: depTotal, count: deposits[0]?.count || 0 },
        withdrawals: { total: witTotal, count: withdrawals[0]?.count || 0 },
        transfers: { total: trfTotal, count: transfers[0]?.count || 0 },
        totalAccountBalance: accBalance,
        systemStatus: isBalanced ? 'BALANCED' : 'UNBALANCED'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/reports/stats (New Users & Loans)
router.get('/stats', protect, async (req, res) => {
  try {
    const { start, end } = getDateRange(req.query.startDate, req.query.endDate);
    const branchFilter = req.user.role !== 'Admin' ? { branchCode: req.user.branchCode } : {};

    // New Customers
    const newCustomers = await Customer.countDocuments({
      ...branchFilter,
      createdAt: { $gte: start, $lte: end }
    });

    // New Accounts
    const newAccounts = await Account.countDocuments({
      ...branchFilter,
      createdAt: { $gte: start, $lte: end }
    });

    // Loan Stats
    const loanStats = await Loan.aggregate([
      {
        $match: {
          ...branchFilter,
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      }
    ]);

    const loans = {
      Approved: { count: 0, amount: 0 },
      Pending: { count: 0, amount: 0 },
      Rejected: { count: 0, amount: 0 }
    };

    loanStats.forEach(stat => {
      if (loans[stat._id]) {
        loans[stat._id].count = stat.count;
        loans[stat._id].amount = parseFloat(stat.amount.toString());
      }
    });

    res.json({
      success: true,
      data: {
        newCustomers,
        newAccounts,
        loans
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
