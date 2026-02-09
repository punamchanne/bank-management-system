'use client';
import { useEffect, useState } from 'react';
import { getBranches, createBranch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineX } from 'react-icons/hi';

export default function BranchManagementPage() {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    branchCode: '', branchName: '', address: '', city: '', ifscCode: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.role === 'Admin') fetchBranches();
  }, [user]);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await getBranches();
      setBranches(res.data.data);
    } catch { toast.error('Failed to load branches'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.branchCode || !form.branchName) {
      toast.error('Branch code and name are required'); return;
    }
    setSaving(true);
    try {
      await createBranch(form);
      toast.success('Branch created');
      setShowForm(false);
      setForm({ branchCode: '', branchName: '', address: '', city: '', ifscCode: '' });
      fetchBranches();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  if (user?.role !== 'Admin') {
    return <div className="flex items-center justify-center h-64"><p className="text-gray-400">Admin access required</p></div>;
  }

  const fmt = (v) => '₹' + Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Branch Management</h1>
          <p className="text-sm text-gray-400 mt-1">Create and manage bank branches</p>
        </div>
        <button onClick={() => setShowForm(true)} className="neo-btn-primary flex items-center gap-2">
          <HiOutlinePlus className="w-5 h-5" /> Add Branch
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : branches.length === 0 ? (
          <div className="col-span-full text-center py-20 text-gray-400">No branches found</div>
        ) : (
          branches.map((b) => (
            <div key={b.branchCode} className="neo-card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800">{b.branchName}</h3>
                  <p className="text-sm text-primary-500 font-mono font-semibold">{b.branchCode}</p>
                </div>
                <span className="neo-badge bg-blue-50 text-blue-600">{b.ifscCode}</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">{b.address}{b.city ? `, ${b.city}` : ''}</p>
              <div className="border-t border-gray-100 pt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-gray-400">Cash Wallet</p>
                  <p className="text-sm font-semibold text-gray-700">{fmt(b.cashWallet)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">ATM Cash</p>
                  <p className="text-sm font-semibold text-gray-700">{fmt(b.atmCash)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Suspense</p>
                  <p className="text-sm font-semibold text-gray-700">{fmt(b.suspenseAccount)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="neo-card w-full max-w-lg animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Add New Branch</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <HiOutlineX className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="neo-label">Branch Code *</label>
                  <input className="neo-input" placeholder="e.g., BR003" value={form.branchCode}
                    onChange={(e) => setForm({ ...form, branchCode: e.target.value.toUpperCase() })} />
                </div>
                <div>
                  <label className="neo-label">Branch Name *</label>
                  <input className="neo-input" placeholder="Branch name" value={form.branchName}
                    onChange={(e) => setForm({ ...form, branchName: e.target.value })} />
                </div>
                <div>
                  <label className="neo-label">City</label>
                  <input className="neo-input" placeholder="City" value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div>
                  <label className="neo-label">IFSC Code</label>
                  <input className="neo-input" placeholder="e.g., NEOF0000003" value={form.ifscCode}
                    onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })} />
                </div>
              </div>
              <div>
                <label className="neo-label">Address</label>
                <textarea className="neo-input !h-20 resize-none" placeholder="Full branch address" value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="neo-btn-ghost">Cancel</button>
                <button type="submit" disabled={saving} className="neo-btn-primary">
                  {saving ? 'Creating...' : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
