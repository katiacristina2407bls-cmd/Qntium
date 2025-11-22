import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Copy, 
  Share2, 
  Trophy, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2,
  UserPlus,
  Clock,
  ArrowUpRight,
  User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../lib/supabase';

interface ReferralProfile {
  id: string;
  full_name: string | null;
  created_at: string;
  onboarded: boolean;
  avatar_url: string | null;
}

export const Team: React.FC = () => {
  const { profile, user } = useAuth();
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<ReferralProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Use referral code if available, otherwise fallback to ID (though onboarding generates code now)
  const referralLink = profile?.referral_code 
    ? `${window.location.origin}/register?ref=${profile.referral_code}`
    : `${window.location.origin}/register?ref=${user?.id}`;

  useEffect(() => {
    const fetchReferrals = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, created_at, onboarded, avatar_url')
          .eq('referred_by', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (data) {
          setReferrals(data);
        }
      } catch (error) {
        console.error('Error fetching referrals', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReferrals();
  }, [user]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Quantium Investments',
          text: 'Junte-se a mim na Quantium e comece a investir no futuro!',
          url: referralLink,
        });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      handleCopy();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Determine the affiliate count to display: 
  // Prefer the length of the fetched list, but if empty, try the profile counter
  const affiliateCount = referrals.length > 0 ? referrals.length : (profile?.total_referrals || 0);

  return (
    <div className="animate-entry space-y-8 pb-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">{t('team_title')}</h2>
        <p className="text-gray-400">{t('team_subtitle')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Commission Balance */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[60px] -mr-10 -mt-10 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">{t('commission_balance')}</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">
              R$ {(profile?.commission_balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <div className="flex items-center gap-2 text-sm text-green-400 mt-2">
              <ArrowUpRight className="w-4 h-4" />
              <span>Disponível para saque</span>
            </div>
          </div>
        </div>

        {/* Total Affiliates */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 blur-[60px] -mr-10 -mt-10 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">{t('total_affiliates')}</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">
              {affiliateCount}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
              <UserPlus className="w-4 h-4" />
              <span>Novos membros esta semana</span>
            </div>
          </div>
        </div>

        {/* Performance/Rank */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-600/10 blur-[60px] -mr-10 -mt-10 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-400">
                <Trophy className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">{t('rank')}</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">
              {affiliateCount > 50 ? 'Gold' : affiliateCount > 10 ? 'Silver' : 'Bronze'}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
              <TrendingUp className="w-4 h-4" />
              <span>
                {affiliateCount > 50 
                  ? 'Nível máximo alcançado!' 
                  : affiliateCount > 10 
                    ? `${50 - affiliateCount} para Gold` 
                    : `${10 - affiliateCount} para Silver`}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Link & Invite */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-blue-900/20 to-[#0a0a0a] border border-blue-500/20 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">{t('invite_friends')}</h3>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Convide amigos para a Quantium e ganhe comissões sobre os depósitos e investimentos deles. Construa sua equipe e aumente seus rendimentos.
            </p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Seu Link de Afiliado</label>
                <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl p-2 pl-4">
                  <input 
                    type="text" 
                    readOnly 
                    value={referralLink}
                    className="bg-transparent border-none text-sm text-white w-full focus:outline-none text-ellipsis"
                  />
                  <button 
                    onClick={handleCopy}
                    className="p-2 hover:bg-white/10 rounded-lg text-blue-400 transition-colors"
                    title="Copiar"
                  >
                    {copied ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button 
                onClick={handleShare}
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" /> Compartilhar Link
              </button>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Regras de Comissão</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                <span>10% sobre o primeiro depósito ou investimento do indicado.</span>
              </li>
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                <span>3% sobre todos os demais depósitos ou investimentos.</span>
              </li>
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                <span>Pagamentos creditados instantaneamente no saldo de comissões.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Col: List */}
        <div className="lg:col-span-2">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden flex flex-col h-full min-h-[400px]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Seus Indicados</h3>
              <span className="text-xs bg-white/5 px-2 py-1 rounded text-gray-400">{affiliateCount} Total</span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500 p-8">
                  <Clock className="w-6 h-6 animate-spin" />
                  <span>Carregando equipe...</span>
                </div>
              ) : referrals.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500 p-8">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center opacity-50">
                    <Users className="w-8 h-8" />
                  </div>
                  <p>
                    {profile?.total_referrals && profile.total_referrals > 0 
                     ? 'Seus afiliados não estão visíveis no momento.' 
                     : 'Você ainda não tem indicados.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {referrals.map((ref) => (
                    <div key={ref.id} className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-800 to-gray-700 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                           {ref.avatar_url ? (
                             <img src={ref.avatar_url} alt={ref.full_name || 'User'} className="w-full h-full object-cover" />
                           ) : (
                             (ref.full_name || 'U').charAt(0)
                           )}
                        </div>
                        <div>
                          <p className="text-white font-medium group-hover:text-blue-400 transition-colors">
                            {ref.full_name || 'Usuário'}
                          </p>
                          <p className="text-xs text-gray-500">Membro desde {formatDate(ref.created_at)}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                         <div className="mb-1">
                           <span className={`text-xs px-2 py-0.5 rounded border ${
                             ref.onboarded 
                               ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                               : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                           }`}>
                             {ref.onboarded ? 'Ativo' : 'Pendente'}
                           </span>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};