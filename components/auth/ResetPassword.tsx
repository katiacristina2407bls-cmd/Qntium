import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ResetPasswordProps {
  onSuccess: () => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strength, setStrength] = useState(0);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    const pass = formData.password;
    let score = 0;
    if (pass.length > 7) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    setStrength(score);
  }, [formData.password]);

  const getStrengthColor = () => {
    if (strength === 0) return 'bg-gray-600';
    if (strength === 1) return 'bg-red-500';
    if (strength === 2) return 'bg-yellow-500';
    if (strength === 3) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await (supabase.auth as any).updateUser({
        password: formData.password
      });

      if (error) throw error;

      setSuccessMsg(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Falha ao redefinir a senha.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative z-50">
      <div className="max-w-md w-full bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl relative">
        <div className="text-center mb-8 mt-4">
          <h2 className="text-3xl font-bold text-white mb-2">Nova Senha</h2>
          <p className="text-gray-400">Defina sua nova senha de acesso</p>
        </div>

        {successMsg ? (
           <div className="py-10 flex flex-col items-center text-center animate-in fade-in zoom-in">
             <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4 border border-green-500/20">
               <CheckCircle2 className="w-8 h-8" />
             </div>
             <h3 className="text-xl font-bold text-white mb-2">Senha atualizada!</h3>
             <p className="text-gray-400">Redirecionando para o painel...</p>
           </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 ml-1">Nova Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input 
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
              
              {formData.password && (
                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden mt-2">
                  <div 
                    className={`h-full transition-all duration-500 ease-out ${getStrengthColor()}`} 
                    style={{ width: `${(strength === 0 ? 5 : strength * 25)}%` }}
                  ></div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 ml-1">Confirmar Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ShieldCheck className={`h-5 w-5 ${formData.confirmPassword && formData.password === formData.confirmPassword ? 'text-green-500' : 'text-gray-500'}`} />
                </div>
                <input 
                  type="password" 
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  required
                  className={`w-full pl-10 pr-4 py-3 bg-white/5 border ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'border-red-500/50 focus:ring-red-500' : 'border-white/10 focus:ring-blue-500'} rounded-lg focus:ring-2 focus:border-transparent text-white placeholder-gray-500 transition-all`}
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
              {loading ? 'Atualizando...' : 'Redefinir Senha'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};