import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Admin = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="bg-white rounded-2xl p-8 shadow-sm border border-navy-200"
      >
        <div className="flex items-center space-x-3 mb-3">
          <div className="bg-navy-900 p-2.5 rounded-xl">
            <ShieldCheck className="h-6 w-6 text-teal-400" />
          </div>
          <h1 className="text-2xl font-bold text-navy-900">Admin Console</h1>
        </div>
        <p className="text-navy-500">
          Restricted area for administrators. Signed in as{' '}
          <span className="font-semibold text-navy-700">{user?.email}</span> ({user?.role}).
        </p>
      </motion.div>
    </div>
  );
};
