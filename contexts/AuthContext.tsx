
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  balance: number;
  onboarded: boolean;
  avatar_url?: string | null;
  phone?: string | null;
  referral_code?: string | null;
  referred_by?: string | null;
  commission_balance?: number;
  total_referrals?: number;
  status?: string;
  ban_reason?: string;
  two_factor_enabled?: boolean;
  telegram_connected?: boolean;
  mobile_layout?: 'sidebar' | 'bottom';
  voucher?: boolean;
  pin_code?: string;
  beta_features?: boolean;
  is_admin?: boolean;
}

export interface BanData {
  status: string;
  reason: string | null;
}

interface AuthContextType {
  session: any | null;
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  passwordRecoveryMode: boolean;
  banData: BanData | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setPasswordRecoveryMode: (value: boolean) => void;
  setBanData: (data: BanData | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  passwordRecoveryMode: false,
  banData: null,
  signOut: async () => {},
  refreshProfile: async () => {},
  setPasswordRecoveryMode: () => {},
  setBanData: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecoveryMode, setPasswordRecoveryMode] = useState(false);
  const [banData, setBanData] = useState<BanData | null>(null);

  const signOut = async () => {
    await (supabase.auth as any).signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
    setPasswordRecoveryMode(false);
    // We do NOT clear banData here to allow the modal to persist after auto-logout
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Fallback profile to prevent getting stuck in Onboarding if DB fails
        setProfile({
          id: userId,
          email: user?.email || '',
          full_name: user?.user_metadata?.full_name || 'Usuário',
          balance: 0,
          onboarded: true, // Force onboarded to true so user goes to Dashboard
          avatar_url: null,
          status: 'active'
        });
      } else if (data) {
        // Security check: if user is suspended or banned, force logout
        if (data.status === 'suspended' || data.status === 'banned') {
          setBanData({ status: data.status, reason: data.ban_reason });
          await signOut();
          return;
        }
        setProfile(data);
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      // Fallback profile on exception
      setProfile({
        id: userId,
        email: user?.email || '',
        full_name: 'Usuário',
        balance: 0,
        onboarded: true,
        avatar_url: null,
        status: 'active'
      });
    }
  };

  useEffect(() => {
    // Get initial session
    (supabase.auth as any).getSession().then(({ data: { session } }: any) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Ensure loading is set to false after profile fetch
        fetchProfile(session.user.id).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for changes
    const {
      data: { subscription },
    } = (supabase.auth as any).onAuthStateChange((event: string, session: any) => {
      // Prevent race conditions by ensuring loading is true during auth transitions
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setLoading(true);
      }
      
      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecoveryMode(true);
      }
      
      if (session?.user) {
        fetchProfile(session.user.id).then(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      profile, 
      loading, 
      passwordRecoveryMode, 
      banData,
      setPasswordRecoveryMode, 
      signOut, 
      refreshProfile,
      setBanData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
