'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'tech';
  color: string;
}

interface AuthContextType {
  currentUser: CurrentUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; role?: 'admin' | 'tech' }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isTech: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function profileToCurrentUser(profile: Profile): CurrentUser {
  return {
    id: profile.id,
    email: profile.email ?? '',
    fullName: profile.full_name,
    role: profile.role,
    color: profile.color,
  };
}

async function fetchProfile(supabase: ReturnType<typeof createClient>, userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, color')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return data as Profile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Stable Supabase client reference — createBrowserClient is a singleton per key pair
  const supabase = useRef(createClient()).current;

  useEffect(() => {
    let mounted = true;

    // getUser() validates the JWT with Supabase servers and ALWAYS resolves.
    // onAuthStateChange INITIAL_SESSION is NOT guaranteed to fire in all
    // environments (known issue with @supabase/ssr on Railway/Vercel cold starts).
    // Using getUser() here prevents the eternal loading spinner.
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!mounted) return;
      if (user) {
        const profile = await fetchProfile(supabase, user.id);
        if (mounted && profile) setCurrentUser(profileToCurrentUser(profile));
      }
      if (mounted) setIsLoading(false);
    });

    // onAuthStateChange handles transitions AFTER initial load.
    // SIGNED_IN is handled by signIn() which already sets currentUser + isLoading.
    // INITIAL_SESSION is handled by getUser() above.
    // TOKEN_REFRESHED needs no action — JWT refreshes silently.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signIn = async (
    email: string,
    password: string,
  ): Promise<{ error: string | null; role?: 'admin' | 'tech' }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    if (data.user) {
      const profile = await fetchProfile(supabase, data.user.id);

      if (!profile) {
        return { error: 'Profile not found. Contact your admin — your account may not be set up yet.' };
      }

      const user = profileToCurrentUser(profile);
      setCurrentUser(user);
      setIsLoading(false); // auth state is known immediately — don't wait for onAuthStateChange
      return { error: null, role: user.role };
    }

    return { error: null };
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Sign out error:', error.message);
    // Immediately clear state so the UI updates before the async SIGNED_OUT event fires
    setCurrentUser(null);
    setIsLoading(false);
  };

  const value: AuthContextType = {
    currentUser,
    isLoading,
    signIn,
    logout,
    isAdmin: currentUser?.role === 'admin',
    isTech: currentUser?.role === 'tech',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
