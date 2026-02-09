'use client';
import { useEffect, useState } from 'react';
import { getUsers, registerUser, updateUser, deleteUser, getBranches } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineX, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';

export default function UserManagementPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    userId: '', password: '', name: '', email: '', role: 'Clerk', branchCode: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.role === 'Admin') {
      fetchUsers();
      fetchBranches();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getUsers();
      setUsers(res.data.data);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const fetchBranches = async () => {
    try {
      const res = await getBranches();
      setBranches(res.data.data);
    } catch {}
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.userId || !form.password || !form.name || !form.branchCode) {
      toast.error('Fill all required fields'); return;
    }
    setSaving(true);
    try {
      await registerUser(form);
      toast.success('User created successfully');
      closeForm();
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUser(editId, {
        name: form.name,
        email: form.email,
        role: form.role,
        branchCode: form.branchCode
      });
      toast.success('User updated');
      closeForm();
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async (id, name) => {
    if (!confirm(`Deactivate user "${name}"?`)) return;
    try {
      await deleteUser(id);
      toast.success('User deactivated');
      fetchUsers();
    } catch { toast.error('Failed'); }
  };

  const openEdit = (u) => {
    setEditId(u._id);
    setForm({ userId: u.userId, password: '', name: u.name, email: u.email || '', role: u.role, branchCode: u.branchCode });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm({ userId: '', password: '', name: '', email: '', role: 'Clerk', branchCode: '' });
  };

  if (user?.role !== 'Admin') {
    return <div className="flex items-center justify-center h-64"><p className="text-gray-400">Admin access required</p></div>;
  }

  const getRoleBadge = (role) => {
    const c = { Admin: 'bg-red-50 text-red-600', Manager: 'bg-purple-50 text-purple-600', Clerk: 'bg-blue-50 text-blue-600' };
    return <span className={`neo-badge ${c[role] || ''}`}>{role}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-sm text-gray-400 mt-1">Create and manage bank users and their roles</p>
        </div>
        <button onClick={() => setShowForm(true)} className="neo-btn-primary flex items-center gap-2">
          <HiOutlinePlus className="w-5 h-5" /> Create User
        </button>
      </div>

      <div className="neo-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="neo-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Branch</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">No users found</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id}>
                    <td className="font-mono font-semibold text-primary-500">{u.userId}</td>
                    <td className="font-medium">{u.name}</td>
                    <td className="text-gray-400">{u.email || '—'}</td>
                    <td>{getRoleBadge(u.role)}</td>
                    <td>{u.branchCode}</td>
                    <td>
                      <span className={`neo-badge ${u.isActive ? 'bg-mint-50 text-mint-600' : 'bg-red-50 text-red-600'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600">
                          <HiOutlinePencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeactivate(u._id, u.name)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600">
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="neo-card w-full max-w-lg animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">{editId ? 'Edit User' : 'Create New User'}</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                <HiOutlineX className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={editId ? handleUpdate : handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="neo-label">User ID *</label>
                  <input className="neo-input" placeholder="e.g., CLK002" value={form.userId}
                    onChange={(e) => setForm({ ...form, userId: e.target.value })} disabled={!!editId} />
                </div>
                {!editId && (
                  <div>
                    <label className="neo-label">Password *</label>
                    <input type="password" className="neo-input" placeholder="Min 6 characters" value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  </div>
                )}
                <div>
                  <label className="neo-label">Full Name *</label>
                  <input className="neo-input" placeholder="Full name" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="neo-label">Email</label>
                  <input type="email" className="neo-input" placeholder="Email address" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="neo-label">Role *</label>
                  <select className="neo-input" value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="Clerk">Clerk</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="neo-label">Branch Code *</label>
                  <select className="neo-input" value={form.branchCode}
                    onChange={(e) => setForm({ ...form, branchCode: e.target.value })}>
                    <option value="">Select Branch</option>
                    {branches.map((b) => (
                      <option key={b.branchCode} value={b.branchCode}>
                        {b.branchCode} — {b.branchName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeForm} className="neo-btn-ghost">Cancel</button>
                <button type="submit" disabled={saving} className="neo-btn-primary">
                  {saving ? 'Saving...' : editId ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
