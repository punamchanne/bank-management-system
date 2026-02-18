import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('neofin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('neofin_token');
        localStorage.removeItem('neofin_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');
export const registerUser = (data) => API.post('/auth/register', data);

// Users
export const getUsers = () => API.get('/users');
export const updateUser = (id, data) => API.put(`/users/${id}`, data);
export const deleteUser = (id) => API.delete(`/users/${id}`);

// Customers
export const getCustomers = (params) => API.get('/customers', { params });
export const getCustomer = (cifId) => API.get(`/customers/${cifId}`);
export const createCustomer = (data) => API.post('/customers', data);
export const updateCustomer = (cifId, data) => API.put(`/customers/${cifId}`, data);

// Accounts
export const getAccounts = (params) => API.get('/accounts', { params });
export const getAccount = (accountId) => API.get(`/accounts/${accountId}`);
export const getAccountsByCif = (cifId) => API.get(`/accounts/customer/${cifId}`);
export const createAccount = (data) => API.post('/accounts', data);
export const updateAccountStatus = (accountId, data) => API.put(`/accounts/${accountId}/status`, data);

// Transactions
export const getTransactions = (params) => API.get('/transactions', { params });
export const deposit = (data) => API.post('/transactions/deposit', data);
export const withdraw = (data) => API.post('/transactions/withdraw', data);
export const transfer = (data) => API.post('/transactions/transfer', data);
export const updateTransactionStatus = (id, data) => API.put(`/transactions/${id}/status`, data);

// Loans
export const getLoans = (params) => API.get('/loans', { params });
export const getLoan = (loanId) => API.get(`/loans/${loanId}`);
export const createLoan = (data) => API.post('/loans', data);
export const calculateEmi = (data) => API.post('/loans/calculate-emi', data);
export const updateLoanStatus = (loanId, data) => API.put(`/loans/${loanId}/status`, data);

// Reports
export const getDashboard = () => API.get('/reports/dashboard');
export const getCashReport = (params) => API.get('/reports/cash', { params });
export const getOnlineReport = (params) => API.get('/reports/online', { params });
export const getChequeReport = (params) => API.get('/reports/cheque', { params });
export const getGlWalletReport = (params) => API.get('/reports/gl-wallet', { params });
export const getEodReport = (params) => API.get('/reports/eod', { params });
export const getStatsReport = (params) => API.get('/reports/stats', { params });

// Branches
export const getBranches = () => API.get('/branches');
export const createBranch = (data) => API.post('/branches', data);

export default API;
