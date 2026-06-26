import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Search, AlertCircle } from 'lucide-react';
import client from '../api/client';
import AccountTable from '../components/AccountTable';
import { useAuth } from '../hooks/useAuth';

export const AdminAccountsDashboard = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const loadAccounts = async (pageNum = 0, searchQuery = '') => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pageNum,
        size: 20,
      };
      if (searchQuery) params.accountNumber = searchQuery;

      const res = await client.get('/admin/accounts', { params });
      setAccounts(res.data?.content || []);
      setTotalPages(res.data?.totalPages || 1);
      setPage(pageNum);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts(0, search);
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearch(query);
    loadAccounts(0, query);
  };

  if (loading && accounts.length === 0) {
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
            <Wallet className="w-8 h-8 text-navy-600" />
            All Accounts
          </h1>
          <p className="text-navy-600">View and monitor all customer accounts</p>
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
              placeholder="Search by account number..."
              className="w-full pl-12 pr-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </motion.div>

        {/* Accounts Table */}
        <AccountTable
          accounts={accounts}
          variant="admin"
          pagination={{
            page,
            totalPages,
            onPrev: () => loadAccounts(page - 1, search),
            onNext: () => loadAccounts(page + 1, search),
          }}
        />
      </div>
    </div>
  );
};
