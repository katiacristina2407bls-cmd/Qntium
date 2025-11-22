
import React, { useState, useEffect } from 'react';
import { 
  ArrowDown, 
  RefreshCw, 
  TrendingUp, 
  Wallet, 
  Info, 
  ArrowLeftRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Mock initial rates (Base: BRL)
const INITIAL_RATES: Record<string, number> = {
  'BRL': 1,
  'USD': 5.15,
  'EUR': 5.58,
  'GBP': 6.52,
  'BTC': 342000.00,
  'ETH': 18500.00,
  'USDT': 5.16,
  'SOL': 720.00
};

const CURRENCIES = [
  { code: 'BRL', name: 'Real Brasileiro', type: 'fiat', icon: '🇧🇷' },
  { code: 'USD', name: 'Dólar Americano', type: 'fiat', icon: '🇺🇸' },
  { code: 'EUR', name: 'Euro', type: 'fiat', icon: '🇪🇺' },
  { code: 'GBP', name: 'Libra Esterlina', type: 'fiat', icon: '🇬🇧' },
  { code: 'USDT', name: 'Tether USD', type: 'crypto', icon: '₮' },
  { code: 'BTC', name: 'Bitcoin', type: 'crypto', icon: '₿' },
  { code: 'ETH', name: 'Ethereum', type: 'crypto', icon: 'Ξ' },
  { code: 'SOL', name: 'Solana', type: 'crypto', icon: '◎' },
];

export const Exchange: React.FC = () => {
  const { profile } = useAuth();
  
  const [fromCurrency, setFromCurrency] = useState('BRL');
  const [toCurrency, setToCurrency] = useState('USD');
  const [amountFrom, setAmountFrom] = useState<string>('');
  const [rates, setRates] = useState(INITIAL_RATES);
  const [rateDirection, setRateDirection] = useState<'up' | 'down' | 'neutral'>('neutral');

  // Simulate Live Market Updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRates(prev => {
        const newRates = { ...prev };
        // Randomly fluctuate rates by small percentage
        Object.keys(newRates).forEach(key => {
          if (key === 'BRL') return; // Base always 1
          const change = (Math.random() - 0.5) * 0.002; // +/- 0.1%
          newRates[key] = newRates[key] * (1 + change);
        });
        
        // Visual feedback for Bitcoin movement as proxy for market
        setRateDirection(newRates['BTC'] > prev['BTC'] ? 'up' : 'down');
        return newRates;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getExchangeRate = () => {
    // Convert From -> BRL -> To
    const fromRateInBRL = rates[fromCurrency];
    const toRateInBRL = rates[toCurrency];
    
    return fromRateInBRL / toRateInBRL;
  };

  const calculateToAmount = () => {
    if (!amountFrom || isNaN(parseFloat(amountFrom))) return 0;
    const rate = getExchangeRate();
    const rawAmount = parseFloat(amountFrom) * rate;
    
    // No fee for simulator view
    return rawAmount;
  };

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const totalBalance = (profile?.balance || 0) + (profile?.commission_balance || 0);

  return (
    <div className="animate-entry pb-8 max-w-5xl mx-auto">
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Simulador de Câmbio</h2>
        <p className="text-gray-400">Acompanhe as cotações e simule conversões em tempo real.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Conversion Card */}
        <div className="lg:col-span-2">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[80px] pointer-events-none"></div>
            
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Wallet className="w-4 h-4" />
                <span>Referência de Saldo:</span>
                <span className="text-white font-mono">
                  {fromCurrency === 'BRL' 
                    ? `R$ ${totalBalance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`
                    : '---'
                  }
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                Cotações ao Vivo
              </div>
            </div>

            <div className="space-y-4 relative">
              
              {/* FROM Input */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 transition-colors focus-within:border-blue-500/50">
                <label className="text-xs text-gray-500 mb-2 block">Valor Base</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="number" 
                    value={amountFrom}
                    onChange={(e) => setAmountFrom(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent text-3xl font-bold text-white placeholder-gray-600 focus:outline-none"
                  />
                  <div className="relative group">
                    <select 
                      value={fromCurrency}
                      onChange={(e) => setFromCurrency(e.target.value)}
                      className="appearance-none bg-white/5 text-white font-semibold py-2 pl-3 pr-8 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      {CURRENCIES.map(c => (
                        <option key={c.code} value={c.code} className="bg-[#0a0a0a] text-white">
                          {c.icon} {c.code}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <ArrowDown className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Swap Button */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <button 
                  onClick={handleSwap}
                  className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white border-4 border-[#0a0a0a] flex items-center justify-center transition-transform hover:rotate-180 shadow-lg"
                >
                  <ArrowDown className="w-5 h-5" />
                </button>
              </div>

              {/* TO Input (Read Only) */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 pt-6 transition-colors">
                <label className="text-xs text-gray-500 mb-2 block">Valor Convertido (Estimativa)</label>
                <div className="flex items-center gap-4">
                  <div className={`w-full text-3xl font-bold bg-transparent focus:outline-none ${amountFrom ? 'text-blue-400' : 'text-gray-600'}`}>
                     {amountFrom ? calculateToAmount().toLocaleString('pt-BR', { maximumFractionDigits: 6 }) : '0.00'}
                  </div>
                  <div className="relative group">
                    <select 
                      value={toCurrency}
                      onChange={(e) => setToCurrency(e.target.value)}
                      className="appearance-none bg-white/5 text-white font-semibold py-2 pl-3 pr-8 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      {CURRENCIES.map(c => (
                        <option key={c.code} value={c.code} className="bg-[#0a0a0a] text-white">
                          {c.icon} {c.code}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <ArrowDown className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info / Summary */}
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/5 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Cotação Comercial</span>
                <span className={`font-mono flex items-center gap-1 ${rateDirection === 'up' ? 'text-green-400' : rateDirection === 'down' ? 'text-red-400' : 'text-white'}`}>
                  1 {fromCurrency} ≈ {getExchangeRate().toLocaleString('pt-BR', {maximumFractionDigits: 6})} {toCurrency}
                  {rateDirection === 'up' ? <TrendingUp className="w-3 h-3" /> : <RefreshCw className="w-3 h-3" />}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400 flex items-center gap-1">Última Atualização</span>
                <span className="text-white font-mono">Agora mesmo</span>
              </div>
            </div>

          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Current Market Rates */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 h-full">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" /> Mercado Agora
            </h3>
            
            <div className="space-y-4">
               {['USD', 'EUR', 'BTC', 'ETH'].map(curr => (
                 <div key={curr} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors group cursor-pointer">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-lg">
                        {CURRENCIES.find(c => c.code === curr)?.icon}
                     </div>
                     <div>
                       <p className="font-bold text-white">{curr}/BRL</p>
                       <p className="text-xs text-gray-500">{CURRENCIES.find(c => c.code === curr)?.name}</p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="font-mono font-medium text-white">
                       R$ {rates[curr].toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                     </p>
                     <p className={`text-xs ${Math.random() > 0.5 ? 'text-green-400' : 'text-red-400'} flex items-center justify-end gap-1`}>
                       {Math.random() > 0.5 ? '+' : '-'}{(Math.random() * 1.5).toFixed(2)}%
                     </p>
                   </div>
                 </div>
               ))}
            </div>

            <div className="mt-8 p-4 bg-blue-900/10 border border-blue-500/20 rounded-xl">
              <h4 className="text-blue-400 font-bold text-sm mb-2">Valores em Tempo Real</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                As cotações exibidas são baseadas no mercado comercial internacional e servem como referência para suas transações.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
