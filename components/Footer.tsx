import React from 'react';
import { TrendingUp, Twitter, Linkedin, Instagram, Github } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-black border-t border-white/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-blue-600 p-1 rounded-md">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Quantium</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Liderando a revolução dos investimentos digitais com tecnologia, segurança e transparência.
            </p>
            <div className="flex gap-4">
              {[Twitter, Linkedin, Instagram, Github].map((Icon, i) => (
                <a key={i} href="#" className="text-gray-500 hover:text-blue-400 transition-colors">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Plataforma</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Trading Pro</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Mercados</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">API para Desenvolvedores</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Segurança</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Empresa</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Sobre Nós</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Carreiras</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Imprensa</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Contato</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Política de Privacidade</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Cookies</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Compliance</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-sm">
            © 2024 Quantium Investimentos. Todos os direitos reservados.
          </p>
          <p className="text-gray-700 text-xs">
            Investimentos envolvem riscos. Consulte os prospectos antes de investir.
          </p>
        </div>
      </div>
    </footer>
  );
};