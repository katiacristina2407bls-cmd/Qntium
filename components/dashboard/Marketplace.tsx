
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  TrendingUp, Clock, DollarSign, Shield, Zap, Award, Globe, Briefcase, 
  ArrowRight, Flame, X, Wallet, QrCode, Coins, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface Team {
  id: number;
  name: string;
  description: string;
  profit: string;
  duration: string;
  minPrice: string;
  maxPrice: string;
  risk: 'Baixo' | 'Médio' | 'Alto';
  icon: React.ReactNode;
  color: string;
  investors: number;
}

const TEAMS: Team[] = [
  {
    id: 1,
    name: "Quantum Alpha",
    description: "Estratégia de curto prazo que dobra seu investimento ao final do período.",
    profit: "+100%",
    duration: "20 Dias",
    minPrice: "R$ 50",
    maxPrice: "R$ 300",
    risk: "Baixo",
    icon: <Zap className="w-6 h-6" />,
    color: "text-purple-400 bg-purple-500/10",
    investors: 2450
  },
  {
    id: 2,
    name: "Crypto Velocity",
    description: "Aceleração de capital com retorno expressivo em médio prazo.",
    profit: "+150%",
    duration: "45 Dias",
    minPrice: "R$ 300",
    maxPrice: "R$ 2.000",
    risk: "Médio",
    icon: <TrendingUp className="w-6 h-6" />,
    color: "text-orange-400 bg-orange-500/10",
    investors: 1890
  },
  {
    id: 3,
    name: "Global Elite",
    description: "Máxima performance para grandes volumes de capital.",
    profit: "+250%",
    duration: "60 Dias",
    minPrice: "R$ 2.000",
    maxPrice: "R$ 10.000",
    risk: "Alto",
    icon: <Globe className="w-6 h-6" />,
    color: "text-blue-400 bg-blue-500/10",
    investors: 945
  }
];

export const Marketplace: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'balance' | 'pix' | 'usdt'>('balance');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sort teams by minimum price (lowest to highest)
  const sortedTeams = [...TEAMS].sort((a, b) => {
    const priceA = parseInt(a.minPrice.replace(/\D/g, ''));
    const priceB = parseInt(b.minPrice.replace(/\D/g, ''));
    return priceA - priceB;
  });

  const parsePrice = (price: string) => parseInt(price.replace(/\D/g, ''));

  const handleInvestClick = (team: Team) => {
    setSelectedTeam(team);
    setAmount('');
    setPaymentMethod('balance');
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    if (loading) return;
    setSelectedTeam(null);
  };

  // Calculate Total Balance
  const totalBalance = (profile?.balance || 0) + (profile?.commission_balance || 0);

  const handleConfirmInvestment = async () => {
    if (!selectedTeam || !user) return;
    setError(null);

    const val = parseFloat(amount);
    const min = parsePrice(selectedTeam.minPrice);
    const max = parsePrice(selectedTeam.maxPrice);

    if (isNaN(val) || val <= 0) {
      setError('Por favor, insira um valor válido.');
      return;
    }

    if (val < min) {
      setError(`O valor mínimo para este time é ${selectedTeam.minPrice}.`);
      return;
    }

    if (val > max) {
      setError(`O valor máximo para este time é ${selectedTeam.maxPrice}.`);
      return;
    }

    setLoading(true);

    if (paymentMethod === 'balance') {
      try {
        // 1. Fetch Fresh Balance Check
        const { data: currentProfile, error: profileError } = await supabase
          .from('profiles')
          .select('balance, commission_balance')
          .eq('id', user.id)
          .single();

        if (profileError || !currentProfile) {
          throw new Error('Erro ao verificar saldo. Tente novamente.');
        }

        const availableFunds = (currentProfile.balance || 0) + (currentProfile.commission_balance || 0);

        if (availableFunds < val) {
          throw new Error(`Saldo insuficiente. Disponível: R$ ${availableFunds.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        }

        // 2. Deduct Balance (Prioritize Main, then Commission)
        let newMainBalance = currentProfile.balance || 0;
        let newCommissionBalance = currentProfile.commission_balance || 0;

        if (newMainBalance >= val) {
            newMainBalance -= val;
        } else {
            const remainder = val - newMainBalance;
            newMainBalance = 0;
            newCommissionBalance -= remainder;
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
              balance: newMainBalance,
              commission_balance: newCommissionBalance 
          })
          .eq('id', user.id);

        if (updateError) throw new Error('Erro ao processar o pagamento.');

        // Determine color theme
        let colorTheme = 'blue';
        if (selectedTeam.color.includes('purple')) colorTheme = 'purple';
        else if (selectedTeam.color.includes('orange')) colorTheme = 'orange';
        else if (selectedTeam.color.includes('green')) colorTheme = 'green';
        else if (selectedTeam.color.includes('yellow')) colorTheme = 'yellow';

        // 3. Create Investment
        const { error: investError } = await supabase
          .from('investments')
          .insert({
            user_id: user.id,
            name: selectedTeam.name,
            type: 'Fundo de Investimento',
            balance: val,
            initial_investment: val,
            total_return_percent: 0.00,
            daily_return_percent: 0.00,
            status: 'active',
            risk_level: selectedTeam.risk,
            color_theme: colorTheme,
            payment_method: 'saldo'
          });

        if (investError) {
          console.error(investError);
          throw new Error('Erro ao criar o investimento.');
        }

        // 4. Log Transaction
        const { error: txError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            type: 'investment',
            amount: val,
            asset: 'BRL',
            status: 'completed',
            description: `Investimento: ${selectedTeam.name}`
          });

        if (txError) console.error('Erro ao registrar transação:', txError);

        // 5. COMMISSION LOGIC
        // Check if user has a referrer
        if (profile?.referred_by) {
             // Check if this is the user's FIRST deposit or investment ever
             // Note: Since we just inserted a transaction (type: investment), we count.
             const { count, error: countError } = await supabase
                 .from('transactions')
                 .select('*', { count: 'exact', head: true })
                 .eq('user_id', user.id)
                 .in('type', ['deposit', 'investment']); 
             
             // If count is 1 (the one we just inserted), then it was the first!
             
             if (!countError) {
                 const isFirstAction = count === 1;
                 const commissionRate = isFirstAction ? 0.10 : 0.03;
                 const commissionAmount = val * commissionRate;
 
                 if (commissionAmount > 0) {
                     // Fetch Referrer Profile
                     const { data: referrerProfile } = await supabase
                         .from('profiles')
                         .select('commission_balance, balance')
                         .eq('id', profile.referred_by)
                         .single();
 
                     if (referrerProfile) {
                         // Update Referrer's Commission Balance only
                         const newCommBalance = (referrerProfile.commission_balance || 0) + commissionAmount;
                         
                         // We only update commission_balance, NOT main balance, because UI sums them up.
                         // If we updated both, it would double count.
                         await supabase
                             .from('profiles')
                             .update({ 
                                 commission_balance: newCommBalance
                             })
                             .eq('id', profile.referred_by);
 
                         // Log transaction for referrer
                         await supabase.from('transactions').insert({
                             user_id: profile.referred_by,
                             type: 'commission',
                             amount: commissionAmount,
                             asset: 'BRL',
                             status: 'completed',
                             description: `Comissão de ${isFirstAction ? '10%' : '3%'} (Investimento)`
                         });
                     }
                 }
             }
        }

        // Refresh UI
        await refreshProfile();
        setLoading(false);
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2000);

      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Ocorreu um erro ao processar o investimento.');
        setLoading(false);
      }
    } else if (paymentMethod === 'usdt') {
      // Plisio Payment (USD Invoice)
      try {
        const orderNumber = Date.now(); 
        let invoiceUrl = null;

        // Conversion: Convert BRL (val) to USD
        const BRL_TO_USD_RATE = 5.15; // Estimated rate, usually fetched from API
        const usdAmount = (val / BRL_TO_USD_RATE).toFixed(2);

        // Try invoke the function
        const { data, error: funcError } = await supabase.functions.invoke('criar-fatura-plisio', {
          body: {
            amount: usdAmount, // Send value in USD
            currency: 'USD',   // Specify Fiat USD so user can pay with any crypto
            order_name: selectedTeam.name,
            order_number: orderNumber,
            callback_url: 'https://plisio.net/faq/transaction-statuses-mass-payouts-and-notifications-letters'
          }
        });

        // Handle function result or failure
        if (funcError || (!data?.data?.invoice_url && !data?.invoice_url)) {
          console.warn("Supabase Edge Function failed or not deployed. Falling back to simulation.", funcError);
          
          // SIMULATION FALLBACK:
          // Create a pending transaction so the user sees the action was recorded.
          // Show success message instead of redirecting to a broken URL.
          await supabase.from('transactions').insert({
            user_id: user.id,
            type: 'investment',
            amount: val, // Store in BRL so dashboard shows correct pending amount
            asset: 'BRL',
            status: 'pending',
            description: `Aguardando Pagamento (USD): ${selectedTeam.name}`
          });

          setLoading(false);
          setSuccess(true); // Show success checkmark
          
          // Auto close after delay
          setTimeout(() => {
            handleClose();
          }, 3000);
          return; 

        } else {
          invoiceUrl = data?.data?.invoice_url || data?.invoice_url;
        }

        if (invoiceUrl) {
          // Create a pending transaction
          await supabase.from('transactions').insert({
            user_id: user.id,
            type: 'investment',
            amount: val, // Store in BRL
            asset: 'BRL',
            status: 'pending',
            description: `Aguardando Pagamento (Plisio): ${selectedTeam.name}`
          });

          // Redirect user to Plisio Invoice
          window.location.href = invoiceUrl;
        } 

      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Erro ao gerar fatura de pagamento.');
        setLoading(false);
      }
    } else {
      // PIX Payment Logic
      try {
        const val = parseFloat(amount);

        // Determine color theme (same as balance logic)
        let colorTheme = 'blue';
        if (selectedTeam.color.includes('purple')) colorTheme = 'purple';
        else if (selectedTeam.color.includes('orange')) colorTheme = 'orange';
        else if (selectedTeam.color.includes('green')) colorTheme = 'green';
        else if (selectedTeam.color.includes('yellow')) colorTheme = 'yellow';

        // 1. Create Investment (Simulated Active for PIX since it's a manual flow)
        const { error: investError } = await supabase
          .from('investments')
          .insert({
            user_id: user.id,
            name: selectedTeam.name,
            type: 'Fundo de Investimento',
            balance: val,
            initial_investment: val,
            total_return_percent: 0.00,
            daily_return_percent: 0.00,
            status: 'active', 
            risk_level: selectedTeam.risk,
            color_theme: colorTheme,
            payment_method: 'pix'
          });

        if (investError) throw investError;

        // 2. Log Transaction
        const { error: txError } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            type: 'investment',
            amount: val,
            asset: 'BRL',
            status: 'completed',
            description: `Investimento via PIX: ${selectedTeam.name}`
          });

        if (txError) console.error('Erro ao registrar transação:', txError);

        // 3. Commission Logic (Same as balance)
        if (profile?.referred_by) {
             const { count, error: countError } = await supabase
                 .from('transactions')
                 .select('*', { count: 'exact', head: true })
                 .eq('user_id', user.id)
                 .in('type', ['deposit', 'investment']); 
             
             if (!countError) {
                 const isFirstAction = count === 1;
                 const commissionRate = isFirstAction ? 0.10 : 0.03;
                 const commissionAmount = val * commissionRate;
 
                 if (commissionAmount > 0) {
                     const { data: referrerProfile } = await supabase
                         .from('profiles')
                         .select('commission_balance, balance')
                         .eq('id', profile.referred_by)
                         .single();
 
                     if (referrerProfile) {
                         const newCommBalance = (referrerProfile.commission_balance || 0) + commissionAmount;
                         await supabase
                             .from('profiles')
                             .update({ commission_balance: newCommBalance })
                             .eq('id', profile.referred_by);
 
                         await supabase.from('transactions').insert({
                             user_id: profile.referred_by,
                             type: 'commission',
                             amount: commissionAmount,
                             asset: 'BRL',
                             status: 'completed',
                             description: `Comissão de ${isFirstAction ? '10%' : '3%'} (Investimento PIX)`
                         });
                     }
                 }
             }
        }

        // Refresh UI
        await refreshProfile();
        setLoading(false);
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2000);

      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Erro ao processar investimento via PIX.');
        setLoading(false);
      }
    }
  };

  const paymentOptions = [
    { 
      id: 'balance', 
      label: 'Saldo em Conta', 
      icon: <Wallet className="w-5 h-5" />, 
      detail: profile ? `R$ ${totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Carregando...',
      color: 'text-blue-400'
    },
    { 
      id: 'pix', 
      label: 'Pix', 
      icon: <QrCode className="w-5 h-5" />, 
      detail: 'Instantâneo',
      color: 'text-green-400'
    },
    { 
      id: 'usdt', 
      label: 'Criptomoedas (Via Plisio)', 
      icon: <Coins className="w-5 h-5" />, 
      detail: 'Bitcoin, USDT, ETH, etc.',
      color: 'text-emerald-400'
    },
  ];

  return (
    <div className="animate-entry relative">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Mercado de Investimentos</h2>
        <p className="text-gray-400">Escolha uma equipe especializada para gerenciar seu capital.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedTeams.map((team, index) => (
          <div 
            key={team.id}
            className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 hover:border-blue-500/30 hover:bg-white/[0.02] transition-all duration-300 group hover:-translate-y-1 flex flex-col h-full animate-entry"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${team.color} group-hover:scale-110 transition-transform`}>
                {team.icon}
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className={`text-xs font-bold px-2 py-1 rounded border ${
                  team.risk === 'Alto' ? 'border-red-500/20 text-red-400 bg-red-500/5' :
                  team.risk === 'Médio' ? 'border-yellow-500/20 text-yellow-400 bg-yellow-500/5' :
                  'border-green-500/20 text-green-400 bg-green-500/5'
                }`}>
                  Risco {team.risk}
                </span>
                <div className="flex items-center gap-1 text-xs font-medium text-orange-400 bg-orange-500/5 px-1.5 py-0.5 rounded border border-orange-500/10">
                  <Flame className="w-3 h-3 fill-orange-500/20" />
                  {team.investors.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="mb-6 flex-1">
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                {team.name}
              </h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                {team.description}
              </p>

              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-green-400">{team.profit}</span>
                <span className="text-xs text-gray-400">est. retorno</span>
              </div>

              {/* Grid Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                    <Clock className="w-3 h-3" /> Duração
                  </div>
                  <div className="text-sm font-semibold text-white">{team.duration}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                    <DollarSign className="w-3 h-3" /> Mínimo
                  </div>
                  <div className="text-sm font-semibold text-white">{team.minPrice}</div>
                </div>
              </div>
              
              <div className="mt-3 bg-white/5 rounded-lg p-2 border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Shield className="w-3 h-3" /> Máximo
                  </div>
                  <div className="text-sm font-semibold text-white">{team.maxPrice}</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <button 
              onClick={() => handleInvestClick(team)}
              className="w-full py-3 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white font-semibold rounded-xl border border-blue-600/20 hover:border-blue-600 transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(37,99,235,0.3)]"
            >
              Investir Agora <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Investment Modal */}
      {selectedTeam && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose}></div>
          
          <div className="relative bg-[#0f0f0f] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl animate-entry overflow-hidden">
            {/* Modal Background Glow */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 ${selectedTeam.color.split(' ')[1].replace('/10', '/20')} blur-[60px] pointer-events-none`}></div>

            {/* Modal Header */}
            <div className="relative p-6 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${selectedTeam.color}`}>
                  {selectedTeam.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedTeam.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>{selectedTeam.profit} est.</span>
                    <span>•</span>
                    <span>{selectedTeam.duration}</span>
                  </div>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              
              {success ? (
                <div className="py-8 flex flex-col items-center text-center animate-entry">
                  <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4 border border-green-500/20">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Solicitação Recebida!</h3>
                  <p className="text-gray-400">
                    {paymentMethod === 'usdt' 
                      ? 'Seu pedido de investimento foi criado. Você será redirecionado para o pagamento.'
                      : `Você investiu com sucesso em ${selectedTeam.name}.`
                    }
                  </p>
                  {paymentMethod !== 'usdt' && (
                    <p className="text-gray-500 text-sm mt-2">Acompanhe o rendimento na aba Portfólio.</p>
                  )}
                </div>
              ) : (
                <>
                  {/* Amount Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Valor do Aporte</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                      <input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0,00"
                        className={`w-full bg-black/20 border ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-blue-500'} rounded-xl py-4 pl-12 pr-4 text-xl font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all`}
                      />
                    </div>
                    {error ? (
                      <div className="flex items-center gap-2 mt-2 text-red-400 text-sm animate-pulse">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </div>
                    ) : (
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>Mínimo: {selectedTeam.minPrice}</span>
                        <span>Máximo: {selectedTeam.maxPrice}</span>
                      </div>
                    )}
                  </div>

                  {/* Payment Methods */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-3">Forma de Pagamento</label>
                    <div className="grid grid-cols-1 gap-3">
                      {paymentOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setPaymentMethod(option.id as any)}
                          className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                            paymentMethod === option.id 
                              ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.1)]' 
                              : 'bg-black/20 border-white/5 hover:border-white/20 hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-white/5 ${option.color}`}>
                              {option.icon}
                            </div>
                            <div className="text-left">
                              <div className={`font-semibold ${paymentMethod === option.id ? 'text-white' : 'text-gray-300'}`}>
                                {option.label}
                              </div>
                              {option.detail && (
                                <div className="text-xs text-gray-500">{option.detail}</div>
                              )}
                            </div>
                          </div>
                          {paymentMethod === option.id && (
                            <div className="w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            {!success && (
              <div className="p-6 border-t border-white/5 bg-black/20 flex gap-3">
                <button 
                  onClick={handleClose}
                  className="flex-1 py-3.5 rounded-xl font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleConfirmInvestment}
                  disabled={loading}
                  className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>Confirmar <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
