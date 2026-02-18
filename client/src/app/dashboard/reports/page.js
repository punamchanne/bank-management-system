'use client';
import { useEffect, useState } from 'react';
import { getCashReport, getOnlineReport, getChequeReport, getGlWalletReport, getEodReport, getStatsReport } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  HiOutlineCash, HiOutlineGlobe, HiOutlineDocumentText,
  HiOutlineLibrary, HiOutlineClipboardCheck, HiDownload
} from 'react-icons/hi';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

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
        case 'cash': res = await getCashReport(dateRange); break;
        case 'online': res = await getOnlineReport(dateRange); break;
        case 'cheque': res = await getChequeReport(dateRange); break;
        case 'gl': res = await getGlWalletReport(dateRange); break;
        case 'eod': res = await getEodReport(dateRange); break;
      }
      setData(res.data.data);
    } catch {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (v) => '₹' + Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const fmtPDF = (v) => 'Rs.' + Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  const downloadPDF = async () => {
    setLoading(true);
    const toastId = toast.loading('Generating consolidated report...');
    try {
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF();

      // Fetch all reports at once for the given date range
      const [cashRes, onlineRes, chequeRes, glRes, eodRes, statsRes] = await Promise.all([
        getCashReport(dateRange),
        getOnlineReport(dateRange),
        getChequeReport(dateRange),
        getGlWalletReport(dateRange),
        getEodReport(dateRange),
        getStatsReport(dateRange)
      ]);

      const cash = cashRes.data.data;
      const online = onlineRes.data.data;
      const cheque = chequeRes.data.data;
      const gl = glRes.data.data;
      const eod = eodRes.data.data;
      const stats = statsRes.data.data;

      // Title Page
      doc.setFontSize(22);
      doc.text('NeoFin - Comprehensive Financial Report', 14, 20);
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`Reporting Period: ${dateRange.startDate} to ${dateRange.endDate}`, 14, 38);

      // Section 1: Transaction Summary (Cash)
      doc.setFontSize(16);
      doc.text('1. Cash Transaction Summary', 14, 50);
      autoTable(doc, {
        head: [['Category', 'Count', 'Amount (Rs)']],
        body: [
          ['Deposits', cash.deposits?.count || 0, fmtPDF(cash.deposits?.total)],
          ['Withdrawals', cash.withdrawals?.count || 0, fmtPDF(cash.withdrawals?.total)],
          ['Net Cash Balance', '', fmtPDF(cash.netCash)]
        ],
        startY: 55,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] }
      });

      // Section 2: Online Transactions
      let finalY = doc.lastAutoTable.finalY + 15;
      doc.text('2. Online Transfers Detail', 14, finalY);
      const onlineRows = ['NEFT', 'RTGS', 'UPI', 'IMPS'].map(mode =>
        [mode, online[mode]?.count || 0, fmtPDF(online[mode]?.total)]
      );
      autoTable(doc, {
        head: [['Mode', 'Count', 'Amount (Rs)']],
        body: onlineRows,
        startY: finalY + 5,
        theme: 'grid',
        headStyles: { fillColor: [39, 174, 96] }
      });

      // Section 3: Cheque Clearance
      finalY = doc.lastAutoTable.finalY + 15;
      doc.text('3. Cheque Processing Status', 14, finalY);
      const chequeRows = ['Received', 'Passed', 'Rejected'].map(status =>
        [status, cheque[status]?.count || 0, fmtPDF(cheque[status]?.total)]
      );
      autoTable(doc, {
        head: [['Status', 'Count', 'Amount (Rs)']],
        body: chequeRows,
        startY: finalY + 5,
        theme: 'grid',
        headStyles: { fillColor: [211, 84, 0] }
      });

      // New Page for Ledger & Stats
      doc.addPage();
      doc.text('4. General Ledger Snapshot', 14, 20);
      autoTable(doc, {
        head: [['Ledger Account', 'Balance (Rs)']],
        body: [
          ['Branch Cash Wallet', fmtPDF(gl.branchCashWallet)],
          ['ATM Cash Balance', fmtPDF(gl.atmCash)],
          ['Suspense Account', fmtPDF(gl.suspenseAccount)],
          ['Total Customer Deposits', fmtPDF(gl.totalDeposits)]
        ],
        startY: 25,
        theme: 'grid',
        headStyles: { fillColor: [142, 68, 173] }
      });

      // Section 5: Growth & Loan Stats
      finalY = doc.lastAutoTable.finalY + 15;
      doc.text('5. Growth & Loan Analytics', 14, finalY);
      autoTable(doc, {
        head: [['Metric', 'Count/Value']],
        body: [
          ['New Customers Acquired', stats.newCustomers],
          ['New Accounts Opened', stats.newAccounts],
          ['Loans Approved', `${stats.loans.Approved.count} (${fmtPDF(stats.loans.Approved.amount)})`],
          ['Loans Pending', `${stats.loans.Pending.count} (${fmtPDF(stats.loans.Pending.amount)})`],
          ['Loans Rejected', `${stats.loans.Rejected.count} (${fmtPDF(stats.loans.Rejected.amount)})`]
        ],
        startY: finalY + 5,
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80] }
      });

      doc.save(`NeoFin_Consolidated_Report_${dateRange.startDate}.pdf`);
      toast.success('Report downloaded successfully');

    } catch (err) {
      console.error(err);
      toast.error('Failed to generate report');
    } finally {
      toast.dismiss(toastId);
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'cash', label: 'Cash Report', icon: HiOutlineCash },
    { id: 'online', label: 'Online Report', icon: HiOutlineGlobe },
    { id: 'cheque', label: 'Cheque Report', icon: HiOutlineDocumentText },
    { id: 'gl', label: 'GL / Wallet', icon: HiOutlineLibrary },
    { id: 'eod', label: 'EOD / Period', icon: HiOutlineClipboardCheck },
  ];

  const renderCharts = () => {
    if (!data) return null;

    if (activeTab === 'cash') {
      const chartData = [
        { name: 'Deposits', Amount: data.deposits?.total || 0, Count: data.deposits?.count || 0 },
        { name: 'Withdrawals', Amount: data.withdrawals?.total || 0, Count: data.withdrawals?.count || 0 },
      ];
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 min-h-[300px]">
          <div className="neo-card">
            <h3 className="text-sm font-semibold text-gray-500 mb-4">Transaction Volume (Amount)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Amount" fill="#8884d8" name="Amount (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="neo-card">
            <h3 className="text-sm font-semibold text-gray-500 mb-4">Transaction Count</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={chartData} dataKey="Count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    } else if (activeTab === 'online') {
      const chartData = ['NEFT', 'RTGS', 'UPI', 'IMPS'].map(mode => ({
        name: mode,
        Amount: data[mode]?.total || 0,
        Count: data[mode]?.count || 0
      }));
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 min-h-[300px]">
          <div className="neo-card">
            <h3 className="text-sm font-semibold text-gray-500 mb-4">Online Transfers (Amount)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Amount" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="neo-card">
            <h3 className="text-sm font-semibold text-gray-500 mb-4">Transfer Count Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={chartData} dataKey="Count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    } else if (activeTab === 'cheque') {
      const chartData = ['Received', 'Passed', 'Rejected'].map(key => ({
        name: key,
        Count: data[key]?.count || 0,
        Amount: data[key]?.total || 0,
      }));
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 min-h-[300px]">
          <div className="neo-card">
            <h3 className="text-sm font-semibold text-gray-500 mb-4">Cheque Status (Count)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Count" fill="#FFBB28" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="neo-card">
            <h3 className="text-sm font-semibold text-gray-500 mb-4">Amount Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={chartData} dataKey="Amount" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    } else if (activeTab === 'gl') {
      const chartData = [
        { name: 'Branch Wallet', Amount: data.branchCashWallet },
        { name: 'ATM Cash', Amount: data.atmCash },
        { name: 'Suspense', Amount: data.suspenseAccount },
      ];
      return (
        <div className="mt-6 neo-card min-h-[400px]">
          <h3 className="text-sm font-semibold text-gray-500 mb-4">Ledger Balances</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Amount" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }
    return null;
  }

  const renderContent = () => {
    if (loading) return <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
    if (!data) return <p className="text-center py-20 text-gray-400">No data available</p>;

    switch (activeTab) {
      case 'cash':
        return (
          <>
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
            {renderCharts()}
          </>
        );

      case 'online':
        return (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {['NEFT', 'RTGS', 'UPI', 'IMPS'].map((mode) => (
                <div key={mode} className="neo-card">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{mode}</p>
                  <p className="text-2xl font-bold text-primary-500 mt-2">{fmt(data[mode]?.total)}</p>
                  <p className="text-sm text-gray-400 mt-1">{data[mode]?.count || 0} transactions</p>
                </div>
              ))}
            </div>
            {renderCharts()}
          </>
        );

      case 'cheque':
        return (
          <>
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
            {renderCharts()}
          </>
        );

      case 'gl':
        return (
          <>
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
            {renderCharts()}
          </>
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
          <p className="text-sm text-gray-400 mt-1">Detailed financial reports and analytics</p>
        </div>
        <button
          onClick={downloadPDF}
          disabled={loading}
          className="neo-btn-outline flex items-center gap-2"
        >
          <HiDownload className="w-5 h-5" /> Download Consolidated PDF
        </button>
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

      {/* Report Content */}
      <div className="animate-fade-in">
        {renderContent()}
      </div>
    </div>
  );
}
