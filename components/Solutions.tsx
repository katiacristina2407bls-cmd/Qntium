import React from 'react';
import { Reveal } from './Reveal';
import { CandlestickChart, Wallet, Layers, Coins } from 'lucide-react';

export const Solutions: React.FC = () => {
  const solutions = [
    {
      icon: <CandlestickChart className="w-8 h-8" />,
      title: "Renda Variável",
      description: "Acesso direto às maiores bolsas de valores do mundo. Ações, BDRs e ETFs com execução instantânea."
    },
    {
      icon: <Coins className="w-8 h-8" />,
      title: "Criptoativos",
      description: "Negocie Bitcoin, Ethereum e altcoins com spreads competitivos e custódia segura."
    },
    {
      icon: <Layers className="w-8 h-8" />,
      title: "Fundos de Investimento",
      description: "Uma curadoria dos melhores gestores do mercado, diversificando seu portfólio automaticamente."
    },
    {
      icon: <Wallet className="w-8 h-8" />,
      title: "Gestão Patrimonial",
      description: "Soluções personalizadas para preservação e crescimento de capital a longo prazo."
    }
  ];

  return (
    <section id="solutions" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <Reveal>
          <div className="mb-16">
            <span className="text-blue-500 font-semibold tracking-wider uppercase text-sm">Nossas Soluções</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-2 mb-6">Um Ecossistema Completo</h2>
            <p className="text-gray-400 text-lg max-w-2xl">
              Centralize todos os seus investimentos em uma única plataforma robusta, desenhada para perfis conservadores e arrojados.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {solutions.map((item, idx) => (
            <Reveal key={idx} delay={idx * 100} width="100%">
              <div className="group relative p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
                  {item.icon}
                </div>
                
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white">{item.title}</h3>
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
                    {item.description}
                  </p>
                </div>

                {/* Hover Border Gradient */}
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-blue-500/30 transition-colors pointer-events-none"></div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};