import React from 'react';
import { Reveal } from './Reveal';

export const About: React.FC = () => {
  const stats = [
    { label: "Volume Transacionado", value: "$12B+" },
    { label: "Países Atendidos", value: "140+" },
    { label: "Usuários Ativos", value: "2M+" },
    { label: "Latência Média", value: "<20ms" },
  ];

  return (
    <section id="about" className="py-24 relative bg-gradient-to-b from-black to-blue-950/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <Reveal>
            <div>
              <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                O futuro do trading é <span className="text-blue-500">transparente</span>.
              </h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                A Quantium nasceu da necessidade de uma plataforma que unisse a velocidade institucional com a usabilidade do varejo. Nossa missão é democratizar o acesso a ferramentas financeiras de alta performance.
              </p>
              <div className="flex flex-col gap-4 border-l-2 border-blue-500 pl-6">
                <p className="text-gray-400 italic">
                  "Nossa tecnologia proprietária processa milhões de ordens por segundo, garantindo que você nunca perca uma oportunidade de mercado."
                </p>
                <span className="text-white font-semibold">— Sarah Connor, CEO</span>
              </div>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 gap-6">
            {stats.map((stat, idx) => (
              <Reveal key={idx} delay={idx * 100} width="100%">
                <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-blue-600/10 transition-colors text-center md:text-left">
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-sm text-blue-400 uppercase tracking-wider font-semibold">{stat.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};