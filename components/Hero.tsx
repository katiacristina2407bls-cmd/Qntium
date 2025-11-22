import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Reveal } from './Reveal';

export const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Specific Hero Glow - highlighting the center content */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
        <div className="flex flex-col items-center gap-6">
          
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-4 backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span className="text-xs md:text-sm font-medium text-gray-300 tracking-wide uppercase">
                Tecnologia de Ponta em Segurança
              </span>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[1.1]">
              Investimentos <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-blue-500">
                Sem Limites
              </span>
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              A plataforma definitiva para traders que exigem velocidade, precisão e inteligência de dados. O futuro do seu patrimônio começa aqui.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
              <button className="group relative px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg overflow-hidden hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all duration-300 transform hover:-translate-y-1">
                <span className="relative z-10 flex items-center gap-2">
                  Começar Agora <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              
              <button className="px-8 py-4 text-white font-medium rounded-lg border border-white/20 hover:bg-white/5 hover:border-white/40 transition-all duration-300">
                Conhecer Plataforma
              </button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};