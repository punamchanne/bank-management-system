# NeoFin Core Banking System

**Banking Simplified for the Modern Era**

A comprehensive full-stack core banking application built with modern technologies, featuring a Neo-Fintech minimalistic design.

## 🚀 Features

### Customer Management
- **CIF (Customer Information File)** creation with auto-generated IDs
- Customer search and listing with pagination
- Comprehensive customer details (Aadhar, PAN, DOB, Address, Contact)

### Account Management
- Account opening with CIF lookup
- Multiple account types (Savings & Current)
- Minimum balance validation (₹5,000)
- Account status management (Active/Dormant/Closed)
- Real-time balance tracking

### Transaction Processing
- **Deposit**: Cash/Cheque deposits with instant balance update
- **Withdrawal**: Balance verification and secure withdrawals
- **Fund Transfer**: Seamless inter-account transfers
- Multiple transaction modes: Cash, Cheque, NEFT, RTGS, UPI, IMPS
- Complete transaction history with filters

### Loan Management
- Loan application processing
- **Auto EMI Calculator** using formula: `EMI = [P × R × (1+R)^N] / [(1+R)^N – 1]`
- Loan approval/rejection workflow
- Loan status tracking (Pending/Approved/Rejected/Closed)

### Comprehensive Reports
- **Cash Report**: Daily deposits vs withdrawals
- **Online Report**: NEFT/RTGS/UPI/IMPS breakdown
- **Cheque Report**: Received/Passed/Rejected status
- **GL/Wallet Report**: Cash wallet, ATM cash, suspense account
- **EOD Report**: End-of-day balance reconciliation

### Admin Panel
- User management with role-based access control
- Branch management and metrics
- User creation, editing, and deactivation
- Branch financial tracking (Cash Wallet, ATM Cash, Suspense)

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14.2.35
- **UI Library**: React 18.3.1
- **Styling**: Tailwind CSS 3.4.10
- **HTTP Client**: Axios
- **Notifications**: react-hot-toast
- **Icons**: react-icons
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcryptjs for password hashing
- **Middleware**: CORS, Morgan (logging)

### Design System
- **Theme**: Neo-Fintech minimalistic design
- **Colors**: Deep Blue (#1e3a8a), Slate Grey (#334155), Mint Green (#10b981)
- **Components**: Custom neo-card, neo-input, neo-btn classes

## 📁 Project Structure

```
bank_system/
├── server/
│   ├── models/
│   │   ├── User.js          # User authentication & roles
│   │   ├── Customer.js      # CIF & customer data
│   │   ├── Account.js       # Account management
│   │   ├── Transaction.js   # Transaction logging
│   │   ├── Loan.js          # Loan processing
│   │   └── Branch.js        # Branch management
│   ├── routes/
│   │   ├── auth.js          # Login & registration
│   │   ├── users.js         # User CRUD
│   │   ├── customers.js     # Customer operations
│   │   ├── accounts.js      # Account operations
│   │   ├── transactions.js  # Transaction processing
│   │   ├── loans.js         # Loan management
│   │   ├── reports.js       # Report generation
│   │   └── branches.js      # Branch operations
│   ├── middleware/
│   │   └── auth.js          # JWT verification & RBAC
│   ├── index.js             # Express server entry
│   └── seed.js              # Database seeding
├── client/
│   └── src/
│       ├── app/
│       │   ├── page.js                    # Landing page
│       │   ├── login/page.js              # Login portal
│       │   ├── dashboard/
│       │   │   ├── layout.js              # Dashboard layout
│       │   │   ├── page.js                # Dashboard home
│       │   │   ├── customers/page.js      # CIF management
│       │   │   ├── accounts/page.js       # Account opening
│       │   │   ├── transactions/page.js   # Transactions
│       │   │   ├── loans/page.js          # Loan processing
│       │   │   ├── reports/page.js        # Reports
│       │   │   └── admin/
│       │   │       ├── page.js            # Admin dashboard
│       │   │       ├── users/page.js      # User management
│       │   │       └── branches/page.js   # Branch management
│       │   ├── layout.js              # Root layout
│       │   └── globals.css            # Global styles
│       ├── context/
│       │   └── AuthContext.js         # Authentication state
│       └── lib/
│           └── api.js                 # API service layer
├── .env                               # Environment variables
├── .gitignore
├── package.json
└── README.md
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally or remote connection)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd bank_system
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create a `.env` file in the root directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/bank_system
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=30d
NODE_ENV=development
```

4. **Seed the database**
```bash
node server/seed.js
```

This will create:
- 2 branches (BR001 Mumbai Main, BR002 Bangalore Digital)
- 3 test users (Admin, Manager, Clerk)
- 3 sample customers
- 4 sample accounts

5. **Start the application**

**Development mode** (both servers):
```bash
npm run dev
```

**Or run separately**:

Backend:
```bash
npm run server:dev
```

Frontend:
```bash
npm run client
```

6. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🔐 Test Credentials

| Role | User ID | Password | Branch Code |
|------|---------|----------|-------------|
| Admin | ADMIN001 | admin123 | BR001 |
| Manager | MGR001 | manager123 | BR001 |
| Clerk | CLK001 | clerk123 | BR001 |

## 📊 Database Schema

### Users Collection
- User ID (unique)
- Name, Email, Password (hashed)
- Role (Admin/Manager/Clerk)
- Branch assignment
- Active status

### Customers Collection
- CIF ID (auto-generated)
- Personal details (Name, DOB, Aadhar, PAN)
- Contact information
- Occupation & Annual Income

### Accounts Collection
- Account ID (auto-generated by type & branch)
- Customer reference (CIF)
- Account type (Savings/Current)
- Balance (Decimal128 for precision)
- Status & timestamps

### Transactions Collection
- Transaction ID
- Account reference
- Type (Deposit/Withdrawal/Transfer)
- Amount & Mode
- Cheque details (if applicable)
- User who processed

### Loans Collection
- Loan ID (auto-generated)
- Customer & Account reference
- Loan type, amount, interest rate
- Tenure & EMI (auto-calculated)
- Status workflow

### Branches Collection
- Branch code (unique)
- Name, IFSC, Address
- Financial metrics (Cash Wallet, ATM Cash, Suspense)

## 🎨 Design System

### Color Palette
- **Deep Blue** (#1e3a8a): Primary actions, headers
- **Slate Grey** (#334155): Text, borders
- **Mint Green** (#10b981): Success states, CTAs

### Component Classes
- `.neo-card`: Elevated card with shadow
- `.neo-input`: Styled form inputs
- `.neo-btn-primary`: Primary action button
- `.neo-btn-secondary`: Secondary action button
- `.neo-table`: Data table styling

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Role-based access control (RBAC)
- Protected API routes
- Automatic token expiry handling
- CORS configuration

## 📱 Responsive Design

- Mobile-friendly hamburger menu
- Responsive sidebar (64px collapsed, 256px expanded)
- Adaptive grid layouts
- Touch-optimized interactions

## 🛣️ API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (Admin only)

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer

### Accounts
- `GET /api/accounts` - List accounts
- `POST /api/accounts` - Open account
- `GET /api/accounts/:id` - Get account details
- `PUT /api/accounts/:id/status` - Update account status

### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions/deposit` - Process deposit
- `POST /api/transactions/withdraw` - Process withdrawal
- `POST /api/transactions/transfer` - Process transfer

### Loans
- `GET /api/loans` - List loans
- `POST /api/loans` - Apply for loan
- `PUT /api/loans/:id/approve` - Approve loan
- `PUT /api/loans/:id/reject` - Reject loan

### Reports
- `GET /api/reports/cash` - Cash report
- `GET /api/reports/online` - Online transactions report
- `GET /api/reports/cheque` - Cheque report
- `GET /api/reports/gl-wallet` - GL/Wallet report
- `GET /api/reports/eod` - End of day report

### Admin
- `GET /api/users` - List users (Admin only)
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `GET /api/branches` - List branches
- `POST /api/branches` - Create branch (Admin only)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

NeoFin Development Team

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- MongoDB for the flexible database
- Tailwind CSS for the utility-first CSS framework
- React community for extensive libraries

---

**Built with ❤️ for modern banking**
