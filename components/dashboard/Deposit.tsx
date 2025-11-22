
import React, { useState } from 'react';
import { 
  ArrowLeft, 
  DollarSign, 
  QrCode, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Wallet,
  CreditCard,
  Loader2,
  Coins
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface DepositProps {
  onBack?: () => void;
}

export const Deposit: React.FC<DepositProps> = ({ onBack }) => {
  const { user, profile, refreshProfile } = useAuth();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'pix' | 'crypto'>('pix');
  const [step, setStep] = useState(1); // 1: Input, 2: Payment, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Mock Pix Key / Crypto Address for Demo
  const PIX_CODE = "00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-4266141740005204000053039865802BR5913Quantium Ltd6008Sao Paulo62070503***63046132";
  const CRYPTO_ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAmount(val);
  };

  const handleContinue = () => {
    setError(null);
    const val = parseFloat(amount);
    if (isNaN(val) || val < 10) {
      setError('O valor mínimo para depósito é R$ 10,00');
      return;
    }
    setStep(2);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleConfirmPayment = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
        const val = parseFloat(amount);
        
        // 1. Create Transaction Record
        const { error: txError } = await supabase
            .from('transactions')
            .insert({
                user_id: user.id,
                type: 'deposit',
                amount: val,
                asset: 'BRL',
                status: 'completed', // Auto-completing for demo purposes
                description: `Depósito via ${method === 'pix' ? 'PIX' : 'Cripto'}`
            });

        if (txError) throw txError;

        // 2. Update User Balance
        const { data: profileData, error: profileFetchError } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', user.id)
            .single();
            
        if (profileFetchError) throw profileFetchError;

        const newBalance = (profileData?.balance || 0) + val;

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ balance: newBalance })
            .eq('id', user.id);

        if (updateError) throw updateError;

        // 3. COMMISSION LOGIC
        // Check if user has a referrer
        if (profile?.referred_by) {
            // Check if this is the user's FIRST deposit or investment ever
            const { count, error: countError } = await supabase
                .from('transactions')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .in('type', ['deposit', 'investment']); // We count deposits and investments
            
            // If count is 1 (the one we just inserted), then it was the first!
            // Note: Since we just inserted a transaction above, the count should be at least 1. 
            // If count === 1, it means this was the very first one.
            
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
                        // Update Referrer's Commission Balance AND Total Balance
                        const newCommBalance = (referrerProfile.commission_balance || 0) + commissionAmount;
                        const newRefBalance = (referrerProfile.balance || 0) + commissionAmount;

                        await supabase
                            .from('profiles')
                            .update({ 
                                commission_balance: newCommBalance,
                                balance: newRefBalance
                            })
                            .eq('id', profile.referred_by);

                        // Log transaction for referrer
                        await supabase.from('transactions').insert({
                            user_id: profile.referred_by,
                            type: 'commission',
                            amount: commissionAmount,
                            asset: 'BRL',
                            status: 'completed',
                            description: `Comissão de ${isFirstAction ? '10%' : '3%'} (Depósito)`
                        });
                    }
                }
            }
        }

        await refreshProfile();
        setStep(3);
    } catch (err: any) {
        console.error(err);
        setError('Erro ao processar depósito. Tente novamente.');
    } finally {
        setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="animate-entry max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-white">Depositar</h2>
            <p className="text-gray-400">Adicione fundos à sua conta para começar a investir.</p>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 md:p-8">
          <div className="space-y-6">
            
            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Valor do Depósito</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">R$</span>
                <input 
                  type="number" 
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0,00"
                  className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-2xl font-bold text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-700"
                />
              </div>
              <div className="flex justify-between mt-2">
                <p className="text-xs text-gray-500">Mínimo: R$ 10,00</p>
                {error && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {error}
                  </p>
                )}
              </div>
            </div>

            {/* Method Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Método de Pagamento</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setMethod('pix')}
                  className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${
                    method === 'pix' 
                      ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.1)]' 
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${method === 'pix' ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className={`font-bold ${method === 'pix' ? 'text-white' : 'text-gray-300'}`}>PIX</p>
                    <p className="text-xs text-gray-500">Aprovação Instantânea</p>
                  </div>
                  {method === 'pix' && <div className="ml-auto w-3 h-3 bg-blue-500 rounded-full" />}
                </button>

                <button
                  onClick={() => setMethod('crypto')}
                  className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${
                    method === 'crypto' 
                      ? 'bg-purple-600/10 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${method === 'crypto' ? 'bg-purple-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                    <Coins className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className={`font-bold ${method === 'crypto' ? 'text-white' : 'text-gray-300'}`}>Criptomoedas</p>
                    <p className="text-xs text-gray-500">USDT, BTC, ETH</p>
                  </div>
                  {method === 'crypto' && <div className="ml-auto w-3 h-3 bg-purple-500 rounded-full" />}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button 
                onClick={handleContinue}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Continuar <ArrowRight className="w-5 h-5" />
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="animate-entry max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setStep(1)}
            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white">Confirmar Pagamento</h2>
            <p className="text-gray-400">Realize o pagamento para creditar sua conta.</p>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 md:p-8 relative overflow-hidden">
          
          {method === 'pix' ? (
            <div className="flex flex-col items-center text-center">
              <div className="bg-white p-4 rounded-xl mb-6">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(PIX_CODE)}`} 
                  alt="QR Code Pix" 
                  className="w-48 h-48"
                />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Escaneie o QR Code</h3>
              <p className="text-gray-400 text-sm max-w-xs mb-8">
                Abra o app do seu banco, escolha a opção PIX e escaneie o código acima ou copie o código abaixo.
              </p>

              <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3 mb-8">
                <code className="flex-1 text-xs text-gray-400 font-mono break-all text-left">
                  {PIX_CODE}
                </code>
                <button 
                  onClick={() => handleCopy(PIX_CODE)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors flex-shrink-0"
                  title="Copiar Código"
                >
                  {copySuccess ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mb-6">
                 <Coins className="w-10 h-10 text-purple-400" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Transferência Crypto</h3>
              <p className="text-gray-400 text-sm max-w-xs mb-8">
                Envie <strong>USDT (BEP20)</strong> para o endereço abaixo. O valor será convertido automaticamente para Reais.
              </p>

              <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3 mb-8">
                <code className="flex-1 text-sm text-purple-300 font-mono break-all text-center">
                  {CRYPTO_ADDRESS}
                </code>
                <button 
                  onClick={() => handleCopy(CRYPTO_ADDRESS)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors flex-shrink-0"
                  title="Copiar Endereço"
                >
                   {copySuccess ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-500/10 px-4 py-2 rounded-lg mb-6">
                 <AlertCircle className="w-4 h-4" />
                 Envie apenas USDT pela rede BSC (BEP20). Outras redes podem resultar em perda de fundos.
              </div>
            </div>
          )}

          {error && (
             <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                {error}
             </div>
          )}

          <button 
            onClick={handleConfirmPayment}
            disabled={loading}
            className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg shadow-green-900/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Processando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" /> Confirmar Pagamento
              </>
            )}
          </button>
          
          <p className="text-center text-xs text-gray-500 mt-4">
            Ao clicar em confirmar, simularemos a aprovação instantânea.
          </p>
        </div>
      </div>
    );
  }

  // Success View
  return (
    <div className="animate-entry max-w-md mx-auto text-center py-12">
      <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
        <CheckCircle2 className="w-12 h-12" />
      </div>
      
      <h2 className="text-3xl font-bold text-white mb-2">Depósito Confirmado!</h2>
      <p className="text-gray-400 mb-8">
        O valor de <span className="text-white font-bold">R$ {parseFloat(amount).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span> foi adicionado ao seu saldo com sucesso.
      </p>

      <div className="space-y-3">
        <button 
          onClick={() => onBack ? onBack() : setStep(1)}
          className="w-full py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
        >
          Fazer Novo Depósito
        </button>
        <button 
          onClick={onBack}
          className="w-full py-3.5 text-gray-400 hover:text-white font-medium transition-all"
        >
          Voltar ao Dashboard
        </button>
      </div>
    </div>
  );
};
