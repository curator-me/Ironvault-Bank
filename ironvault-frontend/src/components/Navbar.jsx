import { useAuth } from '../hooks/useAuth';
import { Shield, LogOut, User, Landmark, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const customerLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/accounts', label: 'Accounts' },
    { path: '/transactions', label: 'Transactions' },
    { path: '/loans', label: 'Loans' },
  ];

  const adminLinks = [
    { path: '/admin/dashboard', label: 'Dashboard' },
    { path: '/admin/customers', label: 'Customers' },
    { path: '/admin/employees', label: 'Employees' },
    { path: '/admin/accounts', label: 'Accounts' },
    { path: '/admin/transactions', label: 'Transactions' },
    { path: '/admin/audit-logs', label: 'Audit Logs' },
  ];

  const employeeLinks = [
    { path: '/employee/dashboard', label: 'Accounts' },
    { path: '/employee/loans', label: 'Loans' },
    { path: '/employee/audit-logs', label: 'Audit Logs' },
    { path: '/employee/transactions', label: 'Transactions'}
  ];

  const navLinks = user?.role === 'ADMIN' ? adminLinks : user?.role === 'EMPLOYEE' ? employeeLinks : customerLinks;

  return (
    <nav className="bg-navy-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-2">
            <Landmark className="h-8 w-8 text-teal-400" />
            <span className="text-xl font-bold tracking-wider text-teal-50">IronVault</span>
            {user?.role === 'ADMIN' && (
              <span className="ml-2 px-2 py-1 bg-navy-800 border border-navy-700 rounded text-xs font-semibold text-orange-400">
                ADMIN PANEL
              </span>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-teal-600 text-white'
                    : 'text-navy-200 hover:bg-navy-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="hidden md:flex items-center space-x-2 bg-navy-800 px-3 py-1.5 rounded-lg border border-navy-700">
                  <User className="h-4 w-4 text-teal-400" />
                  <span className="text-sm font-medium text-navy-200">{user.username}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={logout}
                  className="hidden md:flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </motion.button>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="md:hidden text-navy-200 hover:text-white"
                >
                  {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-1.5 text-navy-300 text-sm">
                <Shield className="h-4 w-4 text-teal-400" />
                <span>Secure Banking</span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-navy-700 bg-navy-800"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'bg-teal-600 text-white'
                      : 'text-navy-200 hover:bg-navy-700'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-navy-200 hover:bg-navy-700 transition-colors flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
};
