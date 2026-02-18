const run = async () => {
    try {
        // 1. Login
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'MGR001', password: 'manager123' })
        });

        if (!loginRes.ok) {
            console.error('Login failed:', await loginRes.text());
            return;
        }

        const { token } = await loginRes.json();
        console.log('Login successful. Token:', token.substring(0, 10) + '...');

        // 2. Get Transactions
        const txnRes = await fetch('http://localhost:5000/api/transactions', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!txnRes.ok) {
            const errText = await txnRes.text();
            console.error('Transactions fetch failed:', txnRes.status, txnRes.statusText);
            console.error('Response:', errText);
        } else {
            const data = await txnRes.json();
            console.log('Transactions fetched successfully:', data.count, 'records');
        }

    } catch (err) {
        console.error('Script error:', err);
    }
};

run();
