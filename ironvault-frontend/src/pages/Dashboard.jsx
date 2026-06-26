import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wallet,
  PiggyBank,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Plus,
  Send,
  Receipt,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import client from '../api/client';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { CountUp } from '../components/CountUp';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const QUICK_ACTIONS = [
  { key: 'deposit', label: 'Deposit', icon: Plus, accent: 'bg-teal-600 hover:bg-teal-500' },
  { key: 'withdraw', label: 'Withdraw', icon: ArrowUpRight, accent: 'bg-navy-700 hover:bg-navy-600' },
  { key: 'transfer', label: 'Transfer', icon: Send, accent: 'bg-navy-900 hover:bg-navy-950' },
];

const TXN_META = {
  DEPOSIT: { icon: ArrowDownLeft, tint: 'bg-teal-50 text-teal-600', sign: '+' },
  WITHDRAWAL: { icon: ArrowUpRight, tint: 'bg-orange-50 text-orange-600', sign: '-' },
  TRANSFER: { icon: ArrowLeftRight, tint: 'bg-navy-100 text-navy-600', sign: '' },
};

const STATUS_TINT = {
  ACTIVE: 'bg-teal-100 text-teal-700',
  SUSPENDED: 'bg-amber-100 text-amber-700',
  CLOSED: 'bg-rose-100 text-rose-700',
  COMPLETED: 'bg-teal-100 text-teal-700',
  PENDING: 'bg-amber-100 text-amber-700',
  FAILED: 'bg-rose-100 text-rose-700',
};

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [accountsRes, txnRes] = await Promise.all([
          client.get('/accounts'),
          client.get('/transactions', { params: { page: 0, size: 5 } }),
        ]);
        if (!active) return;
        setAccounts(Array.isArray(accountsRes.data) ? accountsRes.data : []);
        setTransactions(txnRes.data?.content ?? []);
      } catch {
        if (active) setError('We couldn\u2019t load your dashboard. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance ?? 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
          Welcome back, {user?.username || 'Valued Client'}
        </h1>
        <p className="text-navy-500 mt-1">Here is a secure summary of your accounts today.</p>
      </motion.div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Total balance hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-navy-900 to-navy-950 text-white rounded-2xl p-6 shadow-lg border border-navy-800 relative overflow-hidden mb-6"
      >
        <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 opacity-10">
          <Wallet className="h-40 w-40" />
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-navy-400 text-sm font-semibold tracking-wide uppercase">Total Balance</span>
          <Wallet className="h-6 w-6 text-teal-400" />
        </div>
        <div className="text-3xl sm:text-4xl font-bold tracking-tight">
          {loading ? <span className="text-navy-500">···</span> : <CountUp value={totalBalance} />}
        </div>
        <p className="text-xs text-navy-300 mt-2">
          Across {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
        </p>
      </motion.div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {QUICK_ACTIONS.map(({ key, label, icon: Icon, accent }) => (
          <motion.button
            key={key}
            onClick={() => navigate('/transactions', { state: { action: key } })}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            className={`flex items-center justify-center space-x-2 py-4 rounded-2xl text-white font-semibold shadow-sm transition-colors ${accent}`}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Accounts */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-navy-900 mb-4">Your Accounts</h2>
          {loading ? (
            <SkeletonGrid />
          ) : accounts.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No accounts yet"
              message="Open your first account to start banking with IronVault."
            />
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {accounts.map((account) => {
                const isSavings = account.type === 'SAVINGS';
                const TypeIcon = isSavings ? PiggyBank : Wallet;
                return (
                  <motion.div
                    key={account.id}
                    variants={itemVariants}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-navy-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="bg-navy-50 p-2 rounded-lg">
                          <TypeIcon className="h-5 w-5 text-navy-700" />
                        </div>
                        <span className="text-sm font-semibold text-navy-700 capitalize">
                          {account.type?.toLowerCase()}
                        </span>
                      </div>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_TINT[account.status] || 'bg-navy-100 text-navy-600'}`}
                      >
                        {account.status}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-navy-900">
                      <CountUp value={Number(account.balance ?? 0)} />
                    </div>
                    <p className="text-xs text-navy-400 mt-1 tracking-wider">
                      •••• {String(account.accountNumber || '').slice(-4)}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* Recent transactions */}
        <div>
          <h2 className="text-lg font-bold text-navy-900 mb-4">Recent Transactions</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-navy-200 overflow-hidden">
            {loading ? (
              <div className="p-5 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 bg-navy-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No transactions"
                message="Your recent activity will appear here."
                bare
              />
            ) : (
              <ul className="divide-y divide-navy-100">
                {transactions.map((txn) => {
                  const meta = TXN_META[txn.type] || TXN_META.TRANSFER;
                  const Icon = meta.icon;
                  return (
                    <li key={txn.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${meta.tint}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-navy-800 capitalize truncate">
                            {txn.type?.toLowerCase()}
                          </p>
                          <p className="text-xs text-navy-400">{formatDateTime(txn.timestamp)}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 pl-2">
                        <p className="text-sm font-semibold text-navy-900">
                          {meta.sign}{formatCurrency(Number(txn.amount ?? 0))}
                        </p>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_TINT[txn.status] || 'bg-navy-100 text-navy-600'}`}
                        >
                          {txn.status}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SkeletonGrid = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {Array.from({ length: 2 }).map((_, i) => (
      <div key={i} className="bg-white rounded-2xl p-5 border border-navy-200 shadow-sm">
        <div className="h-9 w-9 bg-navy-100 rounded-lg animate-pulse mb-4" />
        <div className="h-7 w-2/3 bg-navy-100 rounded animate-pulse mb-2" />
        <div className="h-3 w-1/3 bg-navy-100 rounded animate-pulse" />
      </div>
    ))}
  </div>
);

const EmptyState = ({ icon: Icon, title, message, bare = false }) => (
  <div className={bare ? 'p-8 text-center' : 'bg-white rounded-2xl p-8 text-center border border-navy-200 shadow-sm'}>
    <div className="inline-flex bg-navy-50 p-3 rounded-2xl mb-3">
      <Icon className="h-6 w-6 text-navy-400" />
    </div>
    <h3 className="text-sm font-semibold text-navy-800">{title}</h3>
    <p className="text-sm text-navy-400 mt-1">{message}</p>
  </div>
);
