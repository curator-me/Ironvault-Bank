import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Banknote, AlertCircle, Check, X, ArrowDownCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import client from '../api/client';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export const EmployeeLoans = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadLoans = async (filter = '') => {
    setLoading(true);
    setError('');
    try {
      const params = { size: 100 };
      if (filter) {
        params.status = filter;
      }
      const res = await client.get('/employee/loans', { params });
      setLoans(res.data?.content || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoans(statusFilter);
  }, [statusFilter]);

  const handleUpdateStatus = async (loanId, newStatus) => {
    setIsSubmitting(true);
    try {
      await client.put(`/employee/loans/${loanId}/status`, null, { params: { status: newStatus } });
      setLoans(loans.map((l) => (l.id === loanId ? { ...l, status: newStatus } : l)));
    } catch (err) {
      setError(err.response?.data?.message || `Failed to update loan status`);
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeposit = async (loanId) => {
    setIsSubmitting(true);
    try {
      await client.post(`/employee/loans/${loanId}/deposit`);
      setLoans(loans.map((l) => (l.id === loanId ? { ...l, status: 'ACTIVE' } : l)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deposit loan amount');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && loans.length === 0) {
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
          className="mb-8 flex justify-between items-end"
        >
          <div>
            <h1 className="text-3xl font-bold text-navy-900 mb-2">Loan Applications</h1>
            <p className="text-navy-600">Review and manage customer loan applications (Last 100)</p>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved (Not Funded)</option>
              <option value="ACTIVE">Active</option>
              <option value="CLOSED">Closed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
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

        {/* Loans Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-lg border border-navy-100 shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-navy-50 border-b border-navy-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {loans.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <Banknote className="w-12 h-12 text-navy-300 mx-auto mb-3" />
                      <p className="text-navy-600">No loans found</p>
                    </td>
                  </tr>
                ) : (
                  loans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-navy-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-navy-900">{loan.id}</td>
                      <td className="px-6 py-4 text-sm font-medium text-navy-900">{loan.customerId}</td>
                      <td className="px-6 py-4 text-sm text-navy-600">{loan.loanType}</td>
                      <td className="px-6 py-4 text-sm font-medium text-navy-900">{formatCurrency(loan.amount)}</td>
                      <td className="px-6 py-4 text-sm text-navy-600 truncate max-w-[200px]" title={loan.reason}>{loan.reason}</td>
                      <td className="px-6 py-4 text-sm text-navy-600">{formatDateTime(loan.createdDate)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          loan.status === 'ACTIVE' ? 'bg-teal-100 text-teal-700' : 
                          loan.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                          loan.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 
                          loan.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                          'bg-navy-100 text-navy-700'
                        }`}>
                          {loan.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {loan.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateStatus(loan.id, 'APPROVED')}
                              disabled={isSubmitting}
                              className="p-1 rounded text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                              title="Approve"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(loan.id, 'REJECTED')}
                              disabled={isSubmitting}
                              className="p-1 rounded text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                              title="Reject"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                        {loan.status === 'APPROVED' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDeposit(loan.id)}
                              disabled={isSubmitting}
                              className="p-1 rounded text-teal-600 hover:bg-teal-50 transition-colors disabled:opacity-50 flex items-center gap-1"
                              title="Deposit Funds"
                            >
                              <ArrowDownCircle className="w-5 h-5" />
                              <span className="text-xs font-medium">Deposit</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
