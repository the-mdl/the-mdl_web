import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './providers/auth';
import { AccountLayout } from './components/layout';
import { LandingPage } from './pages/landing';
import { LoginPage } from './pages/login';
import { ProfilePage } from './pages/profile';
import { ExportPage } from './pages/export';
import { DeletePage } from './pages/delete';
import { DownloadPage } from './pages/download';
import './app.css';

/* ---------- auth guard ---------- */
function RequireAuth() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-drift-bg flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-drift-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/account" replace />;
  }

  return <Outlet />;
}

/* ---------- redirect-if-authed wrapper for login ---------- */
function PublicOnly() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/account/profile" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/download" element={<DownloadPage />} />

          {/* Login — redirects if already authed */}
          <Route element={<PublicOnly />}>
            <Route path="/account" element={<LoginPage />} />
          </Route>

          {/* Auth-guarded account routes */}
          <Route element={<RequireAuth />}>
            <Route element={<AccountLayout />}>
              <Route path="/account/profile" element={<ProfilePage />} />
              <Route path="/account/export" element={<ExportPage />} />
              <Route path="/account/delete" element={<DeletePage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
