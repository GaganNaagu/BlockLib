import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { AccessDeniedPage } from './pages/auth/AccessDeniedPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminBooksPage } from './pages/admin/AdminBooksPage';
import { AdminMembersPage } from './pages/admin/AdminMembersPage';
import { AdminLendingPage } from './pages/admin/AdminLendingPage';
import { AdminReservationsPage } from './pages/admin/AdminReservationsPage';
import { AdminFinesPage } from './pages/admin/AdminFinesPage';
import { AdminTransactionsPage } from './pages/admin/AdminTransactionsPage';
import { StudentDashboardPage } from './pages/student/StudentDashboardPage';
import { StudentCataloguePage } from './pages/student/StudentCataloguePage';
import { StudentLoansPage } from './pages/student/StudentLoansPage';
import { StudentReservationsPage } from './pages/student/StudentReservationsPage';
import { StudentFinesPage } from './pages/student/StudentFinesPage';
import { StudentTransactionsPage } from './pages/student/StudentTransactionsPage';

function RootRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/student'} replace />;
}

export function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/access-denied" element={<AccessDeniedPage />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/books"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminBooksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/members"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminMembersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/lending"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminLendingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reservations"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminReservationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/fines"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminFinesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/transactions"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminTransactionsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/catalogue"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentCataloguePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/loans"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentLoansPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/reservations"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentReservationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/fines"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentFinesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/transactions"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentTransactionsPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </WalletProvider>
    </AuthProvider>
  );
}

export default App;
