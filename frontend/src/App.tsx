import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { InboxPage } from './pages/InboxPage';
import { MySpacesPage } from './pages/MySpacesPage';
import { SpaceDetailPage } from './pages/SpaceDetailPage';
import CompareProposalsPage from './pages/CompareProposalsPage';
import { VendorsPage } from './pages/VendorsPage';
import { SettingsPage } from './pages/SettingsPage';
import { GmailConnectedPage } from './pages/GmailConnectedPage';

function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/gmail-connected" element={<GmailConnectedPage />} />

          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/inbox" element={<InboxPage />} />
            <Route path="/myspaces" element={<MySpacesPage />} />
            <Route path="/spaces/:spaceId" element={<SpaceDetailPage />} />
            <Route path="/spaces/:spaceId/compare" element={<CompareProposalsPage />} />
            <Route path="/vendors" element={<VendorsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;

