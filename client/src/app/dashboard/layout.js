'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
  HiOutlineHome, HiOutlineUserGroup, HiOutlineCreditCard,
  HiOutlineSwitchHorizontal, HiOutlineDocumentReport, HiOutlineCash,
  HiOutlineCog, HiOutlineLogout, HiOutlineMenu, HiOutlineX,
  HiOutlineUsers, HiOutlineOfficeBuilding
} from 'react-icons/hi';

export default function DashboardLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neo-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading NeoFin...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const mainLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: HiOutlineHome },
    { href: '/dashboard/customers', label: 'Customers (CIF)', icon: HiOutlineUserGroup },
    { href: '/dashboard/accounts', label: 'Accounts', icon: HiOutlineCreditCard },
  ];

  if (user.role !== 'Admin') {
    mainLinks.push(
      { href: '/dashboard/transactions', label: 'Transactions', icon: HiOutlineSwitchHorizontal },
      { href: '/dashboard/loans', label: 'Loans', icon: HiOutlineCash }
    );
  }

  if (user.role === 'Manager') {
    mainLinks.push(
      { href: '/dashboard/reports', label: 'Reports', icon: HiOutlineDocumentReport }
    );
  }

  const adminLinks = user.role === 'Admin' ? [
    { href: '/dashboard/admin', label: 'Admin Panel', icon: HiOutlineCog },
    { href: '/dashboard/admin/users', label: 'User Management', icon: HiOutlineUsers },
    { href: '/dashboard/admin/branches', label: 'Branch Mapping', icon: HiOutlineOfficeBuilding },
  ] : [];

  const allLinks = [...mainLinks, ...adminLinks];

  const isActive = (href) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-neo-bg flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50
        ${collapsed ? 'w-20' : 'w-64'} 
        bg-white border-r border-gray-100 flex flex-col
        transform transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            {!collapsed && <span className="text-lg font-bold text-primary-500">NeoFin</span>}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:block text-gray-400 hover:text-gray-600 p-1"
          >
            <HiOutlineMenu className="w-5 h-5" />
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600 p-1"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {!collapsed && <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider px-4 mb-2">Main Menu</p>}
          {mainLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`neo-sidebar-link ${isActive(link.href) ? 'active' : ''} ${collapsed ? 'justify-center !px-2' : ''}`}
                title={collapsed ? link.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{link.label}</span>}
              </Link>
            );
          })}

          {adminLinks.length > 0 && (
            <>
              <div className="my-4 border-t border-gray-100" />
              {!collapsed && <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider px-4 mb-2">Administration</p>}
              {adminLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`neo-sidebar-link ${isActive(link.href) ? 'active' : ''} ${collapsed ? 'justify-center !px-2' : ''}`}
                    title={collapsed ? link.label : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span>{link.label}</span>}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User Info */}
        <div className="border-t border-gray-100 p-3">
          {!collapsed && (
            <div className="px-3 py-2 mb-2">
              <p className="text-sm font-semibold text-gray-700 truncate">{user.name}</p>
              <p className="text-xs text-gray-400">{user.role} • {user.branchCode}</p>
            </div>
          )}
          <button
            onClick={logout}
            className={`neo-sidebar-link text-red-500 hover:bg-red-50 hover:text-red-600 w-full ${collapsed ? 'justify-center !px-2' : ''}`}
          >
            <HiOutlineLogout className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <HiOutlineMenu className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-sm font-semibold text-gray-700">
                {allLinks.find(l => isActive(l.href))?.label || 'Dashboard'}
              </h2>
              <p className="text-xs text-gray-400">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-700">{user.name}</p>
              <p className="text-xs text-gray-400">{user.userId}</p>
            </div>
            <div className="w-9 h-9 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
