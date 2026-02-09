const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  loanId: {
    type: String,
    unique: true,
    trim: true
  },
  cifId: {
    type: String,
    required: [true, 'CIF ID is required'],
    ref: 'Customer'
  },
  loanType: {
    type: String,
    enum: ['Home', 'Personal', 'Vehicle', 'Education'],
    required: [true, 'Loan type is required']
  },
  amount: {
    type: mongoose.Types.Decimal128,
    required: [true, 'Loan amount is required'],
    get: v => v ? parseFloat(v.toString()) : 0
  },
  interestRate: {
    type: Number,
    default: 8.5
  },
  tenureYears: {
    type: Number,
    required: [true, 'Tenure is required'],
    min: 1,
    max: 30
  },
  emiAmount: {
    type: mongoose.Types.Decimal128,
    get: v => v ? parseFloat(v.toString()) : 0
  },
  status: {
    type: String,
    enum: ['Approved', 'Pending', 'Rejected', 'Closed'],
    default: 'Pending'
  },
  branchCode: {
    type: String,
    trim: true
  },
  processedBy: {
    type: String,
    trim: true
  },
  remarks: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

loanSchema.pre('save', async function (next) {
  if (!this.loanId) {
    const count = await mongoose.model('Loan').countDocuments();
    this.loanId = 'LN' + String(count + 1).padStart(8, '0');
  }
  // Auto-calculate EMI: EMI = [P x R x (1+R)^N] / [(1+R)^N – 1]
  const P = parseFloat(this.amount.toString());
  const R = this.interestRate / 12 / 100;
  const N = this.tenureYears * 12;
  if (P && R && N) {
    const emi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
    this.emiAmount = mongoose.Types.Decimal128.fromString(emi.toFixed(2));
  }
  next();
});

module.exports = mongoose.model('Loan', loanSchema);
