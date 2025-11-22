import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface LoginProps {
  onBack: () => void;
  onRegisterClick: () => void;
  onLoginSuccess: () => void;
  onForgotPasswordClick: () => void;
}

export const Login: React.FC<LoginProps> = ({ onBack, onRegisterClick, onLoginSuccess, onForgotPasswordClick }) => {
  const { setBanData } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setBanData(null);

    try {
      // Cast to any to avoid TS errors if types are outdated
      const { error } = await (supabase.auth as any).signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // The AuthContext onAuthStateChange listener will handle profile fetching, 
      // ban checking, and redirecting.
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Falha ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative z-50">
      <div className="max-w-md w-full bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl relative">
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center mb-8 mt-4">
          <h2 className="text-3xl font-bold text-white mb-2">Bem-vindo de volta</h2>
          <p className="text-gray-400">Acesse sua conta para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">E-mail</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500" />
              </div>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-medium text-gray-300">Senha</label>
              <button 
                type="button"
                onClick={onForgotPasswordClick}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Esqueceu a senha?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500" />
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-400">
          Não tem uma conta?{' '}
          <button 
            onClick={onRegisterClick}
            className="text-blue-400 hover:text-blue-300 font-semibold hover:underline"
          >
            Criar conta
          </button>
        </div>
      </div>
    </div>
  );
};