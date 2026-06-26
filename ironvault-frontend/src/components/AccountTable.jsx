import { motion } from 'framer-motion';
import { Wallet, PiggyBank, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../utils/formatters';

const ACCOUNT_ICONS = {
  CHECKING: Wallet,
  SAVINGS: PiggyBank,
};

const STATUS_BADGE = {
  ACTIVE: 'bg-teal-100 text-teal-700',
  SUSPENDED: 'bg-amber-100 text-amber-700',
  CLOSED: 'bg-rose-100 text-rose-700',
};

const STATUS_BADGE_FALLBACK = 'bg-navy-100 text-navy-700';

/**
 * Shared accounts table.
 *
 * Props:
 *  - accounts: array
 *  - variant: 'admin' (shows customer name) | 'employee' (shows customer id + created date) | 'minimal' (just ID, Number, Type, Balance, Status)
 *  - emptyText?: string
 *  - pagination?: { page, totalPages, onPrev, onNext } (optional)
 *  - showSearch?: boolean (optional, unused here — search lives in the page)
 */
export const AccountTable = ({
  accounts = [],
  variant = 'admin',
  emptyText = 'No accounts found',
  pagination,
}) => {
  const isEmployee = variant === 'employee';

  return (
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
              <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">Account Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">Balance</th>
              {isEmployee ? (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">Customer ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">Created</th>
                </>
              ) : (
                <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">Customer</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={isEmployee ? 7 : 6} className="px-6 py-12 text-center">
                  <Wallet className="w-12 h-12 text-navy-300 mx-auto mb-3" />
                  <p className="text-navy-600">{emptyText}</p>
                </td>
              </tr>
            ) : (
              accounts.map((account, idx) => {
                const Icon = ACCOUNT_ICONS[account.type];
                return (
                  <motion.tr
                    key={account.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-navy-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-navy-900">
                      {account.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-navy-900 font-mono">
                      {account.accountNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-teal-100 p-1.5 rounded">
                          {Icon && <Icon className="w-4 h-4 text-teal-600" />}
                        </div>
                        <span className="text-sm text-navy-600">{account.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          STATUS_BADGE[account.status] || STATUS_BADGE_FALLBACK
                        }`}
                      >
                        {account.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-navy-900">
                      {formatCurrency(account.balance)}
                    </td>
                    {isEmployee ? (
                      <>
                        <td className="px-6 py-4 text-sm text-navy-600">{account.userId}</td>
                        <td className="px-6 py-4 text-sm text-navy-600">
                          {formatDateTime(account.createdDate)}
                        </td>
                      </>
                    ) : (
                      <td className="px-6 py-4 text-sm text-navy-600">
                        {account.customerName || 'N/A'}
                      </td>
                    )}
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="border-t border-navy-100 px-6 py-4 flex items-center justify-between">
          <button
            onClick={pagination.onPrev}
            disabled={pagination.page === 0}
            className="flex items-center gap-2 bg-navy-100 hover:bg-navy-200 disabled:bg-navy-50 text-navy-900 disabled:text-navy-400 px-3 py-2 rounded-lg transition-colors text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="text-sm text-navy-600">
            Page {pagination.page + 1} of {pagination.totalPages}
          </span>
          <button
            onClick={pagination.onNext}
            disabled={pagination.page >= pagination.totalPages - 1}
            className="flex items-center gap-2 bg-navy-100 hover:bg-navy-200 disabled:bg-navy-50 text-navy-900 disabled:text-navy-400 px-3 py-2 rounded-lg transition-colors text-sm"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default AccountTable;