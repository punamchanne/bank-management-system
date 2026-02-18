'use client';
import { useEffect, useState } from 'react';
import { getLoans, createLoan, calculateEmi, updateLoanStatus } from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { HiOutlinePlus, HiOutlineX, HiOutlineCalculator } from 'react-icons/hi';

export default function LoansPage() {
  const [loans, setLoans] = useState([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [form, setForm] = useState({
    cifId: '', loanType: 'Personal', amount: '', tenureYears: '', interestRate: '8.5', remarks: ''
  });
  const [emiResult, setEmiResult] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchLoans(); }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const res = await getLoans({});
      setLoans(res.data.data);
    } catch { toast.error('Failed to load loans'); }
    finally { setLoading(false); }
  };

  const handleCalcEmi = async () => {
    if (!form.amount || !form.tenureYears) { toast.error('Enter amount and tenure'); return; }
    try {
      const res = await calculateEmi({
        amount: Number(form.amount),
        tenureYears: Number(form.tenureYears),
        interestRate: Number(form.interestRate)
      });
      setEmiResult(res.data.data);
    } catch { toast.error('EMI calculation failed'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.cifId || !form.amount || !form.tenureYears) {
      toast.error('Fill all required fields'); return;
    }
    setSaving(true);
    try {
      const res = await createLoan({
        ...form,
        amount: Number(form.amount),
        tenureYears: Number(form.tenureYears),
        interestRate: Number(form.interestRate)
      });
      toast.success(`Loan created! ID: ${res.data.data.loanId}`);
      setShowForm(false);
      setForm({ cifId: '', loanType: 'Personal', amount: '', tenureYears: '', interestRate: '8.5', remarks: '' });
      setEmiResult(null);
      fetchLoans();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleStatusUpdate = async (loanId, status) => {
    try {
      await updateLoanStatus(loanId, { status });
      toast.success(`Loan ${status.toLowerCase()}`);
      fetchLoans();
    } catch { toast.error('Update failed'); }
  };

  const getStatusBadge = (status) => {
    const c = {
      Approved: 'bg-mint-50 text-mint-600',
      Pending: 'bg-amber-50 text-amber-600',
      Rejected: 'bg-red-50 text-red-600',
      Closed: 'bg-gray-100 text-gray-600'
    };
    return <span className={`neo-badge ${c[status] || ''}`}>{status}</span>;
  };

  const fmt = (v) => '₹' + Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Loan Management</h1>
          <p className="text-sm text-gray-400 mt-1">Apply for loans and track loan applications</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCalc(true)} className="neo-btn-outline flex items-center gap-2">
            <HiOutlineCalculator className="w-5 h-5" /> EMI Calculator
          </button>
          {user?.role !== 'Manager' && (
            <button onClick={() => setShowForm(true)} className="neo-btn-primary flex items-center gap-2">
              <HiOutlinePlus className="w-5 h-5" /> Apply Loan
            </button>
          )}
        </div>
      </div>

      {/* Loan List */}
      <div className="neo-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="neo-table">
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>CIF ID</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Tenure</th>
                <th>EMI</th>
                <th>Rate</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">Loading...</td></tr>
              ) : loans.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">No loans found</td></tr>
              ) : (
                loans.map((l) => (
                  <tr key={l.loanId}>
                    <td className="font-mono font-semibold text-primary-500">{l.loanId}</td>
                    <td className="font-mono">{l.cifId}</td>
                    <td><span className="neo-badge bg-purple-50 text-purple-600">{l.loanType}</span></td>
                    <td className="font-semibold">{fmt(l.amount)}</td>
                    <td>{l.tenureYears} yr</td>
                    <td className="font-semibold text-mint-600">{fmt(l.emiAmount)}</td>
                    <td>{l.interestRate}%</td>
                    <td>{getStatusBadge(l.status)}</td>
                    <td>
                      {l.status === 'Pending' && user?.role === 'Manager' && (
                        <div className="flex gap-1">
                          <button onClick={() => handleStatusUpdate(l.loanId, 'Approved')}
                            className="text-xs px-2 py-1 rounded-lg bg-mint-50 text-mint-600 hover:bg-mint-100">
                            Approve
                          </button>
                          <button onClick={() => handleStatusUpdate(l.loanId, 'Rejected')}
                            className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Loan Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="neo-card w-full max-w-lg animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Apply for Loan</h2>
              <button onClick={() => { setShowForm(false); setEmiResult(null); }} className="text-gray-400 hover:text-gray-600">
                <HiOutlineX className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="neo-label">CIF ID *</label>
                  <input className="neo-input" placeholder="Customer CIF ID" value={form.cifId}
                    onChange={(e) => setForm({ ...form, cifId: e.target.value })} />
                </div>
                <div>
                  <label className="neo-label">Loan Type *</label>
                  <select className="neo-input" value={form.loanType}
                    onChange={(e) => setForm({ ...form, loanType: e.target.value })}>
                    <option value="Personal">Personal</option>
                    <option value="Home">Home</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Education">Education</option>
                  </select>
                </div>
                <div>
                  <label className="neo-label">Loan Amount (₹) *</label>
                  <input type="number" className="neo-input" placeholder="Amount" value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
                <div>
                  <label className="neo-label">Tenure (Years) *</label>
                  <input type="number" className="neo-input" placeholder="1-30" min={1} max={30} value={form.tenureYears}
                    onChange={(e) => setForm({ ...form, tenureYears: e.target.value })} />
                </div>
                <div>
                  <label className="neo-label">Interest Rate (%)</label>
                  <input type="number" step="0.1" className="neo-input" value={form.interestRate}
                    onChange={(e) => setForm({ ...form, interestRate: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="neo-label">Remarks</label>
                <input className="neo-input" placeholder="Any remarks" value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
              </div>

              <button type="button" onClick={handleCalcEmi} className="neo-btn-outline w-full flex items-center justify-center gap-2">
                <HiOutlineCalculator className="w-5 h-5" /> Calculate EMI
              </button>

              {emiResult && (
                <div className="bg-mint-50 rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-mint-500 font-semibold">Monthly EMI</p>
                    <p className="text-lg font-bold text-mint-700">{fmt(emiResult.emi)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-mint-500 font-semibold">Total Interest</p>
                    <p className="text-lg font-bold text-mint-700">{fmt(emiResult.totalInterest)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-mint-500 font-semibold">Total Payable</p>
                    <p className="text-lg font-bold text-mint-700">{fmt(emiResult.totalPayable)}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEmiResult(null); }} className="neo-btn-ghost">Cancel</button>
                <button type="submit" disabled={saving} className="neo-btn-primary">
                  {saving ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EMI Calculator Modal */}
      {showCalc && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="neo-card w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">EMI Calculator</h2>
              <button onClick={() => { setShowCalc(false); setEmiResult(null); }} className="text-gray-400 hover:text-gray-600">
                <HiOutlineX className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="neo-label">Loan Amount (₹)</label>
                <input type="number" className="neo-input" placeholder="Enter amount" value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label className="neo-label">Tenure (Years)</label>
                <input type="number" className="neo-input" placeholder="1-30" value={form.tenureYears}
                  onChange={(e) => setForm({ ...form, tenureYears: e.target.value })} />
              </div>
              <div>
                <label className="neo-label">Interest Rate (%)</label>
                <input type="number" step="0.1" className="neo-input" value={form.interestRate}
                  onChange={(e) => setForm({ ...form, interestRate: e.target.value })} />
              </div>
              <button onClick={handleCalcEmi} className="neo-btn-mint w-full">Calculate</button>

              {emiResult && (
                <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between"><span className="text-gray-500">Monthly EMI</span><span className="font-bold text-primary-500">{fmt(emiResult.emi)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Principal</span><span className="font-semibold">{fmt(emiResult.principal)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Total Interest</span><span className="font-semibold text-amber-600">{fmt(emiResult.totalInterest)}</span></div>
                  <div className="border-t pt-2 flex justify-between"><span className="text-gray-500 font-semibold">Total Payable</span><span className="font-bold text-primary-500">{fmt(emiResult.totalPayable)}</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
