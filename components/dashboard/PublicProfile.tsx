import React, { useState, useEffect } from 'react';
import { 
  User, 
  MapPin, 
  Calendar, 
  Share2, 
  Edit3, 
  ShieldCheck, 
  Trophy, 
  Users, 
  Star,
  CheckCircle2,
  Copy,
  Briefcase,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface PublicProfileProps {
  onEditProfile: () => void;
}

export const PublicProfile: React.FC<PublicProfileProps> = ({ onEditProfile }) => {
  const { profile, user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    referrals: 0,
    operations: 0,
    winRate: 0
  });

  const joinDate = new Date(user?.created_at || Date.now()).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric'
  });

  useEffect(() => {
    const fetchRealStats = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // 1. Get Real Referral Count
        const { count: referralCount, error: refError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('referred_by', user.id);

        if (refError) console.error('Error fetching referrals:', refError);

        // 2. Get Investment Stats (Operations & Win Rate)
        const { data: investments, error: invError } = await supabase
          .from('investments')
          .select('total_return_percent')
          .eq('user_id', user.id);

        if (invError) console.error('Error fetching investments:', invError);

        let totalOps = 0;
        let calculatedWinRate = 0;

        if (investments && investments.length > 0) {
          totalOps = investments.length;
          // Assume a "win" is any investment with return >= 0 or specifically > 0. 
          // Often in these apps, purely positive is a win.
          const wins = investments.filter(inv => inv.total_return_percent > 0).length;
          calculatedWinRate = Math.round((wins / totalOps) * 100);
        }

        setStats({
          referrals: referralCount || 0,
          operations: totalOps,
          winRate: calculatedWinRate
        });

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRealStats();
  }, [user]);

  const handleShare = () => {
    // In a real app, this would be a public URL like quantium.com/u/username
    // Using the referral link as the shareable profile link for now
    const url = `${window.location.origin}/register?ref=${profile?.referral_code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate rank based on REAL referrals
  const rank = stats.referrals > 50 ? 'Gold' : stats.referrals > 10 ? 'Silver' : 'Bronze';

  // Dynamic Badges based on real data
  const badges = [
    // Always show Verified if email is confirmed
    ...(user?.email_confirmed_at ? [{ 
      icon: <ShieldCheck className="w-5 h-5 text-blue-400" />, 
      label: "Verificado", 
      bg: "bg-blue-500/10 border-blue-500/20" 
    }] : []),
    
    // Show Early Adopter if joined in 2024 (or logic based on date)
    { 
      icon: <Star className="w-5 h-5 text-yellow-400" />, 
      label: "Membro Fundador", 
      bg: "bg-yellow-500/10 border-yellow-500/20" 
    },

    // Show "Investidor Pro" if has > 5 operations
    ...(stats.operations >= 5 ? [{ 
      icon: <Briefcase className="w-5 h-5 text-purple-400" />, 
      label: "Trader Ativo", 
      bg: "bg-purple-500/10 border-purple-500/20" 
    }] : []),

    // Show "Influencer" if > 5 referrals
    ...(stats.referrals >= 5 ? [{ 
      icon: <Trophy className="w-5 h-5 text-orange-400" />, 
      label: "Influencer", 
      bg: "bg-orange-500/10 border-orange-500/20" 
    }] : [])
  ];

  return (
    <div className="animate-entry max-w-4xl mx-auto pb-8">
      
      {/* Profile Card */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden relative group">
        
        {/* Banner Image */}
        <div className="h-48 w-full bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 relative">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#0a0a0a] to-transparent"></div>
        </div>

        {/* Profile Info Container */}
        <div className="px-8 pb-8 relative -mt-20">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            
            {/* Avatar & Basic Info */}
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
              <div className="w-32 h-32 rounded-full p-1 bg-[#0a0a0a] relative z-10">
                <div className="w-full h-full rounded-full bg-gray-800 overflow-hidden border-4 border-[#0a0a0a]">
                   {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800">
                        <User className="w-12 h-12 text-gray-400" />
                      </div>
                   )}
                </div>
                {user?.email_confirmed_at && (
                  <div className="absolute bottom-2 right-2 bg-blue-500 text-white p-1.5 rounded-full border-4 border-[#0a0a0a]" title="Verificado">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="text-center md:text-left mb-2">
                <h1 className="text-3xl font-bold text-white flex items-center gap-2 justify-center md:justify-start">
                  {profile?.full_name || 'Investidor'}
                  {user?.email_confirmed_at && <ShieldCheck className="w-5 h-5 text-blue-400" />}
                </h1>
                <p className="text-gray-400 font-medium">@{profile?.email?.split('@')[0]}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-3 justify-center md:justify-start">
                  <span className="flex items-center gap-1">
                     <Calendar className="w-4 h-4" /> Membro desde {joinDate}
                  </span>
                  <span className="flex items-center gap-1">
                     <MapPin className="w-4 h-4" /> Brasil
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-4 md:mt-20 w-full md:w-auto">
              <button 
                onClick={handleShare}
                className="flex-1 md:flex-none py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
                {copied ? 'Copiado!' : 'Compartilhar'}
              </button>
              <button 
                onClick={onEditProfile}
                className="flex-1 md:flex-none py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" /> Editar Perfil
              </button>
            </div>
          </div>

          {/* Bio / About */}
          <div className="mt-8 max-w-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Sobre</h3>
            <p className="text-gray-400 leading-relaxed">
              Entusiasta de investimentos e tecnologia. Focando em criptoativos e mercado de ações global. Buscando liberdade financeira através de estratégias inteligentes.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-center hover:bg-white/10 transition-colors">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Rank</div>
              <div className="text-xl font-bold text-white">{rank}</div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-center hover:bg-white/10 transition-colors">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Indicações</div>
              <div className="text-xl font-bold text-white">
                {loading ? '...' : stats.referrals}
              </div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-center hover:bg-white/10 transition-colors">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Operações</div>
              <div className="text-xl font-bold text-white">
                {loading ? '...' : stats.operations}
              </div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-center hover:bg-white/10 transition-colors">
              <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Win Rate</div>
              <div className={`text-xl font-bold ${stats.winRate >= 50 ? 'text-green-400' : 'text-yellow-400'}`}>
                {loading ? '...' : `${stats.winRate}%`}
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="mt-8">
            <h3 className="text-lg font-bold text-white mb-4">Conquistas</h3>
            <div className="flex flex-wrap gap-4">
              {badges.length > 0 ? badges.map((badge, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${badge.bg}`}>
                  {badge.icon}
                  <span className="font-medium text-white">{badge.label}</span>
                </div>
              )) : (
                <p className="text-sm text-gray-500">Nenhuma conquista desbloqueada ainda.</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Referral Section Preview */}
      <div className="mt-6 bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white">
             <Users className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white">Faça parte do meu time</h4>
            <p className="text-sm text-gray-400">Cadastre-se usando meu código e ganhe benefícios.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-lg">
           <span className="text-gray-400 text-sm">Código:</span>
           <span className="text-white font-mono font-bold">{profile?.referral_code || '...'}</span>
           <button 
             onClick={() => {
               navigator.clipboard.writeText(profile?.referral_code || '');
               setCopied(true);
               setTimeout(() => setCopied(false), 2000);
             }}
             className="ml-2 text-blue-400 hover:text-white transition-colors"
           >
             <Copy className="w-4 h-4" />
           </button>
        </div>
      </div>

    </div>
  );
};