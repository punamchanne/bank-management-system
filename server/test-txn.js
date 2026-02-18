const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');

const run = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/bank_system');
        console.log('Connected');

        const txns = await Transaction.find({});
        console.log('Found transactions:', txns.length);

        // Test count
        const count = await Transaction.countDocuments({});
        console.log('Count:', count);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

run();
