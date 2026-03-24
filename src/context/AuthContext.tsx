'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';

// Expose the same shape as before so all consumers work unchanged
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
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, color')
          .eq('id', user.id)
          .single();
        if (!error && profile) setCurrentUser(profileToCurrentUser(profile as Profile));
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, color')
          .eq('id', session.user.id)
          .single();
        if (!error && profile) setCurrentUser(profileToCurrentUser(profile as Profile));
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Sign out error:', error.message);
    // Clear local state regardless — the hard redirect in Header handles cleanup
    setCurrentUser(null);
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
