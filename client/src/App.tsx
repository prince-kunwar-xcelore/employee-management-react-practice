import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';

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
              {/* Replace with: <Login /> */}
              <Login />
            </PublicOnly>
          }
        />
        <Route
          path="/*"
          element={
            <Protected>
              {/* Replace with: <Dashboard /> */}
              <div>Dashboard</div>
            </Protected>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
