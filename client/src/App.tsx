import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Shell from './layouts/shell';

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />
        <Route
          element={
            <Protected>
              <Shell />
            </Protected>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/about" element={<Dashboard />} />

          <Route path="/managers" element={<Dashboard />} />

          <Route path="/team-leads" element={<Dashboard />} />

          <Route path="/employees" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
