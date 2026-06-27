import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter,
  X,
  ArrowLeftRight,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import client from "../api/client";
import TransactionForm from "../components/TransactionForm";
import TransactionTable from "../components/TransactionTable";
import { downloadFile } from "../utils/downloadFile";

export const Transactions = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [showForm, setShowForm] = useState(location.state?.action || null);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    minAmount: "",
    maxAmount: "",
  });

  const loadAccounts = async () => {
    try {
      const res = await client.get("/accounts");
      setAccounts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load accounts");
    }
  };

  const loadTransactions = async (pageNum = 0) => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page: pageNum,
        size: 10,
      };

      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.minAmount) params.minAmount = filters.minAmount;
      if (filters.maxAmount) params.maxAmount = filters.maxAmount;

      const res = await client.get("/transactions", { params });
      setTransactions(res.data?.content || []);
      console.log(res.data.content[0])
      setTotalPages(res.data?.totalPages || 1);
      setPage(pageNum);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadStatement = async (trx_id) => {
    try {
      await downloadFile(`/transactions/${trx_id}/statement`, `statement-${trx_id}.pdf`);
    } catch (err) {
      setError('Failed to download statement');
    }
  };

  useEffect(() => {
    loadAccounts();
    if (location.state?.action) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    loadTransactions(0);
  }, [filters]);

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      minAmount: "",
      maxAmount: "",
    });
  };

  const handleRefresh = () => {
    loadTransactions(page);
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-navy-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-50 to-teal-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-navy-900 mb-2">
            Transactions
          </h1>
          <p className="text-navy-600">
            View and manage your transaction history
          </p>
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

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 flex gap-3 flex-wrap items-center justify-between"
        >
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-2 bg-white border border-navy-200 hover:bg-navy-50 text-navy-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setShowForm("deposit")}
              disabled={accounts.length === 0}
              className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              Deposit
            </button>
            <button
              onClick={() => setShowForm("withdraw")}
              disabled={accounts.length === 0}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              Withdraw
            </button>
            <button
              onClick={() => setShowForm("transfer")}
              disabled={accounts.length === 0}
              className="bg-navy-600 hover:bg-navy-700 disabled:bg-navy-400 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              Transfer
            </button>
          </div>
        </motion.div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilter && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 bg-white border border-navy-200 rounded-lg p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      handleFilterChange("startDate", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) =>
                      handleFilterChange("endDate", e.target.value)
                    }
                    className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-2">
                    Min Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-2 text-navy-600">
                      $
                    </span>
                    <input
                      type="number"
                      value={filters.minAmount}
                      onChange={(e) =>
                        handleFilterChange("minAmount", e.target.value)
                      }
                      className="w-full pl-8 pr-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy-900 mb-2">
                    Max Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-2 text-navy-600">
                      $
                    </span>
                    <input
                      type="number"
                      value={filters.maxAmount}
                      onChange={(e) =>
                        handleFilterChange("maxAmount", e.target.value)
                      }
                      className="w-full pl-8 pr-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={handleClearFilters}
                className="text-navy-600 hover:text-navy-900 font-medium text-sm"
              >
                Clear Filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transactions Table */}
        <TransactionTable
          transactions={transactions}
          showId={false}
          compact
          onDownload={(txn) => handleDownloadStatement(txn.id)}
          emptyText="Your transactions will appear here"
          pagination={{
            page,
            totalPages,
            onPrev: () => loadTransactions(page - 1),
            onNext: () => loadTransactions(page + 1),
          }}
        />
      </div>

      {/* Transaction Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-8 max-w-md w-full"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-navy-900 capitalize">
                  {showForm}
                </h2>
                <button
                  onClick={() => setShowForm(null)}
                  className="text-navy-400 hover:text-navy-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <TransactionForm
                type={showForm}
                accounts={accounts}
                onClose={() => setShowForm(null)}
                onSuccess={handleRefresh}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
