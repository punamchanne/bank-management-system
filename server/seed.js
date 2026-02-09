require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Branch = require('./models/Branch');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bank_system');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Branch.deleteMany({});

    // Create branches
    const branches = await Branch.insertMany([
      {
        branchCode: 'BR001',
        branchName: 'NeoFin Main Branch',
        address: '1 Financial District, Mumbai',
        city: 'Mumbai',
        ifscCode: 'NEOF0000001',
        cashWallet: mongoose.Types.Decimal128.fromString('5000000'),
        atmCash: mongoose.Types.Decimal128.fromString('2000000'),
        suspenseAccount: mongoose.Types.Decimal128.fromString('0')
      },
      {
        branchCode: 'BR002',
        branchName: 'NeoFin Digital Branch',
        address: '42 Tech Park, Bangalore',
        city: 'Bangalore',
        ifscCode: 'NEOF0000002',
        cashWallet: mongoose.Types.Decimal128.fromString('3000000'),
        atmCash: mongoose.Types.Decimal128.fromString('1500000'),
        suspenseAccount: mongoose.Types.Decimal128.fromString('0')
      }
    ]);

    console.log('✅ Branches seeded');

    // Create users
    await User.create([
      {
        userId: 'ADMIN001',
        password: 'admin123',
        name: 'System Administrator',
        email: 'admin@neofin.com',
        role: 'Admin',
        branchCode: 'BR001',
        assignedBranch: branches[0]._id
      },
      {
        userId: 'MGR001',
        password: 'manager123',
        name: 'Rajesh Kumar',
        email: 'rajesh@neofin.com',
        role: 'Manager',
        branchCode: 'BR001',
        assignedBranch: branches[0]._id
      },
      {
        userId: 'CLK001',
        password: 'clerk123',
        name: 'Priya Sharma',
        email: 'priya@neofin.com',
        role: 'Clerk',
        branchCode: 'BR001',
        assignedBranch: branches[0]._id
      }
    ]);

    console.log('✅ Users seeded');
    console.log('\n📋 Login Credentials:');
    console.log('   Admin:   ADMIN001 / admin123 / BR001');
    console.log('   Manager: MGR001  / manager123 / BR001');
    console.log('   Clerk:   CLK001  / clerk123 / BR001');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
