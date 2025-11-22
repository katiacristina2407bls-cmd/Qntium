import React from 'react';
import { Reveal } from './Reveal';
import { Laptop, Smartphone, Monitor } from 'lucide-react';

export const PlatformPreview: React.FC = () => {
  return (
    <section id="platform" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <Reveal>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Poder Profissional, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Design Intuitivo
              </span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Uma interface premiada que se adapta ao seu estilo de trading. Disponível para Web, Desktop e Mobile.
            </p>
          </Reveal>
        </div>

        {/* Abstract Platform Mockup */}
        <Reveal delay={200}>
          <div className="relative w-full max-w-5xl mx-auto aspect-video bg-[#0a0a0a] rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
            {/* Fake Browser Header */}
            <div className="h-8 bg-white/5 border-b border-white/5 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
              </div>
              <div className="mx-auto w-1/3 h-4 bg-white/5 rounded-full"></div>
            </div>

            {/* App Layout */}
            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar */}
              <div className="w-16 bg-white/5 border-r border-white/5 flex flex-col items-center py-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-blue-500/50 transition-colors"></div>
                ))}
              </div>

              {/* Main Content */}
              <div className="flex-1 flex flex-col">
                {/* Top Bar */}
                <div className="h-12 border-b border-white/5 flex items-center px-6 justify-between">
                  <div className="w-32 h-4 bg-white/10 rounded"></div>
                  <div className="flex gap-2">
                    <div className="w-20 h-8 bg-green-500/20 rounded border border-green-500/30"></div>
                    <div className="w-20 h-8 bg-red-500/20 rounded border border-red-500/30"></div>
                  </div>
                </div>

                {/* Chart Area */}
                <div className="flex-1 relative bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0a0a0a] to-[#0a0a0a] p-6 flex items-end">
                  {/* Abstract Chart Line */}
                  <svg className="w-full h-3/4 overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,50 L0,40 L10,35 L20,42 L30,25 L40,30 L50,15 L60,20 L70,10 L80,25 L90,5 L100,15 L100,50 Z" fill="url(#chartGradient)" />
                    <path d="M0,40 L10,35 L20,42 L30,25 L40,30 L50,15 L60,20 L70,10 L80,25 L90,5 L100,15" fill="none" stroke="#3b82f6" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                  </svg>
                  
                  {/* Floating Price Tag */}
                  <div className="absolute top-1/4 right-1/4 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-lg animate-bounce">
                    $45,230.00
                  </div>
                </div>
              </div>

              {/* Right Panel (Order Book) */}
              <div className="w-64 bg-white/5 border-l border-white/5 hidden lg:flex flex-col p-4 gap-3">
                <div className="text-xs text-gray-500 mb-2">LIVRO DE OFERTAS</div>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-gray-400">0.4521</span>
                    <span className={i < 4 ? "text-red-400" : "text-green-400"}>
                      {(Math.random() * 1000).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="mt-auto w-full h-10 bg-blue-600 rounded flex items-center justify-center font-bold text-sm">
                  COMPRAR
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="flex justify-center gap-8 mt-12 opacity-50">
          <div className="flex items-center gap-2"><Monitor className="w-5 h-5" /> Web Trader</div>
          <div className="flex items-center gap-2"><Laptop className="w-5 h-5" /> Desktop Pro</div>
          <div className="flex items-center gap-2"><Smartphone className="w-5 h-5" /> Mobile App</div>
        </div>
      </div>
    </section>
  );
};