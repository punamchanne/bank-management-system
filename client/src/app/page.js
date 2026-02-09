'use client';
import Link from 'next/link';
import { 
  HiShieldCheck, HiLightningBolt, HiChartBar, HiArrowRight, 
  HiUsers, HiCreditCard, HiCash, HiTrendingUp, HiCheckCircle,
  HiClock, HiGlobe, HiLockClosed
} from 'react-icons/hi';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white overflow-x-hidden">
      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-xl shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">NeoFin</span>
                <p className="text-xs text-gray-500 hidden sm:block">Core Banking System</p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <a href="#features" className="hidden sm:block text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                Features
              </a>
              <a href="#modules" className="hidden sm:block text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                Modules
              </a>
              <Link
                href="/login"
                className="neo-btn-primary text-sm !py-2.5 !px-6 shadow-lg hover:shadow-xl transition-all"
              >
                Login <HiArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 lg:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-mint-50 opacity-60 -z-10"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-mint-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-mint-50 border border-blue-100 rounded-full text-sm font-medium mb-6 sm:mb-8 animate-fadeIn">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-gray-700">Next-Gen Core Banking Platform</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold leading-tight mb-6 sm:mb-8 tracking-tight animate-slideIn">
            <span className="text-gray-900">Banking Simplified</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-700 to-mint-500">
              for the Modern Era
            </span>
          </h1>
          
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto mb-8 sm:mb-12 leading-relaxed px-4 animate-fadeIn animation-delay-200">
            Digitize your branch operations with our powerful, intuitive core banking system. 
            Streamline cash management, clearing, loans, and administration in one unified platform.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 sm:mb-16 animate-fadeIn animation-delay-400">
            <Link href="/login" className="w-full sm:w-auto neo-btn-primary text-base !py-4 !px-8 flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-all group">
              Get Started 
              <HiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#features" className="w-full sm:w-auto neo-btn-ghost text-base !py-4 !px-8 group">
              Explore Features
              <HiChartBar className="w-5 h-5 ml-2 inline group-hover:scale-110 transition-transform" />
            </a>
          </div>

          {/* Dashboard Preview Stats */}
          <div className="mt-12 sm:mt-20 relative animate-fadeIn animation-delay-600">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 border border-gray-200 shadow-2xl">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {[
                  { label: 'Total Deposits', value: '₹24.5 Cr', change: '+12.3%', icon: HiTrendingUp, color: 'from-blue-500 to-blue-600' },
                  { label: 'Active Accounts', value: '12,847', change: '+5.2%', icon: HiUsers, color: 'from-mint-500 to-mint-600' },
                  { label: 'Loans Processed', value: '₹8.2 Cr', change: '+18.7%', icon: HiCash, color: 'from-purple-500 to-purple-600' },
                  { label: 'Daily Transactions', value: '3,254', change: '+8.1%', icon: HiCreditCard, color: 'from-orange-500 to-orange-600' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all group cursor-default">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">{stat.label}</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs sm:text-sm text-mint-600 font-semibold mt-1 flex items-center gap-1">
                      <HiTrendingUp className="w-3 h-3 sm:w-4 sm:h-4" /> {stat.change}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-20">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Why Choose NeoFin</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mt-3 mb-4 sm:mb-6">
              Everything You Need, Nothing You Don't
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              A comprehensive suite of banking tools designed for efficiency, security, and modern operations.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: HiShieldCheck,
                title: 'Secure Transactions',
                desc: 'End-to-end encrypted transactions with real-time balance updates, comprehensive audit trails, and multi-layer security protocols.',
                color: 'from-blue-500 to-blue-600',
                bgColor: 'bg-blue-50'
              },
              {
                icon: HiLightningBolt,
                title: 'Instant Loan Processing',
                desc: 'Auto EMI calculator, real-time loan processing with intelligent approval workflows and complete status tracking.',
                color: 'from-mint-500 to-mint-600',
                bgColor: 'bg-mint-50'
              },
              {
                icon: HiChartBar,
                title: 'Real-time Reports',
                desc: 'Cash, online, cheque, GL/Wallet, and EOD reports with drill-down analytics and exportable data insights.',
                color: 'from-purple-500 to-purple-600',
                bgColor: 'bg-purple-50'
              },
              {
                icon: HiClock,
                title: '24/7 Availability',
                desc: 'Always-on banking platform with cloud infrastructure ensuring zero downtime and maximum uptime SLA.',
                color: 'from-orange-500 to-orange-600',
                bgColor: 'bg-orange-50'
              },
              {
                icon: HiGlobe,
                title: 'Multi-Branch Support',
                desc: 'Centralized management across multiple branches with granular permissions and consolidated reporting.',
                color: 'from-teal-500 to-teal-600',
                bgColor: 'bg-teal-50'
              },
              {
                icon: HiLockClosed,
                title: 'Role-Based Access',
                desc: 'Advanced RBAC system with Admin, Manager, and Clerk roles ensuring proper authorization and compliance.',
                color: 'from-red-500 to-red-600',
                bgColor: 'bg-red-50'
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 hover:border-blue-200 hover:shadow-2xl transition-all duration-300 group cursor-default">
                <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="modules" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Core Modules</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mt-3 mb-4 sm:mb-6">
              Complete Banking Suite
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
            {[
              {
                title: 'Customer Management (CIF)',
                desc: 'Auto-generated CIF IDs, comprehensive customer profiles with Aadhar, PAN verification, and complete KYC management.',
                features: ['Auto CIF Generation', 'KYC Verification', 'Customer Search', 'Profile Management']
              },
              {
                title: 'Account Operations',
                desc: 'Multi-type account support (Savings/Current) with ₹5K minimum balance, real-time balance tracking, and status management.',
                features: ['Account Opening', 'Balance Tracking', 'Status Control', 'Multiple Types']
              },
              {
                title: 'Transaction Processing',
                desc: 'Deposit, withdrawal, fund transfer with multiple modes (Cash, Cheque, NEFT, RTGS, UPI, IMPS) and instant updates.',
                features: ['Multi-mode Transactions', 'Instant Processing', 'Balance Verification', 'Transaction History']
              },
              {
                title: 'Loan Management',
                desc: 'Complete loan lifecycle from application to closure with auto EMI calculation and approval workflows.',
                features: ['Auto EMI Calculator', 'Approval Workflow', 'Status Tracking', 'Loan Analytics']
              },
              {
                title: 'Comprehensive Reports',
                desc: 'Cash, Online, Cheque, GL/Wallet, and EOD reports with date filtering and exportable formats.',
                features: ['5 Report Types', 'Date Filtering', 'Export Options', 'Real-time Data']
              },
              {
                title: 'Admin & Branch Management',
                desc: 'User management, role assignment, branch configuration, and financial tracking across all locations.',
                features: ['User Management', 'RBAC System', 'Branch Metrics', 'Audit Logs']
              }
            ].map((module, i) => (
              <div key={i} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 sm:p-8 border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">{module.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-6 leading-relaxed">{module.desc}</p>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {module.features.map((feature, fi) => (
                    <div key={fi} className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                      <HiCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-mint-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:30px_30px]"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
            Ready to Transform Your Banking?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-blue-100 mb-8 sm:mb-10 max-w-2xl mx-auto">
            Join modern banks using NeoFin to streamline operations, enhance security, and deliver exceptional customer experiences.
          </p>
          <Link href="/login" className="inline-flex items-center gap-2 bg-white text-blue-600 font-semibold px-8 sm:px-10 py-4 rounded-xl hover:bg-gray-50 transition-all shadow-2xl hover:shadow-3xl hover:scale-105 text-base sm:text-lg">
            Start Now <HiArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <div>
                <span className="text-lg font-bold text-white">NeoFin</span>
                <p className="text-xs text-gray-400">Core Banking System</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm text-gray-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#modules" className="hover:text-white transition-colors">Modules</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-gray-500">
            <p>© 2026 NeoFin. All rights reserved.</p>
            <p>Built with ❤️ for modern banking</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
