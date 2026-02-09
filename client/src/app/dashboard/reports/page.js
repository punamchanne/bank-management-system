'use client';
import { useEffect, useState } from 'react';
import { getCashReport, getOnlineReport, getChequeReport, getGlWalletReport, getEodReport } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  HiOutlineCash, HiOutlineGlobe, HiOutlineDocumentText,
  HiOutlineLibrary, HiOutlineClipboardCheck
} from 'react-icons/hi';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('cash');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10)
  });

  useEffect(() => { loadReport(activeTab); }, [activeTab]);

  const loadReport = async (tab) => {
    setLoading(true);
    setData(null);
    try {
      let res;
      switch (tab) {
        case 'cash':
          res = await getCashReport(dateRange);
          break;
        case 'online':
          res = await getOnlineReport(dateRange);
          break;
        case 'cheque':
          res = await getChequeReport(dateRange);
          break;
        case 'gl':
          res = await getGlWalletReport({});
          break;
        case 'eod':
          res = await getEodReport();
          break;
      }
      setData(res.data.data);
    } catch {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (v) => '₹' + Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  const tabs = [
    { id: 'cash', label: 'Cash Report', icon: HiOutlineCash },
    { id: 'online', label: 'Online Report', icon: HiOutlineGlobe },
    { id: 'cheque', label: 'Cheque Report', icon: HiOutlineDocumentText },
    { id: 'gl', label: 'GL / Wallet', icon: HiOutlineLibrary },
    { id: 'eod', label: 'EOD Report', icon: HiOutlineClipboardCheck },
  ];

  const renderContent = () => {
    if (loading) return <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
    if (!data) return <p className="text-center py-20 text-gray-400">No data available</p>;

    switch (activeTab) {
      case 'cash':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="neo-card bg-green-50 border-green-100">
              <p className="text-xs font-semibold text-green-500 uppercase tracking-wider">Total Deposits</p>
              <p className="text-3xl font-bold text-green-700 mt-2">{fmt(data.deposits?.total)}</p>
              <p className="text-sm text-green-500 mt-1">{data.deposits?.count || 0} transactions</p>
            </div>
            <div className="neo-card bg-red-50 border-red-100">
              <p className="text-xs font-semibold text-red-500 uppercase tracking-wider">Total Withdrawals</p>
              <p className="text-3xl font-bold text-red-700 mt-2">{fmt(data.withdrawals?.total)}</p>
              <p className="text-sm text-red-500 mt-1">{data.withdrawals?.count || 0} transactions</p>
            </div>
            <div className={`neo-card ${data.netCash >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100'}`}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Cash Balance</p>
              <p className={`text-3xl font-bold mt-2 ${data.netCash >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>{fmt(data.netCash)}</p>
              <p className="text-sm text-gray-400 mt-1">Deposits - Withdrawals</p>
            </div>
          </div>
        );

      case 'online':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {['NEFT', 'RTGS', 'UPI', 'IMPS'].map((mode) => (
              <div key={mode} className="neo-card">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{mode}</p>
                <p className="text-2xl font-bold text-primary-500 mt-2">{fmt(data[mode]?.total)}</p>
                <p className="text-sm text-gray-400 mt-1">{data[mode]?.count || 0} transactions</p>
              </div>
            ))}
          </div>
        );

      case 'cheque':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { key: 'Received', color: 'blue', label: 'Received' },
              { key: 'Passed', color: 'green', label: 'Passed / Cleared' },
              { key: 'Rejected', color: 'red', label: 'Rejected' }
            ].map((s) => (
              <div key={s.key} className={`neo-card bg-${s.color}-50 border-${s.color}-100`}>
                <p className={`text-xs font-semibold text-${s.color}-500 uppercase tracking-wider`}>{s.label}</p>
                <p className={`text-3xl font-bold text-${s.color}-700 mt-2`}>{fmt(data[s.key]?.total)}</p>
                <p className={`text-sm text-${s.color}-500 mt-1`}>{data[s.key]?.count || 0} cheques</p>
              </div>
            ))}
          </div>
        );

      case 'gl':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="neo-card">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Branch Cash Wallet</p>
              <p className="text-2xl font-bold text-primary-500 mt-2">{fmt(data.branchCashWallet)}</p>
            </div>
            <div className="neo-card">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ATM Cash</p>
              <p className="text-2xl font-bold text-primary-500 mt-2">{fmt(data.atmCash)}</p>
            </div>
            <div className="neo-card">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Suspense Account</p>
              <p className="text-2xl font-bold text-amber-600 mt-2">{fmt(data.suspenseAccount)}</p>
            </div>
            <div className="neo-card">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Deposits</p>
              <p className="text-2xl font-bold text-mint-600 mt-2">{fmt(data.totalDeposits)}</p>
            </div>
          </div>
        );

      case 'eod':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-lg font-bold ${data.systemStatus === 'BALANCED' ? 'bg-mint-50 text-mint-600' : 'bg-red-50 text-red-600'}`}>
                {data.systemStatus === 'BALANCED' ? '✅' : '⚠️'} System Status: {data.systemStatus}
              </div>
              <p className="text-sm text-gray-400 mt-2">End of Day Report — {data.date}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="neo-card">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Deposits</p>
                <p className="text-2xl font-bold text-green-600 mt-2">{fmt(data.deposits?.total)}</p>
                <p className="text-sm text-gray-400">{data.deposits?.count || 0} txns</p>
              </div>
              <div className="neo-card">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Withdrawals</p>
                <p className="text-2xl font-bold text-red-600 mt-2">{fmt(data.withdrawals?.total)}</p>
                <p className="text-sm text-gray-400">{data.withdrawals?.count || 0} txns</p>
              </div>
              <div className="neo-card">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Transfers</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">{fmt(data.transfers?.total)}</p>
                <p className="text-sm text-gray-400">{data.transfers?.count || 0} txns</p>
              </div>
              <div className="neo-card">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Account Balance</p>
                <p className="text-2xl font-bold text-primary-500 mt-2">{fmt(data.totalAccountBalance)}</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
        <p className="text-sm text-gray-400 mt-1">Detailed financial reports and analytics</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${activeTab === tab.id ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Date Range (for applicable reports) */}
      {['cash', 'online', 'cheque'].includes(activeTab) && (
        <div className="neo-card !p-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="neo-label">Start Date</label>
            <input type="date" className="neo-input" value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} />
          </div>
          <div>
            <label className="neo-label">End Date</label>
            <input type="date" className="neo-input" value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} />
          </div>
          <button onClick={() => loadReport(activeTab)} className="neo-btn-primary">
            Generate Report
          </button>
        </div>
      )}

      {/* Report Content */}
      {renderContent()}
    </div>
  );
}
