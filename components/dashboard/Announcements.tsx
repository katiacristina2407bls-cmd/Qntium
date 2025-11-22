import React, { useEffect, useState } from 'react';
import { 
  Megaphone, 
  Wrench, 
  Newspaper, 
  AlertTriangle, 
  Calendar,
  ChevronRight,
  Bell,
  Info
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'news' | 'maintenance' | 'update' | 'alert';
  priority: 'normal' | 'high' | 'critical';
  created_at: string;
  active: boolean;
}

export const Announcements: React.FC = () => {
  const { t } = useLanguage();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error: any) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'maintenance': return <Wrench className="w-5 h-5 text-yellow-400" />;
      case 'update': return <Bell className="w-5 h-5 text-blue-400" />;
      case 'alert': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default: return <Newspaper className="w-5 h-5 text-purple-400" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'maintenance': return 'Manutenção';
      case 'update': return 'Atualização';
      case 'alert': return 'Alerta';
      default: return 'Novidade';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'maintenance': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
      case 'update': return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      case 'alert': return 'bg-red-500/10 border-red-500/20 text-red-400';
      default: return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="animate-entry max-w-4xl mx-auto pb-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">{t('announcements_title')}</h2>
        <p className="text-gray-400">{t('announcements_subtitle')}</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-[#0a0a0a] border border-white/5 rounded-xl animate-pulse"></div>
          ))
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[#0a0a0a] border border-white/5 rounded-2xl border-dashed">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Megaphone className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{t('no_announcements')}</h3>
            <p className="text-gray-500 text-sm">{t('announcements_empty_state')}</p>
          </div>
        ) : (
          announcements.map((item) => (
            <div 
              key={item.id}
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              className={`bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer hover:border-blue-500/30 ${
                expandedId === item.id ? 'bg-white/[0.02]' : ''
              }`}
            >
              <div className="p-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getCategoryColor(item.category)}`}>
                      {getCategoryIcon(item.category)}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="font-bold text-white text-lg">{item.title}</h3>
                        <div className="flex gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded border uppercase font-bold tracking-wider ${getCategoryColor(item.category)}`}>
                            {getCategoryLabel(item.category)}
                          </span>
                          {item.priority === 'high' || item.priority === 'critical' ? (
                            <span className="text-xs px-2 py-0.5 rounded border bg-red-500/10 border-red-500/20 text-red-400 uppercase font-bold tracking-wider">
                              Prioridade
                            </span>
                          ) : null}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.created_at)}
                      </div>

                      <p className={`text-gray-400 text-sm leading-relaxed ${expandedId === item.id ? '' : 'line-clamp-2'}`}>
                        {item.content}
                      </p>
                    </div>
                  </div>

                  <button 
                    className={`p-2 rounded-full hover:bg-white/5 text-gray-500 transition-transform duration-300 ${expandedId === item.id ? 'rotate-90' : ''}`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Expandable Details */}
              {expandedId === item.id && (
                <div className="px-6 pb-6 pl-20 animate-in slide-in-from-top-2 fade-in duration-200">
                  {/* If we had more structured content like images or links, they would go here */}
                  <div className="flex items-center gap-2 text-xs text-blue-400 mt-2">
                    <Info className="w-3 h-3" />
                    <span>Comunicado oficial da equipe Quantium</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};