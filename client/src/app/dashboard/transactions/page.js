'use client';
import { useEffect, useState } from 'react';
import { getTransactions, deposit, withdraw, transfer, getAccount, updateTransactionStatus } from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { HiOutlineX } from 'react-icons/hi';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('list'); // list | deposit | withdraw | transfer
  const [form, setForm] = useState({
    accountId: '', amount: '', mode: 'Cash', description: '',
    chequeNumber: '', chequeBank: '', chequeBranch: '', chequeDate: '', beneficiaryAccountId: ''
  });
  const [saving, setSaving] = useState(false);
  const [accountInfo, setAccountInfo] = useState(null);
  const [filterAccountId, setFilterAccountId] = useState('');

  // Denomination State
  const [denominations, setDenominations] = useState({
    2000: 0, 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 1: 0
  });

  useEffect(() => { fetchTransactions(); }, []);

  // Calculate total from denominations
  useEffect(() => {
    if (form.mode === 'Cash') {
      const total = Object.entries(denominations).reduce((acc, [denom, count]) => acc + (Number(denom) * count), 0);
      if (total > 0) {
        setForm(prev => ({ ...prev, amount: total }));
      }
    }
  }, [denominations, form.mode]);

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
        chequeNumber: form.chequeNumber,
        chequeBank: form.chequeBank,
        chequeBranch: form.chequeBranch,
        chequeDate: form.chequeDate
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

  const handleStatusUpdate = async (id, status) => {
    try {
      setLoading(true);
      await updateTransactionStatus(id, { status });
      toast.success(`Transaction ${status === 'Success' ? 'Approved' : 'Rejected'}`);
      fetchTransactions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      accountId: '', amount: '', mode: 'Cash', description: '',
      chequeNumber: '', chequeBank: '', chequeBranch: '', chequeDate: '', beneficiaryAccountId: ''
    });
    setDenominations({ 2000: 0, 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 1: 0 });
    setAccountInfo(null);
    setTab('list');
  };

  const getStatusBadge = (status) => {
    const c = { Success: 'bg-mint-50 text-mint-600', Pending: 'bg-amber-50 text-amber-600', Failed: 'bg-red-50 text-red-600', Rejected: 'bg-red-50 text-red-600' };
    return <span className={`neo-badge ${c[status] || ''}`}>{status}</span>;
  };

  const getTypeBadge = (type) => {
    const c = { Deposit: 'bg-green-50 text-green-600', Withdrawal: 'bg-red-50 text-red-600', Transfer: 'bg-blue-50 text-blue-600' };
    return <span className={`neo-badge ${c[type] || ''}`}>{type}</span>;
  };

  const handleDenomChange = (denom, value) => {
    setDenominations(prev => ({ ...prev, [denom]: Number(value) || 0 }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
          <p className="text-sm text-gray-400 mt-1">Process deposits, withdrawals, and fund transfers</p>
        </div>
        <div className="flex gap-2">
          {user?.role !== 'Manager' && (
            <>
              <button onClick={() => setTab('deposit')} className={`neo-btn text-sm !py-2 ${tab === 'deposit' ? 'bg-green-500 text-white' : 'bg-green-50 text-green-600'}`}>Deposit</button>
              <button onClick={() => setTab('withdraw')} className={`neo-btn text-sm !py-2 ${tab === 'withdraw' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-600'}`}>Withdraw</button>
              <button onClick={() => setTab('transfer')} className={`neo-btn text-sm !py-2 ${tab === 'transfer' ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-600'}`}>Transfer</button>
            </>
          )}
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

              {form.mode === 'Cash' && tab !== 'transfer' ? (
                <div className="md:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <label className="neo-label mb-2 block text-gray-700 font-semibold">Cash Denominations</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {[2000, 500, 200, 100, 50, 20, 10, 5, 1].map(denom => (
                      <div key={denom}>
                        <span className="text-xs text-gray-500 block mb-1">₹{denom} x</span>
                        <input
                          type="number"
                          min="0"
                          className="neo-input !py-1 !px-2 text-sm"
                          placeholder="0"
                          value={denominations[denom] || ''}
                          onChange={(e) => handleDenomChange(denom, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <span className="text-sm font-medium text-gray-500">Total Cash Amount:</span>
                    <span className="text-xl font-bold text-primary-600">₹{Number(form.amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="neo-label">Amount (₹) *</label>
                  <input type="number" className="neo-input" placeholder="Enter amount" min={1} value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
              )}

              {form.mode === 'Cheque' && tab === 'deposit' && (
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                  <div>
                    <label className="neo-label">Cheque Number *</label>
                    <input className="neo-input" placeholder="Enter cheque number" value={form.chequeNumber}
                      onChange={(e) => setForm({ ...form, chequeNumber: e.target.value })} />
                  </div>
                  <div>
                    <label className="neo-label">Bank Name *</label>
                    <input className="neo-input" placeholder="Issuing Bank Name" value={form.chequeBank}
                      onChange={(e) => setForm({ ...form, chequeBank: e.target.value })} />
                  </div>
                  <div>
                    <label className="neo-label">Branch Name</label>
                    <input className="neo-input" placeholder="Issuing Branch (Optional)" value={form.chequeBranch}
                      onChange={(e) => setForm({ ...form, chequeBranch: e.target.value })} />
                  </div>
                  <div>
                    <label className="neo-label">Cheque Date *</label>
                    <input type="date" className="neo-input" value={form.chequeDate}
                      onChange={(e) => setForm({ ...form, chequeDate: e.target.value })} />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="neo-label">Description</label>
              <input className="neo-input" placeholder="Transaction description (optional)" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            {accountInfo && (
              <div className="bg-blue-50 rounded-xl p-4 text-sm mt-4">
                <p className="font-semibold text-blue-700">Account: {accountInfo.accountId} ({accountInfo.accountType})</p>
                <p className="text-blue-600">Balance: ₹{Number(accountInfo.balance).toLocaleString('en-IN')} | Status: {accountInfo.status}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6">
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
                {user?.role === 'Manager' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={user?.role === 'Manager' ? 8 : 7} className="text-center py-10 text-gray-400">Loading...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={user?.role === 'Manager' ? 8 : 7} className="text-center py-10 text-gray-400">No transactions found</td></tr>
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
                    {user?.role === 'Manager' && (
                      <td>
                        {t.status === 'Pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStatusUpdate(t._id, 'Success')}
                              className="text-white bg-green-500 hover:bg-green-600 px-2 py-1 rounded text-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(t._id, 'Rejected')}
                              className="text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded text-xs"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    )}
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
