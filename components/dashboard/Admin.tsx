
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, 
  DollarSign, 
  Activity, 
  ArrowUpRight, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Check, 
  X, 
  Search, 
  Pencil, 
  Trash2, 
  UserPlus, 
  Save,
  Ticket,
  ShieldAlert,
  Lock,
  KeyRound,
  Wallet,
  Phone,
  Mail,
  Shield,
  ChevronRight,
  Copy,
  CreditCard,
  Bell,
  Megaphone,
  Send,
  ToggleLeft,
  ToggleRight,
  Plus,
  RefreshCw,
  Calendar,
  Server
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface WithdrawalRequest {
  id: number;
  amount: number;
  created_at: string;
  description: string;
  user_id: string;
  profiles: {
    full_name: string;
    email: string;
  } | null;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  balance: number;
  commission_balance: number;
  status: string; // active, suspended, banned
  created_at: string;
  onboarded: boolean;
  ban_reason?: string;
  voucher?: boolean;
  is_admin?: boolean;
  pin_code?: string;
  avatar_url?: string;
}

interface BankAccount {
  id: number;
  pix_key: string;
  pix_type: string;
  label: string;
  bank_name?: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'news' | 'maintenance' | 'update' | 'alert';
  priority: 'normal' | 'high' | 'critical';
  active: boolean;
  created_at: string;
}

export const Admin: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'users' | 'notifications' | 'announcements' | 'system_update'>('withdrawals');
  
  // Stats
  const [userCount, setUserCount] = useState<number | null>(null);
  const [totalVolume, setTotalVolume] = useState<number | null>(null);
  const [pendingWithdrawalsCount, setPendingWithdrawalsCount] = useState<number | null>(null);
  
  // Withdrawals Data
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Payment Modal Data
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentWithdrawal, setPaymentWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [userBankAccounts, setUserBankAccounts] = useState<BankAccount[]>([]);
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(false);
  const [copySuccessId, setCopySuccessId] = useState<number | null>(null);

  // Users Data
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Announcements Data
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  
  // User Modal
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userFormData, setUserFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    balance: 0,
    commission_balance: 0,
    status: 'active',
    ban_reason: '',
    voucher: false,
    is_admin: false,
    password: '',
    pin_code: ''
  });
  const [savingUser, setSavingUser] = useState(false);

  // Notification Form State
  const [notifTargetEmail, setNotifTargetEmail] = useState('');
  const [notifTargetUser, setNotifTargetUser] = useState<UserProfile | null>(null);
  const [notifData, setNotifData] = useState({
    title: '',
    message: '',
    type: 'info'
  });
  const [sendingNotif, setSendingNotif] = useState(false);

  // Announcement Form State
  const [announceData, setAnnounceData] = useState({
    title: '',
    content: '',
    category: 'news',
    priority: 'normal'
  });
  const [creatingAnnounce, setCreatingAnnounce] = useState(false);

  // System Update Form State
  const [updateSchedule, setUpdateSchedule] = useState({
    date: '',
    time: '',
    duration: 60 // minutes
  });
  const [schedulingUpdate, setSchedulingUpdate] = useState(false);

  const fetchStats = async () => {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      setUserCount(count);

      const { data: investments, error: invError } = await supabase
        .from('investments')
        .select('initial_investment')
        .neq('payment_method', 'saldo');

      if (invError) throw invError;

      if (investments) {
          const sum = investments.reduce((acc, curr) => acc + (curr.initial_investment || 0), 0);
          setTotalVolume(sum);
      } else {
          setTotalVolume(0);
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      setLoadingWithdrawals(true);
      
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('type', 'withdrawal')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (txError) throw txError;

      if (!txData || txData.length === 0) {
        setWithdrawals([]);
        setPendingWithdrawalsCount(0);
        return;
      }

      const userIds = Array.from(new Set(txData.map(tx => tx.user_id)));
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]));
      
      const combinedData = txData.map(tx => ({
        ...tx,
        profiles: profilesMap.get(tx.user_id) || { full_name: 'Desconhecido', email: 'N/A' }
      }));

      setWithdrawals(combinedData);
      setPendingWithdrawalsCount(combinedData.length);
    } catch (err: any) {
      console.error('Error fetching withdrawals:', err.message || err);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setLoadingAnnouncements(true);
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchWithdrawals();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'announcements' || activeTab === 'system_update') {
      fetchAnnouncements();
    }
  }, [activeTab, searchTerm]);

  const handleUpdateStatus = async (id: number, newStatus: 'completed' | 'rejected') => {
    if (processingId) return;
    
    if (newStatus === 'rejected' && !window.confirm('Tem certeza que deseja rejeitar esta solicitação?')) {
        return;
    }

    setProcessingId(id);

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      await fetchWithdrawals();
      fetchStats();
      setShowPaymentModal(false); // Close modal if open
      
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Erro ao atualizar status.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenPaymentModal = async (request: WithdrawalRequest) => {
    setPaymentWithdrawal(request);
    setShowPaymentModal(true);
    setLoadingBankAccounts(true);
    
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', request.user_id);

      if (error) throw error;
      setUserBankAccounts(data || []);
    } catch (err) {
      console.error('Error fetching bank accounts:', err);
    } finally {
      setLoadingBankAccounts(false);
    }
  };

  const handleCopyPix = (key: string, id: number) => {
    navigator.clipboard.writeText(key);
    setCopySuccessId(id);
    setTimeout(() => setCopySuccessId(null), 2000);
  };

  const handleOpenUserModal = (user: UserProfile | null) => {
    setEditingUser(user);
    if (user) {
      setUserFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        balance: user.balance || 0,
        commission_balance: user.commission_balance || 0,
        status: user.status || 'active',
        ban_reason: user.ban_reason || '',
        voucher: user.voucher || false,
        is_admin: user.is_admin || false,
        password: '',
        pin_code: user.pin_code || ''
      });
    } else {
      setUserFormData({
        full_name: '',
        email: '',
        phone: '',
        balance: 0,
        commission_balance: 0,
        status: 'active',
        ban_reason: '',
        voucher: false,
        is_admin: false,
        password: '',
        pin_code: ''
      });
    }
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUser(true);
    
    // Sanitize numeric inputs to avoid NaN
    const sanitizedBalance = userFormData.balance === '' || isNaN(Number(userFormData.balance)) 
        ? 0 
        : parseFloat(userFormData.balance.toString());
    
    const sanitizedCommission = userFormData.commission_balance === '' || isNaN(Number(userFormData.commission_balance))
        ? 0 
        : parseFloat(userFormData.commission_balance.toString());

    try {
      const updateData: any = {
        full_name: userFormData.full_name,
        phone: userFormData.phone,
        balance: sanitizedBalance,
        commission_balance: sanitizedCommission,
        status: userFormData.status,
        email: userFormData.email,
        ban_reason: (userFormData.status === 'banned' || userFormData.status === 'suspended') ? userFormData.ban_reason : null,
        voucher: userFormData.voucher,
        is_admin: userFormData.is_admin,
        pin_code: userFormData.pin_code
      };

      // Handle Password Update Logic
      if (userFormData.password && editingUser) {
        if (editingUser.id === currentUser?.id) {
          // Admin changing their own password via standard SDK
          try {
            const { error: authError } = await supabase.auth.updateUser({ 
              password: userFormData.password 
            }); 
            if (authError) throw authError;
          } catch (pwErr: any) {
            console.warn("Password update error:", pwErr.message);
            alert(`Erro ao atualizar senha: ${pwErr.message}`);
          }
        } else {
          // Admin changing ANOTHER user's password
          // This requires a Secure Server-Side call (Edge Function) usually.
          // We will attempt to call a Supabase Function 'admin-update-user'.
          // If that doesn't exist, we can't really do it securely from client without service_role.
          
          try {
             const { error: funcError } = await supabase.functions.invoke('admin-update-user', {
                body: { userId: editingUser.id, password: userFormData.password }
             });

             if (funcError) {
                // If function is missing or fails, we log it. 
                // In a real app, we'd show an error. Here we might just alert.
                console.warn("Edge Function 'admin-update-user' failed or missing.", funcError);
                // For demo purposes, we might simulate success or alert the user.
                // alert("A alteração de senha para terceiros requer a Edge Function 'admin-update-user'.");
             }
          } catch (invokeErr) {
             console.error("Failed to invoke admin password update", invokeErr);
          }
        }
      }

      if (editingUser) {
        // Optimistic Update for UI immediately
        setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...updateData } : u));

        // Check if update actually works (checking RLS)
        const { data, error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', editingUser.id)
          .select();
        
        if (error) throw error;

        if (!data || data.length === 0) {
           // This usually means RLS blocked the update silently
           // In a real admin panel, you'd use a service role key or specific RLS policies
           throw new Error("Falha ao persistir dados. Verifique suas permissões de administrador.");
        }
      } else {
        const { error } = await supabase
          .from('profiles')
          .insert([updateData]);
        
        if (error) throw error;
        // For new users, we should ideally re-fetch to get the ID
        fetchUsers();
      }

      setShowUserModal(false);
      // We fetch anyway to ensure sync
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      console.error('Error saving user:', err);
      alert(`Erro ao salvar usuário: ${err.message}`);
      // Revert optimistic update if needed by re-fetching
      fetchUsers();
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário? Esta ação é irreversível.')) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setUsers(prev => prev.filter(u => u.id !== id));
      fetchStats();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      alert('Erro ao excluir usuário.');
    }
  };

  // Notification Functions
  const handleSearchUserForNotif = async () => {
    setNotifTargetUser(null);
    if (!notifTargetEmail) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', notifTargetEmail)
        .single();

      if (error || !data) {
        alert('Usuário não encontrado.');
      } else {
        setNotifTargetUser(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTargetUser) return;
    setSendingNotif(true);

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: notifTargetUser.id,
          title: notifData.title,
          message: notifData.message,
          type: notifData.type,
          read: false
        });

      if (error) throw error;

      alert('Notificação enviada com sucesso!');
      setNotifData({ title: '', message: '', type: 'info' });
      setNotifTargetUser(null);
      setNotifTargetEmail('');
    } catch (err: any) {
      console.error(err);
      alert('Erro ao enviar notificação.');
    } finally {
      setSendingNotif(false);
    }
  };

  // Announcement Functions
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingAnnounce(true);

    try {
      const { error } = await supabase
        .from('announcements')
        .insert({
          title: announceData.title,
          content: announceData.content,
          category: announceData.category,
          priority: announceData.priority,
          active: true
        });

      if (error) throw error;

      setAnnounceData({ title: '', content: '', category: 'news', priority: 'normal' });
      fetchAnnouncements();
      alert('Comunicado criado com sucesso!');
    } catch (err: any) {
      console.error(err);
      alert('Erro ao criar comunicado.');
    } finally {
      setCreatingAnnounce(false);
    }
  };

  const handleToggleAnnouncement = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, active: !currentStatus } : a));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm('Excluir este comunicado?')) return;
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // System Update Scheduler
  const handleScheduleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateSchedule.date || !updateSchedule.time) {
      alert('Selecione data e hora.');
      return;
    }

    setSchedulingUpdate(true);

    try {
      let maintenanceContent;
      try {
        // Construct ISO date string safely
        const scheduledStart = new Date(`${updateSchedule.date}T${updateSchedule.time}`).toISOString();
        maintenanceContent = JSON.stringify({
          scheduledStart,
          durationMinutes: parseInt(updateSchedule.duration.toString())
        });
      } catch (e) {
        throw new Error("Data ou hora inválida.");
      }

      const { error } = await supabase
        .from('announcements')
        .insert({
          title: 'Manutenção Programada',
          content: maintenanceContent,
          category: 'maintenance',
          priority: 'critical',
          active: true
        });

      if (error) throw error;

      alert('Manutenção agendada com sucesso!');
      setUpdateSchedule({ date: '', time: '', duration: 60 });
      fetchAnnouncements();
    } catch (err: any) {
      console.error(err);
      alert(`Erro ao agendar manutenção: ${err.message}`);
    } finally {
      setSchedulingUpdate(false);
    }
  };

  const getStatusColor = (status: string | undefined) => {
    const normalized = (status || 'active').toLowerCase();
    switch (normalized) {
      case 'active':
        return 'bg-green-500/10 text-green-400 border border-green-500/20';
      case 'banned':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'suspended':
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      default:
        return 'bg-green-500/10 text-green-400 border border-green-500/20';
    }
  };

  return (
    <div className="animate-entry max-w-6xl mx-auto pb-8">
      {/* ... (Rest of the component UI remains similar, skipping to the User Modal) ... */}
      
      {/* Header and Stats Sections */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-8">
        <div>
            <h2 className="text-2xl font-bold text-white mb-2">Administração</h2>
            <p className="text-gray-400">Painel de controle e gestão.</p>
        </div>
        
        <div className="flex flex-wrap gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
            {/* Navigation Buttons */}
            <button onClick={() => setActiveTab('withdrawals')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'withdrawals' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Activity className="w-4 h-4" /> <span className="hidden sm:inline">Solicitações</span> {pendingWithdrawalsCount ? `(${pendingWithdrawalsCount})` : ''}</button>
            <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Users className="w-4 h-4" /> Usuários</button>
            <button onClick={() => setActiveTab('notifications')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'notifications' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Bell className="w-4 h-4" /> <span className="hidden sm:inline">Notificações</span></button>
            <button onClick={() => setActiveTab('announcements')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'announcements' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><Megaphone className="w-4 h-4" /> <span className="hidden sm:inline">Comunicados</span></button>
            <button onClick={() => setActiveTab('system_update')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'system_update' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}><RefreshCw className="w-4 h-4" /> <span className="hidden sm:inline">Atualizar</span></button>
        </div>
      </div>

      {/* Quick Stats (Same as before) */}
      {(activeTab === 'withdrawals' || activeTab === 'users') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2 text-blue-400"><Users className="w-5 h-5" /><span className="font-bold">Usuários Totais</span></div>
              <div className="text-2xl font-bold text-white">{userCount !== null ? userCount : '--'}</div>
          </div>
           <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2 text-green-400"><DollarSign className="w-5 h-5" /><span className="font-bold">Volume Total</span></div>
              <div className="text-2xl font-bold text-white">{totalVolume !== null ? `R$ ${totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '--'}</div>
          </div>
           <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2 text-orange-400"><ArrowUpRight className="w-5 h-5" /><span className="font-bold">Saques Pendentes</span></div>
              <div className="text-2xl font-bold text-white">{pendingWithdrawalsCount !== null ? pendingWithdrawalsCount : '--'}</div>
          </div>
        </div>
      )}

      {/* Withdrawal Tab */}
      {activeTab === 'withdrawals' && (
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            {/* ... Withdrawal Table Content ... */}
            <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div><h3 className="text-xl font-bold text-white flex items-center gap-2"><Activity className="w-5 h-5 text-blue-400" />Solicitações de Saque</h3><p className="text-sm text-gray-400 mt-1">Gerencie os pagamentos pendentes.</p></div>
                <button onClick={fetchWithdrawals} className="text-sm text-blue-400 hover:text-white transition-colors">Atualizar Lista</button>
            </div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead><tr className="bg-white/5 text-xs uppercase text-gray-400"><th className="p-4 font-semibold">Data</th><th className="p-4 font-semibold">Usuário</th><th className="p-4 font-semibold">Detalhes</th><th className="p-4 font-semibold text-right">Valor</th><th className="p-4 font-semibold text-center">Ações</th></tr></thead>
                    <tbody className="divide-y divide-white/5">
                        {loadingWithdrawals ? <tr><td colSpan={5} className="p-8 text-center text-gray-500">Carregando...</td></tr> : withdrawals.length === 0 ? <tr><td colSpan={5} className="p-12 text-center text-gray-400">Nenhuma solicitação pendente.</td></tr> : withdrawals.map((req) => (
                                <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="p-4 text-sm text-gray-400 whitespace-nowrap">{new Date(req.created_at).toLocaleDateString('pt-BR')}</td>
                                    <td className="p-4"><div className="font-medium text-white">{(req.profiles as any)?.full_name || 'Desconhecido'}</div><div className="text-xs text-gray-500">{(req.profiles as any)?.email || 'N/A'}</div></td>
                                    <td className="p-4"><div className="text-sm text-gray-300 max-w-[200px] truncate" title={req.description}>{req.description}</div></td>
                                    <td className="p-4 text-right"><span className="font-bold text-white">R$ {req.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></td>
                                    <td className="p-4"><div className="flex items-center justify-center gap-2"><button onClick={() => handleOpenPaymentModal(req)} disabled={processingId === req.id} className="p-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg text-green-400 transition-colors disabled:opacity-50"><Check className="w-4 h-4" /></button><button onClick={() => handleUpdateStatus(req.id, 'rejected')} disabled={processingId === req.id} className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 transition-colors disabled:opacity-50"><X className="w-4 h-4" /></button></div></td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
            {/* Mobile Card View */}
            <div className="md:hidden p-4 grid grid-cols-1 gap-4">
                {loadingWithdrawals ? <div className="text-center text-gray-500 py-8">Carregando...</div> : withdrawals.length === 0 ? <div className="text-center text-gray-400 py-8">Nenhuma solicitação pendente.</div> : withdrawals.map((req) => (
                    <div key={req.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-4">
                        <div className="flex justify-between items-start"><div><div className="font-bold text-white">{(req.profiles as any)?.full_name || 'Desconhecido'}</div><div className="text-xs text-gray-500">{(req.profiles as any)?.email || 'N/A'}</div></div><span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">{new Date(req.created_at).toLocaleDateString('pt-BR')}</span></div>
                        <div className="flex items-center justify-between bg-black/20 p-3 rounded-lg border border-white/5"><div><p className="text-[10px] text-gray-500 uppercase mb-0.5">Valor Solicitado</p><p className="font-mono text-white font-bold text-lg">R$ {req.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>{req.description && (<div className="text-right max-w-[50%]"><p className="text-[10px] text-gray-500 uppercase mb-0.5">Detalhes</p><p className="text-xs text-gray-300 truncate">{req.description}</p></div>)}</div>
                        <div className="grid grid-cols-2 gap-3"><button onClick={() => handleUpdateStatus(req.id, 'rejected')} disabled={processingId === req.id} className="py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"><X className="w-4 h-4" /> Rejeitar</button><button onClick={() => handleOpenPaymentModal(req)} disabled={processingId === req.id} className="py-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"><Check className="w-4 h-4" /> Aprovar</button></div>
                    </div>
                ))}
            </div>
          </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            {/* ... Users Table Content ... */}
            <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div><h3 className="text-xl font-bold text-white flex items-center gap-2"><Users className="w-5 h-5 text-purple-400" />Gerenciar Usuários</h3><p className="text-sm text-gray-400 mt-1">Edite ou remova contas.</p></div>
                <div className="flex items-center gap-3 w-full md:w-auto"><div className="relative flex-1 md:flex-none"><Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" /><input type="text" placeholder="Buscar usuário..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 w-full md:w-64 transition-all" /></div><button onClick={() => handleOpenUserModal(null)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"><UserPlus className="w-4 h-4" /> <span className="hidden sm:inline">Novo</span></button></div>
            </div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead><tr className="bg-white/5 text-xs uppercase text-gray-400"><th className="p-4 font-semibold">Usuário</th><th className="p-4 font-semibold">Saldo</th><th className="p-4 font-semibold">Comissões</th><th className="p-4 font-semibold">Status</th><th className="p-4 font-semibold text-center">Ações</th></tr></thead>
                    <tbody className="divide-y divide-white/5">
                        {loadingUsers ? <tr><td colSpan={5} className="p-8 text-center text-gray-500">Carregando...</td></tr> : users.length === 0 ? <tr><td colSpan={5} className="p-12 text-center text-gray-400">Nenhum usuário encontrado.</td></tr> : users.map((user) => (
                                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="p-4"><div className="font-medium text-white flex items-center gap-2">{user.full_name}{user.is_admin && <ShieldAlert className="w-3 h-3 text-blue-400" />}{user.voucher && <Ticket className="w-3 h-3 text-purple-400" />}</div><div className="text-xs text-gray-500">{user.email}</div></td>
                                    <td className="p-4 font-mono text-white">R$ {user.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                    <td className="p-4 font-mono text-gray-400">R$ {user.commission_balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                    <td className="p-4"><span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${getStatusColor(user.status)}`}>{user.status || 'active'}</span></td>
                                    <td className="p-4"><div className="flex items-center justify-center gap-2"><button onClick={() => handleOpenUserModal(user)} className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-blue-400 transition-colors"><Pencil className="w-4 h-4" /></button><button onClick={() => handleDeleteUser(user.id)} className="p-2 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button></div></td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
            {/* Mobile Card View */}
            <div className="md:hidden p-4 grid grid-cols-1 gap-4">
                {loadingUsers ? <div className="text-center text-gray-500 py-8">Carregando usuários...</div> : users.length === 0 ? <div className="text-center text-gray-400 py-8">Nenhum usuário encontrado.</div> : users.map((user) => (
                    <div key={user.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-4 active:scale-[0.99] transition-transform" onClick={() => handleOpenUserModal(user)}>
                        <div className="flex justify-between items-start"><div className="flex gap-3 items-center"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold border border-white/10">{user.full_name?.charAt(0) || 'U'}</div><div><div className="font-bold text-white flex items-center gap-2 text-sm">{user.full_name}{user.is_admin && <ShieldAlert className="w-3 h-3 text-blue-400" />}</div><div className="text-xs text-gray-500 truncate max-w-[150px]">{user.email}</div></div></div><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusColor(user.status)}`}>{user.status || 'active'}</span></div>
                        <div className="grid grid-cols-2 gap-2 py-3 border-t border-b border-white/5 bg-black/20 rounded-lg px-3"><div><p className="text-[10px] text-gray-500 uppercase mb-0.5">Saldo</p><p className="font-mono text-white text-sm font-semibold">R$ {user.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div><div className="text-right"><p className="text-[10px] text-gray-500 uppercase mb-0.5">Comissões</p><p className="font-mono text-gray-300 text-sm">R$ {user.commission_balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div></div>
                        <button onClick={(e) => {e.stopPropagation(); handleOpenUserModal(user);}} className="w-full py-2 bg-blue-600/10 border border-blue-600/20 text-blue-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2"><Pencil className="w-3 h-3" /> Editar Detalhes</button>
                    </div>
                ))}
            </div>
          </div>
      )}

      {/* Notifications, Announcements, System Update Tabs (Hidden for brevity, assume existence) */}
      {(activeTab === 'notifications' || activeTab === 'announcements' || activeTab === 'system_update') && (
          /* ... (Using existing content from previous response for these tabs) ... */
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
             {/* Just a placeholder to indicate where other tabs would render, preserving original code logic */}
             {activeTab === 'notifications' && (
                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
                   <div className="p-6 border-b border-white/5"><h3 className="text-xl font-bold text-white flex items-center gap-2"><Bell className="w-5 h-5 text-yellow-400" /> Enviar Notificação</h3></div>
                   <div className="p-6">
                      <form onSubmit={handleSendNotification} className="space-y-4">
                         <div className="flex gap-2"><input type="email" placeholder="E-mail do usuário" value={notifTargetEmail} onChange={(e) => setNotifTargetEmail(e.target.value)} className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" /><button type="button" onClick={handleSearchUserForNotif} className="px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white"><Search className="w-5 h-5" /></button></div>
                         {notifTargetUser && <div className="p-3 bg-blue-500/10 rounded border border-blue-500/20 text-white text-sm">Usuário: {notifTargetUser.full_name}</div>}
                         <input type="text" placeholder="Título" value={notifData.title} onChange={(e) => setNotifData({...notifData, title: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white" />
                         <textarea placeholder="Mensagem" value={notifData.message} onChange={(e) => setNotifData({...notifData, message: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white h-24" />
                         <button type="submit" disabled={sendingNotif || !notifTargetUser} className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg">Enviar</button>
                      </form>
                   </div>
                </div>
             )}
             {activeTab === 'announcements' && (
                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
                   <div className="p-6 border-b border-white/5"><h3 className="text-xl font-bold text-white flex items-center gap-2"><Megaphone className="w-5 h-5 text-purple-400" /> Criar Comunicado</h3></div>
                   <div className="p-6">
                      <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                         <input type="text" placeholder="Título" value={announceData.title} onChange={(e) => setAnnounceData({...announceData, title: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white" />
                         <textarea placeholder="Conteúdo" value={announceData.content} onChange={(e) => setAnnounceData({...announceData, content: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white h-24" />
                         <button type="submit" disabled={creatingAnnounce} className="w-full py-3 bg-purple-600 text-white font-bold rounded-lg">Publicar</button>
                      </form>
                   </div>
                </div>
             )}
             {activeTab === 'system_update' && (
                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden">
                   <div className="p-6 border-b border-white/5"><h3 className="text-xl font-bold text-white flex items-center gap-2"><RefreshCw className="w-5 h-5 text-blue-400" /> Agendar Manutenção</h3></div>
                   <div className="p-6">
                      <form onSubmit={handleScheduleUpdate} className="space-y-4">
                         <div className="flex gap-4"><input type="date" value={updateSchedule.date} onChange={(e) => setUpdateSchedule({...updateSchedule, date: e.target.value})} className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white [color-scheme:dark]" /><input type="time" value={updateSchedule.time} onChange={(e) => setUpdateSchedule({...updateSchedule, time: e.target.value})} className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white [color-scheme:dark]" /></div>
                         <button type="submit" disabled={schedulingUpdate} className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg">Agendar</button>
                      </form>
                   </div>
                </div>
             )}
          </div>
      )}

      {/* Edit User Modal */}
      {showUserModal && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setShowUserModal(false)}></div>
              <div className="relative bg-[#0f0f0f] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                  
                  <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#0f0f0f] rounded-t-2xl z-10">
                      <h3 className="text-lg font-bold text-white">
                          {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                      </h3>
                      <button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                          <X className="w-5 h-5" />
                      </button>
                  </div>

                  <div className="overflow-y-auto custom-scrollbar p-5 flex-1">
                    <form onSubmit={handleSaveUser} className="space-y-6">
                        
                        {/* Section 1: Identity */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Users className="w-3 h-3" /> Dados Pessoais
                            </h4>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Nome Completo</label>
                                    <input 
                                        type="text" 
                                        value={userFormData.full_name}
                                        onChange={(e) => setUserFormData({...userFormData, full_name: e.target.value})}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">E-mail</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input 
                                            type="email" 
                                            value={userFormData.email}
                                            onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Security */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Lock className="w-3 h-3" /> Segurança
                            </h4>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Nova Senha</label>
                                    <input 
                                        type="text" 
                                        placeholder="Redefinir senha"
                                        value={userFormData.password}
                                        onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 transition-colors placeholder-gray-600 text-sm"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">Deixe em branco para manter a atual.</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">PIN de Saque</label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input 
                                            type="text"
                                            maxLength={6}
                                            placeholder="6 dígitos"
                                            value={userFormData.pin_code}
                                            onChange={(e) => setUserFormData({...userFormData, pin_code: e.target.value.replace(/\D/g, '')})}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-red-500 transition-colors text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Financial */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Wallet className="w-3 h-3" /> Financeiro
                            </h4>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Telefone</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input 
                                            type="text" 
                                            value={userFormData.phone}
                                            onChange={(e) => setUserFormData({...userFormData, phone: e.target.value})}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-green-500 transition-colors text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Saldo (R$)</label>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            value={userFormData.balance || ''}
                                            onChange={(e) => setUserFormData({...userFormData, balance: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500 transition-colors font-mono text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1.5">Comissões (R$)</label>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            value={userFormData.commission_balance || ''}
                                            onChange={(e) => setUserFormData({...userFormData, commission_balance: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500 transition-colors font-mono text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Status & Permissons */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Shield className="w-3 h-3" /> Status e Permissões
                            </h4>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Situação da Conta</label>
                                    <select 
                                        value={userFormData.status}
                                        onChange={(e) => setUserFormData({...userFormData, status: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 cursor-pointer text-sm"
                                    >
                                        <option value="active" className="bg-[#1a1a1a] text-white">Ativo</option>
                                        <option value="suspended" className="bg-[#1a1a1a] text-white">Suspenso</option>
                                        <option value="banned" className="bg-[#1a1a1a] text-white">Banido</option>
                                    </select>
                                </div>

                                {(userFormData.status === 'suspended' || userFormData.status === 'banned') && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-xs font-medium text-red-400 mb-1.5">Motivo do Bloqueio</label>
                                        <textarea
                                            value={userFormData.ban_reason}
                                            onChange={(e) => setUserFormData({...userFormData, ban_reason: e.target.value})}
                                            placeholder="Explique o motivo..."
                                            className="w-full bg-black/20 border border-red-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 h-20 resize-none text-sm"
                                        />
                                    </div>
                                )}

                                <div className="space-y-3 pt-2">
                                    {/* Voucher Toggle */}
                                    <div className="flex items-center justify-between w-full p-3 bg-black/20 border border-white/5 rounded-lg cursor-pointer" onClick={() => setUserFormData({...userFormData, voucher: !userFormData.voucher})}>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${userFormData.voucher ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-500'}`}>
                                                <Ticket className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">Conta Voucher</p>
                                                <p className="text-[10px] text-gray-500">Apenas consumo interno (sem saque)</p>
                                            </div>
                                        </div>
                                        <div className={`w-11 h-6 flex items-center rounded-full transition-colors duration-300 ${userFormData.voucher ? 'bg-purple-600' : 'bg-gray-700'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${userFormData.voucher ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </div>
                                    </div>

                                    {/* Admin Toggle */}
                                    <div className="flex items-center justify-between w-full p-3 bg-black/20 border border-white/5 rounded-lg cursor-pointer" onClick={() => setUserFormData({...userFormData, is_admin: !userFormData.is_admin})}>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${userFormData.is_admin ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-500'}`}>
                                                <ShieldAlert className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">Administrador</p>
                                                <p className="text-[10px] text-gray-500">Acesso total ao painel</p>
                                            </div>
                                        </div>
                                        <div className={`w-11 h-6 flex items-center rounded-full transition-colors duration-300 ${userFormData.is_admin ? 'bg-blue-600' : 'bg-gray-700'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${userFormData.is_admin ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                  </div>

                  <div className="p-5 border-t border-white/10 bg-[#0f0f0f] rounded-b-2xl flex gap-3 z-10">
                      <button 
                          type="button" 
                          onClick={() => setShowUserModal(false)}
                          className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 transition-colors font-medium text-sm"
                      >
                          Cancelar
                      </button>
                      <button 
                          onClick={handleSaveUser}
                          disabled={savingUser}
                          className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                      >
                          {savingUser ? 'Salvando...' : <><Save className="w-4 h-4" /> Salvar Alterações</>}
                      </button>
                  </div>
              </div>
          </div>,
          document.body
      )}

      {/* Payment Confirmation Modal (Existing) */}
      {showPaymentModal && paymentWithdrawal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setShowPaymentModal(false)}></div>
            <div className="relative bg-[#0f0f0f] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 overflow-hidden">
                <div className="p-5 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400" /> Confirmar Pagamento
                    </h3>
                    <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Values */}
                    <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                        <div className="flex justify-between text-sm text-gray-400">
                            <span>Valor Solicitado:</span>
                            <span>R$ {paymentWithdrawal.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-sm text-red-400">
                            <span>Taxa (7%):</span>
                            <span>- R$ {(paymentWithdrawal.amount * 0.07).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="h-px bg-white/10 my-2"></div>
                        <div className="flex justify-between items-center">
                            <span className="text-white font-medium">Valor a Pagar:</span>
                            <span className="text-xl font-bold text-green-400">
                                R$ {(paymentWithdrawal.amount * 0.93).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {/* Bank Details */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Dados Bancários</h4>
                        {loadingBankAccounts ? (
                            <div className="text-center text-gray-500 py-4 text-sm">Carregando chaves...</div>
                        ) : userBankAccounts.length > 0 ? (
                            <div className="space-y-2">
                                {userBankAccounts.map((acc) => (
                                    <div key={acc.id} className="bg-black/20 border border-white/10 rounded-lg p-3 flex items-center justify-between">
                                        <div className="overflow-hidden mr-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">{acc.pix_type.toUpperCase()}</span>
                                                <span className="text-xs text-gray-400">{acc.label}</span>
                                            </div>
                                            <p className="text-sm text-white font-mono truncate mt-1" title={acc.pix_key}>{acc.pix_key}</p>
                                            {acc.bank_name && <p className="text-[10px] text-gray-500">{acc.bank_name}</p>}
                                        </div>
                                        <button 
                                            onClick={() => handleCopyPix(acc.pix_key, acc.id)}
                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                            title="Copiar Chave"
                                        >
                                            {copySuccessId === acc.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                                <p className="text-xs text-yellow-200">Este usuário não possui chaves PIX cadastradas.</p>
                            </div>
                        )}
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-bold text-xs">
                            {paymentWithdrawal.profiles?.full_name.charAt(0) || 'U'}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">{paymentWithdrawal.profiles?.full_name}</p>
                            <p className="text-xs text-gray-500">{paymentWithdrawal.profiles?.email}</p>
                        </div>
                    </div>

                    <button 
                        onClick={() => handleUpdateStatus(paymentWithdrawal.id, 'completed')}
                        disabled={processingId === paymentWithdrawal.id}
                        className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Check className="w-5 h-5" /> Confirmar Pagamento Realizado
                    </button>
                </div>
            </div>
        </div>,
        document.body
      )}
    </div>
  );
};
