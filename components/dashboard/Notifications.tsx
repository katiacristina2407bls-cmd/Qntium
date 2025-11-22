import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  XCircle, 
  Gift, 
  Trash2, 
  Check, 
  Clock
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'promotion';
  read: boolean;
  created_at: string;
  action_link?: string;
}

export const Notifications: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Optional: Set up realtime subscription
    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user?.id}` }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking as read:', error);
      fetchNotifications(); // Revert on error
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length === 0) return;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'promotion': return <Gift className="w-5 h-5 text-purple-400" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500/10';
      case 'warning': return 'bg-yellow-500/10';
      case 'error': return 'bg-red-500/10';
      case 'promotion': return 'bg-purple-500/10';
      default: return 'bg-blue-500/10';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Agora';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min atrás`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} h atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.read);

  return (
    <div className="animate-entry max-w-4xl mx-auto pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">{t('notifications_title')}</h2>
          <p className="text-gray-400">{t('notifications_subtitle')}</p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={markAllAsRead}
             className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition-colors"
           >
             <Check className="w-4 h-4" />
             {t('mark_all_read')}
           </button>
           <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
             <button 
               onClick={() => setFilter('all')}
               className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'all' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
             >
               Todas
             </button>
             <button 
               onClick={() => setFilter('unread')}
               className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'unread' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
             >
               Não lidas
             </button>
           </div>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-[#0a0a0a] border border-white/5 rounded-xl animate-pulse"></div>
          ))
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[#0a0a0a] border border-white/5 rounded-2xl border-dashed">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{t('no_notifications')}</h3>
            <p className="text-gray-500 text-sm">{t('notifications_empty_state')}</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div 
              key={notification.id}
              onClick={() => !notification.read && markAsRead(notification.id)}
              className={`relative group p-4 md:p-6 rounded-xl border transition-all duration-300 cursor-pointer ${
                notification.read 
                  ? 'bg-[#0a0a0a] border-white/5 opacity-70 hover:opacity-100' 
                  : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04]'
              }`}
            >
              {!notification.read && (
                <div className="absolute top-6 right-6 w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]"></div>
              )}
              
              <div className="flex gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getBgColor(notification.type)}`}>
                  {getIcon(notification.type)}
                </div>
                
                <div className="flex-1 pr-6">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`font-bold text-base ${notification.read ? 'text-gray-300' : 'text-white'}`}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(notification.created_at)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-400 leading-relaxed mb-3">
                    {notification.message}
                  </p>

                  {notification.action_link && (
                    <a 
                      href={notification.action_link}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      Ver detalhes
                    </a>
                  )}
                </div>

                <button 
                  onClick={(e) => deleteNotification(notification.id, e)}
                  className="opacity-0 group-hover:opacity-100 absolute bottom-4 right-4 p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};