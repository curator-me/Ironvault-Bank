import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Wallet,
  PiggyBank,
  AlertCircle,
  Trash2,
  Download,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import client from '../api/client';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { downloadFile } from '../utils/downloadFile';

const ACCOUNT_ICONS = {
  CHECKING: Wallet,
  SAVINGS: PiggyBank,
};

const STATUS_TINT = {
  ACTIVE: 'bg-teal-100 text-teal-700',
  SUSPENDED: 'bg-amber-100 text-amber-700',
  CLOSED: 'bg-rose-100 text-rose-700',
};

export const Accounts = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ type: 'CHECKING' });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadAccounts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await client.get('/accounts');
      setAccounts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleOpenModal = () => {
    setFormData({ type: 'CHECKING' });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ type: 'CHECKING' });
    setFormError('');
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const res = await client.post('/accounts', formData);
      setAccounts([...accounts, res.data]);
      setSuccessMessage(`Account ${res.data.accountNumber} created successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      handleCloseModal();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async (accountId) => {
    setIsSubmitting(true);
    try {
      await client.delete(`/accounts/${accountId}`);
      setAccounts(accounts.filter((a) => a.id !== accountId));
      setSuccessMessage('Account closed successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadStatement = async (account) => {
    try {
      await downloadFile(
        `/accounts/${account.id}/statement`,
        `statement-${account.accountNumber}.pdf`
      );
    } catch (err) {
      setError('Failed to download statement');
    }
  };

  if (loading) {
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
          className="mb-8 flex justify-between items-center"
        >
          <div>
            <h1 className="text-3xl font-bold text-navy-900 mb-2">My Accounts</h1>
            <p className="text-navy-600">Manage your accounts and view balances</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenModal}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Open Account
          </motion.button>
        </motion.div>

        {/* Success Message */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 bg-teal-100 border border-teal-300 text-teal-700 px-4 py-3 rounded-lg"
            >
              {successMessage}
            </motion.div>
          )}
        </AnimatePresence>

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

        {/* Accounts Grid */}
        {accounts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white rounded-lg border border-navy-100"
          >
            <Wallet className="w-12 h-12 text-navy-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-navy-900 mb-2">No Accounts Yet</h3>
            <p className="text-navy-600 mb-6">Open an account to get started</p>
            <button
              onClick={handleOpenModal}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Open First Account
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {accounts.map((account, index) => {
              const Icon = ACCOUNT_ICONS[account.type];
              return (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg border border-navy-100 shadow-sm hover:shadow-md transition-shadow p-6"
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-teal-100 p-3 rounded-lg">
                        <Icon className="w-6 h-6 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-navy-600 uppercase">
                          {account.type}
                        </h3>
                        <p className="text-xs text-navy-400">{account.accountNumber}</p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        STATUS_TINT[account.status]
                      }`}
                    >
                      {account.status}
                    </span>
                  </div>

                  {/* Balance */}
                  <div className="mb-6">
                    <p className="text-navy-600 text-sm mb-1">Available Balance</p>
                    <p className="text-3xl font-bold text-navy-900">
                      {formatCurrency(account.balance)}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="text-xs text-navy-500 mb-6 space-y-1">
                    <p>Created: {formatDateTime(account.createdDate)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDownloadStatement(account)}
                      className="flex-1 flex items-center justify-center gap-2 bg-navy-50 hover:bg-navy-100 text-navy-700 py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Statement
                    </motion.button>
                    {account.status === 'ACTIVE' && account.balance === 0 && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setDeleteConfirm(account.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 py-2 rounded-lg font-medium transition-colors text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Close
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteConfirm && (
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
                className="bg-white rounded-lg p-6 max-w-md w-full"
              >
                <h2 className="text-xl font-bold text-navy-900 mb-4">Close Account?</h2>
                <p className="text-navy-600 mb-6">
                  This action cannot be undone. Make sure the account balance is zero before closing.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 bg-navy-100 hover:bg-navy-200 text-navy-900 py-2 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteAccount(deleteConfirm)}
                    disabled={isSubmitting}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white py-2 rounded-lg font-medium transition-colors"
                  >
                    {isSubmitting ? 'Closing...' : 'Close Account'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Open Account Modal */}
        <AnimatePresence>
          {isModalOpen && (
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
                <h2 className="text-2xl font-bold text-navy-900 mb-6">Open New Account</h2>

                {formError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 bg-rose-100 border border-rose-300 text-rose-700 px-4 py-3 rounded-lg text-sm"
                  >
                    {formError}
                  </motion.div>
                )}

                <form onSubmit={handleCreateAccount} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-2">
                      Account Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="CHECKING">Checking Account</option>
                      <option value="SAVINGS">Savings Account</option>
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 bg-navy-100 hover:bg-navy-200 text-navy-900 py-2 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white py-2 rounded-lg font-medium transition-colors"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Account'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
