import React from 'react';
import { Zap, Globe, Lock, BarChart3, Cpu, Smartphone } from 'lucide-react';
import { Reveal } from './Reveal';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay }) => (
  <div className="h-full">
    <Reveal delay={delay} width="100%">
      <div className="group p-8 h-full rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-blue-900/10 transition-all duration-500 hover:-translate-y-2">
        <div className="mb-6 inline-block p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:text-blue-300 group-hover:scale-110 transition-all duration-300">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-200 transition-colors">
          {title}
        </h3>
        <p className="text-gray-400 leading-relaxed">
          {description}
        </p>
      </div>
    </Reveal>
  </div>
);

export const Features: React.FC = () => {
  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Execução em Milissegundos",
      description: "Nossa infraestrutura de baixa latência garante que suas ordens sejam executadas no preço exato que você deseja, sem slippage."
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Segurança Institucional",
      description: "Proteção de ativos com criptografia de ponta a ponta e custódia segregada para garantir total tranquilidade."
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Acesso Global",
      description: "Opere em mais de 50 mercados internacionais a partir de uma única conta multimoeda integrada."
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Análise Preditiva",
      description: "Ferramentas de IA que analisam tendências de mercado em tempo real para sugerir as melhores oportunidades."
    },
    {
      icon: <Cpu className="w-6 h-6" />,
      title: "API Robusta",
      description: "Conecte seus próprios bots e algoritmos de trading através de nossa API de alta performance."
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "Mobile First",
      description: "Uma experiência completa de trading na palma da sua mão, com gráficos avançados e notificações em tempo real."
    }
  ];

  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Por que escolher a <span className="text-blue-500">Quantium</span>?
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-gray-400 text-lg">
              Combinamos tecnologia financeira avançada com uma interface intuitiva para potencializar seus resultados.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index * 100}
            />
          ))}
        </div>
      </div>
    </section>
  );
};