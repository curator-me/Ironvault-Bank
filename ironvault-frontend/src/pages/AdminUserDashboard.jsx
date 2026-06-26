import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Lock,
  LockOpen,
  Search,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import client from '../api/client';
import { formatDateTime } from '../utils/formatters';

const STATUS_BADGE = {
  CUSTOMER: 'bg-teal-100 text-teal-700',
  EMPLOYEE: 'bg-blue-100 text-blue-700',
  ADMIN: 'bg-navy-900 text-white',
};

export const AdminUserDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [lockingUserId, setLockingUserId] = useState(null);

  const loadUsers = async (pageNum = 0, searchQuery = '') => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pageNum,
        size: 20,
        role: 'CUSTOMER',
      };
      if (searchQuery) params.search = searchQuery;

      const res = await client.get('/admin/users', { params });
      setUsers(res.data?.content || []);
      setTotalPages(res.data?.totalPages || 1);
      setPage(pageNum);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(0, search);
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearch(query);
    loadUsers(0, query);
  };

  const handleLockToggle = async (userId, isLocked) => {
    setLockingUserId(userId);
    try {
      const endpoint = isLocked ? `/admin/users/${userId}/unlock` : `/admin/users/${userId}/lock`;
      const res = await client.put(endpoint);
      setUsers(users.map((u) => (u.id === userId ? res.data : u)));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user lock status');
    } finally {
      setLockingUserId(null);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-navy-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-50 to-teal-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-navy-900 mb-2 flex items-center gap-2">
            <Users className="w-8 h-8 text-navy-600" />
            Customer Management
          </h1>
          <p className="text-navy-600">Manage all customers and their status</p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-rose-100 border border-rose-300 text-rose-700 px-4 py-3 rounded-lg flex gap-2"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </motion.div>
        )}

        {/* Search */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-4 top-3 w-5 h-5 text-navy-400" />
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Search by email or username..."
              className="w-full pl-12 pr-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-lg border border-navy-100 shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-navy-50 border-b border-navy-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">
                    Failed Attempts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">
                    Last Password Change
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <Users className="w-12 h-12 text-navy-300 mx-auto mb-3" />
                      <p className="text-navy-600">No customers found</p>
                    </td>
                  </tr>
                ) : (
                  users.map((u, idx) => (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-navy-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-navy-900">
                        {u.username}
                      </td>
                      <td className="px-6 py-4 text-sm text-navy-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            STATUS_BADGE[u.role] || 'bg-navy-100 text-navy-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-navy-600">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            u.failedAttempts > 0
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-teal-100 text-teal-700'
                          }`}
                        >
                          {u.failedAttempts}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            u.accountLocked
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-teal-100 text-teal-700'
                          }`}
                        >
                          {u.accountLocked ? 'LOCKED' : 'ACTIVE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-navy-600">
                        {formatDateTime(u.passwordLastChanged)}
                      </td>
                      <td className="px-6 py-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleLockToggle(u.id, u.accountLocked)}
                          disabled={lockingUserId === u.id}
                          className={`p-2 rounded-lg transition-colors ${
                            u.accountLocked
                              ? 'bg-teal-100 hover:bg-teal-200 text-teal-600'
                              : 'bg-rose-100 hover:bg-rose-200 text-rose-600'
                          } disabled:opacity-50`}
                        >
                          {lockingUserId === u.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                          ) : u.accountLocked ? (
                            <LockOpen className="w-4 h-4" />
                          ) : (
                            <Lock className="w-4 h-4" />
                          )}
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-navy-100 px-6 py-4 flex items-center justify-between">
              <button
                onClick={() => loadUsers(page - 1, search)}
                disabled={page === 0}
                className="flex items-center gap-2 bg-navy-100 hover:bg-navy-200 disabled:bg-navy-50 text-navy-900 disabled:text-navy-400 px-3 py-2 rounded-lg transition-colors text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-sm text-navy-600">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => loadUsers(page + 1, search)}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-2 bg-navy-100 hover:bg-navy-200 disabled:bg-navy-50 text-navy-900 disabled:text-navy-400 px-3 py-2 rounded-lg transition-colors text-sm"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
