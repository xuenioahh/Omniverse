import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { Toaster as SonnerToaster } from "sonner";
import ProtectedRoute from './components/ProtectedRoute';
import AppErrorBoundary from './components/AppErrorBoundary';

// Page imports
import AuthPage from './pages/AuthPage';
import MainLanding from './pages/MainLanding';
import Home from './pages/Home';
import VoiceSetup from './pages/VoiceSetup';
import VoiceChat from './pages/VoiceChat';
import VoiceReport from './pages/VoiceReport';
import Presentation from './pages/Presentation';
import PresentationAnalysis from './pages/PresentationAnalysis';
import PresentationFeedback from './pages/PresentationFeedback';
import PresentationPractice from './pages/PresentationPractice';
import PresentationReport from './pages/PresentationReport';
import Profile from './pages/Profile';
import VoiceHistory from './pages/VoiceHistory';
import PresentationHistory from './pages/PresentationHistory';
import AdminPage from './pages/AdminPage';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
          <p className="text-xs text-muted-foreground">Loading SpeakNow...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
  }

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<AuthPage />} />}>
        <Route path="/" element={<MainLanding />} />
        <Route path="/voice" element={<Home />} />
        <Route path="/voice/setup" element={<VoiceSetup />} />
        <Route path="/voice/chat" element={<VoiceChat />} />
        <Route path="/voice/report" element={<VoiceReport />} />
        <Route path="/presentation" element={<Presentation />} />
        <Route path="/presentation/analysis" element={<PresentationAnalysis />} />
        <Route path="/presentation/practice" element={<PresentationPractice />} />
        <Route path="/presentation/feedback" element={<PresentationFeedback />} />
        <Route path="/presentation/report" element={<PresentationReport />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/voice/history" element={<VoiceHistory />} />
        <Route path="/presentation/history" element={<PresentationHistory />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
          <SonnerToaster
            theme="dark"
            position="top-center"
            toastOptions={{
              style: {
                background: "rgba(30, 41, 59, 0.95)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#F1F5F9",
                borderRadius: "16px",
                backdropFilter: "blur(16px)",
              },
            }}
          />
        </QueryClientProvider>
      </AuthProvider>
    </AppErrorBoundary>
  )
}

export default App
