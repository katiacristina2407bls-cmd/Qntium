
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  LayoutDashboard, 
  PieChart, 
  ArrowLeftRight, 
  Wallet as WalletIcon, 
  Settings as SettingsIcon, 
  LogOut, 
  Bell, 
  Eye, 
  EyeOff, 
  TrendingUp,
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Search,
  Menu,
  Users,
  User,
  Megaphone,
  Headphones,
  Clock,
  Zap,
  Shield,
  Globe,
  Award,
  Briefcase,
  Sparkles,
  CheckCircle,
  X,
  ChevronRight,
  ShieldAlert,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Gift,
  Mail,
  Wrench,
  RefreshCw
} from 'lucide-react';
import { Marketplace } from './Marketplace';
import { Portfolio } from './Portfolio';
import { Wallet } from './Wallet';
import { Exchange } from './Exchange';
import { Settings } from './Settings';
import { Team } from './Team';
import { Notifications } from './Notifications';
import { Announcements } from './Announcements';
import { Support } from './Support';
import { Deposit } from './Deposit';
import { Withdraw } from './Withdraw';
import { PublicProfile } from './PublicProfile';
import { Admin } from './Admin';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';
import confetti from 'https://esm.sh/canvas-confetti@1.9.2';

interface DashboardProps {
  onLogout: () => void;
  showWelcome?: boolean;
  onWelcomeDismiss?: () => void;
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  asset: string;
  status: string;
  created_at: string;
  description?: string;
}

interface TourStep {
  target: string;
  title: string;
  content: string;
  position: 'right' | 'bottom' | 'left' | 'top';
}

interface RealtimeNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'promotion';
  created_at: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'tour-sidebar',
    title: 'Menu Principal',
    content: 'Navegue entre sua Carteira, Mercado de Investimentos, Câmbio e Configurações através deste menu lateral.',
    position: 'right'
  },
  {
    target: 'tour-balance',
    title: 'Seu Patrimônio',
    content: 'Visualize seu saldo total, rendimentos acumulados e realize operações rápidas como Depósitos e Saques.',
    position: 'bottom'
  },
  {
    target: 'tour-actions',
    title: 'Acesso Rápido',
    content: 'Atalhos para ver sua Equipe, Comunicados importantes e entrar em contato com o Suporte.',
    position: 'bottom'
  },
  {
    target: 'tour-notifications',
    title: 'Notificações',
    content: 'Fique por dentro de todas as novidades, alertas de segurança e atualizações de rendimentos.',
    position: 'left'
  },
  {
    target: 'tour-profile',
    title: 'Seu Perfil',
    content: 'Gerencie seus dados pessoais, segurança (2FA) e preferências de conta aqui.',
    position: 'left'
  }
];

export const Dashboard: React.FC<DashboardProps> = ({ onLogout, showWelcome = false, onWelcomeDismiss }) => {
  const { profile, user } = useAuth();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Real-time Notification Popup State
  const [newNotification, setNewNotification] = useState<RealtimeNotification | null>(null);
  
  // Offline Notifications Popup State
  const [offlineNotification, setOfflineNotification] = useState<{count: number} | null>(null);
  const hasCheckedOffline = useRef(false);

  // Welcome Modal State
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);

  // Maintenance Mode State
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceDetails, setMaintenanceDetails] = useState<{ end: Date } | null>(null);

  // Tour State
  const [tourStep, setTourStep] = useState(0); // 0 = inactive
  const [tourRect, setTourRect] = useState<DOMRect | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Transaction State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  // Active Investments State
  const [activeInvestments, setActiveInvestments] = useState<any[]>([]);
  const [loadingInvestments, setLoadingInvestments] = useState(true);
  
  // Growth Metrics
  const [portfolioGrowth, setPortfolioGrowth] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);

  // Layout Preference State
  const [mobileLayout, setMobileLayout] = useState<'sidebar' | 'bottom'>(() => {
    if (typeof window !== 'undefined') {
       const local = localStorage.getItem('quantium_mobile_layout');
       if (local === 'sidebar' || local === 'bottom') return local;
    }
    return profile?.mobile_layout || 'sidebar';
  });

  // Sync layout when profile changes
  useEffect(() => {
    if (profile?.mobile_layout) {
       setMobileLayout(profile.mobile_layout);
       localStorage.setItem('quantium_mobile_layout', profile.mobile_layout);
    }
  }, [profile]);

  // Check for Maintenance Mode
  useEffect(() => {
    const checkMaintenance = async () => {
        // Admins bypass maintenance
        if (profile?.is_admin) return;

        try {
            const { data } = await supabase
                .from('announcements')
                .select('content')
                .eq('category', 'maintenance')
                .eq('active', true)
                .order('created_at', { ascending: false });

            if (data && data.length > 0) {
                // Check the most recent maintenance schedule
                for (const ann of data) {
                    try {
                        const schedule = typeof ann.content === 'string' ? JSON.parse(ann.content) : ann.content;
                        if (schedule.scheduledStart && schedule.durationMinutes) {
                            const start = new Date(schedule.scheduledStart);
                            const end = new Date(start.getTime() + schedule.durationMinutes * 60000);
                            const now = new Date();

                            if (now >= start && now <= end) {
                                setIsMaintenance(true);
                                setMaintenanceDetails({ end });
                                return;
                            }
                        }
                    } catch (e) {
                        // Ignore non-JSON content
                    }
                }
            }
            setIsMaintenance(false);
        } catch (err) {
            console.error('Error checking maintenance:', err);
        }
    };

    checkMaintenance();
    // Periodic check every minute
    const interval = setInterval(checkMaintenance, 60000);
    return () => clearInterval(interval);
  }, [profile]);

  // Listen for local updates from Settings component
  useEffect(() => {
    const handleStorageUpdate = () => {
       const local = localStorage.getItem('quantium_mobile_layout');
       if (local === 'sidebar' || local === 'bottom') {
          setMobileLayout(local);
       }
    };
    window.addEventListener('local-storage-update', handleStorageUpdate);
    return () => window.removeEventListener('local-storage-update', handleStorageUpdate);
  }, []);

  // Auto-dismiss notification popup
  useEffect(() => {
    if (newNotification) {
      const timer = setTimeout(() => {
        setNewNotification(null);
      }, 6000); // Dismiss after 6 seconds
      return () => clearTimeout(timer);
    }
  }, [newNotification]);

  // Handle Welcome Animation
  useEffect(() => {
    if (showWelcome) {
      setIsWelcomeOpen(true);
      
      // Trigger Confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#3b82f6', '#8b5cf6', '#10b981']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#3b82f6', '#8b5cf6', '#10b981']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [showWelcome]);

  // Offline Notification Check (Welcome Back)
  useEffect(() => {
    const checkOfflineNotifications = async () => {
      if (!user || hasCheckedOffline.current) return;
      hasCheckedOffline.current = true;

      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('read', false);

        if (!error && count && count > 0) {
          setOfflineNotification({ count });
          // Auto dismiss after 8 seconds
          setTimeout(() => setOfflineNotification(null), 8000);
        }
      } catch (err) {
        console.error("Error checking offline notifications", err);
      }
    };

    if (user) {
      checkOfflineNotifications();
    }
  }, [user]);

  // Helper to just update the highlight position (rect) without scrolling
  const updateHighlight = useCallback(() => {
    if (tourStep > 0 && tourStep <= TOUR_STEPS.length) {
      const stepData = TOUR_STEPS[tourStep - 1];
      const el = document.getElementById(stepData.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTourRect(rect);
      }
    }
  }, [tourStep]);

  // Effect to handle step changes: Navigation + Scrolling + Initial Highlight
  useEffect(() => {
    if (tourStep > 0 && tourStep <= TOUR_STEPS.length) {
      const stepData = TOUR_STEPS[tourStep - 1];
      
      const prepareStep = () => {
        const el = document.getElementById(stepData.target);
        if (el) {
          // Scroll the element into view smoothly
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Set initial position (and update again shortly after scroll starts)
          const rect = el.getBoundingClientRect();
          setTourRect(rect);
          
          setTimeout(() => {
             const updatedRect = el.getBoundingClientRect();
             setTourRect(updatedRect);
          }, 150);
        }
      };

      // Handle Context Switching (Tab or Sidebar)
      if (stepData.target === 'tour-sidebar' && window.innerWidth < 1024 && !sidebarOpen) {
        setSidebarOpen(true);
        setTimeout(prepareStep, 300); // Wait for sidebar animation
      } else if (['tour-balance', 'tour-actions'].includes(stepData.target) && activeTab !== 'overview') {
        setActiveTab('overview');
        setTimeout(prepareStep, 300); // Wait for render
      } else if (['tour-profile', 'tour-notifications'].includes(stepData.target)) {
         // Header items are always visible
         prepareStep();
      } else {
         // General case
         setTimeout(prepareStep, 100);
      }
    }
  }, [tourStep, activeTab, sidebarOpen]);

  // Effect to track scrolling and resizing to update highlight position
  useEffect(() => {
    if (tourStep > 0) {
      window.addEventListener('resize', updateHighlight);
      const scroller = scrollContainerRef.current;
      if (scroller) {
        scroller.addEventListener('scroll', updateHighlight);
      }
      
      return () => {
        window.removeEventListener('resize', updateHighlight);
        if (scroller) {
          scroller.removeEventListener('scroll', updateHighlight);
        }
      };
    }
  }, [tourStep, updateHighlight]);

  const handleCloseWelcome = () => {
    setIsWelcomeOpen(false);
    if (onWelcomeDismiss) onWelcomeDismiss();
    
    // Check if tour has been completed
    const tourDone = localStorage.getItem('quantium_tour_completed');
    if (!tourDone) {
      setTimeout(() => {
        setTourStep(1);
      }, 500);
    }
  };

  const handleNextTourStep = () => {
    if (tourStep < TOUR_STEPS.length) {
      setTourStep(prev => prev + 1);
    } else {
      finishTour();
    }
  };

  const finishTour = () => {
    setTourStep(0);
    localStorage.setItem('quantium_tour_completed', 'true');
  };

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoadingTransactions(false);
    }
  }, [user]);

  const fetchInvestments = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('balance', { ascending: false });

      if (error) throw error;
      setActiveInvestments(data || []);

      // Calculate Growth
      if (data && data.length > 0) {
        const totalInitial = data.reduce((sum, inv) => sum + (inv.initial_investment || 0), 0);
        const totalCurrent = data.reduce((sum, inv) => sum + (inv.balance || 0), 0);
        
        const profit = totalCurrent - totalInitial;
        setTotalProfit(profit);

        if (totalInitial > 0) {
          const growth = ((totalCurrent - totalInitial) / totalInitial) * 100;
          setPortfolioGrowth(growth);
        } else {
          setPortfolioGrowth(0);
        }
      } else {
        setTotalProfit(0);
        setPortfolioGrowth(0);
      }

    } catch (err) {
      console.error('Error fetching investments:', err);
    } finally {
      setLoadingInvestments(false);
    }
  }, [user]);

  const fetchUnreadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (!error && count !== null) {
        setUnreadCount(count);
      }
    } catch (err) {
      console.error('Error fetching notifications count:', err);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchTransactions();
      fetchInvestments();
    }
    fetchUnreadNotifications();

    if (!user) return;

    // Subscribe to notifications to update count AND show popup
    const channel = supabase
      .channel('dashboard_notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user?.id}` }, (payload) => {
        fetchUnreadNotifications();
        
        // If it's a new insertion, show popup
        if (payload.eventType === 'INSERT') {
          setNewNotification(payload.new as RealtimeNotification);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab, fetchTransactions, fetchInvestments, fetchUnreadNotifications, user]);

  const menuItems = [
    { id: 'overview', label: t('overview'), icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'market', label: t('market'), icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'portfolio', label: t('portfolio'), icon: <PieChart className="w-5 h-5" /> },
    { id: 'wallet', label: t('wallet'), icon: <WalletIcon className="w-5 h-5" /> },
    { id: 'exchange', label: t('exchange'), icon: <ArrowLeftRight className="w-5 h-5" /> },
    { id: 'settings', label: t('settings'), icon: <SettingsIcon className="w-5 h-5" /> },
  ];

  if (profile?.is_admin) {
    menuItems.push({ 
      id: 'admin', 
      label: t('admin'), 
      icon: <ShieldAlert className="w-5 h-5" /> 
    });
  }

  // Bottom Navigation Items (Subset of menu items + Menu trigger)
  const bottomNavItems = [
    { id: 'overview', label: 'Início', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'market', label: 'Mercado', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'portfolio', label: 'Ativos', icon: <PieChart className="w-5 h-5" /> },
    { id: 'wallet', label: 'Carteira', icon: <WalletIcon className="w-5 h-5" /> },
    { id: 'menu', label: 'Menu', icon: <Menu className="w-5 h-5" />, action: () => setSidebarOpen(true) },
  ];

  const quickActions = [
    { 
      label: 'Equipe', 
      icon: <Users className="w-6 h-6" />, 
      color: 'text-blue-400', 
      bg: 'bg-blue-500/10', 
      hoverBg: 'group-hover:bg-blue-500',
      onClick: () => setActiveTab('team')
    },
    { 
      label: 'Perfil', 
      icon: <User className="w-6 h-6" />, 
      color: 'text-purple-400', 
      bg: 'bg-purple-500/10', 
      hoverBg: 'group-hover:bg-purple-500',
      onClick: () => setActiveTab('settings')
    },
    { 
      label: 'Comunicados', 
      icon: <Megaphone className="w-6 h-6" />, 
      color: 'text-orange-400', 
      bg: 'bg-orange-500/10', 
      hoverBg: 'group-hover:bg-orange-500',
      onClick: () => setActiveTab('announcements') 
    },
    { 
      label: 'Suporte', 
      icon: <Headphones className="w-6 h-6" />, 
      color: 'text-green-400', 
      bg: 'bg-green-500/10', 
      hoverBg: 'group-hover:bg-green-500',
      onClick: () => setActiveTab('support')
    },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();

    if (isToday) return `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    if (isYesterday) return `Ontem, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const getTxIcon = (type: string) => {
    if (['deposit', 'profit', 'transfer_in', 'sell'].includes(type)) {
      return <ArrowDownLeft className="w-4 h-4" />;
    }
    return <ArrowUpRight className="w-4 h-4" />;
  };

  const getTxColor = (type: string) => {
    if (['deposit', 'profit', 'transfer_in', 'sell'].includes(type)) {
      return 'text-green-400 bg-green-500/10 group-hover:bg-green-500/20';
    }
    return 'text-white bg-white/10 group-hover:bg-white/20';
  };

  // Notification Icon Helper
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-6 h-6 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-6 h-6 text-yellow-400" />;
      case 'error': return <AlertCircle className="w-6 h-6 text-red-400" />;
      case 'promotion': return <Gift className="w-6 h-6 text-purple-400" />;
      default: return <Info className="w-6 h-6 text-blue-400" />;
    }
  };

  // Notification Border Helper
  const getNotificationBorder = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-500/30 bg-green-500/5';
      case 'warning': return 'border-yellow-500/30 bg-yellow-500/5';
      case 'error': return 'border-red-500/30 bg-red-500/5';
      case 'promotion': return 'border-purple-500/30 bg-purple-500/5';
      default: return 'border-blue-500/30 bg-blue-500/5';
    }
  };

  // Determine header title
  const getHeaderTitle = () => {
    if (activeTab === 'team') return t('team');
    if (activeTab === 'notifications') return t('notifications_title');
    if (activeTab === 'announcements') return t('announcements_title');
    if (activeTab === 'support') return t('support_title');
    if (activeTab === 'deposit') return 'Depósito';
    if (activeTab === 'withdraw') return 'Saque';
    if (activeTab === 'public_profile') return 'Perfil Público';
    const item = menuItems.find(i => i.id === activeTab);
    return item ? item.label : '';
  };

  // Calculate Total Balance (Balance + Commission)
  const totalBalance = (profile?.balance || 0) + (profile?.commission_balance || 0);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex overflow-hidden selection:bg-blue-500/30">
      
      {/* Custom Animations */}
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes growBar {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-entry {
          animation: slideUpFade 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .animate-bar {
          animation: growBar 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: bottom;
          transform: scaleY(0);
        }
        .delay-0 { animation-delay: 0ms; }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
      `}</style>

      {/* System Maintenance Blocking Overlay */}
      {isMaintenance && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-500">
           <div className="max-w-md w-full text-center relative">
              {/* Glow effect */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col items-center">
                 <div className="w-24 h-24 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mb-8 border border-blue-500/20 animate-[pulse_3s_ease-in-out_infinite]">
                    <Wrench className="w-10 h-10" />
                 </div>
                 
                 <h2 className="text-3xl font-bold text-white mb-4">Sistema em Atualização</h2>
                 <p className="text-gray-300 text-lg leading-relaxed mb-8">
                    Estamos atualizando nossos sistemas para melhorar sua experiência. O painel ficará indisponível temporariamente.
                 </p>
                 
                 {maintenanceDetails && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 w-full">
                       <p className="text-sm text-gray-400 mb-1">Previsão de retorno</p>
                       <p className="text-white font-mono font-bold text-xl">
                          {maintenanceDetails.end.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
                       </p>
                    </div>
                 )}

                 <div className="flex items-center gap-2 text-blue-400 text-sm font-medium bg-blue-500/10 px-4 py-2 rounded-full">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Por favor, verifique novamente mais tarde
                 </div>
              </div>
           </div>
        </div>,
        document.body
      )}

      {/* Offline Notifications Popup (Welcome Back) */}
      {offlineNotification && createPortal(
        <div className="fixed top-24 right-6 z-[150] w-full max-w-sm rounded-2xl p-4 shadow-2xl backdrop-blur-md border bg-[#0a0a0a]/95 border-blue-500/30 animate-in slide-in-from-right-full fade-in duration-500">
          <div className="flex items-start gap-3">
             <div className="p-2 rounded-full bg-blue-500/10 flex-shrink-0">
               <Bell className="w-6 h-6 text-blue-400" />
             </div>
             <div className="flex-1 pt-1 cursor-pointer" onClick={() => {
               setActiveTab('notifications');
               setOfflineNotification(null);
             }}>
               <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Enquanto você estava offline</h4>
               <p className="text-sm text-white font-semibold">
                 Você recebeu {offlineNotification.count} notificações novas.
               </p>
               <p className="text-xs text-gray-400 mt-1">Toque para visualizar.</p>
             </div>
             <button 
               onClick={() => setOfflineNotification(null)}
               className="p-1 text-gray-500 hover:text-white transition-colors hover:bg-white/10 rounded-lg"
             >
               <X className="w-4 h-4" />
             </button>
          </div>
          {/* Progress bar for auto dismiss */}
          <div className="absolute bottom-0 left-0 h-1 bg-blue-500/20 rounded-b-2xl overflow-hidden w-full">
             <div className="h-full bg-blue-500 w-full animate-[shrink_8s_linear_forwards]" style={{ animationName: 'shrink', animationDuration: '8s' }}></div>
          </div>
        </div>,
        document.body
      )}

      {/* Real-time Notification Popup */}
      {newNotification && createPortal(
        <div className={`fixed top-6 right-6 z-[150] w-full max-w-sm rounded-2xl p-4 shadow-2xl backdrop-blur-md border animate-in slide-in-from-right-full fade-in duration-500 ${getNotificationBorder(newNotification.type)}`}>
          <div className="flex items-start gap-3">
             <div className="p-2 rounded-full bg-white/5 flex-shrink-0">
               {getNotificationIcon(newNotification.type)}
             </div>
             <div className="flex-1 pt-1">
               <h4 className="text-sm font-bold text-white mb-1">{newNotification.title}</h4>
               <p className="text-xs text-gray-300 leading-relaxed">{newNotification.message}</p>
             </div>
             <button 
               onClick={() => setNewNotification(null)}
               className="p-1 text-gray-500 hover:text-white transition-colors hover:bg-white/10 rounded-lg"
             >
               <X className="w-4 h-4" />
             </button>
          </div>
          {/* Progress bar for auto dismiss */}
          <div className="absolute bottom-0 left-0 h-1 bg-white/20 rounded-b-2xl overflow-hidden w-full">
             <div className="h-full bg-white/50 w-full animate-[shrink_6s_linear_forwards]" style={{ animationName: 'shrink', animationDuration: '6s' }}></div>
          </div>
          <style>{`
            @keyframes shrink {
              from { width: 100%; }
              to { width: 0%; }
            }
          `}</style>
        </div>,
        document.body
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        id="tour-sidebar"
        className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0a0a0a] border-r border-white/5 transform transition-transform duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-20 flex items-center px-8 border-b border-white/5">
          <div className="flex items-center gap-2 text-blue-500 group cursor-pointer">
            <div className="bg-blue-600 p-1.5 rounded-lg group-hover:shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-shadow duration-300">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">Quantium</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] translate-x-1' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#050505] relative">
        
        {/* Background Glow */}
        <div className="absolute top-0 left-0 w-full h-96 bg-blue-900/10 blur-[100px] pointer-events-none" />

        {/* Topbar */}
        <header className="h-20 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 animate-entry delay-0">
          <div className="flex items-center gap-4">
            {/* Only show hamburger if layout is 'sidebar' or if we are on desktop */}
            {(mobileLayout === 'sidebar') && (
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-400 hover:text-white"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
            <h1 className="text-xl font-semibold hidden sm:block tracking-tight">
              {getHeaderTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center bg-white/5 rounded-full px-4 py-2 border border-white/5 focus-within:border-blue-500/50 transition-colors hover:bg-white/10">
              <Search className="w-4 h-4 text-gray-500 mr-2" />
              <input 
                type="text" 
                placeholder={t('search')} 
                className="bg-transparent border-none focus:outline-none text-sm text-white w-48 placeholder-gray-500"
              />
            </div>

            <button 
              id="tour-notifications"
              onClick={() => setActiveTab('notifications')}
              className={`relative p-2 text-gray-400 hover:text-white transition-colors group ${activeTab === 'notifications' ? 'text-blue-400' : ''}`}
            >
              <Bell className="w-5 h-5 group-hover:animate-swing" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-[#050505] animate-pulse"></span>
              )}
            </button>

            <div 
              id="tour-profile"
              onClick={() => setActiveTab('public_profile')} // Changed to public_profile
              className="flex items-center gap-3 pl-6 border-l border-white/10 cursor-pointer group"
            >
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                  {profile?.full_name || 'Investidor'}
                </p>
                <p className="text-xs text-gray-500">Conta Premium</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-[#050505] shadow-lg group-hover:scale-110 transition-transform flex items-center justify-center overflow-hidden">
                 {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                    <User className="w-5 h-5 text-white/50" />
                 )}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        {/* Added extra padding bottom if using bottom nav */}
        <div ref={scrollContainerRef} className={`flex-1 overflow-y-auto p-6 lg:p-10 pb-24 ${mobileLayout === 'bottom' ? 'pb-32' : 'pb-24'} scroll-smooth`}>
          <div className="max-w-6xl mx-auto">

            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Balance Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-entry delay-100">
                  {/* Main Balance Card */}
                  <div id="tour-balance" className="lg:col-span-2 bg-gradient-to-br from-blue-900/20 to-black border border-blue-500/20 rounded-2xl p-8 relative overflow-hidden group hover:border-blue-500/40 transition-all duration-500 hover:shadow-[0_0_30px_rgba(37,99,235,0.1)]">
                    <div className="absolute top-0 right-0 p-32 bg-blue-600/10 blur-[80px] rounded-full -mr-10 -mt-10 pointer-events-none group-hover:bg-blue-600/20 transition-colors duration-700"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-2 text-blue-300">
                        <span className="text-sm font-medium uppercase tracking-wider">{t('total_balance')}</span>
                        <button onClick={() => setShowBalance(!showBalance)} className="hover:text-white transition-colors p-1 hover:bg-white/5 rounded">
                          {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                      
                      <div className="flex items-baseline gap-2 mb-6">
                        <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                          {showBalance 
                            ? `R$ ${(totalBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                            : 'R$ ••••••••'}
                        </h2>
                        {showBalance && (
                          <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-entry delay-200 ${
                            portfolioGrowth >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {portfolioGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {portfolioGrowth > 0 ? '+' : ''}{portfolioGrowth.toFixed(2)}%
                          </span>
                        )}
                      </div>

                      <div className="flex gap-3 flex-wrap">
                        <button 
                          onClick={() => setActiveTab('deposit')}
                          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" /> {t('deposit')}
                        </button>
                        <button 
                          onClick={() => setActiveTab('withdraw')}
                          className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-lg border border-white/10 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                        >
                          <ArrowUpRight className="w-4 h-4" /> {t('withdraw')}
                        </button>
                        <button 
                          onClick={() => setActiveTab('exchange')}
                          className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-lg border border-white/10 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                        >
                          <ArrowLeftRight className="w-4 h-4" /> {t('convert')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats / Mini Chart */}
                  <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:border-white/10 transition-colors group">
                    <div>
                      <h3 className="text-gray-400 text-sm font-medium mb-1">Rendimento Total</h3>
                      <div className={`text-2xl font-bold transition-colors ${totalProfit >= 0 ? 'text-green-400 group-hover:text-green-300' : 'text-red-400 group-hover:text-red-300'}`}>
                        {totalProfit > 0 ? '+' : ''} R$ {Math.abs(totalProfit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    
                    {/* CSS Only Chart visualization with Animation */}
                    <div className="h-24 w-full flex items-end gap-1 mt-4 overflow-hidden">
                      {[40, 65, 50, 80, 55, 90, 70, 85, 60, 95].map((h, i) => (
                        <div 
                          key={i} 
                          style={{ height: `${h}%`, animationDelay: `${(i * 50) + 400}ms` }} 
                          className="flex-1 bg-blue-600/20 hover:bg-blue-500 transition-all duration-300 rounded-t-sm animate-bar"
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Actions Section */}
                <div id="tour-actions" className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-entry delay-200">
                  {quickActions.map((action, idx) => (
                    <button 
                      key={idx}
                      onClick={action.onClick}
                      className="flex flex-col items-center justify-center p-5 bg-[#0a0a0a] border border-white/5 rounded-xl hover:bg-white/5 hover:border-white/10 hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                    >
                      <div className={`p-3 rounded-full mb-3 transition-all duration-300 group-hover:scale-110 group-hover:text-white ${action.bg} ${action.color} ${action.hoverBg}`}>
                        {action.icon}
                      </div>
                      <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">
                        {action.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Main Grid: Assets & Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-entry delay-300">
                  
                  {/* Assets List */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-white">Seus Ativos</h3>
                      <button 
                        onClick={() => setActiveTab('portfolio')}
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Ver todos
                      </button>
                    </div>

                    <div className="space-y-3">
                      {loadingInvestments ? (
                         <div className="h-40 flex items-center justify-center">
                            <Clock className="w-6 h-6 animate-spin text-gray-500" />
                         </div>
                      ) : activeInvestments.length > 0 ? (
                        activeInvestments.map((investment, index) => {
                            // Determine color/icon based on theme
                            let icon = <Briefcase className="w-5 h-5" />;
                            let colorClass = "text-gray-400 bg-gray-500/10";
                            
                            switch(investment.color_theme) {
                                case 'purple': 
                                    icon = <Zap className="w-5 h-5" />; 
                                    colorClass = "text-purple-400 bg-purple-500/10";
                                    break;
                                case 'blue': 
                                    icon = <Shield className="w-5 h-5" />; 
                                    colorClass = "text-blue-400 bg-blue-500/10";
                                    break;
                                case 'orange': 
                                    icon = <TrendingUp className="w-5 h-5" />; 
                                    colorClass = "text-orange-400 bg-orange-500/10";
                                    break;
                                case 'green': 
                                    icon = <Globe className="w-5 h-5" />; 
                                    colorClass = "text-emerald-400 bg-emerald-500/10";
                                    break;
                                case 'yellow': 
                                    icon = <Award className="w-5 h-5" />; 
                                    colorClass = "text-yellow-400 bg-yellow-500/10";
                                    break;
                            }

                            return (
                              <div 
                                key={investment.id} 
                                className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-white/5 rounded-xl hover:border-blue-500/30 hover:bg-white/5 transition-all cursor-pointer group animate-entry"
                                style={{ animationDelay: `${index * 100}ms` }}
                                onClick={() => setActiveTab('portfolio')}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass} group-hover:scale-110 transition-transform`}>
                                    {icon}
                                  </div>
                                  <div>
                                    <div className="font-bold text-white group-hover:text-blue-400 transition-colors">{investment.name}</div>
                                    <div className="text-sm text-gray-500">{investment.type}</div>
                                  </div>
                                </div>
                                
                                <div className="text-right">
                                  <div className="font-bold text-white">
                                      R$ {showBalance ? investment.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '••••••'}
                                  </div>
                                  <div className="text-sm text-gray-500 flex items-center justify-end gap-2">
                                    <span className={investment.total_return_percent >= 0 ? 'text-green-400' : 'text-red-400'}>
                                      {investment.total_return_percent > 0 ? '+' : ''}{investment.total_return_percent}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                        })
                      ) : (
                         <div className="p-8 text-center border border-white/5 rounded-xl border-dashed">
                            <p className="text-gray-400 mb-2">Você não possui investimentos ativos.</p>
                            <button onClick={() => setActiveTab('market')} className="text-blue-400 text-sm hover:underline">Ir para o Mercado</button>
                         </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white">Atividade Recente</h3>
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-2 hover:border-white/10 transition-colors h-full max-h-[400px] flex flex-col">
                      {loadingTransactions ? (
                        <div className="flex-1 flex items-center justify-center text-gray-500 gap-2 p-8">
                          <Clock className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Carregando...</span>
                        </div>
                      ) : transactions.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-gray-500 p-8 text-sm">
                          Nenhuma transação recente.
                        </div>
                      ) : (
                        <div className="overflow-y-auto custom-scrollbar">
                          {transactions.map((tx, idx) => (
                            <div 
                              key={tx.id} 
                              className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-all group cursor-default border-b border-white/5 last:border-0"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg transition-colors ${getTxColor(tx.type)}`}>
                                  {getTxIcon(tx.type)}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-white group-hover:text-gray-200 capitalize">
                                    {tx.description || tx.type}
                                  </div>
                                  <div className="text-xs text-gray-500">{formatDate(tx.created_at)}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`text-sm font-medium ${['deposit', 'profit', 'transfer_in', 'sell'].includes(tx.type) ? 'text-green-400' : 'text-white'}`}>
                                  {['deposit', 'profit', 'transfer_in', 'sell'].includes(tx.type) ? '+' : '-'} 
                                  {showBalance ? ` ${Number(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '••••'}
                                </div>
                                <div className="text-xs text-gray-500">{tx.asset} • {tx.status === 'completed' ? 'Concluído' : tx.status}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <button 
                        onClick={() => setActiveTab('wallet')}
                        className="w-full mt-auto py-3 text-sm text-gray-400 hover:text-white border-t border-white/5 transition-colors hover:bg-white/5 rounded-b-xl"
                      >
                        Ver histórico completo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'market' && (
              <Marketplace />
            )}

            {activeTab === 'portfolio' && (
              <Portfolio onNavigateToMarketplace={() => setActiveTab('market')} />
            )}

            {activeTab === 'wallet' && (
              <Wallet onNavigateToDeposit={() => setActiveTab('deposit')} onNavigateToWithdraw={() => setActiveTab('withdraw')} />
            )}

            {activeTab === 'team' && (
              <Team />
            )}

            {activeTab === 'exchange' && (
              <Exchange />
            )}
            
            {activeTab === 'settings' && (
              <Settings />
            )}

            {activeTab === 'admin' && (
              <Admin />
            )}

            {activeTab === 'notifications' && (
              <Notifications />
            )}

            {activeTab === 'announcements' && (
              <Announcements />
            )}
            
            {activeTab === 'support' && (
              <Support />
            )}

            {activeTab === 'deposit' && (
              <Deposit onBack={() => setActiveTab('overview')} />
            )}

            {activeTab === 'withdraw' && (
              <Withdraw onBack={() => setActiveTab('overview')} onNavigateToWallet={() => setActiveTab('wallet')} />
            )}

            {activeTab === 'public_profile' && (
              <PublicProfile onEditProfile={() => setActiveTab('settings')} />
            )}

          </div>
        </div>
      </main>

      {/* Bottom Navigation - Only Visible on Mobile if enabled */}
      {mobileLayout === 'bottom' && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 px-4 py-2 z-40 flex justify-between items-center pb-6">
           {bottomNavItems.map((item) => (
             <button
               key={item.id}
               onClick={() => item.action ? item.action() : setActiveTab(item.id)}
               className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-all ${
                 activeTab === item.id 
                 ? 'text-blue-400' 
                 : 'text-gray-500 hover:text-white'
               }`}
             >
                <div className={`transition-transform ${activeTab === item.id ? 'scale-110' : ''}`}>
                  {item.icon}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
             </button>
           ))}
        </div>
      )}

      {/* Tour Overlay */}
      {tourStep > 0 && (
        <div className="fixed inset-0 z-[60]">
          {/* Dark Backdrop with Hole (using boxShadow on highlight element) */}
          <div className="absolute inset-0 pointer-events-auto" />

          {tourRect && (
            <>
               {/* Spotlight - The "hole" via box shadow */}
               <div 
                  style={{ 
                    top: tourRect.top - 8, 
                    left: tourRect.left - 8, 
                    width: tourRect.width + 16, 
                    height: tourRect.height + 16,
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)'
                  }}
                  className="absolute rounded-xl transition-all duration-500 ease-in-out pointer-events-none"
               >
                 <div className="absolute inset-0 rounded-xl border-2 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)] animate-pulse"></div>
               </div>
               
               {/* Tooltip Card */}
               <div 
                 style={{
                    top: TOUR_STEPS[tourStep-1].position === 'bottom' ? tourRect.bottom + 24 : 
                         TOUR_STEPS[tourStep-1].position === 'top' ? tourRect.top - 180 : 
                         tourRect.top,
                    left: TOUR_STEPS[tourStep-1].position === 'right' ? tourRect.right + 24 : 
                          TOUR_STEPS[tourStep-1].position === 'left' ? tourRect.left - 340 : 
                          tourRect.left,
                 }}
                 className="absolute w-80 bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-300 z-[70]"
               >
                  <div className="flex justify-between items-start mb-4">
                     <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                        Passo {tourStep} de {TOUR_STEPS.length}
                     </span>
                     <button onClick={finishTour} className="text-gray-500 hover:text-white">
                        <X size={16} />
                     </button>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{TOUR_STEPS[tourStep-1].title}</h3>
                  <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                     {TOUR_STEPS[tourStep-1].content}
                  </p>
                  <div className="flex justify-between items-center">
                     <button onClick={finishTour} className="text-sm text-gray-500 hover:text-white transition-colors">
                        Pular Tour
                     </button>
                     <button 
                        onClick={handleNextTourStep} 
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                     >
                        {tourStep === TOUR_STEPS.length ? 'Concluir' : 'Próximo'}
                        {tourStep !== TOUR_STEPS.length && <ChevronRight size={14} />}
                     </button>
                  </div>
               </div>
            </>
          )}
          
        </div>
      )}

      {/* Welcome Modal for First Time Users */}
      {isWelcomeOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in" onClick={handleCloseWelcome}></div>
          <div className="relative bg-[#0f0f0f] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 p-8 overflow-hidden text-center">
            
            {/* Decorative Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-48 bg-blue-600/20 blur-[80px] pointer-events-none"></div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-600/20 rounded-full blur-[40px]"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(59,130,246,0.5)] animate-bounce">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-2">Bem-vindo à Quantium!</h2>
              <p className="text-gray-300 mb-8 leading-relaxed">
                Sua conta foi configurada com sucesso. Você está pronto para explorar o futuro dos investimentos.
              </p>

              <div className="w-full space-y-3 mb-8 text-left">
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-sm text-gray-300">Perfil verificado</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-sm text-gray-300">Carteira Digital Ativa</span>
                </div>
              </div>

              <button 
                onClick={handleCloseWelcome}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all transform hover:scale-[1.02] active:scale-95"
              >
                Começar a Investir
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
