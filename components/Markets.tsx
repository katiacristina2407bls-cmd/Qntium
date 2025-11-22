import React from 'react';
import { Reveal } from './Reveal';
import { Globe2, TrendingUp, TrendingDown } from 'lucide-react';

export const Markets: React.FC = () => {
  const markets = [
    { name: "S&P 500", value: "4,783.45", change: "+1.24%", up: true },
    { name: "NASDAQ", value: "15,055.65", change: "+2.10%", up: true },
    { name: "BTC/USD", value: "45,230.00", change: "-0.54%", up: false },
    { name: "EUR/USD", value: "1.0923", change: "+0.12%", up: true },
    { name: "GOLD", value: "2,045.50", change: "-0.30%", up: false },
    { name: "IBOVESPA", value: "132,023", change: "+0.85%", up: true },
  ];

  return (
    <section id="markets" className="py-24 bg-black/30 border-y border-white/5 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute left-0 top-0 w-1/3 h-full bg-blue-900/5 blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <Reveal>
            <div>
              <div className="flex items-center gap-2 mb-2 text-blue-500 font-medium">
                <Globe2 className="w-5 h-5" />
                <span>MERCADOS GLOBAIS</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold">Conexão Mundial</h2>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-gray-400 max-w-md text-sm md:text-base">
              Acompanhe e negocie nos principais índices e ativos do mundo com latência zero e dados em tempo real.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {markets.map((market, idx) => (
            <Reveal key={idx} delay={idx * 50} width="100%">
              <div className="flex items-center justify-between p-5 rounded-lg bg-white/5 border border-white/10 hover:border-blue-500/30 transition-colors cursor-pointer group">
                <div className="flex flex-col">
                  <span className="font-bold text-white group-hover:text-blue-400 transition-colors">{market.name}</span>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Index</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-mono text-white">{market.value}</div>
                  <div className={`text-sm flex items-center justify-end gap-1 ${market.up ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {market.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {market.change}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={300}>
          <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-blue-900/20 to-transparent border border-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="text-xl font-bold text-white">Comece a operar hoje</h4>
              <p className="text-gray-400 text-sm mt-1">Abra sua conta em minutos e acesse o mercado global.</p>
            </div>
            <button className="px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-blue-50 hover:scale-105 transition-all whitespace-nowrap">
              Ver Todos os Ativos
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
};