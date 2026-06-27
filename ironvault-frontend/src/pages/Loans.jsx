
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Banknote,
  AlertCircle,
  Info,
  CreditCard,
  Car,
  Home,
  GraduationCap,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import client from '../api/client';
import { formatCurrency, formatDateTime } from '../utils/formatters';

const LOAN_ICONS = {
  PERSONAL: Banknote,
  HOME: Home,
  CAR: Car,
  EDUCATION: GraduationCap,
};

const STATUS_TINT = {
  PENDING: 'bg-amber-100 text-amber-700',
  REJECTED: 'bg-rose-100 text-rose-700',
  ACTIVE: 'bg-teal-100 text-teal-700',
  CLOSED: 'bg-navy-100 text-navy-700',
};

export const Loans = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ amount: '', reason: '', loanType: 'PERSONAL', accountId: '' });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [payConfirm, setPayConfirm] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [loansRes, accountsRes] = await Promise.all([
        client.get('/customer/loans'),
        client.get('/accounts')
      ]);
      setLoans(Array.isArray(loansRes.data) ? loansRes.data : []);
      const activeAccounts = Array.isArray(accountsRes.data) ? accountsRes.data.filter(a => a.status === 'ACTIVE') : [];
      setAccounts(activeAccounts);
      if (activeAccounts.length > 0) {
        setFormData(prev => ({ ...prev, accountId: activeAccounts[0].id }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = () => {
    if (accounts.length === 0) {
      setError('You need an active account to apply for a loan.');
      return;
    }
    setFormData({ amount: '', reason: '', loanType: 'PERSONAL', accountId: accounts[0].id });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormError('');
  };

  const handleApplyForLoan = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const res = await client.post('/customer/loans', {
          ...formData,
          amount: parseFloat(formData.amount)
      });
      setLoans([res.data, ...loans]);
      setSuccessMessage('Loan application submitted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      handleCloseModal();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to apply for loan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAskPayLoan = (loan) => {
    setPayConfirm(loan);
  };

  const handleCancelPayLoan = () => {
    setPayConfirm(null);
  };

  const handleConfirmPayLoan = async () => {
    if (!payConfirm) return;
    setIsSubmitting(true);
    try {
      await client.post(`/customer/loans/${payConfirm.id}/pay`);
      setLoans(loans.map((l) => (l.id === payConfirm.id ? { ...l, status: 'CLOSED' } : l)));
      setSuccessMessage('Loan paid off successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      setPayConfirm(null);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Failed to pay loan');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsSubmitting(false);
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
            <h1 className="text-3xl font-bold text-navy-900 mb-2">My Loans</h1>
            <p className="text-navy-600">Manage your loans and applications</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenModal}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Apply for Loan
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

        {/* Loans Grid */}
        {loans.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white rounded-lg border border-navy-100"
          >
            <Banknote className="w-12 h-12 text-navy-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-navy-900 mb-2">No Loans Yet</h3>
            <p className="text-navy-600 mb-6">Apply for a loan to get started</p>
            <button
              onClick={handleOpenModal}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Apply Now
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {loans.map((loan, index) => {
              const Icon = LOAN_ICONS[loan.loanType] || Banknote;
              return (
                <motion.div
                  key={loan.id}
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
                          {loan.loanType}
                        </h3>
                        <p className="text-xs text-navy-400">ID: {loan.id}</p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        STATUS_TINT[loan.status] || STATUS_TINT.PENDING
                      }`}
                    >
                      {loan.status}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="mb-6">
                    <p className="text-navy-600 text-sm mb-1">Loan Amount</p>
                    <p className="text-3xl font-bold text-navy-900">
                      {formatCurrency(loan.amount)}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="text-xs text-navy-500 mb-6 space-y-1">
                    <p>Applied: {formatDateTime(loan.createdDate)}</p>
                    {loan.startDate && <p>Started: {formatDateTime(loan.startDate)}</p>}
                    {loan.interestRate && <p>Interest Rate: {loan.interestRate}%</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => alert(`Reason: ${loan.reason}`)} // simplified details
                      className="flex-1 flex items-center justify-center gap-2 bg-navy-50 hover:bg-navy-100 text-navy-700 py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                      <Info className="w-4 h-4" />
                      Details
                    </motion.button>
                    {loan.status === 'ACTIVE' && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAskPayLoan(loan)}
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center gap-2 bg-teal-50 hover:bg-teal-100 text-teal-600 py-2 rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
                      >
                        <CreditCard className="w-4 h-4" />
                        Pay Loan
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Apply Loan Modal */}
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
                <h2 className="text-2xl font-bold text-navy-900 mb-6">Apply for a Loan</h2>

                {formError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 bg-rose-100 border border-rose-300 text-rose-700 px-4 py-3 rounded-lg text-sm"
                  >
                    {formError}
                  </motion.div>
                )}

                <form onSubmit={handleApplyForLoan} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-2">
                      Loan Type
                    </label>
                    <select
                      value={formData.loanType}
                      onChange={(e) =>
                        setFormData({ ...formData, loanType: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="PERSONAL">Personal</option>
                      <option value="HOME">Home</option>
                      <option value="CAR">Car</option>
                      <option value="EDUCATION">Education</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-2">
                      Amount
                    </label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      min="100"
                      step="0.01"
                      className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-2">
                      Reason
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) =>
                        setFormData({ ...formData, reason: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-navy-900 mb-2">
                      Target Account (for deposit)
                    </label>
                    <select
                      value={formData.accountId}
                      onChange={(e) =>
                        setFormData({ ...formData, accountId: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.accountNumber} ({a.type})</option>
                      ))}
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
                      {isSubmitting ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pay Loan Confirmation Modal */}
        <AnimatePresence>
          {payConfirm && (() => {
            const linkedAccount = accounts.find((a) => a.id === payConfirm.accountId)
              || payConfirm.account
              || null;
            const currentBalance = linkedAccount ? Number(linkedAccount.balance) : 0;
            const payAmount = Number(payConfirm.amount);
            const resultingBalance = currentBalance - payAmount;
            const insufficientFunds = linkedAccount && resultingBalance < 0;

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                onClick={handleCancelPayLoan}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white rounded-lg p-8 max-w-md w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-navy-900">Confirm Loan Payment</h2>
                      <p className="text-sm text-navy-600 mt-1">
                        Please review the details before proceeding.
                      </p>
                    </div>
                    <button
                      onClick={handleCancelPayLoan}
                      className="text-navy-400 hover:text-navy-600 transition-colors"
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="bg-navy-50 border border-navy-100 rounded-lg p-4 mb-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-navy-600">Loan ID</span>
                      <span className="font-medium text-navy-900">#{payConfirm.id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-navy-600">Loan Type</span>
                      <span className="font-medium text-navy-900 uppercase">{payConfirm.loanType}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-navy-600">Source Account</span>
                      <span className="font-mono font-medium text-navy-900">
                        {linkedAccount?.accountNumber || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-navy-600">Current Balance</span>
                      <span className="font-medium text-navy-900">{formatCurrency(currentBalance)}</span>
                    </div>
                  </div>

                  <div className="bg-rose-50 border border-rose-100 rounded-lg p-4 mb-6">
                    <p className="text-xs uppercase tracking-wide text-rose-600 mb-1">Amount to deduct</p>
                    <p className="text-3xl font-bold text-rose-700">−{formatCurrency(payAmount)}</p>
                    {linkedAccount && (
                      <p className="text-xs text-navy-600 mt-2">
                        Balance after payment: <span className="font-semibold">{formatCurrency(resultingBalance)}</span>
                      </p>
                    )}
                    {insufficientFunds && (
                      <p className="text-xs text-rose-700 mt-2 font-medium">
                        Insufficient funds in the source account.
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleCancelPayLoan}
                      className="flex-1 bg-navy-100 hover:bg-navy-200 text-navy-900 py-2 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmPayLoan}
                      disabled={isSubmitting || insufficientFunds}
                      className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white py-2 rounded-lg font-medium transition-colors"
                    >
                      {isSubmitting ? 'Processing...' : 'Confirm Payment'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>
    </div>
  );
};