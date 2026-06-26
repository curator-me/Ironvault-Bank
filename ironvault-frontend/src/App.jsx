import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleProtectedRoute } from './components/RoleProtectedRoute';
import { LoadingScreen } from './components/LoadingScreen';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Accounts } from './pages/Accounts';
import { Loans } from './pages/Loans';
import { Transactions } from './pages/Transactions';
import { AdminSummaryDashboard } from './pages/AdminSummaryDashboard';
import { AdminUserDashboard } from './pages/AdminUserDashboard';
import { AdminEmployeeDashboard } from './pages/AdminEmployeeDashboard';
import { AdminAccountsDashboard } from './pages/AdminAccountsDashboard';
import { AdminTransactionsDashboard } from './pages/AdminTransactionsDashboard';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { EmployeeLoans } from './pages/EmployeeLoans';
import { AdminAuditLog } from './pages/AdminAuditLog';
import { EmployeeAuditLog } from './pages/EmployeeAuditLog';
import EmployeeTransactions from './pages/EmployeeTransaction';

// Redirects already-authenticated users away from auth pages.
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, role } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'EMPLOYEE') return <Navigate to="/employee/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppContent = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-navy-50">
      {isAuthenticated && <Navbar />}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        {/* Public Routes End */}

        {/* Admin Routes starting with /admin */}
        <Route
          path="/admin/dashboard"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN']}>
              <AdminSummaryDashboard />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/admin/customers"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN']}>
              <AdminUserDashboard />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/admin/employees"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN']}>
              <AdminEmployeeDashboard />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/admin/accounts"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN']}>
              <AdminAccountsDashboard />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/admin/transactions"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN']}>
              <AdminTransactionsDashboard />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/admin/audit-logs"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN']}>
              <AdminAuditLog />
            </RoleProtectedRoute>
          }
        />
        {/* Admin Routes End */}

        {/* User Routes starting with / */}
        <Route
          path="/dashboard"
          element={
            <RoleProtectedRoute allowedRoles={['CUSTOMER']}>
              <Dashboard />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/accounts"
          element={
            <RoleProtectedRoute allowedRoles={['CUSTOMER']}>
              <Accounts />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/loans"
          element={
            <RoleProtectedRoute allowedRoles={['CUSTOMER']}>
              <Loans />
            </RoleProtectedRoute>
          }
        />  

        <Route
          path="/transactions"
          element={
            <RoleProtectedRoute allowedRoles={['CUSTOMER']}>
              <Transactions />
            </RoleProtectedRoute>
          }
        />
        {/* User Routes End */}

        {/* Employee Routes starting with /employee */}
        <Route
          path="/employee/dashboard"
          element={
            <RoleProtectedRoute allowedRoles={['EMPLOYEE']}>
              <EmployeeDashboard />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/employee/loans"
          element={
            <RoleProtectedRoute allowedRoles={['EMPLOYEE']}>
              <EmployeeLoans />
            </RoleProtectedRoute>
          }
        />  

        <Route
          path="/employee/audit-logs"
          element={
            <RoleProtectedRoute allowedRoles={['EMPLOYEE']}>
              <EmployeeAuditLog />
            </RoleProtectedRoute>
          }
        /> 

        <Route
          path="/employee/transactions"
          element={
            <RoleProtectedRoute allowedRoles={['EMPLOYEE']}>
              <EmployeeTransactions />
            </RoleProtectedRoute>
          }
        /> 

        {/* Employee Routes End */}

        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
