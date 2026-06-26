import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingScreen } from './LoadingScreen';

// Restricts access to users whose role is included in `allowedRoles`.
// Unauthenticated users go to /login; authenticated-but-unauthorized users
// are redirected to /dashboard (or a custom `redirectTo`).
export const RoleProtectedRoute = ({ allowedRoles = [], redirectTo = '/dashboard', children }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};
