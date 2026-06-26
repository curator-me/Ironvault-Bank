import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ArrowLeftRight,
  TrendingUp,
  Calendar,
  Activity,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import client from '../api/client';
import { formatCurrency } from '../utils/formatters';
import { CountUp } from '../components/CountUp';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export const AdminSummaryDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminAccountValue, setAdminAccountValue] = useState(null);

  const loadSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await client.get('/admin/summary');
      setSummary(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-navy-600"></div>
      </div>
    );
  }

  const statCards = summary
    ? [
        {
          label: 'Total Accounts',
          value: summary.totalAccounts,
          icon: CreditCard,
          gradient: 'from-teal-500 to-teal-700',
          iconBg: 'bg-teal-400/20',
          format: (v) => Math.round(v).toLocaleString(),
        },
        {
          label: 'Total Users',
          value: summary.totalUsers,
          icon: Users,
          gradient: 'from-navy-700 to-navy-900',
          iconBg: 'bg-white/10',
          format: (v) => Math.round(v).toLocaleString(),
          subtitle: `${summary.activeUsers} active · ${summary.lockedUsers} locked`,
        },
        {
          label: 'Transactions (Last Month)',
          value: summary.transactionsLastMonth,
          icon: Calendar,
          gradient: 'from-indigo-500 to-indigo-700',
          iconBg: 'bg-indigo-400/20',
          format: (v) => Math.round(v).toLocaleString(),
          subtitle: `Volume: ${formatCurrency(summary.transactionVolumeLastMonth || 0)}`,
        },
        {
          label: 'Total Transactions',
          value: summary.totalTransactions,
          icon: ArrowLeftRight,
          gradient: 'from-amber-500 to-orange-600',
          iconBg: 'bg-amber-400/20',
          format: (v) => Math.round(v).toLocaleString(),
          subtitle: `Volume: ${formatCurrency(summary.totalTransactionVolume || 0)}`,
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-50 to-teal-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-navy-900 mb-2 flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-navy-600" />
              Admin Dashboard
            </h1>
            <p className="text-navy-600">System overview and key metrics at a glance</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadSummary}
            disabled={loading}
            className="flex items-center gap-2 bg-white border border-navy-200 hover:bg-navy-50 text-navy-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
        </motion.div>

        {/* Error */}
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

        {/* Summary Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                variants={itemVariants}
                className={`relative overflow-hidden bg-gradient-to-br ${card.gradient} text-white rounded-2xl p-6 shadow-lg`}
              >
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10">
                  <Icon className="h-28 w-28" />
                </div>
                <div className={`inline-flex p-2 rounded-xl ${card.iconBg} mb-4`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm font-medium text-white/80 mb-1">{card.label}</p>
                <p className="text-3xl font-bold tracking-tight">
                  <CountUp value={card.value} format={card.format} />
                </p>
                {card.subtitle && (
                  <p className="text-xs text-white/70 mt-2">{card.subtitle}</p>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Additional Insights Row */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Today's Activity */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-navy-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-teal-50 rounded-xl">
                  <Activity className="w-5 h-5 text-teal-600" />
                </div>
                <h2 className="text-lg font-bold text-navy-900">Today's Activity</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-navy-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <ArrowLeftRight className="w-5 h-5 text-navy-500" />
                    <span className="text-sm font-medium text-navy-700">Transactions Today</span>
                  </div>
                  <span className="text-lg font-bold text-navy-900">
                    {summary.transactionsToday.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-navy-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-teal-500" />
                    <span className="text-sm font-medium text-navy-700">Volume Today</span>
                  </div>
                  <span className="text-lg font-bold text-teal-700">
                    {formatCurrency(summary.transactionVolumeToday || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* User Breakdown */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-navy-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-50 rounded-xl">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-bold text-navy-900">User Overview</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-navy-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                    <span className="text-sm font-medium text-navy-700">Active Users</span>
                  </div>
                  <span className="text-lg font-bold text-teal-700">
                    {summary.activeUsers.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-navy-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                    <span className="text-sm font-medium text-navy-700">Locked Users</span>
                  </div>
                  <span className="text-lg font-bold text-rose-600">
                    {summary.lockedUsers.toLocaleString()}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-navy-500 mb-1">
                    <span>Account Health</span>
                    <span>
                      {summary.totalUsers > 0
                        ? Math.round((summary.activeUsers / summary.totalUsers) * 100)
                        : 100}
                      % active
                    </span>
                  </div>
                  <div className="w-full bg-navy-100 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${
                          summary.totalUsers > 0
                            ? (summary.activeUsers / summary.totalUsers) * 100
                            : 100
                        }%`,
                      }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.6 }}
                      className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Generated timestamp */}
        {summary?.generatedAt && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-xs text-navy-400 mt-8"
          >
            Data generated at{' '}
            {new Date(summary.generatedAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </motion.p>
        )}
      </div>
    </div>
  );
};
