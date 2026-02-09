'use client';
import { useEffect, useState } from 'react';
import { getTransactions, deposit, withdraw, transfer, getAccount } from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlineX } from 'react-icons/hi';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('list'); // list | deposit | withdraw | transfer
  const [form, setForm] = useState({
    accountId: '', amount: '', mode: 'Cash', description: '',
    chequeNumber: '', beneficiaryAccountId: ''
  });
  const [saving, setSaving] = useState(false);
  const [accountInfo, setAccountInfo] = useState(null);
  const [filterAccountId, setFilterAccountId] = useState('');

  useEffect(() => { fetchTransactions(); }, []);

  const fetchTransactions = async (accId) => {
    try {
      setLoading(true);
      const params = accId ? { accountId: accId } : {};
      const res = await getTransactions(params);
      setTransactions(res.data.data);
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  };

  const lookupAccount = async () => {
    if (!form.accountId) return;
    try {
      const res = await getAccount(form.accountId);
      setAccountInfo(res.data.data);
      toast.success(`Account found. Balance: ₹${Number(res.data.data.balance).toLocaleString('en-IN')}`);
    } catch {
      setAccountInfo(null);
      toast.error('Account not found');
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!form.accountId || !form.amount) { toast.error('Fill required fields'); return; }
    setSaving(true);
    try {
      const res = await deposit({
        accountId: form.accountId,
        amount: Number(form.amount),
        mode: form.mode,
        description: form.description,
        chequeNumber: form.chequeNumber
      });
      toast.success(`Deposit successful! New Balance: ₹${Number(res.data.newBalance).toLocaleString('en-IN')}`);
      resetForm();
      fetchTransactions();
    } catch (err) { toast.error(err.response?.data?.message || 'Deposit failed'); }
    finally { setSaving(false); }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!form.accountId || !form.amount) { toast.error('Fill required fields'); return; }
    setSaving(true);
    try {
      const res = await withdraw({
        accountId: form.accountId,
        amount: Number(form.amount),
        mode: form.mode,
        description: form.description
      });
      toast.success(`Withdrawal successful! New Balance: ₹${Number(res.data.newBalance).toLocaleString('en-IN')}`);
      resetForm();
      fetchTransactions();
    } catch (err) { toast.error(err.response?.data?.message || 'Withdrawal failed'); }
    finally { setSaving(false); }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!form.accountId || !form.beneficiaryAccountId || !form.amount) {
      toast.error('Fill all required fields'); return;
    }
    setSaving(true);
    try {
      await transfer({
        accountId: form.accountId,
        beneficiaryAccountId: form.beneficiaryAccountId,
        amount: Number(form.amount),
        mode: form.mode,
        description: form.description
      });
      toast.success('Transfer successful!');
      resetForm();
      fetchTransactions();
    } catch (err) { toast.error(err.response?.data?.message || 'Transfer failed'); }
    finally { setSaving(false); }
  };

  const resetForm = () => {
    setForm({ accountId: '', amount: '', mode: 'Cash', description: '', chequeNumber: '', beneficiaryAccountId: '' });
    setAccountInfo(null);
    setTab('list');
  };

  const getStatusBadge = (status) => {
    const c = { Success: 'bg-mint-50 text-mint-600', Pending: 'bg-amber-50 text-amber-600', Failed: 'bg-red-50 text-red-600' };
    return <span className={`neo-badge ${c[status] || ''}`}>{status}</span>;
  };

  const getTypeBadge = (type) => {
    const c = { Deposit: 'bg-green-50 text-green-600', Withdrawal: 'bg-red-50 text-red-600', Transfer: 'bg-blue-50 text-blue-600' };
    return <span className={`neo-badge ${c[type] || ''}`}>{type}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
          <p className="text-sm text-gray-400 mt-1">Process deposits, withdrawals, and fund transfers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('deposit')} className={`neo-btn text-sm !py-2 ${tab === 'deposit' ? 'bg-green-500 text-white' : 'bg-green-50 text-green-600'}`}>Deposit</button>
          <button onClick={() => setTab('withdraw')} className={`neo-btn text-sm !py-2 ${tab === 'withdraw' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-600'}`}>Withdraw</button>
          <button onClick={() => setTab('transfer')} className={`neo-btn text-sm !py-2 ${tab === 'transfer' ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-600'}`}>Transfer</button>
        </div>
      </div>

      {/* Transaction Forms */}
      {tab !== 'list' && (
        <div className="neo-card animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-800 capitalize">{tab}</h2>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={tab === 'deposit' ? handleDeposit : tab === 'withdraw' ? handleWithdraw : handleTransfer} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="neo-label">{tab === 'transfer' ? 'Payee Account No *' : 'Account No *'}</label>
                <div className="flex gap-2">
                  <input className="neo-input" placeholder="Enter Account ID" value={form.accountId}
                    onChange={(e) => setForm({ ...form, accountId: e.target.value })} />
                  <button type="button" onClick={lookupAccount} className="neo-btn-outline !py-2 whitespace-nowrap">Fetch</button>
                </div>
              </div>

              {tab === 'transfer' && (
                <div>
                  <label className="neo-label">Beneficiary Account No *</label>
                  <input className="neo-input" placeholder="Enter Beneficiary Account ID" value={form.beneficiaryAccountId}
                    onChange={(e) => setForm({ ...form, beneficiaryAccountId: e.target.value })} />
                </div>
              )}

              <div>
                <label className="neo-label">Amount (₹) *</label>
                <input type="number" className="neo-input" placeholder="Enter amount" min={1} value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>

              <div>
                <label className="neo-label">Mode *</label>
                <select className="neo-input" value={form.mode}
                  onChange={(e) => setForm({ ...form, mode: e.target.value })}>
                  {tab === 'transfer' ? (
                    <>
                      <option value="NEFT">NEFT</option>
                      <option value="RTGS">RTGS</option>
                      <option value="UPI">UPI</option>
                      <option value="IMPS">IMPS</option>
                    </>
                  ) : (
                    <>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                    </>
                  )}
                </select>
              </div>

              {form.mode === 'Cheque' && tab === 'deposit' && (
                <div>
                  <label className="neo-label">Cheque Number</label>
                  <input className="neo-input" placeholder="Enter cheque number" value={form.chequeNumber}
                    onChange={(e) => setForm({ ...form, chequeNumber: e.target.value })} />
                </div>
              )}
            </div>

            <div>
              <label className="neo-label">Description</label>
              <input className="neo-input" placeholder="Transaction description (optional)" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            {accountInfo && (
              <div className="bg-blue-50 rounded-xl p-4 text-sm">
                <p className="font-semibold text-blue-700">Account: {accountInfo.accountId} ({accountInfo.accountType})</p>
                <p className="text-blue-600">Balance: ₹{Number(accountInfo.balance).toLocaleString('en-IN')} | Status: {accountInfo.status}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={resetForm} className="neo-btn-ghost">Cancel</button>
              <button type="submit" disabled={saving}
                className={`neo-btn text-white ${tab === 'deposit' ? 'bg-green-500 hover:bg-green-600' : tab === 'withdraw' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}>
                {saving ? 'Processing...' : `Confirm ${tab.charAt(0).toUpperCase() + tab.slice(1)}`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="neo-card !p-4">
        <div className="flex gap-3">
          <input type="text" className="neo-input" placeholder="Filter by Account ID..."
            value={filterAccountId} onChange={(e) => setFilterAccountId(e.target.value)} />
          <button onClick={() => fetchTransactions(filterAccountId)} className="neo-btn-primary">Filter</button>
          <button onClick={() => { setFilterAccountId(''); fetchTransactions(); }} className="neo-btn-ghost">Clear</button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="neo-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="neo-table">
            <thead>
              <tr>
                <th>TXN ID</th>
                <th>Account</th>
                <th>Type</th>
                <th>Mode</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Loading...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">No transactions found</td></tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.transactionId}>
                    <td className="font-mono text-xs">{t.transactionId}</td>
                    <td className="font-mono text-primary-500">{t.accountId}</td>
                    <td>{getTypeBadge(t.type)}</td>
                    <td><span className="neo-badge bg-gray-100 text-gray-600">{t.mode}</span></td>
                    <td className="font-semibold">₹{Number(t.amount).toLocaleString('en-IN')}</td>
                    <td>{getStatusBadge(t.status)}</td>
                    <td className="text-gray-400 text-xs">{new Date(t.createdAt).toLocaleString('en-IN')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
