'use client';
import { useEffect, useState } from 'react';
import { getDashboard } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  HiOutlineCash, HiOutlineGlobe, HiOutlineCreditCard,
  HiOutlineDocumentText, HiOutlineUserGroup, HiOutlineTrendingUp
} from 'react-icons/hi';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await getDashboard();
      setStats(res.data.data);
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    if (!val && val !== 0) return '₹0';
    return '₹' + Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Cash Today',
      value: formatCurrency(stats?.todayCash || 0),
      sub: `Deposits: ${formatCurrency(stats?.todayDeposits)} | Withdrawals: ${formatCurrency(stats?.todayWithdrawals)}`,
      icon: HiOutlineCash,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      label: 'Online Transactions',
      value: formatCurrency(stats?.onlineTransactions || 0),
      sub: `${stats?.todayTransactions || 0} transactions today`,
      icon: HiOutlineGlobe,
      color: 'bg-mint-50 text-mint-600'
    },
    {
      label: 'Active Accounts',
      value: (stats?.totalAccounts || 0).toLocaleString(),
      sub: `${stats?.totalCustomers || 0} registered customers`,
      icon: HiOutlineCreditCard,
      color: 'bg-purple-50 text-purple-600'
    },
    {
      label: 'Cheques Processed',
      value: stats?.chequesProcessed || 0,
      sub: 'Today\'s cheque clearance',
      icon: HiOutlineDocumentText,
      color: 'bg-amber-50 text-amber-600'
    },
    {
      label: 'Total Customers',
      value: (stats?.totalCustomers || 0).toLocaleString(),
      sub: 'Registered CIF accounts',
      icon: HiOutlineUserGroup,
      color: 'bg-pink-50 text-pink-600'
    },
    {
      label: 'Pending Loans',
      value: stats?.pendingLoans || 0,
      sub: `${stats?.totalLoans || 0} total loan applications`,
      icon: HiOutlineTrendingUp,
      color: 'bg-orange-50 text-orange-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}


      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="neo-stat-card animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-2">{card.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
                </div>
                <div className={`w-12 h-12 ${card.color} rounded-2xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}

    </div>
  );
}
