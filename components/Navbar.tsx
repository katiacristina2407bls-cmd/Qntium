import React, { useState, useEffect } from 'react';
import { TrendingUp, Menu, X } from 'lucide-react';

interface NavbarProps {
  onLoginClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onLoginClick }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Soluções', href: '#solutions' },
    { label: 'Mercados', href: '#markets' },
    { label: 'Plataforma', href: '#platform' },
    { label: 'Sobre Nós', href: '#about' },
  ];

  const handleScrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    
    if (element) {
      const headerOffset = 80; // Height of the fixed header to prevent overlap
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? 'bg-black/70 backdrop-blur-md border-white/10 py-4'
          : 'bg-transparent border-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <a 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="bg-blue-600 p-1.5 rounded-lg group-hover:shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-shadow duration-300">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            Quantium
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => handleScrollToSection(e, item.href)}
              className="text-sm text-gray-400 hover:text-blue-400 transition-colors duration-300 font-medium"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <button 
            onClick={onLoginClick}
            className="px-5 py-2 text-sm font-semibold text-black bg-white rounded-full hover:bg-blue-500 hover:text-white hover:scale-105 transition-all duration-300"
          >
            Área do Cliente
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-gray-300"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-black/95 backdrop-blur-xl border-b border-white/10 p-6 flex flex-col gap-4 animate-fade-in shadow-2xl">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => handleScrollToSection(e, item.href)}
              className="text-lg text-gray-300 hover:text-blue-400"
            >
              {item.label}
            </a>
          ))}
          <button 
            onClick={() => {
              setMobileMenuOpen(false);
              onLoginClick();
            }}
            className="mt-2 w-full py-3 font-semibold text-black bg-white rounded-lg hover:bg-blue-500 hover:text-white transition-colors"
          >
            Área do Cliente
          </button>
        </div>
      )}
    </header>
  );
};