import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProfileProvider, useProfile } from './contexts/ProfileContext';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Overview from './pages/Overview';
import AIAssistant from './pages/AIAssistant';
import BusinessHealth from './pages/BusinessHealth';
import Documents from './pages/Documents';
import FinanceTools from './pages/FinanceTools';
import Funding from './pages/Funding';
import FundingDetail from './pages/FundingDetail';
import Applications from './pages/Applications';
import Tasks from './pages/Tasks';
import Settings from './pages/Settings';
import CreateQR from './pages/CreateQR';
import LoadingScreen from './components/LoadingScreen';

/** Route guard — redirects unauthenticated users and handles onboarding */
function ProtectedRoutes() {
  const { user } = useAuth();
  const { hasCompletedOnboarding } = useProfile();

  if (!user) return <Navigate to="/login" replace />;
  if (!hasCompletedOnboarding) return <Navigate to="/onboarding" replace />;

  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Overview />} />
        <Route path="assistant" element={<AIAssistant />} />
        <Route path="health" element={<BusinessHealth />} />
        <Route path="documents" element={<Documents />} />
        <Route path="finance" element={<FinanceTools />} />
        <Route path="funding" element={<Funding />} />
        <Route path="funding/:id" element={<FundingDetail />} />
        <Route path="applications" element={<Applications />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="settings" element={<Settings />} />
        <Route path="create-qr" element={<CreateQR />} />
      </Route>
    </Routes>
  );
}

function AppRoutes() {
  const { user, loading: authLoading } = useAuth();
  const { hasCompletedOnboarding, loading: profileLoading } = useProfile();

  if (authLoading || (user && profileLoading)) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />
      <Route
        path="/onboarding"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : hasCompletedOnboarding ? (
            <Navigate to="/" replace />
          ) : (
            <Onboarding />
          )
        }
      />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProfileProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
