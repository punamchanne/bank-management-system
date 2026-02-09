'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUsers, getCustomers, getAccounts, getLoans } from '@/lib/api';
import { HiOutlineUsers, HiOutlineUserGroup, HiOutlineCreditCard, HiOutlineCash } from 'react-icons/hi';
import Link from 'next/link';

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ users: 0, customers: 0, accounts: 0, loans: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [u, c, a, l] = await Promise.all([
          getUsers(),
          getCustomers({}),
          getAccounts({}),
          getLoans({})
        ]);
        setStats({
          users: u.data.count || 0,
          customers: c.data.total || 0,
          accounts: a.data.total || 0,
          loans: l.data.total || 0,
        });
      } catch (err) {
        console.error(err);
      }
    };
    if (user?.role === 'Admin') fetchStats();
  }, [user]);

  if (user?.role !== 'Admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  const cards = [
    { label: 'Total Users', value: stats.users, icon: HiOutlineUsers, color: 'bg-blue-50 text-blue-600', href: '/dashboard/admin/users' },
    { label: 'Total Customers', value: stats.customers, icon: HiOutlineUserGroup, color: 'bg-mint-50 text-mint-600', href: '/dashboard/customers' },
    { label: 'Total Accounts', value: stats.accounts, icon: HiOutlineCreditCard, color: 'bg-purple-50 text-purple-600', href: '/dashboard/accounts' },
    { label: 'Total Loans', value: stats.loans, icon: HiOutlineCash, color: 'bg-amber-50 text-amber-600', href: '/dashboard/loans' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
        <p className="text-sm text-gray-400 mt-1">System administration and configuration</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <Link key={i} href={c.href} className="neo-stat-card group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{c.label}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{c.value}</p>
                </div>
                <div className={`w-12 h-12 ${c.color} rounded-2xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Link href="/dashboard/admin/users" className="neo-card group">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">User Management</h3>
          <p className="text-sm text-gray-400">Create, edit, and deactivate bank users. Assign roles and branch access.</p>
          <p className="text-sm text-primary-500 font-medium mt-3 group-hover:underline">Manage Users →</p>
        </Link>
        <Link href="/dashboard/admin/branches" className="neo-card group">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Branch Mapping</h3>
          <p className="text-sm text-gray-400">Create branches and map users to specific branch codes.</p>
          <p className="text-sm text-primary-500 font-medium mt-3 group-hover:underline">Manage Branches →</p>
        </Link>
      </div>
    </div>
  );
}
