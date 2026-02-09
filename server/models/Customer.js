const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  cifId: {
    type: String,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  dob: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  aadhar: {
    type: String,
    required: [true, 'Aadhar number is required'],
    trim: true
  },
  pan: {
    type: String,
    required: [true, 'PAN number is required'],
    trim: true,
    uppercase: true
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  branchCode: {
    type: String,
    trim: true
  },
  createdBy: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

customerSchema.pre('save', async function (next) {
  if (!this.cifId) {
    const count = await mongoose.model('Customer').countDocuments();
    this.cifId = 'CIF' + String(count + 1).padStart(8, '0');
  }
  next();
});

module.exports = mongoose.model('Customer', customerSchema);
