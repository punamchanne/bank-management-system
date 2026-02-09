const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true,
    trim: true
  },
  accountId: {
    type: String,
    required: [true, 'Account ID is required']
  },
  beneficiaryAccountId: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['Deposit', 'Withdrawal', 'Transfer'],
    required: [true, 'Transaction type is required']
  },
  mode: {
    type: String,
    enum: ['Cash', 'Cheque', 'NEFT', 'RTGS', 'UPI', 'IMPS'],
    required: [true, 'Transaction mode is required']
  },
  amount: {
    type: mongoose.Types.Decimal128,
    required: [true, 'Amount is required'],
    get: v => v ? parseFloat(v.toString()) : 0
  },
  description: {
    type: String,
    trim: true
  },
  chequeNumber: {
    type: String,
    trim: true
  },
  chequeStatus: {
    type: String,
    enum: ['Received', 'Passed', 'Rejected', 'N/A'],
    default: 'N/A'
  },
  status: {
    type: String,
    enum: ['Success', 'Pending', 'Failed'],
    default: 'Success'
  },
  branchCode: {
    type: String,
    trim: true
  },
  performedBy: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

transactionSchema.pre('save', async function (next) {
  if (!this.transactionId) {
    const count = await mongoose.model('Transaction').countDocuments();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    this.transactionId = 'TXN' + dateStr + String(count + 1).padStart(6, '0');
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
