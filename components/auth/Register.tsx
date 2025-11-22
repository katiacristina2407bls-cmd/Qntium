import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface RegisterProps {
  onBack: () => void;
  onLoginClick: () => void;
  onRegisterSuccess: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onBack, onLoginClick, onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [strength, setStrength] = useState(0); // 0 to 4
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  // Capture referral code from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) setReferralCode(ref);
  }, []);

  // Calculate password strength
  useEffect(() => {
    const pass = formData.password;
    let score = 0;
    if (pass.length > 7) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    setStrength(score);
  }, [formData.password]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError(null);
  };

  // SendGrid Email Service via Supabase Edge Function
  const sendWelcomeEmail = async (email: string) => {
    try {
      // Invoke the 'send-welcome-email' Edge Function which uses SendGrid API
      // We pass a generic name since we don't collect it at register anymore
      const { error } = await supabase.functions.invoke('send-welcome-email', {
        body: { 
          email, 
          name: 'Investidor',
          subject: `Bem-vindo à Quantium!`
        }
      });

      if (error) {
        console.error('Failed to send welcome email:', error);
      }
    } catch (err) {
      console.error('Error invoking email service:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Por favor, insira um e-mail válido.');
      return;
    }

    // Password Length Validation
    if (formData.password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    // Password Match Validation
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      // 1. Register User in Supabase
      const { data, error: authError } = await (supabase.auth as any).signUp({
        email: formData.email,
        password: formData.password,
        options: {
          // Save the referral code in user_metadata for processing during onboarding
          data: {
            referral_code_signup: referralCode
          }
        }
      });

      if (authError) {
        throw authError;
      }

      // 2. Send Welcome Email
      await sendWelcomeEmail(formData.email);

      // If successful, the AuthContext in App.tsx will detect the session change
      onRegisterSuccess();
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao criar a conta.');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (strength === 0) return 'bg-gray-600';
    if (strength === 1) return 'bg-red-500';
    if (strength === 2) return 'bg-yellow-500';
    if (strength === 3) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = () => {
    if (strength === 0) return 'Vazia';
    if (strength === 1) return 'Fraca';
    if (strength === 2) return 'Média';
    if (strength === 3) return 'Forte';
    return 'Muito Forte';
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

        <div className="text-center mb-6 mt-4">
          <h2 className="text-3xl font-bold text-white mb-2">Criar Conta</h2>
          <p className="text-gray-400">Comece sua jornada de investimentos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">E-mail</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500" />
              </div>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500" />
              </div>
              <input 
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
                placeholder="••••••••"
              />
            </div>
            
            {/* Password Strength Meter */}
            {formData.password && (
              <div className="space-y-1 mt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Força da senha:</span>
                  <span className={`font-medium ${strength > 2 ? 'text-green-400' : 'text-gray-300'}`}>
                    {getStrengthLabel()}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ease-out ${getStrengthColor()}`} 
                    style={{ width: `${(strength === 0 ? 5 : strength * 25)}%` }}
                  ></div>
                </div>
                <div className="flex gap-2 mt-2 text-xs text-gray-500 flex-wrap">
                  <span className={formData.password.length >= 8 ? 'text-green-400' : ''}>• 8+ carateres</span>
                  <span className={/[A-Z]/.test(formData.password) ? 'text-green-400' : ''}>• Maiúscula</span>
                  <span className={/[0-9]/.test(formData.password) ? 'text-green-400' : ''}>• Número</span>
                  <span className={/[^A-Za-z0-9]/.test(formData.password) ? 'text-green-400' : ''}>• Especial</span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 ml-1">Confirmar Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ShieldCheck className={`h-5 w-5 ${formData.confirmPassword && formData.password === formData.confirmPassword ? 'text-green-500' : 'text-gray-500'}`} />
              </div>
              <input 
                type="password" 
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className={`w-full pl-10 pr-4 py-3 bg-white/5 border ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-500/50 focus:ring-red-500' : 'border-white/10 focus:ring-blue-500'} rounded-lg focus:ring-2 focus:border-transparent text-white placeholder-gray-500 transition-all`}
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Criando...' : 'Continuar'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-400">
          Já tem uma conta?{' '}
          <button 
            onClick={onLoginClick}
            className="text-blue-400 hover:text-blue-300 font-semibold hover:underline"
          >
            Fazer Login
          </button>
        </div>
      </div>
    </div>
  );
};