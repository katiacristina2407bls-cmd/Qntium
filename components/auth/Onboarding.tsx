import React, { useState, useEffect } from 'react';
import { Camera, User, Calendar, Globe, Phone, CheckCircle2, ArrowRight, Delete, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Step 1 Data
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dob: '',
    gender: 'select',
    nationality: ''
  });

  // Initialize name from user metadata if available
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setFormData(prev => ({ ...prev, name: user.user_metadata.full_name }));
    }
  }, [user]);

  // Avatar State
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Step 3 Data
  const [pin, setPin] = useState('');

  const handleNext = () => {
    setStep(prev => prev + 1);
  };

  const handlePinInput = (num: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
    }
  };

  const handlePinDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const finishOnboarding = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      let avatarUrl = null;

      // Upload Avatar if selected
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

      // Generate a unique referral code for this user
      // Using first 3 chars of name + 3 random numbers/letters
      const cleanName = formData.name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
      const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
      const myReferralCode = `${cleanName}${randomSuffix}`;

      const updateData: any = {
        full_name: formData.name,
        phone: formData.phone,
        dob: formData.dob,
        gender: formData.gender,
        nationality: formData.nationality,
        pin_code: pin, // In a real app, hash this before sending or on server
        onboarded: true,
        balance: 0, // Ensure new users start with 0 balance
        referral_code: myReferralCode,
        total_referrals: 0,
        commission_balance: 0
      };

      if (avatarUrl) {
        updateData.avatar_url = avatarUrl;
      }

      // Process Referral Logic
      const usedRefCode = user.user_metadata?.referral_code_signup;
      if (usedRefCode) {
        try {
           // Find the sponsor
           const { data: sponsor } = await supabase
             .from('profiles')
             .select('id')
             .eq('referral_code', usedRefCode)
             .single();
           
           if (sponsor) {
             updateData.referred_by = sponsor.id;
             
             // Call the Secure Database Function to increment referrals
             // This bypasses RLS issues since the function is SECURITY DEFINER
             await supabase.rpc('increment_referrals', { sponsor_id: sponsor.id });
           }
        } catch (refErr) {
           console.warn('Error processing referral:', refErr);
           // Do not block onboarding if referral fails
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      onComplete();
    } catch (err: any) {
      console.error(err);
      setError('Falha ao salvar os dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Personal Info
  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative z-50">
        <div className="max-w-lg w-full bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-white">Dados Pessoais</h2>
              <span className="text-blue-500 font-mono">1/3</span>
            </div>
            <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-1/3 transition-all duration-500"></div>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input required type="text" className="w-full pl-10 bg-white/5 border border-white/10 rounded-lg py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Seu nome" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <input required type="tel" className="w-full pl-10 bg-white/5 border border-white/10 rounded-lg py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="(00) 00000-0000" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Data Nasc.</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <input required type="date" className="w-full pl-10 bg-white/5 border border-white/10 rounded-lg py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Gênero</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none" 
                  value={formData.gender} 
                  onChange={e => setFormData({...formData, gender: e.target.value})}
                >
                  <option value="select" disabled className="bg-zinc-900 text-gray-400">Selecione</option>
                  <option value="m" className="bg-zinc-900 text-white">Masculino</option>
                  <option value="f" className="bg-zinc-900 text-white">Feminino</option>
                  <option value="o" className="bg-zinc-900 text-white">Outro</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Nacionalidade</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <input required type="text" className="w-full pl-10 bg-white/5 border border-white/10 rounded-lg py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Brasileiro" value={formData.nationality} onChange={e => setFormData({...formData, nationality: e.target.value})} />
                </div>
              </div>
            </div>

            <button type="submit" className="w-full mt-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2">
              Próximo <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Step 2: Profile Picture
  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative z-50">
        <div className="max-w-md w-full bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl text-center">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-white">Foto de Perfil</h2>
              <span className="text-blue-500 font-mono">2/3</span>
            </div>
            <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-2/3 transition-all duration-500"></div>
            </div>
          </div>

          <div className="relative w-40 h-40 mx-auto mb-8 group cursor-pointer bg-white/5 rounded-full flex items-center justify-center border-2 border-dashed border-gray-600 hover:border-blue-500 transition-all overflow-hidden">
             {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
             ) : (
               <>
                <div className="absolute inset-0 bg-blue-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Camera className="w-12 h-12 text-gray-400 group-hover:text-blue-400 transition-colors" />
                <span className="absolute bottom-8 text-xs text-gray-400 font-medium">Adicionar</span>
               </>
             )}
            
            <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
            />
          </div>

          <h3 className="text-lg font-semibold text-white mb-2">Mostre seu rosto</h3>
          <p className="text-gray-400 text-sm mb-8">Isso ajuda a verificar sua identidade e manter a comunidade segura.</p>

          <div className="flex flex-col gap-3">
            <button onClick={handleNext} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all">
              {avatarFile ? 'Continuar' : 'Pular por enquanto'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Withdrawal PIN (Custom Keyboard)
  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative z-50">
        <div className="max-w-md w-full bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl flex flex-col items-center">
          
          {loading ? (
             <div className="py-20 flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-white font-semibold animate-pulse">Criando sua conta...</p>
                <p className="text-xs text-gray-500 mt-2">Configurando perfil e carteira...</p>
             </div>
          ) : (
            <>
              <div className="w-full mb-8">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold text-white">Senha de Saque</h2>
                  <span className="text-blue-500 font-mono">3/3</span>
                </div>
                <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-full transition-all duration-500"></div>
                </div>
                <p className="text-gray-400 text-sm mt-2">Crie um PIN de 6 dígitos para transações.</p>
              </div>

              {/* PIN Display */}
              <div className="flex gap-3 mb-10">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`w-4 h-4 rounded-full transition-all duration-200 ${i < pin.length ? 'bg-blue-500 scale-110 shadow-[0_0_10px_#3b82f6]' : 'bg-gray-700'}`} />
                ))}
              </div>

              {/* Custom Keyboard */}
              <div className="w-full max-w-[280px] grid grid-cols-3 gap-4 mb-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => handlePinInput(num.toString())}
                    className="h-16 rounded-xl bg-white/5 border border-white/5 text-2xl font-semibold text-white hover:bg-white/10 active:scale-95 transition-all"
                  >
                    {num}
                  </button>
                ))}
                <div className="pointer-events-none"></div> {/* Empty slot for alignment */}
                <button
                  onClick={() => handlePinInput('0')}
                  className="h-16 rounded-xl bg-white/5 border border-white/5 text-2xl font-semibold text-white hover:bg-white/10 active:scale-95 transition-all"
                >
                  0
                </button>
                <button
                  onClick={handlePinDelete}
                  className="h-16 rounded-xl bg-white/5 border border-white/5 text-white hover:bg-red-500/20 hover:text-red-400 active:scale-95 transition-all flex items-center justify-center"
                >
                  <Delete className="w-6 h-6" />
                </button>
              </div>
              
              {error && (
                <div className="mb-4 p-2 bg-red-500/10 rounded border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <button 
                onClick={finishOnboarding}
                disabled={pin.length !== 6}
                className={`w-full py-4 font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  pin.length === 6 
                    ? 'bg-green-600 hover:bg-green-500 text-white shadow-[0_0_20px_rgba(22,163,74,0.4)]' 
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" /> Finalizar Cadastro
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
};