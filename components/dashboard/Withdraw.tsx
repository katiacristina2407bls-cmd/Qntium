
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowUpRight, 
  AlertTriangle, 
  Wallet, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Lock,
  Plus,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface WithdrawProps {
  onBack?: () => void;
  onNavigateToWallet?: () => void;
}

interface BankAccount {
  id: number;
  pix_key: string;
  pix_type: string;
  label: string;
  bank_name?: string;
}

export const Withdraw: React.FC<WithdrawProps> = ({ onBack, onNavigateToWallet }) => {
  const { user, profile, refreshProfile } = useAuth();
  const [amount, setAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [step, setStep] = useState(1); // 1: Input, 2: Select Account, 3: Confirm, 4: Success
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // PIN Verification State
  const [pin, setPin] = useState('');

  // Constants
  const FEE_PERCENTAGE = 0.07; // 7%

  // Check for voucher lock
  const isVoucherLocked = profile?.voucher === true;
  
  // Combined Balance
  const totalBalance = (profile?.balance || 0) + (profile?.commission_balance || 0);

  useEffect(() => {
    const fetchAccounts = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('bank_accounts')
          .select('*')
          .eq('user_id', user.id);
        
        if (error) throw error;
        setAccounts(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingAccounts(false);
      }
    };

    fetchAccounts();
  }, [user]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
    setError(null);
  };

  const handleContinueToAccount = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setError('Insira um valor válido.');
      return;
    }
    if (val > totalBalance) {
      setError('Saldo insuficiente.');
      return;
    }
    if (val < 50) {
        setError('O valor mínimo para saque é R$ 50,00');
        return;
    }
    setStep(2);
  };

  const handleSelectAccount = (acc: BankAccount) => {
    setSelectedAccount(acc);
    setPin(''); // Reset PIN when selecting account
    setStep(3);
  };

  const handleConfirmWithdraw = async () => {
    if (!user || !selectedAccount) return;
    setLoading(true);
    setError(null);

    try {
      // 0. Validate PIN
      if (!pin || pin.length < 4) {
        throw new Error('Por favor, insira sua senha de saque.');
      }

      // Verify PIN against database (to ensure it's fresh)
      const { data: profileCheck, error: pinError } = await supabase
        .from('profiles')
        .select('pin_code, voucher, balance, commission_balance')
        .eq('id', user.id)
        .single();

      if (pinError || !profileCheck) {
         throw new Error('Erro ao verificar credenciais.');
      }

      if (profileCheck.pin_code !== pin) {
        throw new Error('Senha de saque incorreta.');
      }

      if (profileCheck.voucher) {
        throw new Error('Saques não permitidos para contas Voucher.');
      }

      const val = parseFloat(amount);
      const availableFunds = (profileCheck.balance || 0) + (profileCheck.commission_balance || 0);
      
      if (availableFunds < val) {
        throw new Error('Saldo insuficiente.');
      }

      // Deduction Logic: Prioritize Main Balance
      let newMainBalance = profileCheck.balance || 0;
      let newCommissionBalance = profileCheck.commission_balance || 0;
      
      if (newMainBalance >= val) {
          newMainBalance -= val;
      } else {
          const remainder = val - newMainBalance;
          newMainBalance = 0;
          newCommissionBalance -= remainder;
      }

      // 2. Update balances
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
            balance: newMainBalance,
            commission_balance: newCommissionBalance 
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 3. Create Transaction
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'withdrawal',
          amount: val,
          asset: 'BRL',
          status: 'pending',
          description: `Saque PIX para ${selectedAccount.pix_type.toUpperCase()} (Taxa 7%)`
        });

      if (txError) throw txError;

      await refreshProfile();
      setStep(4);

    } catch (err: any) {
      setError(err.message || 'Erro ao processar saque.');
    } finally {
      setLoading(false);
    }
  };

  // Render: Voucher Locked State
  if (isVoucherLocked) {
    return (
      <div className="animate-entry max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          <h2 className="text-2xl font-bold text-white">Saque Indisponível</h2>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
          <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <Lock className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Conta Voucher</h3>
          <p className="text-gray-300 max-w-md mx-auto mb-6">
            Sua conta está classificada como "Voucher". De acordo com nossos termos, este tipo de conta não possui permissão para realizar saques, apenas para utilização do saldo em produtos internos.
          </p>
          <div className="p-4 bg-black/20 rounded-xl text-sm text-gray-400 text-left">
             <strong>Nota:</strong> Se você acredita que isso é um erro, entre em contato com o suporte para verificar o status da sua conta.
          </div>
        </div>
      </div>
    );
  }

  // Render: Success
  if (step === 4) {
    const val = parseFloat(amount);
    const fee = val * FEE_PERCENTAGE;
    const net = val - fee;

    return (
      <div className="animate-entry max-w-md mx-auto text-center py-12">
        <div className="w-24 h-24 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/20">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Solicitação Enviada!</h2>
        <p className="text-gray-400 mb-8">
          Seu saque líquido de <span className="text-white font-bold">R$ {net.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span> está sendo processado. O valor cairá na sua conta PIX em instantes.
        </p>
        <button onClick={() => onBack ? onBack() : setStep(1)} className="w-full py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all">
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="animate-entry max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        {onBack && (
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <div>
          <h2 className="text-2xl font-bold text-white">Realizar Saque</h2>
          <p className="text-gray-400">Transfira seu saldo para sua conta bancária via PIX.</p>
        </div>
      </div>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 md:p-8">
        
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
             <div className="flex justify-between items-center p-4 bg-blue-900/10 border border-blue-500/20 rounded-xl mb-4">
                <div className="flex items-center gap-3">
                    <Wallet className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-gray-300">Saldo Disponível</span>
                </div>
                <span className="font-bold text-white">R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Valor do Saque</label>
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
                   <p className="text-xs text-gray-500">Mínimo: R$ 50,00</p>
                   {error && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>}
                </div>
             </div>

             <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Taxa de Saque (7%)</span>
                    <span className="text-yellow-400 font-medium">
                        {amount ? `R$ ${(parseFloat(amount) * FEE_PERCENTAGE).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : '--'}
                    </span>
                </div>
             </div>

             <button 
               onClick={handleContinueToAccount}
               className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
             >
               Selecionar Destino <ArrowUpRight className="w-5 h-5" />
             </button>
          </div>
        )}

        {step === 2 && (
           <div className="space-y-6 animate-in slide-in-from-right-4">
              <h3 className="font-bold text-white mb-4">Selecione a Chave PIX</h3>
              
              {loadingAccounts ? (
                 <div className="space-y-3"><div className="h-16 bg-white/5 rounded-xl animate-pulse"></div></div>
              ) : accounts.length === 0 ? (
                 <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                    <p className="text-gray-400 mb-4">Nenhuma conta bancária cadastrada.</p>
                    <button 
                       onClick={() => onNavigateToWallet ? onNavigateToWallet() : null}
                       className="px-4 py-2 bg-blue-600/10 text-blue-400 border border-blue-600/20 rounded-lg hover:bg-blue-600/20 transition-all flex items-center gap-2 mx-auto"
                    >
                       <Plus className="w-4 h-4" /> Adicionar na Carteira
                    </button>
                 </div>
              ) : (
                 <div className="space-y-3">
                    {accounts.map(acc => (
                       <button
                          key={acc.id}
                          onClick={() => handleSelectAccount(acc)}
                          className="w-full flex justify-between items-center p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-blue-500/50 transition-all text-left group"
                       >
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-black/40 rounded-lg text-gray-300 group-hover:text-blue-400 transition-colors">
                                <Wallet className="w-5 h-5" />
                             </div>
                             <div>
                                <p className="font-bold text-white text-sm">{acc.label}</p>
                                <p className="text-xs text-gray-400">{acc.pix_type.toUpperCase()}: {acc.pix_key}</p>
                             </div>
                          </div>
                          {acc.bank_name && <span className="text-xs text-gray-500">{acc.bank_name}</span>}
                       </button>
                    ))}
                 </div>
              )}

              <div className="flex gap-3 pt-4">
                 <button onClick={() => setStep(1)} className="flex-1 py-3 text-gray-400 hover:text-white transition-colors">Voltar</button>
              </div>
           </div>
        )}

        {step === 3 && selectedAccount && (
           <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-3">
                 <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                 <div className="text-xs text-yellow-200">
                    Confira os dados com atenção. Saques para chaves PIX incorretas não podem ser estornados.
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between py-3 border-b border-white/5">
                    <span className="text-gray-400">Valor Solicitado</span>
                    <span className="font-bold text-white text-lg">R$ {parseFloat(amount).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                 </div>
                 <div className="flex justify-between py-3 border-b border-white/5">
                    <span className="text-gray-400">Taxa de Saque (7%)</span>
                    <span className="font-bold text-red-400 text-lg">
                        - R$ {(parseFloat(amount) * FEE_PERCENTAGE).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </span>
                 </div>
                 <div className="flex justify-between py-3 border-b border-white/5 bg-white/5 px-3 rounded-lg">
                    <span className="text-gray-300 font-medium">Valor Líquido a Receber</span>
                    <span className="font-bold text-green-400 text-lg">
                        R$ {(parseFloat(amount) * (1 - FEE_PERCENTAGE)).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </span>
                 </div>

                 <div className="flex justify-between py-3 border-b border-white/5">
                    <span className="text-gray-400">Destino</span>
                    <div className="text-right">
                       <p className="text-white font-medium">{selectedAccount.label}</p>
                       <p className="text-xs text-gray-500">{selectedAccount.pix_key}</p>
                    </div>
                 </div>
              </div>

              {/* PIN Input */}
              <div className="pt-4">
                 <label className="block text-sm font-medium text-gray-400 mb-2">Senha de Saque (PIN)</label>
                 <div className="relative">
                    <KeyRound className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                    <input 
                      type="password" 
                      maxLength={6}
                      placeholder="Digite seu PIN de 6 dígitos"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                 </div>
              </div>

              {error && (
                 <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                    {error}
                 </div>
              )}

              <div className="flex gap-3 pt-4">
                 <button onClick={() => setStep(2)} disabled={loading} className="flex-1 py-3 text-gray-400 hover:text-white transition-colors">Voltar</button>
                 <button 
                    onClick={handleConfirmWithdraw}
                    disabled={loading || pin.length < 4}
                    className="flex-[2] py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                 >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Saque'}
                 </button>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};
