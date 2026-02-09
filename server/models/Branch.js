const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  branchCode: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    uppercase: true
  },
  branchName: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  ifscCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  cashWallet: {
    type: mongoose.Types.Decimal128,
    default: 0,
    get: v => v ? parseFloat(v.toString()) : 0
  },
  atmCash: {
    type: mongoose.Types.Decimal128,
    default: 0,
    get: v => v ? parseFloat(v.toString()) : 0
  },
  suspenseAccount: {
    type: mongoose.Types.Decimal128,
    default: 0,
    get: v => v ? parseFloat(v.toString()) : 0
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

module.exports = mongoose.model('Branch', branchSchema);
