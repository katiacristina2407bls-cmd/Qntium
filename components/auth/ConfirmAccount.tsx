import React from 'react';
import { User, CheckCircle2, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ConfirmAccountProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmAccount: React.FC<ConfirmAccountProps> = ({ onConfirm, onCancel }) => {
  const { user, profile } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative z-50">
      <div className="max-w-md w-full bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl relative animate-in fade-in zoom-in duration-300">
        
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20 shadow-[0_0_30px_rgba(37,99,235,0.2)]">
             {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
             ) : (
                <User className="w-10 h-10" />
             )}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Confirmar Conta</h2>
          <p className="text-gray-400">Verifique se esta é a conta que deseja acessar.</p>
        </div>

        <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-8">
            <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                    <ShieldCheck className="w-6 h-6 text-blue-400" />
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm text-gray-400">E-mail identificado</p>
                    <p className="text-white font-semibold truncate">{user?.email}</p>
                </div>
            </div>
        </div>

        <div className="space-y-3">
            <button 
                onClick={onConfirm}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
                <CheckCircle2 className="w-5 h-5" /> Confirmar e Acessar
            </button>
            
            <button 
                onClick={onCancel}
                className="w-full py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
            >
                <LogOut className="w-4 h-4" /> Não é minha conta
            </button>
        </div>

      </div>
    </div>
  );
};