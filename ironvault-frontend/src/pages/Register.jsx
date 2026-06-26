import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Landmark, ShieldAlert, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthField } from '../components/AuthField';
import { validateAuthForm, MIN_PASSWORD_LENGTH } from '../utils/validation';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errors = validateAuthForm({ email, password });
    if (password && confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    const result = await register(email.trim(), password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-navy-50">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-navy-200"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="bg-navy-900 p-3 rounded-2xl mb-3 shadow-md">
            <Landmark className="h-8 w-8 text-teal-400" />
          </div>
          <h2 className="text-2xl font-bold text-navy-900">Create your IronVault account</h2>
          <p className="text-navy-500 text-sm mt-1">Get started with secure online banking</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-center space-x-2"
          >
            <ShieldAlert className="h-5 w-5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <AuthField
            id="email"
            label="Email"
            type="email"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            error={fieldErrors.email}
          />

          <AuthField
            id="password"
            label="Password"
            type="password"
            icon={Lock}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            error={fieldErrors.password}
          />

          <AuthField
            id="confirmPassword"
            label="Confirm password"
            type="password"
            icon={Lock}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            error={fieldErrors.confirmPassword}
          />

          <p className="text-xs text-navy-400">
            Use at least {MIN_PASSWORD_LENGTH} characters with a valid email address.
          </p>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-navy-900 hover:bg-navy-950 text-white rounded-xl font-semibold shadow-md transition-colors flex justify-center items-center text-sm disabled:opacity-75"
          >
            {loading ? 'Creating account...' : 'Register'}
          </motion.button>
        </form>

        <div className="mt-6 text-center text-sm text-navy-500">
          Already have an account?{' '}
          <Link to="/login" className="text-teal-600 hover:text-teal-500 font-semibold">
            Sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
