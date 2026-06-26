import { motion } from 'framer-motion';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '../utils/formatters';

const TXN_META = {
  DEPOSIT: { icon: ArrowDownLeft, tint: 'bg-teal-50 text-teal-600', sign: '+' },
  WITHDRAWAL: { icon: ArrowUpRight, tint: 'bg-orange-50 text-orange-600', sign: '-' },
  TRANSFER: { icon: ArrowLeftRight, tint: 'bg-navy-100 text-navy-600', sign: '' },
};

const STATUS_BADGE = {
  COMPLETED: 'bg-teal-100 text-teal-700',
  PENDING: 'bg-amber-100 text-amber-700',
  FAILED: 'bg-rose-100 text-rose-700',
};

/**
 * Shared transactions table.
 *
 * Props:
 *  - transactions: array of transaction objects
 *  - onDownload?: (txn) => void  -> if provided, an extra "Statement" column is rendered
 *  - showId?: boolean (default true) -> show leading ID column (admin view)
 *  - showTxId?: boolean (default true) -> show the public transactionId column
 *  - emptyText?: string
 *  - pagination?: { page, totalPages, onPrev, onNext } (optional)
 *  - toFallback?: string (default '—') for missing To Account
 */
export const TransactionTable = ({
  transactions = [],
  onDownload,
  showId = true,
  showTxId = true,
  emptyText = 'No transactions found',
  pagination,
  toFallback = '—',
}) => {
  const columnCount =
    (showId ? 1 : 0) +
    (showTxId ? 1 : 0) +
    6 +
    (onDownload ? 1 : 0);

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
              {showId && (
                <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">
                  ID
                </th>
              )}
              {showTxId && (
                <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">
                  Transaction ID
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">
                From Account
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">
                To Account
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">
                Status
              </th>
              {onDownload && (
                <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase">
                  Statement
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-6 py-12 text-center">
                  <ArrowLeftRight className="w-12 h-12 text-navy-300 mx-auto mb-3" />
                  <p className="text-navy-600">{emptyText}</p>
                </td>
              </tr>
            ) : (
              transactions.map((txn, idx) => {
                const Meta = TXN_META[txn.type] || {
                  icon: ArrowLeftRight,
                  tint: 'bg-navy-100 text-navy-600',
                  sign: '',
                };
                const Icon = Meta.icon;
                return (
                  <motion.tr
                    key={txn.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-navy-50 transition-colors"
                  >
                    {showId && (
                      <td className="px-6 py-4 text-sm font-medium text-navy-900">
                        {txn.id}
                      </td>
                    )}
                    {showTxId && (
                      <td className="px-6 py-4 text-sm font-mono text-navy-700">
                        {txn.transactionId}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div
                        className={`flex items-center gap-2 ${Meta.tint} w-fit px-3 py-1 rounded-full`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{txn.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-navy-900">
                      {Meta.sign}
                      {formatCurrency(txn.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-navy-600 font-mono">
                      {txn.fromAccountNumber || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-navy-600 font-mono">
                      {txn.type === 'WITHDRAWAL'
                        ? 'N/A'
                        : txn.toAccountNumber || toFallback}
                    </td>
                    <td className="px-6 py-4 text-sm text-navy-600">
                      {formatDateTime(txn.timestamp)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          STATUS_BADGE[txn.status] || 'bg-navy-100 text-navy-700'
                        }`}
                      >
                        {txn.status}
                      </span>
                    </td>
                    {onDownload && (
                      <td className="px-6 py-4">
                        {txn.status === 'COMPLETED' ? (
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onDownload(txn)}
                            className="inline-flex items-center gap-2 bg-navy-50 hover:bg-navy-100 text-navy-700 px-3 py-1.5 rounded-lg font-medium transition-colors text-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Statement
                          </motion.button>
                        ) : (
                          <span className="text-xs text-navy-300">—</span>
                        )}
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

export default TransactionTable;