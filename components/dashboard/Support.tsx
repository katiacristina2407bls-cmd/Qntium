import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Headphones, 
  ArrowLeft, 
  Send, 
  Bot, 
  User, 
  Mail, 
  Phone, 
  MessageCircle 
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

type SupportView = 'selection' | 'automated' | 'human';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export const Support: React.FC = () => {
  const { t } = useLanguage();
  const [view, setView] = useState<SupportView>('selection');
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: 'Olá! Sou o assistente virtual da Quantium. Como posso ajudar você hoje?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Mock Bot Response
    setTimeout(() => {
      let botResponse = 'Desculpe, não entendi. Poderia reformular? Ou escolha o atendimento humano para falar com um especialista.';
      const lowerInput = userMsg.text.toLowerCase();

      if (lowerInput.includes('saque') || lowerInput.includes('sacar')) {
        botResponse = 'Para realizar um saque, vá até a aba "Carteira" e clique no botão "Sacar". Lembre-se que saques via PIX são processados instantaneamente.';
      } else if (lowerInput.includes('deposito') || lowerInput.includes('depositar')) {
        botResponse = 'Você pode depositar via PIX ou Cripto. Vá até a aba "Carteira", clique em "Depositar" e escolha seu método preferido.';
      } else if (lowerInput.includes('senha') || lowerInput.includes('acesso')) {
        botResponse = 'Para alterar sua senha, acesse "Configurações" > "Segurança". Se não consegue entrar na conta, use a opção "Esqueci minha senha" na tela de login.';
      } else if (lowerInput.includes('taxa') || lowerInput.includes('custo')) {
        botResponse = 'A Quantium não cobra taxas de manutenção de conta. Cobramos apenas uma pequena taxa de performance sobre os lucros obtidos nos investimentos.';
      } else if (lowerInput.includes('investir') || lowerInput.includes('aplicar')) {
        botResponse = 'Para investir, acesse o "Mercado", escolha uma equipe que combine com seu perfil e clique em "Investir Agora".';
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      }]);
    }, 1000);
  };

  if (view === 'selection') {
    return (
      <div className="animate-entry max-w-4xl mx-auto">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">{t('support_title')}</h2>
          <p className="text-gray-400">{t('support_subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Automated Support Card */}
          <button 
            onClick={() => setView('automated')}
            className="group relative bg-[#0a0a0a] border border-white/5 hover:border-blue-500/30 rounded-2xl p-8 text-left transition-all duration-300 hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[60px] -mr-10 -mt-10 pointer-events-none group-hover:bg-blue-600/20 transition-colors"></div>
            
            <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Bot className="w-7 h-7" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">{t('automated_support')}</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Obtenha respostas instantâneas para dúvidas frequentes sobre saques, depósitos e funcionamento da plataforma através do nosso assistente virtual inteligente.
            </p>

            <div className="flex items-center gap-2 text-blue-400 text-sm font-bold">
              Iniciar Chat <MessageSquare className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Human Support Card */}
          <button 
            onClick={() => setView('human')}
            className="group relative bg-[#0a0a0a] border border-white/5 hover:border-purple-500/30 rounded-2xl p-8 text-left transition-all duration-300 hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 blur-[60px] -mr-10 -mt-10 pointer-events-none group-hover:bg-purple-600/20 transition-colors"></div>
            
            <div className="w-14 h-14 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Headphones className="w-7 h-7" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">{t('human_support')}</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Precisa de ajuda mais complexa? Fale diretamente com um de nossos especialistas de suporte dedicados para resolver problemas específicos.
            </p>

            <div className="flex items-center gap-2 text-purple-400 text-sm font-bold">
              Falar com Especialista <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (view === 'automated') {
    return (
      <div className="animate-entry max-w-3xl mx-auto h-[calc(100vh-200px)] flex flex-col">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => setView('selection')}
            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">{t('automated_support')}</h2>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span> Online
            </p>
          </div>
        </div>

        <div className="flex-1 bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${msg.sender === 'user' ? 'bg-blue-600' : 'bg-white/10'}`}>
                    {msg.sender === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-blue-400" />}
                  </div>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white/10 text-gray-200 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-black/20">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-colors"
              />
              <button 
                type="submit"
                disabled={!input.trim()}
                className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Human Support View
  return (
    <div className="animate-entry max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => setView('selection')}
          className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white">{t('human_support')}</h2>
          <p className="text-sm text-gray-400">Escolha um canal para falar com nossa equipe.</p>
        </div>
      </div>

      <div className="space-y-4">
        <a 
          href="https://wa.me/5511999999999" // Replace with real number
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-5 bg-[#0a0a0a] border border-white/5 rounded-xl hover:bg-white/5 hover:border-green-500/30 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white group-hover:text-green-400 transition-colors">WhatsApp</h3>
              <p className="text-sm text-gray-500">Resposta média: 5 minutos</p>
            </div>
          </div>
          <ArrowLeft className="w-5 h-5 text-gray-500 rotate-180 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </a>

        <a 
          href="mailto:suporte@quantium.com"
          className="flex items-center justify-between p-5 bg-[#0a0a0a] border border-white/5 rounded-xl hover:bg-white/5 hover:border-blue-500/30 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">E-mail</h3>
              <p className="text-sm text-gray-500">Resposta média: 24 horas</p>
            </div>
          </div>
          <ArrowLeft className="w-5 h-5 text-gray-500 rotate-180 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </a>

        <a 
          href="tel:+5508001234567"
          className="flex items-center justify-between p-5 bg-[#0a0a0a] border border-white/5 rounded-xl hover:bg-white/5 hover:border-purple-500/30 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white group-hover:text-purple-400 transition-colors">Telefone</h3>
              <p className="text-sm text-gray-500">0800 123 4567 (Seg-Sex, 9h às 18h)</p>
            </div>
          </div>
          <ArrowLeft className="w-5 h-5 text-gray-500 rotate-180 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </a>
      </div>
      
      <div className="mt-8 p-4 bg-blue-900/10 border border-blue-500/20 rounded-xl flex gap-3">
        <div className="p-1">
           <Headphones className="w-5 h-5 text-blue-400" />
        </div>
        <p className="text-sm text-blue-200 leading-relaxed">
          Nossa equipe de suporte humano está disponível para resolver problemas complexos de conta, verificações de segurança e disputas de transações. Para dúvidas gerais, recomendamos o Suporte Automatizado para maior agilidade.
        </p>
      </div>
    </div>
  );
};