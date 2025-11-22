
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Wallet as WalletIcon, 
  Plus, 
  Trash2, 
  Copy, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  QrCode,
  Smartphone,
  Mail,
  Hash,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  Clock,
  Filter,
  Coins,
  Globe
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface BankAccount {
  id: number;
  pix_key: string;
  pix_type: string;
  label: string;
  bank_name?: string;
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  asset: string;
  status: string;
  created_at: string;
  description?: string;
}

interface WalletProps {
  onNavigateToDeposit?: () => void;
  onNavigateToWithdraw?: () => void;
}

export const Wallet: React.FC<WalletProps> = ({ onNavigateToDeposit, onNavigateToWithdraw }) => {
  const { user, profile } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<number | null>(null);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'withdrawal' | 'investment' | 'profit' | 'transfer_in'>('all');

  // Form State
  const [method, setMethod] = useState<'pix' | 'crypto'>('pix');
  const [formData, setFormData] = useState({
    pix_key: '',
    pix_type: 'cpf',
    label: '',
    bank_name: '',
    network: 'BEP20'
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (err) {
      console.error('Error fetching accounts:', err);
    } finally {
      setLoadingAccounts(false);
    }
  }, [user]);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    setLoadingTransactions(true);
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (filterType !== 'all') {
        query = query.eq('type', filterType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoadingTransactions(false);
    }
  }, [user, filterType]);

  useEffect(() => {
    fetchAccounts();
    fetchTransactions();
  }, [fetchAccounts, fetchTransactions]);

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(id);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const handleDelete = async (id: number) => {
    if (!user) return;
    if (!window.confirm('Tem certeza que deseja remover esta chave?')) return;
    
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      setAccounts(prev => prev.filter(acc => acc.id !== id));
    } catch (err) {
      console.error('Error deleting account:', err);
      alert('Erro ao remover conta.');
    }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSubmitting(true);

    try {
      const finalType = method === 'crypto' ? 'usdt' : formData.pix_type;
      const finalBankName = method === 'crypto' ? formData.network : formData.bank_name;
      const finalLabel = formData.label || (method === 'crypto' ? 'Carteira USDT' : 'Minha Chave');

      // Validation
      if (method === 'crypto') {
         if (!formData.pix_key.startsWith('0x') && formData.network === 'BEP20') {
             // Simple check for BEP20
             // throw new Error('Endereço BEP20 inválido (deve começar com 0x).');
         }
         if (!formData.pix_key.startsWith('T') && formData.network === 'TRC20') {
             // Simple check for TRC20
             // throw new Error('Endereço TRC20 inválido (deve começar com T).');
         }
      }

      const { error } = await supabase
        .from('bank_accounts')
        .insert({
          user_id: user.id,
          pix_key: formData.pix_key,
          pix_type: finalType,
          label: finalLabel,
          bank_name: finalBankName
        });

      if (error) throw error;

      await fetchAccounts();
      setShowAddModal(false);
      setFormData({ pix_key: '', pix_type: 'cpf', label: '', bank_name: '', network: 'BEP20' });
      setMethod('pix');
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('bank_accounts_pix_type_check')) {
        setError('Erro de Banco de Dados: O tipo "usdt" precisa ser adicionado à constraint CHECK no Supabase. Contate o admin.');
      } else {
        setError(err.message || 'Erro ao salvar conta.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getPixIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'phone': return <Smartphone className="w-4 h-4" />;
      case 'random': return <Hash className="w-4 h-4" />;
      case 'usdt': return <Coins className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) return `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getTxIcon = (type: string) => {
    if (['deposit', 'profit', 'transfer_in', 'sell'].includes(type)) {
      return <ArrowDownLeft className="w-5 h-5" />;
    }
    return <ArrowUpRight className="w-5 h-5" />;
  };

  const getTxColor = (type: string) => {
    if (['deposit', 'profit', 'transfer_in', 'sell'].includes(type)) {
      return 'bg-green-500/10 text-green-400';
    }
    return 'bg-red-500/10 text-red-400';
  };

  const handleFilterChange = (type: any) => {
    setFilterType(type);
  };

  const totalBalance = (profile?.balance || 0) + (profile?.commission_balance || 0);

  return (
    <div className="animate-entry space-y-8 pb-8">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Carteira</h2>
          <p className="text-gray-400">Gerencie seu saldo e métodos de saque.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Cards & Balance */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Virtual Card / Balance Display */}
            <div className="relative h-64 rounded-3xl p-8 overflow-hidden group transition-all hover:shadow-[0_0_40px_rgba(37,99,235,0.3)]">
                {/* Card Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-[#0a0a0a] to-black border border-white/10 z-0"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[80px] rounded-full -mr-10 -mt-10 z-0"></div>

                {/* Card Content */}
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-white/10 backdrop-blur-md rounded-lg">
                                <WalletIcon className="w-6 h-6 text-blue-400" />
                            </div>
                            <span className="text-sm font-medium text-gray-300 tracking-wider">SALDO DISPONÍVEL</span>
                        </div>
                        <CreditCard className="w-8 h-8 text-white/20" />
                    </div>

                    <div>
                        <h3 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
                             R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span>Pronto para saque imediato</span>
                        </div>
                    </div>

                    <div className="flex gap-4">
                         <button 
                            onClick={onNavigateToDeposit}
                            className="flex-1 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 active:scale-95"
                         >
                            <ArrowDownLeft className="w-5 h-5" /> Depositar
                         </button>
                         <button 
                            onClick={onNavigateToWithdraw}
                            className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 backdrop-blur-md transition-colors flex items-center justify-center gap-2 border border-white/10 active:scale-95"
                         >
                            <ArrowUpRight className="w-5 h-5" /> Sacar
                         </button>
                    </div>
                </div>
            </div>

            {/* Transaction History */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <History className="w-5 h-5 text-gray-400" /> Histórico Recente
                    </h3>
                    
                    <div className="relative">
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-all ${
                                showFilters || filterType !== 'all' 
                                ? 'text-blue-400 border-blue-500/50 bg-blue-500/10' 
                                : 'text-gray-400 border-white/10 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <Filter className="w-4 h-4" />
                            <span>Filtros</span>
                            {filterType !== 'all' && (
                                <span className="flex h-2 w-2 rounded-full bg-blue-400 ml-1"></span>
                            )}
                        </button>

                        {showFilters && (
                            <div className="absolute right-0 mt-2 w-48 bg-[#0f0f0f] border border-white/10 rounded-xl shadow-xl z-20 p-2 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-1">
                                    {[
                                        { id: 'all', label: 'Todos' },
                                        { id: 'deposit', label: 'Depósitos' },
                                        { id: 'withdrawal', label: 'Saques' },
                                        { id: 'investment', label: 'Investimentos' },
                                        { id: 'profit', label: 'Rendimentos' }
                                    ].map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleFilterChange(opt.id)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                                filterType === opt.id 
                                                ? 'bg-blue-600 text-white' 
                                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden min-h-[200px]">
                    {loadingTransactions ? (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-2">
                         <Clock className="w-6 h-6 animate-spin" />
                         <p>Carregando transações...</p>
                      </div>
                    ) : transactions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                         <History className="w-10 h-10 mb-2 opacity-20" />
                         <p>Nenhuma transação encontrada.</p>
                         {filterType !== 'all' && (
                             <button 
                                onClick={() => setFilterType('all')}
                                className="text-sm text-blue-400 mt-2 hover:underline"
                             >
                                Limpar filtros
                             </button>
                         )}
                      </div>
                    ) : (
                      transactions.map((tx) => (
                          <div key={tx.id} className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors last:border-0 group">
                              <div className="flex items-center gap-4">
                                  <div className={`p-2 rounded-full ${getTxColor(tx.type)}`}>
                                      {getTxIcon(tx.type)}
                                  </div>
                                  <div>
                                      <p className="font-medium text-white capitalize">{tx.description || tx.type}</p>
                                      <p className="text-xs text-gray-500">{formatDate(tx.created_at)}</p>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <p className={`font-bold ${['deposit', 'profit', 'transfer_in', 'sell'].includes(tx.type) ? 'text-green-400' : 'text-white'}`}>
                                      {['deposit', 'profit', 'transfer_in', 'sell'].includes(tx.type) ? '+' : '-'} R$ {Number(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                  <p className="text-xs text-gray-500">{tx.status === 'completed' ? 'Concluído' : tx.status}</p>
                              </div>
                          </div>
                      ))
                    )}
                </div>
            </div>
        </div>

        {/* Right Column: Withdrawal Methods */}
        <div className="space-y-6">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 h-full">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <WalletIcon className="w-5 h-5 text-blue-400" /> Contas de Saque
                    </h3>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="p-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg transition-colors active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>

                {loadingAccounts ? (
                    <div className="space-y-4">
                        {[1, 2].map(i => (
                            <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                ) : accounts.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-600">
                            <QrCode className="w-6 h-6" />
                        </div>
                        <p className="text-gray-400 text-sm mb-4">Nenhuma conta cadastrada.</p>
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="text-blue-400 text-sm font-medium hover:underline"
                        >
                            Adicionar conta
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {accounts.map((acc) => (
                            <div key={acc.id} className="group bg-white/5 hover:bg-white/[0.07] border border-white/5 rounded-xl p-4 transition-all relative overflow-hidden">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2 text-blue-400">
                                        {getPixIcon(acc.pix_type)}
                                        <span className="text-xs font-bold uppercase tracking-wider">
                                            {acc.pix_type === 'usdt' ? 'USDT' : (acc.label || acc.pix_type)}
                                        </span>
                                    </div>
                                    <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleCopy(acc.pix_key, acc.id)}
                                            className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                                            title="Copiar"
                                        >
                                            {copySuccess === acc.id ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(acc.id)}
                                            className="p-1.5 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-white font-mono text-sm truncate">{acc.pix_key}</p>
                                {acc.bank_name && (
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                        {acc.pix_type === 'usdt' ? <Globe className="w-3 h-3" /> : null}
                                        {acc.bank_name}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-6 p-4 bg-blue-900/10 border border-blue-500/20 rounded-xl">
                    <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                        <p className="text-xs text-blue-200 leading-relaxed">
                            Os saques via PIX são processados instantaneamente 24/7. Saques via Cripto (USDT) podem levar até 30 minutos para confirmação da rede.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Add Account Modal */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setShowAddModal(false)}></div>
            <div className="relative bg-[#0f0f0f] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Adicionar Método de Saque</h3>
                    <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="px-6 pt-6 pb-2">
                    <div className="flex p-1 bg-white/5 rounded-lg">
                        <button 
                            onClick={() => { setMethod('pix'); setError(null); }}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
                                method === 'pix' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <QrCode className="w-4 h-4" /> PIX
                        </button>
                        <button 
                            onClick={() => { setMethod('crypto'); setError(null); }}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
                                method === 'crypto' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <Coins className="w-4 h-4" /> Cripto (USDT)
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSaveAccount} className="p-6 space-y-4">
                    {method === 'pix' ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Tipo de Chave</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['cpf', 'email', 'phone', 'random'].map(type => (
                                        <button
                                            type="button"
                                            key={type}
                                            onClick={() => setFormData({...formData, pix_type: type})}
                                            className={`py-2 px-1 text-xs sm:text-sm rounded-lg border transition-all ${
                                                formData.pix_type === type 
                                                ? 'bg-blue-600 text-white border-blue-500' 
                                                : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                                            }`}
                                        >
                                            {type === 'random' ? 'Aleatória' : type.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Chave PIX</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder={formData.pix_type === 'email' ? 'exemplo@email.com' : 'Digite sua chave'}
                                    value={formData.pix_key}
                                    onChange={e => setFormData({...formData, pix_key: e.target.value})}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400">Apelido (Opcional)</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: Nubank"
                                        value={formData.label}
                                        onChange={e => setFormData({...formData, label: e.target.value})}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400">Banco (Opcional)</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: Inter"
                                        value={formData.bank_name}
                                        onChange={e => setFormData({...formData, bank_name: e.target.value})}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Rede</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['BEP20', 'TRC20'].map(net => (
                                        <button
                                            type="button"
                                            key={net}
                                            onClick={() => setFormData({...formData, network: net})}
                                            className={`py-3 px-1 text-sm rounded-lg border transition-all font-medium ${
                                                formData.network === net 
                                                ? 'bg-purple-600 text-white border-purple-500' 
                                                : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                                            }`}
                                        >
                                            USDT ({net})
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Endereço da Carteira</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder={formData.network === 'BEP20' ? '0x...' : 'T...'}
                                    value={formData.pix_key}
                                    onChange={e => setFormData({...formData, pix_key: e.target.value})}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none font-mono text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Apelido (Opcional)</label>
                                <input 
                                    type="text" 
                                    placeholder="Ex: Binance Wallet"
                                    value={formData.label}
                                    onChange={e => setFormData({...formData, label: e.target.value})}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:outline-none"
                                />
                            </div>
                            
                            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg flex gap-2 text-xs text-purple-300">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <p>Certifique-se que o endereço corresponde à rede selecionada ({formData.network}). Envios para redes incorretas podem ser perdidos permanentemente.</p>
                            </div>
                        </>
                    )}

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={submitting}
                        className={`w-full py-3.5 text-white font-bold rounded-lg shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                            method === 'pix' 
                            ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20' 
                            : 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/20'
                        }`}
                    >
                        {submitting ? 'Salvando...' : method === 'pix' ? 'Salvar Chave PIX' : 'Salvar Carteira'}
                    </button>
                </form>
            </div>
        </div>,
        document.body
      )}
    </div>
  );
};
