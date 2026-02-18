'use client';
import { useEffect, useState } from 'react';
import { getAccounts, createAccount, getCustomer } from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { HiOutlinePlus, HiOutlineSearch, HiOutlineX } from 'react-icons/hi';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ cifId: '', accountType: 'Savings', initialDeposit: '', nominee: '' });
  const [saving, setSaving] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);
  const { user } = useAuth();
  const [fetchingCif, setFetchingCif] = useState(false);

  useEffect(() => { fetchAccounts(); }, []);

  const fetchAccounts = async (s) => {
    try {
      setLoading(true);
      const res = await getAccounts({ search: s || '' });
      setAccounts(res.data.data);
    } catch { toast.error('Failed to load accounts'); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => { e.preventDefault(); fetchAccounts(search); };

  const handleCifLookup = async () => {
    if (!form.cifId) return;
    setFetchingCif(true);
    try {
      const res = await getCustomer(form.cifId);
      setCustomerInfo(res.data.data);
      toast.success(`Customer found: ${res.data.data.name}`);
    } catch {
      setCustomerInfo(null);
      toast.error('Customer not found');
    } finally { setFetchingCif(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.cifId || !form.initialDeposit) {
      toast.error('Please fill required fields');
      return;
    }
    if (Number(form.initialDeposit) < 5000) {
      toast.error('Minimum initial deposit is ₹5,000');
      return;
    }
    setSaving(true);
    try {
      const res = await createAccount({
        ...form,
        initialDeposit: Number(form.initialDeposit)
      });
      toast.success(`Account created! ID: ${res.data.data.accountId}`);
      setShowForm(false);
      setForm({ cifId: '', accountType: 'Savings', initialDeposit: '', nominee: '' });
      setCustomerInfo(null);
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create account');
    } finally { setSaving(false); }
  };

  const getStatusBadge = (status) => {
    const colors = {
      Active: 'bg-mint-50 text-mint-600',
      Dormant: 'bg-amber-50 text-amber-600',
      Closed: 'bg-red-50 text-red-600'
    };
    return <span className={`neo-badge ${colors[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
  };

  const formatCurrency = (val) => '₹' + Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Account Management</h1>
          <p className="text-sm text-gray-400 mt-1">Manage bank accounts</p>
        </div>
        {user?.role === 'Manager' && (
          <button onClick={() => setShowForm(true)} className="neo-btn-primary flex items-center gap-2">
            <HiOutlinePlus className="w-5 h-5" /> Open Account
          </button>
        )}
      </div>

      <form onSubmit={handleSearch} className="neo-card !p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" className="neo-input !pl-10" placeholder="Search by Account ID or CIF ID..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button type="submit" className="neo-btn-primary">Search</button>
        </div>
      </form>

      <div className="neo-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="neo-table">
            <thead>
              <tr>
                <th>Account ID</th>
                <th>CIF ID</th>
                <th>Type</th>
                <th>Balance</th>
                <th>Branch</th>
                <th>Status</th>
                <th>Opened</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Loading...</td></tr>
              ) : accounts.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">No accounts found</td></tr>
              ) : (
                accounts.map((a) => (
                  <tr key={a.accountId}>
                    <td className="font-mono font-semibold text-primary-500">{a.accountId}</td>
                    <td className="font-mono">{a.cifId}</td>
                    <td>
                      <span className={`neo-badge ${a.accountType === 'Savings' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                        {a.accountType}
                      </span>
                    </td>
                    <td className="font-semibold">{formatCurrency(a.balance)}</td>
                    <td>{a.branchCode}</td>
                    <td>{getStatusBadge(a.status)}</td>
                    <td className="text-gray-400">{new Date(a.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Account Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="neo-card w-full max-w-lg animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Open New Account</h2>
              <button onClick={() => { setShowForm(false); setCustomerInfo(null); }} className="text-gray-400 hover:text-gray-600">
                <HiOutlineX className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="neo-label">CIF ID *</label>
                <div className="flex gap-2">
                  <input className="neo-input" placeholder="Enter CIF ID" value={form.cifId}
                    onChange={(e) => setForm({ ...form, cifId: e.target.value })} />
                  <button type="button" onClick={handleCifLookup} disabled={fetchingCif}
                    className="neo-btn-outline !py-2 whitespace-nowrap">
                    {fetchingCif ? 'Looking...' : 'Fetch'}
                  </button>
                </div>
              </div>

              {customerInfo && (
                <div className="bg-mint-50 rounded-xl p-4 text-sm">
                  <p className="font-semibold text-mint-700">{customerInfo.name}</p>
                  <p className="text-mint-600">Mobile: {customerInfo.mobile} | PAN: {customerInfo.pan}</p>
                </div>
              )}

              <div>
                <label className="neo-label">Account Type *</label>
                <select className="neo-input" value={form.accountType}
                  onChange={(e) => setForm({ ...form, accountType: e.target.value })}>
                  <option value="Savings">Savings Account</option>
                  <option value="Current">Current Account</option>
                </select>
              </div>

              <div>
                <label className="neo-label">Initial Deposit * (Min ₹5,000)</label>
                <input type="number" className="neo-input" placeholder="Enter amount" min={5000} value={form.initialDeposit}
                  onChange={(e) => setForm({ ...form, initialDeposit: e.target.value })} />
              </div>

              <div>
                <label className="neo-label">Nominee Name</label>
                <input className="neo-input" placeholder="Nominee full name" value={form.nominee}
                  onChange={(e) => setForm({ ...form, nominee: e.target.value })} />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setCustomerInfo(null); }} className="neo-btn-ghost">Cancel</button>
                <button type="submit" disabled={saving} className="neo-btn-primary">
                  {saving ? 'Creating...' : 'Open Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
