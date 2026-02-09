const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  accountId: {
    type: String,
    unique: true,
    trim: true
  },
  cifId: {
    type: String,
    required: [true, 'CIF ID is required'],
    ref: 'Customer'
  },
  accountType: {
    type: String,
    enum: ['Savings', 'Current'],
    required: [true, 'Account type is required']
  },
  branchCode: {
    type: String,
    required: [true, 'Branch code is required'],
    trim: true
  },
  balance: {
    type: mongoose.Types.Decimal128,
    default: 0,
    get: v => v ? parseFloat(v.toString()) : 0
  },
  status: {
    type: String,
    enum: ['Active', 'Dormant', 'Closed'],
    default: 'Active'
  },
  openedBy: {
    type: String,
    trim: true
  },
  nominee: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

accountSchema.pre('save', async function (next) {
  if (!this.accountId) {
    const prefix = this.accountType === 'Savings' ? 'SA' : 'CA';
    const count = await mongoose.model('Account').countDocuments();
    this.accountId = prefix + this.branchCode + String(count + 1).padStart(8, '0');
  }
  next();
});

module.exports = mongoose.model('Account', accountSchema);
