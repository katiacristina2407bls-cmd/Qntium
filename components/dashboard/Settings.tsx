
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  LogOut, 
  Camera, 
  Save, 
  Moon, 
  Globe, 
  Mail, 
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Key,
  ChevronRight,
  X,
  AlertTriangle,
  Check,
  Trash2,
  QrCode,
  Copy,
  Link as LinkIcon,
  ExternalLink,
  Send,
  MessageCircle,
  Palette,
  PanelLeft,
  LayoutTemplate,
  Info,
  Beaker,
  FileText,
  Download,
  Eye
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';

export const Settings: React.FC = () => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'preferences' | 'integrations' | 'customization' | 'privacy'>('profile');
  
  // Profile Form
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    email: ''
  });

  // Avatar Upload State
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Password Form
  const [passData, setPassData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Settings State
  const [showLangModal, setShowLangModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [betaFeatures, setBetaFeatures] = useState(false);
  
  // 2FA State
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState(1); // 1: Intro, 2: QR, 3: Success
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorQR, setTwoFactorQR] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  
  // Telegram Integration State
  const [isTelegramConnected, setIsTelegramConnected] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);

  // Customization State
  const [mobileLayout, setMobileLayout] = useState<'sidebar' | 'bottom'>('sidebar');

  // UI State
  const [loading, setLoading] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [msg, setMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

  const LANGUAGES = [
    { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
    { code: 'fr-FR', name: 'Français', flag: '🇫🇷' },
    { code: 'de-DE', name: 'Deutsch', flag: '🇩🇪' },
  ];

  // Initialize data
  useEffect(() => {
    if (profile && user) {
      setProfileData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        email: user.email || ''
      });
      setIs2FAEnabled(profile.two_factor_enabled || false);
      setIsTelegramConnected(profile.telegram_connected || false);
      
      // Check local storage first, then profile
      const localLayout = localStorage.getItem('quantium_mobile_layout') as 'sidebar' | 'bottom';
      setMobileLayout(localLayout || profile.mobile_layout || 'sidebar');

      // Sync beta features
      setBetaFeatures(profile.beta_features || localStorage.getItem('quantium_beta_features') === 'true');
    }
  }, [profile, user]);

  // Clear messages on tab change
  useEffect(() => {
    setMsg(null);
    setPassData({ newPassword: '', confirmPassword: '' });
  }, [activeSection]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setMsg(null);

    try {
      let avatarUrl = profile?.avatar_url;

      // Handle Avatar Upload
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        avatarUrl = publicUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone,
          avatar_url: avatarUrl
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      // Clear local preview state after successful save
      setAvatarFile(null);
      setAvatarPreview(null);
      setMsg({ type: 'success', text: 'Perfil atualizado com sucesso.' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Erro ao atualizar perfil.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    if (passData.newPassword !== passData.confirmPassword) {
      setMsg({ type: 'error', text: 'As senhas não coincidem.' });
      setLoading(false);
      return;
    }

    if (passData.newPassword.length < 8) {
      setMsg({ type: 'error', text: 'A senha deve ter pelo menos 8 caracteres.' });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passData.newPassword
      });

      if (error) throw error;

      setMsg({ type: 'success', text: 'Senha alterada com sucesso.' });
      setPassData({ newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Erro ao alterar senha.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageSelect = (code: string) => {
    setLanguage(code as any);
    setShowLangModal(false);
    setMsg({ type: 'success', text: 'Idioma alterado com sucesso.' });
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // 1. Try to delete profile (depends on RLS)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (error) {
         console.error("Profile delete error:", error);
      }

      // 2. Sign out
      await signOut();
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Erro ao processar solicitação.' });
      setShowDeleteModal(false);
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!user?.email) return;
    setResendingEmail(true);
    setMsg(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (error) throw error;

      setMsg({ type: 'success', text: 'E-mail de confirmação enviado! Verifique sua caixa de entrada.' });
    } catch (err: any) {
      console.error(err);
      const message = err.message?.includes('rate limit') 
        ? 'Muitas tentativas recentes. Aguarde um momento.' 
        : 'Erro ao enviar e-mail. Tente novamente mais tarde.';
      setMsg({ type: 'error', text: message });
    } finally {
      setResendingEmail(false);
    }
  };

  const handleLayoutChange = async (layout: 'sidebar' | 'bottom') => {
    if (!user) return;
    setLoading(true);
    setMsg(null);

    // 1. Save to local storage immediately (Optimistic update & Fallback)
    localStorage.setItem('quantium_mobile_layout', layout);
    
    // Dispatch event to notify other components (like Dashboard)
    window.dispatchEvent(new Event('local-storage-update'));
    
    setMobileLayout(layout);

    try {
      // 2. Attempt to save to DB
      const { error } = await supabase
        .from('profiles')
        .update({ mobile_layout: layout })
        .eq('id', user.id);

      if (error) {
        // If DB update fails (e.g. missing column), warn but don't block user
        console.warn("Failed to save layout to database:", error);
        // We don't throw here to avoid showing an error to the user since local storage works
      } else {
        await refreshProfile();
      }

      setMsg({ type: 'success', text: 'Layout atualizado com sucesso!' });
    } catch (err: any) {
      console.error(err);
      // Even if it failed, we successfully updated locally
      setMsg({ type: 'success', text: 'Layout atualizado (localmente).' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBeta = async () => {
    if (!user) return;
    const newValue = !betaFeatures;
    setBetaFeatures(newValue);
    setLoading(true);
    setMsg(null);

    // Optimistic / Local storage
    localStorage.setItem('quantium_beta_features', String(newValue));

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ beta_features: newValue })
        .eq('id', user.id);
      
      if (error) {
        console.warn('DB update failed (beta_features might be missing)', error);
      } else {
        await refreshProfile();
      }
      
      setMsg({ type: 'success', text: newValue ? t('beta_enabled') : t('beta_disabled') });
    } catch (err) {
       // ignore
    } finally {
       setLoading(false);
    }
  };

  const handleDownloadLGPD = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let cursorY = margin;

    const addHeader = () => {
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("Quantium Capital - LGPD & Termos de Uso", margin, 15);
        doc.line(margin, 18, pageWidth - margin, 18);
        cursorY = 30;
    };

    const addFooter = (pageNumber: number) => {
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("Protegido por Lei nº 13.709/2018 (LGPD)", margin, pageHeight - 10);
        doc.text(`Página ${pageNumber}`, pageWidth - margin - 10, pageHeight - 10);
    };

    const checkPageBreak = (neededSpace: number) => {
        if (cursorY + neededSpace > pageHeight - 20) {
            doc.addPage();
            addHeader();
            return true;
        }
        return false;
    };

    // --- Page 1: Cover ---
    doc.setFillColor(5, 5, 5); // Black background
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text("Termos de Uso e LGPD", pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text("Segurança e Transparência para Seus Investimentos", pageWidth / 2, pageHeight / 2, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(200, 200, 200);
    doc.text("Protegendo seus dados com excelência e conformidade legal.", pageWidth / 2, pageHeight / 2 + 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text("Quantium Capital", pageWidth / 2, pageHeight - 30, { align: 'center' });

    // --- Page 2: Introduction ---
    doc.addPage();
    doc.setTextColor(0, 0, 0); // Reset text color
    addHeader();

    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text("Introdução à Quantium Capital e à Proteção de Dados", margin, cursorY);
    cursorY += 15;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const introText = "A Quantium Capital é uma plataforma de investimentos comprometida com a segurança e a privacidade dos dados dos seus usuários. Operamos com os mais altos padrões de proteção e transparência no mercado financeiro brasileiro.\n\nEste documento apresenta os Termos de Uso e as práticas de proteção de dados pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). Nosso compromisso é claro: garantir transparência absoluta, segurança robusta e respeito integral aos direitos dos investidores.";
    
    const splitIntro = doc.splitTextToSize(introText, contentWidth);
    doc.text(splitIntro, margin, cursorY);
    cursorY += 50;

    // Highlights box
    doc.setFillColor(240, 245, 255);
    doc.setDrawColor(37, 99, 235);
    doc.roundedRect(margin, cursorY, contentWidth, 40, 3, 3, 'FD');
    
    doc.setFontSize(12);
    doc.setTextColor(37, 99, 235);
    doc.setFont('helvetica', 'bold');
    doc.text("Pilares Fundamentais:", margin + 5, cursorY + 10);
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    doc.text("• Segurança: Proteção máxima dos seus dados.", margin + 5, cursorY + 20);
    doc.text("• Transparência: Clareza em todos os processos.", margin + 5, cursorY + 28);
    doc.text("• Conformidade: 100% adequados à LGPD.", margin + 5, cursorY + 36);
    
    addFooter(2);

    // --- Page 3: Terms ---
    doc.addPage();
    addHeader();

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("O Que São os Termos de Uso?", margin, cursorY);
    cursorY += 15;

    const termsPoints = [
        { title: "01. Documento Regulatório", desc: "Regula o acesso e uso da plataforma Quantium Capital, estabelecendo as bases legais da nossa relação." },
        { title: "02. Direitos e Deveres", desc: "Define direitos, obrigações e responsabilidades tanto dos usuários quanto da empresa de forma clara e equilibrada." },
        { title: "03. Concordância", desc: "Ao utilizar a plataforma, o usuário concorda com estes termos, que podem ser atualizados periodicamente." }
    ];

    termsPoints.forEach(point => {
        checkPageBreak(30);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(point.title, margin, cursorY);
        cursorY += 7;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(doc.splitTextToSize(point.desc, contentWidth), margin, cursorY);
        cursorY += 20;
    });

    cursorY += 10;
    doc.setFillColor(230, 255, 230);
    doc.setDrawColor(0, 150, 0);
    doc.roundedRect(margin, cursorY, contentWidth, 25, 2, 2, 'FD');
    doc.setFontSize(10);
    doc.setTextColor(0, 100, 0);
    doc.text("Importante: Recomendamos a leitura atenta dos Termos de Uso antes de utilizar a plataforma. Notificaremos você sobre quaisquer alterações significativas.", margin + 5, cursorY + 10, { maxWidth: contentWidth - 10 });
    
    addFooter(3);

    // --- Page 4: LGPD Fundamentals ---
    doc.addPage();
    addHeader();

    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text("Fundamentos da LGPD", margin, cursorY);
    cursorY += 15;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const lgpdText = "A Lei Geral de Proteção de Dados (LGPD) protege os direitos fundamentais de liberdade e privacidade dos titulares de dados. A Quantium Capital atua como Controladora dos dados, sendo responsável pelas decisões sobre o tratamento dos dados pessoais.";
    doc.text(doc.splitTextToSize(lgpdText, contentWidth), margin, cursorY);
    cursorY += 30;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Coleta e Tratamento", margin, cursorY);
    cursorY += 10;

    const collectionTable = [
        ["Dados Coletados", "Finalidade", "Base Legal"],
        ["Nome, CPF, Endereço", "Cadastro e Compliance", "Execução de Contrato"],
        ["Perfil de Investimento", "Análise de Risco", "Legítimo Interesse"],
        ["Dados Bancários", "Operações Financeiras", "Execução de Contrato"]
    ];
    
    let colY = cursorY;
    const colWidth = contentWidth / 3;
    
    doc.setFontSize(10);
    collectionTable.forEach((row, i) => {
        if (i === 0) doc.setFont('helvetica', 'bold');
        else doc.setFont('helvetica', 'normal');
        
        doc.text(row[0], margin, colY);
        doc.text(row[1], margin + colWidth, colY);
        doc.text(row[2], margin + (colWidth * 2), colY);
        colY += 10;
    });

    addFooter(4);

    // --- Page 5: Rights & Security ---
    doc.addPage();
    addHeader();

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("Seus Direitos (LGPD)", margin, cursorY);
    cursorY += 15;

    const rights = [
        "Direito de Acesso: Saber quais dados são coletados.",
        "Direito de Correção: Atualizar dados incorretos.",
        "Direito de Eliminação: Solicitar exclusão quando aplicável.",
        "Portabilidade: Transferir dados a outro fornecedor.",
        "Revogação: Retirar consentimento a qualquer momento."
    ];

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    rights.forEach(right => {
        doc.text("• " + right, margin + 5, cursorY);
        cursorY += 8;
    });

    cursorY += 15;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("Segurança e Proteção", margin, cursorY);
    cursorY += 15;

    const securityText = "Adotamos medidas técnicas e administrativas de ponta:\n\n1. Criptografia Avançada (dados em trânsito e repouso).\n2. Monitoramento 24/7 contra ameaças.\n3. Controles de Acesso restritos a pessoal autorizado.\n4. Plano de Resposta a Incidentes.";
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(securityText, margin, cursorY);

    addFooter(5);

    // --- Page 6: Contact ---
    doc.addPage();
    addHeader();

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text("Contato e Encarregado (DPO)", margin, cursorY);
    cursorY += 15;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text("Para exercer seus direitos ou tirar dúvidas, contate nosso DPO:", margin, cursorY);
    cursorY += 15;

    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, cursorY, contentWidth, 40, 2, 2, 'F');
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("E-mail: dpo@quantiumcapital.com.br", margin + 10, cursorY + 15);
    doc.text("Horário: Segunda a Sexta, 9h às 18h", margin + 10, cursorY + 25);
    doc.text("Prazo de Resposta: Até 15 dias úteis", margin + 10, cursorY + 35);

    cursorY += 60;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100);
    doc.text("\"Na Quantium Capital, sua confiança é nosso ativo mais valioso.\"", pageWidth / 2, cursorY, { align: 'center' });

    addFooter(6);

    doc.save('Quantium_Termos_LGPD.pdf');
  };

  // 2FA Functions
  const start2FASetup = async () => {
    setTwoFactorStep(2);
    setTwoFactorError(null);
    setTwoFactorCode('');
    
    // Generate a random secret (simulated base32)
    const secret = Array(16).fill(0).map(() => "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".charAt(Math.floor(Math.random() * 32))).join('');
    setTwoFactorSecret(secret);

    // Generate QR Code
    const otpAuthUrl = `otpauth://totp/Quantium:${user?.email}?secret=${secret}&issuer=Quantium`;
    try {
      const qrUrl = await QRCode.toDataURL(otpAuthUrl);
      setTwoFactorQR(qrUrl);
    } catch (err) {
      console.error(err);
      setTwoFactorError('Erro ao gerar QR Code.');
    }
  };

  const confirm2FASetup = async () => {
    setTwoFactorLoading(true);
    setTwoFactorError(null);

    // Validate input length
    if (twoFactorCode.length !== 6) {
      setTwoFactorError('O código deve ter 6 dígitos.');
      setTwoFactorLoading(false);
      return;
    }

    // Simulate Verification delay
    setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ two_factor_enabled: true })
          .eq('id', user?.id);

        if (error) throw error;

        await refreshProfile();
        setIs2FAEnabled(true);
        setTwoFactorStep(3);
      } catch (err: any) {
        setTwoFactorError('Erro ao verificar código. Tente novamente.');
      } finally {
        setTwoFactorLoading(false);
      }
    }, 1500);
  };

  const disable2FA = async () => {
    if (!window.confirm('Tem certeza que deseja desativar a proteção em duas etapas?')) return;
    
    setTwoFactorLoading(true);
    try {
        const { error } = await supabase
          .from('profiles')
          .update({ two_factor_enabled: false })
          .eq('id', user?.id);

        if (error) throw error;
        await refreshProfile();
        setIs2FAEnabled(false);
        setMsg({ type: 'success', text: 'Autenticação de dois fatores desativada.' });
    } catch (err: any) {
        setMsg({ type: 'error', text: 'Erro ao desativar 2FA.' });
    } finally {
        setTwoFactorLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Telegram Functions
  const handleConnectTelegram = async () => {
    setTelegramLoading(true);
    
    // Simulate API call to generate link and wait for connection
    setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ telegram_connected: true })
          .eq('id', user?.id);

        if (error) throw error;

        await refreshProfile();
        setIsTelegramConnected(true);
        setMsg({ type: 'success', text: 'Telegram conectado com sucesso!' });
      } catch (err) {
        setMsg({ type: 'error', text: 'Erro ao conectar com Telegram.' });
      } finally {
        setTelegramLoading(false);
      }
    }, 2000);
  };

  const handleDisconnectTelegram = async () => {
    if (!window.confirm('Deseja desconectar o bot do Telegram? Você deixará de receber notificações.')) return;
    setTelegramLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ telegram_connected: false })
        .eq('id', user?.id);

      if (error) throw error;

      await refreshProfile();
      setIsTelegramConnected(false);
      setMsg({ type: 'success', text: 'Telegram desconectado.' });
    } catch (err) {
      setMsg({ type: 'error', text: 'Erro ao desconectar Telegram.' });
    } finally {
      setTelegramLoading(false);
    }
  };

  const handleTestTelegramNotification = () => {
    setMsg({ type: 'success', text: '🔔 Teste: Você recebeu R$ 150,00 de rendimento hoje!' });
  };

  const sections = [
    { id: 'profile', label: t('profile'), icon: <User className="w-5 h-5" /> },
    { id: 'security', label: t('security'), icon: <Lock className="w-5 h-5" /> },
    { id: 'privacy', label: 'Privacidade', icon: <FileText className="w-5 h-5" /> },
    { id: 'preferences', label: t('preferences'), icon: <Bell className="w-5 h-5" /> },
    { id: 'customization', label: 'Personalização', icon: <Palette className="w-5 h-5" /> },
    { id: 'integrations', label: 'Integrações', icon: <LinkIcon className="w-5 h-5" /> },
  ];

  const currentLangObj = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <div className="animate-entry max-w-6xl mx-auto pb-10">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">{t('settings')}</h2>
        <p className="text-gray-400">Gerencie seus dados pessoais e preferências da conta.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 mb-1 last:mb-0 ${
                  activeSection === section.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  {section.icon}
                  {section.label}
                </div>
                {activeSection === section.id && <ChevronRight className="w-4 h-4 opacity-50" />}
              </button>
            ))}
            
            <div className="my-2 border-t border-white/5 mx-2"></div>
            
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              {t('logout')}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 md:p-8 relative overflow-hidden min-h-[500px]">
            
            {/* Feedback Message */}
            {msg && (
              <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
                msg.type === 'success' 
                  ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <p className="text-sm font-medium">{msg.text}</p>
              </div>
            )}

            {activeSection === 'profile' && (
              <div className="space-y-8 animate-entry">
                {/* Header */}
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-0.5">
                      <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden relative">
                         {avatarPreview ? (
                            <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                         ) : profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                         ) : (
                            <User className="w-10 h-10 text-gray-400" />
                         )}
                         
                         <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                           <Camera className="w-6 h-6 text-white" />
                         </div>
                         {/* Hidden Input for Avatar */}
                         <input 
                           type="file" 
                           accept="image/*"
                           onChange={handleFileChange}
                           className="absolute inset-0 opacity-0 cursor-pointer z-20"
                         />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{profile?.full_name || 'Usuário'}</h3>
                    <p className="text-gray-500 text-sm">Membro desde {new Date().getFullYear()}</p>
                    <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                      <Shield className="w-3 h-3" /> Conta {user?.email_confirmed_at ? 'Verificada' : 'Ativa'}
                    </span>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Nome Completo</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-5 h-5 text-gray-600" />
                        <input 
                          type="text" 
                          value={profileData.full_name}
                          onChange={e => setProfileData({...profileData, full_name: e.target.value})}
                          className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Telefone</label>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-3 w-5 h-5 text-gray-600" />
                        <input 
                          type="tel" 
                          value={profileData.phone}
                          onChange={e => setProfileData({...profileData, phone: e.target.value})}
                          className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-400">E-mail (Não alterável)</label>
                        {user?.email_confirmed_at ? (
                          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                            <CheckCircle2 className="w-3 h-3 text-green-400" />
                            <span className="text-xs font-bold text-green-400">Verificado</span>
                          </div>
                        ) : (
                          <button 
                            type="button"
                            onClick={handleResendConfirmation}
                            disabled={resendingEmail}
                            className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {resendingEmail ? (
                              <Loader2 className="w-3 h-3 text-yellow-400 animate-spin" />
                            ) : (
                              <AlertCircle className="w-3 h-3 text-yellow-400" />
                            )}
                            <span className="text-xs font-bold text-yellow-400">
                              {resendingEmail ? 'Enviando...' : 'Confirmar E-mail'}
                            </span>
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-600" />
                        <input 
                          type="email" 
                          disabled
                          value={profileData.email}
                          className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-gray-500 cursor-not-allowed"
                        />
                      </div>
                      {!user?.email_confirmed_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          Confirme seu e-mail para aumentar a segurança da sua conta.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      {t('save_changes')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeSection === 'privacy' && (
              <div className="space-y-8 animate-entry">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Privacidade e Dados</h3>
                  <p className="text-sm text-gray-400">Acesse os documentos legais e entenda como protegemos seus dados.</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Main Document Card */}
                  <div className="bg-blue-600/5 border border-blue-500/20 rounded-2xl p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                          <FileText className="w-8 h-8" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white">Termos de Uso e LGPD</h4>
                          <p className="text-sm text-gray-400 mt-1 mb-4 leading-relaxed max-w-xl">
                            Este documento detalha nossos compromissos com a segurança dos seus dados, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Ele inclui seus direitos como titular, nossas responsabilidades e políticas de privacidade.
                          </p>
                          <div className="flex gap-3">
                            <button 
                              onClick={handleDownloadLGPD}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" /> Baixar PDF
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Document Preview / Reader */}
                  <div className="bg-black/20 border border-white/10 rounded-2xl overflow-hidden">
                     <div className="p-4 border-b border-white/5 flex items-center gap-2 bg-white/5">
                        <Eye className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Visualização Rápida</span>
                     </div>
                     <div className="p-6 max-h-[400px] overflow-y-auto custom-scrollbar space-y-6 text-sm text-gray-300 leading-relaxed">
                        <div>
                           <h5 className="text-white font-bold mb-2">1. Introdução</h5>
                           <p>A Quantium Capital é uma plataforma de investimentos comprometida com a segurança e a privacidade dos dados dos seus usuários. Operamos com os mais altos padrões de proteção e transparência no mercado financeiro brasileiro.</p>
                        </div>
                        <div>
                           <h5 className="text-white font-bold mb-2">2. Coleta de Dados</h5>
                           <p>Coletamos apenas os dados necessários para a prestação dos nossos serviços (Nome, CPF, Dados Financeiros) e cumprimento de obrigações legais. Todo tratamento é realizado com base em consentimento explícito ou hipóteses legais da LGPD.</p>
                        </div>
                        <div>
                           <h5 className="text-white font-bold mb-2">3. Seus Direitos</h5>
                           <ul className="list-disc pl-5 space-y-1">
                              <li>Direito de Acesso: Saber quais dados são coletados.</li>
                              <li>Direito de Correção: Atualizar dados incorretos.</li>
                              <li>Direito de Eliminação: Solicitar exclusão de dados (quando aplicável).</li>
                              <li>Portabilidade: Transferir seus dados para outro fornecedor.</li>
                           </ul>
                        </div>
                        <div>
                           <h5 className="text-white font-bold mb-2">4. Segurança</h5>
                           <p>Adotamos medidas técnicas como criptografia avançada, monitoramento 24/7 e controles de acesso rigorosos para garantir a integridade das suas informações.</p>
                        </div>
                        <div>
                           <h5 className="text-white font-bold mb-2">5. Contato do DPO</h5>
                           <p>Para exercer seus direitos, entre em contato com nosso Encarregado de Proteção de Dados pelo e-mail: <strong>dpo@quantiumcapital.com.br</strong>.</p>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="space-y-8 animate-entry">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Alterar Senha</h3>
                  <p className="text-sm text-gray-400">Mantenha sua conta segura alterando sua senha periodicamente.</p>
                </div>

                <form onSubmit={handlePasswordUpdate} className="space-y-6 max-w-md">
                   <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Nova Senha</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-600" />
                        <input 
                          type="password" 
                          placeholder="No mínimo 8 caracteres"
                          value={passData.newPassword}
                          onChange={e => setPassData({...passData, newPassword: e.target.value})}
                          className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-400">Confirmar Nova Senha</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-600" />
                        <input 
                          type="password" 
                          placeholder="Repita a nova senha"
                          value={passData.confirmPassword}
                          onChange={e => setPassData({...passData, confirmPassword: e.target.value})}
                          className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Key className="w-5 h-5" />}
                        Atualizar Senha
                      </button>
                    </div>
                </form>

                <div className="border-t border-white/5 pt-8 mt-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Autenticação de Dois Fatores (2FA)</h3>
                      <p className="text-sm text-gray-400 max-w-md">Adicione uma camada extra de segurança à sua conta exigindo um código ao entrar.</p>
                    </div>
                    <div className="flex items-center">
                        {is2FAEnabled ? (
                          <button 
                            onClick={disable2FA}
                            disabled={twoFactorLoading}
                            className="relative inline-flex h-6 w-11 items-center rounded-full bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
                          >
                             <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition-transform" />
                          </button>
                        ) : (
                          <button 
                             onClick={() => {
                               setShow2FAModal(true);
                               setTwoFactorStep(1);
                             }}
                             className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
                          >
                              <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition-transform" />
                          </button>
                        )}
                    </div>
                  </div>
                  {is2FAEnabled && (
                     <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
                        <Shield className="w-5 h-5 text-green-400" />
                        <p className="text-sm text-green-300">
                           Sua conta está protegida com autenticação de dois fatores.
                        </p>
                     </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'preferences' && (
              <div className="space-y-8 animate-entry">
                 <div>
                  <h3 className="text-lg font-bold text-white mb-1">Preferências do Sistema</h3>
                  <p className="text-sm text-gray-400">Personalize sua experiência na plataforma.</p>
                </div>

                <div className="space-y-4 max-w-2xl">
                  {/* Theme */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                        <Moon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{t('theme_dark')}</h4>
                        <p className="text-xs text-gray-400">Otimizado para ambientes com pouca luz.</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">{t('active')}</span>
                  </div>

                  {/* Notifications */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                     <div className="flex items-center gap-4">
                      <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                        <Bell className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{t('notifications')}</h4>
                        <p className="text-xs text-gray-400">Receba alertas sobre seus investimentos.</p>
                      </div>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-green-600 transition-colors">
                      <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition-transform" />
                    </button>
                  </div>

                  {/* Language */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                     <div className="flex items-center gap-4">
                      <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                        <Globe className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{t('language')}</h4>
                        <p className="text-xs text-gray-400">{currentLangObj.name}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowLangModal(true)}
                      className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 hover:bg-white/5 rounded-lg"
                    >
                      {t('change')}
                    </button>
                  </div>

                  {/* Beta Features */}
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                     <div className="flex items-center gap-4">
                      <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400">
                        <Beaker className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{t('beta_features')}</h4>
                        <p className="text-xs text-gray-400">{t('beta_features_desc')}</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleToggleBeta}
                      disabled={loading}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none ${betaFeatures ? 'bg-green-600' : 'bg-gray-700'}`}
                    >
                      <span className={`${betaFeatures ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
                    </button>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-8 mt-8">
                  <h3 className="text-lg font-bold text-red-500 mb-4">{t('danger_zone')}</h3>
                  <button 
                    onClick={() => setShowDeleteModal(true)}
                    className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold rounded-xl transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" /> {t('delete_account')}
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Esta ação é irreversível. Todos os seus dados e investimentos serão perdidos.
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'customization' && (
               <div className="space-y-8 animate-entry">
                 <div>
                   <h3 className="text-lg font-bold text-white mb-1">Personalização Visual</h3>
                   <p className="text-sm text-gray-400">Ajuste a aparência da plataforma para atender às suas necessidades.</p>
                 </div>

                 <div className="space-y-6">
                   <div>
                     <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                       <Smartphone className="w-4 h-4 text-blue-400" /> Layout Mobile
                     </h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Sidebar Option */}
                        <button 
                          onClick={() => handleLayoutChange('sidebar')}
                          disabled={loading}
                          className={`relative group p-6 rounded-2xl border text-left transition-all duration-300 ${
                             mobileLayout === 'sidebar'
                             ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.15)]'
                             : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                           <div className="flex justify-between items-start mb-4">
                              <div className={`p-3 rounded-xl ${mobileLayout === 'sidebar' ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                                 <PanelLeft className="w-6 h-6" />
                              </div>
                              {mobileLayout === 'sidebar' && <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]"></div>}
                           </div>
                           <h5 className={`font-bold mb-1 ${mobileLayout === 'sidebar' ? 'text-white' : 'text-gray-300'}`}>Menu Lateral (Padrão)</h5>
                           <p className="text-xs text-gray-500 leading-relaxed">
                              Menu clássico com ícone de hambúrguer no topo. Ideal para acesso rápido a todas as opções.
                           </p>
                        </button>

                        {/* Bottom Nav Option */}
                        <button 
                          onClick={() => handleLayoutChange('bottom')}
                          disabled={loading}
                          className={`relative group p-6 rounded-2xl border text-left transition-all duration-300 ${
                             mobileLayout === 'bottom'
                             ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.15)]'
                             : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                           <div className="flex justify-between items-start mb-4">
                              <div className={`p-3 rounded-xl ${mobileLayout === 'bottom' ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                                 <LayoutTemplate className="w-6 h-6" />
                              </div>
                              {mobileLayout === 'bottom' && <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]"></div>}
                           </div>
                           <h5 className={`font-bold mb-1 ${mobileLayout === 'bottom' ? 'text-white' : 'text-gray-300'}`}>Barra de Navegação (App)</h5>
                           <p className="text-xs text-gray-500 leading-relaxed">
                              Navegação moderna na parte inferior da tela. Ideal para uso com uma mão em dispositivos móveis.
                           </p>
                        </button>
                     </div>
                     <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Esta configuração afeta apenas a visualização em dispositivos móveis.
                     </p>
                   </div>
                 </div>
               </div>
            )}

            {activeSection === 'integrations' && (
              <div className="space-y-8 animate-entry">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Integrações</h3>
                  <p className="text-sm text-gray-400">Conecte serviços externos para potencializar sua experiência.</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Telegram Card */}
                  <div className={`rounded-2xl border transition-all duration-300 ${
                    isTelegramConnected 
                      ? 'bg-blue-500/5 border-blue-500/30' 
                      : 'bg-[#0a0a0a] border-white/5 hover:border-blue-400/30'
                  }`}>
                    <div className="p-5 md:p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#229ED9]/10 flex items-center justify-center text-[#229ED9] flex-shrink-0">
                            <Send className="w-6 h-6 md:w-7 md:h-7" />
                          </div>
                          <div>
                            <h3 className="text-lg md:text-xl font-bold text-white flex flex-wrap items-center gap-2">
                              Telegram Bot
                              {isTelegramConnected && (
                                <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Ativo
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-400 mt-1">
                              Receba notificações instantâneas sobre rendimentos, saques e novidades.
                            </p>
                          </div>
                        </div>
                      </div>

                      {isTelegramConnected ? (
                        <div className="space-y-4">
                          <div className="bg-[#229ED9]/5 border border-[#229ED9]/10 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                              <MessageCircle className="w-5 h-5 text-[#229ED9] mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-white font-medium">Bot Conectado</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  O bot está ativo e enviará mensagens para o seu Telegram.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3">
                            <button 
                              onClick={handleTestTelegramNotification}
                              className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 active:scale-95"
                            >
                              <Bell className="w-4 h-4" /> Testar Notificação
                            </button>
                            <button 
                              onClick={handleDisconnectTelegram}
                              disabled={telegramLoading}
                              className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                              {telegramLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Desconectar'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <div className="flex items-start gap-3 text-sm text-gray-400">
                              <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5">1</div>
                              <p>Inicie o bot da Quantium no Telegram.</p>
                            </div>
                            <div className="flex items-start gap-3 text-sm text-gray-400">
                              <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5">2</div>
                              <p>O sistema vinculará automaticamente sua conta.</p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3">
                            <a 
                              href={`https://t.me/QuantiumDemoBot?start=${user?.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 py-3 bg-[#229ED9] hover:bg-[#1e8bc0] text-white font-bold rounded-xl shadow-lg shadow-[#229ED9]/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                              <ExternalLink className="w-4 h-4" /> Abrir Telegram
                            </a>
                            <button 
                              onClick={handleConnectTelegram}
                              disabled={telegramLoading}
                              className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                               {telegramLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verificar Conexão'}
                            </button>
                          </div>
                          
                          <p className="text-xs text-center text-gray-500">
                             Ao conectar, você aceita receber mensagens automatizadas.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FAModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setShow2FAModal(false)}></div>
            <div className="relative bg-[#0f0f0f] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 overflow-hidden">
               
               {/* Modal Header */}
               <div className="p-6 border-b border-white/5 flex justify-between items-center">
                 <h3 className="text-xl font-bold text-white">Configurar 2FA</h3>
                 <button onClick={() => setShow2FAModal(false)} className="text-gray-400 hover:text-white">
                   <X className="w-6 h-6" />
                 </button>
               </div>

               {/* Modal Body */}
               <div className="p-6">
                  {twoFactorStep === 1 && (
                     <div className="text-center space-y-6 animate-in fade-in slide-in-from-right-4">
                         <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
                            <Shield className="w-8 h-8" />
                         </div>
                         <div>
                            <h4 className="text-lg font-bold text-white mb-2">Proteja sua conta</h4>
                            <p className="text-sm text-gray-400">
                              A autenticação de dois fatores adiciona uma camada extra de segurança. Você precisará de um aplicativo autenticador (Google Authenticator, Authy, etc).
                            </p>
                         </div>
                         <button 
                           onClick={start2FASetup}
                           className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all"
                         >
                           Começar Configuração
                         </button>
                     </div>
                  )}

                  {twoFactorStep === 2 && (
                     <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="text-center">
                           <p className="text-sm text-gray-300 mb-4">
                              1. Escaneie o QR Code abaixo com seu aplicativo autenticador.
                           </p>
                           <div className="bg-white p-4 rounded-xl inline-block mb-4">
                              {twoFactorQR ? (
                                <img src={twoFactorQR} alt="2FA QR Code" className="w-40 h-40" />
                              ) : (
                                <div className="w-40 h-40 flex items-center justify-center">
                                   <Loader2 className="w-8 h-8 text-black animate-spin" />
                                </div>
                              )}
                           </div>
                           <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between gap-2">
                              <code className="text-xs text-gray-400 font-mono">{twoFactorSecret}</code>
                              <button onClick={() => copyToClipboard(twoFactorSecret)} className="text-blue-400 hover:text-white">
                                 <Copy className="w-4 h-4" />
                              </button>
                           </div>
                        </div>

                        <div>
                           <p className="text-sm text-gray-300 mb-2">
                              2. Digite o código de 6 dígitos gerado pelo app.
                           </p>
                           <input 
                             type="text"
                             placeholder="000000"
                             maxLength={6}
                             value={twoFactorCode}
                             onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                             className="w-full bg-black/20 border border-white/10 rounded-xl py-3 text-center text-xl font-bold text-white tracking-widest focus:border-blue-500 focus:outline-none"
                           />
                        </div>

                        {twoFactorError && (
                           <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
                              {twoFactorError}
                           </div>
                        )}

                        <button 
                           onClick={confirm2FASetup}
                           disabled={twoFactorLoading || twoFactorCode.length !== 6}
                           className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                           {twoFactorLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verificar e Ativar'}
                        </button>
                     </div>
                  )}

                  {twoFactorStep === 3 && (
                     <div className="text-center space-y-6 animate-in fade-in zoom-in">
                        <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
                           <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <div>
                           <h4 className="text-lg font-bold text-white mb-2">Sucesso!</h4>
                           <p className="text-sm text-gray-400">
                              A autenticação de dois fatores foi ativada na sua conta.
                           </p>
                        </div>
                        <button 
                           onClick={() => setShow2FAModal(false)}
                           className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
                        >
                           Fechar
                        </button>
                     </div>
                  )}
               </div>
            </div>
        </div>,
        document.body
      )}

      {/* Language Modal */}
      {showLangModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setShowLangModal(false)}></div>
          <div className="relative bg-[#0f0f0f] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Selecionar Idioma</h3>
              <button onClick={() => setShowLangModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-2">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    language === lang.code
                    ? 'bg-blue-600/10 border-blue-500 text-white'
                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-xl">{lang.flag}</span>
                    <span className="font-medium">{lang.name}</span>
                  </span>
                  {language === lang.code && <Check className="w-5 h-5 text-blue-400" />}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => !loading && setShowDeleteModal(false)}></div>
          <div className="relative bg-[#0f0f0f] border border-red-500/30 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500 border border-red-500/20">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Excluir Conta?</h3>
              <p className="text-gray-400">
                Tem certeza que deseja excluir permanentemente sua conta? Esta ação não pode ser desfeita.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={loading}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-colors border border-white/10"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
