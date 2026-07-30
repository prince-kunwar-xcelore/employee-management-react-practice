import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Shell from './layouts/shell';
import About from './pages/About';
import Users from './pages/users';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme/theme-provider';

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
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
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
            <Route path="/about" element={<About />} />

            <Route path="/managers" element={<Users role="manager" />} />

            <Route path="/team-leads" element={<Users role="team_lead" />} />

            <Route path="/employees" element={<Users role="employee" />} />
          </Route>
        </Routes>
        <Toaster richColors />
      </BrowserRouter>
    </ThemeProvider>
  );
}
