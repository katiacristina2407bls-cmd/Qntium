import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Partners } from './components/Partners';
import { Solutions } from './components/Solutions';
import { Markets } from './components/Markets';
import { PlatformPreview } from './components/PlatformPreview';
import { Features } from './components/Features';
import { About } from './components/About';
import { Footer } from './components/Footer';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { Onboarding } from './components/auth/Onboarding';
import { ForgotPassword } from './components/auth/ForgotPassword';
import { ResetPassword } from './components/auth/ResetPassword';
import { ConfirmAccount } from './components/auth/ConfirmAccount';
import { Dashboard } from './components/dashboard/Dashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Ban, AlertTriangle } from 'lucide-react';

type ViewState = 'landing' | 'login' | 'register' | 'confirm-account' | 'onboarding' | 'dashboard' | 'forgot-password' | 'update-password';

const AppContent: React.FC = () => {
  const { session, profile, loading, signOut, passwordRecoveryMode, setPasswordRecoveryMode, banData, setBanData } = useAuth();
  const [view, setView] = useState<ViewState>('landing');
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(false);

  // Effect to handle auto-routing based on auth state
  useEffect(() => {
    if (!loading) {
      if (passwordRecoveryMode) {
        setView('update-password');
        return;
      }

      if (session) {
        // If user just logged in (was in login view), go to confirmation
        if (view === 'login') {
          setView('confirm-account');
          return;
        }

        // If currently confirming, stay there waiting for user action
        if (view === 'confirm-account') {
          return;
        }

        // If user is logged in, check if they are onboarded
        if (profile?.onboarded) {
          if (view !== 'dashboard') setView('dashboard');
        } else {
          // If they have a session but not onboarded, send to onboarding
          if (view !== 'onboarding') setView('onboarding');
        }
      } else {
        // If not logged in, allow landing, login, register, or forgot-password
        // If current view is dashboard, onboarding, etc., kick to landing
        if (['dashboard', 'onboarding', 'update-password', 'confirm-account'].includes(view)) {
          setView('landing');
        }
      }
    }
  }, [session, profile, loading, passwordRecoveryMode, view]);

  // Navigation Handlers
  const navigateToLogin = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setView('login');
  };

  const navigateToRegister = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setView('register');
  };

  const navigateToHome = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setView('landing');
  };
  
  const navigateToForgotPassword = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setView('forgot-password');
  };

  const handleConfirmAccount = () => {
    if (profile?.onboarded) {
      setView('dashboard');
    } else {
      setView('onboarding');
    }
  };

  const handleCancelAccount = async () => {
    await signOut();
    setView('login');
  };

  const closeBanModal = () => {
    setBanData(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30 selection:text-blue-200 relative overflow-hidden">
      
      {/* Global Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Gradient Blobs - Hide on dashboard to keep it clean */}
        {view !== 'dashboard' && (
          <>
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-screen filter blur-[128px] opacity-40 animate-blob"></div>
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full mix-blend-screen filter blur-[128px] opacity-40 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-screen filter blur-[128px] opacity-40 animate-blob animation-delay-4000"></div>
          </>
        )}
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid opacity-40"></div>

        {/* Global Noise */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      {/* Content Layer */}
      <div className="relative z-10">
        
        {view === 'landing' && (
          <>
            <Navbar onLoginClick={navigateToLogin} />
            <main>
              <Hero />
              <Partners />
              <Solutions />
              <Markets />
              <PlatformPreview />
              <Features />
              <About />
            </main>
            <Footer />
          </>
        )}

        {view === 'login' && (
          <Login 
            onBack={navigateToHome}
            onRegisterClick={navigateToRegister}
            onForgotPasswordClick={navigateToForgotPassword}
            onLoginSuccess={() => {
              // Handled by AuthContext effect -> Confirm Account
            }}
          />
        )}

        {view === 'confirm-account' && (
          <ConfirmAccount 
            onConfirm={handleConfirmAccount}
            onCancel={handleCancelAccount}
          />
        )}

        {view === 'register' && (
          <Register 
            onBack={navigateToLogin}
            onLoginClick={navigateToLogin}
            onRegisterSuccess={() => {
              // Handled by AuthContext effect
            }}
          />
        )}

        {view === 'forgot-password' && (
          <ForgotPassword 
            onBack={navigateToLogin}
          />
        )}

        {view === 'update-password' && (
          <ResetPassword 
            onSuccess={() => {
              setPasswordRecoveryMode(false);
              // After this, the useEffect loop should catch the active session 
              // and redirect to Dashboard.
              setView('dashboard');
            }}
          />
        )}

        {view === 'onboarding' && (
          <Onboarding 
            onComplete={() => {
               setShowWelcomeAnimation(true);
               // Profile refresh will trigger redirect in useEffect
            }}
          />
        )}

        {view === 'dashboard' && (
          <Dashboard 
            onLogout={signOut}
            showWelcome={showWelcomeAnimation}
            onWelcomeDismiss={() => setShowWelcomeAnimation(false)}
          />
        )}

      </div>

      {/* Global Ban Modal */}
      {banData && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in" onClick={closeBanModal}></div>
          <div className="relative bg-[#0f0f0f] border border-red-500/30 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 p-6 overflow-hidden">
            {/* Background Effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-red-600/20 blur-[60px] pointer-events-none"></div>
            
            <div className="relative z-10 text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                {banData.status === 'banned' ? <Ban className="w-8 h-8 text-red-500" /> : <AlertTriangle className="w-8 h-8 text-yellow-500" />}
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">
                {banData.status === 'banned' ? 'Conta Banida' : 'Conta Suspensa'}
              </h3>
              
              <p className="text-gray-300 mb-6">
                 Sua conta foi {banData.status === 'banned' ? 'permanentemente banida' : 'temporariamente suspensa'} devido a violações dos nossos termos de uso.
              </p>
              
              {banData.reason && (
                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 mb-6 text-left">
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider block mb-1">Motivo:</span>
                  <p className="text-sm text-gray-300">{banData.reason}</p>
                </div>
              )}

              <button 
                onClick={closeBanModal}
                className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold rounded-xl transition-colors"
              >
                Entendi
              </button>
              
              <div className="mt-4 text-xs text-gray-500">
                Se você acha que isso é um erro, entre em contato com o suporte.
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;