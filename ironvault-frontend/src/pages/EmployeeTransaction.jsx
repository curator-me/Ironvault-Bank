import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, AlertCircle } from 'lucide-react';
import client from '../api/client';
import TransactionTable from '../components/TransactionTable';

export const EmployeeTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadTransactions = async (pageNum = 0) => {
    setLoading(true);
    setError('');
    try {
      const res = await client.get('/employee/transactions', {
        params: {
          page: pageNum,
          size: 50,
        },
      });
      setTransactions(res.data?.content || []);
      setTotalPages(res.data?.totalPages || 1);
      setPage(pageNum);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions(0);
  }, []);

  if (loading && transactions.length === 0) {
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
            <ArrowLeftRight className="w-8 h-8 text-navy-600" />
            All Transactions
          </h1>
          <p className="text-navy-600">Monitor all system transactions (Last 50 per page)</p>
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

        {/* Transactions Table */}
        <TransactionTable
          transactions={transactions}
          emptyText="No transactions found"
          pagination={{
            page,
            totalPages,
            onPrev: () => loadTransactions(page - 1),
            onNext: () => loadTransactions(page + 1),
          }}
        />
      </div>
    </div>
  );
};

export default EmployeeTransactions;
