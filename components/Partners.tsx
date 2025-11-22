import React from 'react';

const PARTNERS = [
  "TechFinance", "BlockSecure", "GlobalMarket", "AlphaVentures", 
  "QuantumFund", "NovaAssets", "PrimeBroker", "StellarCapital",
  "NexusTrading", "FutureWealth"
];

export const Partners: React.FC = () => {
  return (
    <section className="py-12 border-t border-b border-white/5 bg-black/40 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest text-center">
          Empresas que confiam na Quantium
        </h3>
      </div>

      <div className="relative w-full flex overflow-hidden">
        {/* Gradient Masks for Smooth Fade In/Out */}
        <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none"></div>

        {/* Marquee Track - Doubled for seamless loop */}
        <div className="flex animate-marquee whitespace-nowrap py-4">
          {[...PARTNERS, ...PARTNERS].map((partner, index) => (
            <div 
              key={`${partner}-${index}`} 
              className="mx-8 md:mx-12 flex items-center justify-center"
            >
              <span className="text-xl md:text-2xl font-bold text-gray-700 hover:text-blue-500 transition-colors duration-500 cursor-default select-none">
                {partner}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};