'use client';
import { useEffect, useState } from 'react';
import { getCustomers, createCustomer } from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { HiOutlinePlus, HiOutlineSearch, HiOutlineX } from 'react-icons/hi';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', dob: '', aadhar: '', pan: '', address: '', mobile: '', email: ''
  });
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async (s) => {
    try {
      setLoading(true);
      const res = await getCustomers({ search: s || '' });
      setCustomers(res.data.data);
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCustomers(search);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.dob || !form.aadhar || !form.pan || !form.address || !form.mobile) {
      toast.error('Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      const res = await createCustomer(form);
      toast.success(`Customer created! CIF: ${res.data.data.cifId}`);
      setShowForm(false);
      setForm({ name: '', dob: '', aadhar: '', pan: '', address: '', mobile: '', email: '' });
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Customer Management</h1>
          <p className="text-sm text-gray-400 mt-1">Manage Customer Information Files (CIF)</p>
        </div>
        {user?.role === 'Manager' && (
          <button onClick={() => setShowForm(true)} className="neo-btn-primary flex items-center gap-2">
            <HiOutlinePlus className="w-5 h-5" /> New Customer
          </button>
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="neo-card !p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              className="neo-input !pl-10"
              placeholder="Search by CIF ID, Name, Mobile, or PAN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="neo-btn-primary">Search</button>
        </div>
      </form>

      {/* Customer List */}
      <div className="neo-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="neo-table">
            <thead>
              <tr>
                <th>CIF ID</th>
                <th>Name</th>
                <th>Mobile</th>
                <th>PAN</th>
                <th>Branch</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No customers found</td></tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.cifId}>
                    <td className="font-mono font-semibold text-primary-500">{c.cifId}</td>
                    <td className="font-medium">{c.name}</td>
                    <td>{c.mobile}</td>
                    <td className="font-mono">{c.pan}</td>
                    <td>{c.branchCode}</td>
                    <td className="text-gray-400">{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Customer Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="neo-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Create New Customer (CIF)</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <HiOutlineX className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="neo-label">Full Name *</label>
                  <input className="neo-input" placeholder="Customer full name" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="neo-label">Date of Birth *</label>
                  <input type="date" className="neo-input" value={form.dob}
                    onChange={(e) => setForm({ ...form, dob: e.target.value })} />
                </div>
                <div>
                  <label className="neo-label">Aadhar Number *</label>
                  <input className="neo-input" placeholder="12-digit Aadhar" maxLength={12} value={form.aadhar}
                    onChange={(e) => setForm({ ...form, aadhar: e.target.value.replace(/\D/g, '') })} />
                </div>
                <div>
                  <label className="neo-label">PAN Number *</label>
                  <input className="neo-input" placeholder="e.g., ABCDE1234F" maxLength={10} value={form.pan}
                    onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })} />
                </div>
                <div>
                  <label className="neo-label">Mobile Number *</label>
                  <input className="neo-input" placeholder="10-digit mobile" maxLength={10} value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, '') })} />
                </div>
                <div>
                  <label className="neo-label">Email</label>
                  <input type="email" className="neo-input" placeholder="email@example.com" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="neo-label">Address *</label>
                <textarea className="neo-input !h-20 resize-none" placeholder="Full address" value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="neo-btn-ghost">Cancel</button>
                <button type="submit" disabled={saving} className="neo-btn-primary">
                  {saving ? 'Saving...' : 'Save CIF'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
