'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { login } from '@/lib/api';
import toast from 'react-hot-toast';
import { HiEye, HiEyeOff } from 'react-icons/hi';

export default function LoginPage() {
  const [form, setForm] = useState({ userId: '', password: '', branchCode: '', role: 'Clerk' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.userId || !form.password) {
      toast.error('Please enter User ID and Password');
      return;
    }
    setLoading(true);
    try {
      const res = await login(form);
      loginUser(res.data.user, res.data.token);
      toast.success(`Welcome, ${res.data.user.name}!`);

      if (res.data.user.role === 'Admin') {
        router.push('/dashboard/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-mint-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="neo-card w-full max-w-md relative z-10 !p-8 animate-fade-in">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="absolute top-4 right-4 text-xs text-primary-500 hover:underline focus:outline-none"
        >
          ← Back to Home
        </button>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">N</span>
          </div>
          <h1 className="text-2xl font-bold text-primary-500">NeoFin</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Role */}
          <div>
            <label className="neo-label">Role</label>
            <div className="relative">
              <select
                className="neo-input appearance-none bg-no-repeat bg-right"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundSize: `1.5em 1.5em` }}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="Clerk">Clerk</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>

          {/* User ID */}
          <div>
            <label className="neo-label">User ID</label>
            <input
              type="text"
              className="neo-input"
              placeholder="Enter your User ID"
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              autoFocus
            />
          </div>

          {/* Password */}
          <div>
            <label className="neo-label">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                className="neo-input !pr-12"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Branch Code */}
          <div>
            <label className="neo-label">Branch Code</label>
            <input
              type="text"
              className="neo-input"
              placeholder="e.g., BR001"
              value={form.branchCode}
              onChange={(e) => setForm({ ...form, branchCode: e.target.value })}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="neo-btn-primary w-full !py-3.5 text-base"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Demo: ADMIN001 / admin123 / BR001
          </p>
        </div>
      </div>
    </div>
  );
}
