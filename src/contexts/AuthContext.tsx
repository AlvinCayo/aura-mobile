import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type AuthContextProps = {
  user: User | null;
  session: Session | null;
  initialized: boolean; // <-- Soluciona el primer error
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<any>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextProps>({} as AuthContextProps);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);

  useEffect(() => {
    // Buscar la sesión inicial al abrir la app
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setInitialized(true); // Ya terminó de cargar
    };

    fetchSession();

    // Escuchar cambios (login, logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (email: string, password: string, fullName: string, role: string) => {
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, initialized, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);