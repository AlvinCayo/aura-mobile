import { Session, User } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

type AuthContextProps = {
  user: User | null;
  session: Session | null;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<any>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextProps>({} as AuthContextProps);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);

  useEffect(() => {
    // Función maestra: Asegura que exista el perfil y guarda el token
    const handleUserSync = async (currentUser: User) => {
      try {
        // 1. Verificamos si el perfil público ya existe
        const { data: profileCheck } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', currentUser.id)
          .maybeSingle();
        
        // 2. Si no existe (ej. login por Google), lo creamos a la fuerza
        if (!profileCheck) {
          await supabase.from('profiles').insert([{ 
            id: currentUser.id, 
            email: currentUser.email, 
            role: 'user',
            full_name: currentUser.user_metadata?.full_name || 'Usuario AURA' 
          }]);
        }

        // 3. Manejo de Notificaciones
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await supabase.from('profiles').update({ expo_push_token: token }).eq('id', currentUser.id);
        }
      } catch (error) {
        console.log('Error de sincronización de usuario:', error);
      }
    };

    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setInitialized(true);

      if (session?.user) {
        handleUserSync(session.user);
      }
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        handleUserSync(newSession.user);
      }
    });

    return () => authListener.subscription.unsubscribe();
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
    if (user) {
      await supabase.from('profiles').update({ expo_push_token: null }).eq('id', user.id);
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, initialized, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default', importance: Notifications.AndroidImportance.MAX, vibrationPattern: [0, 250, 250, 250], lightColor: '#FF231F7C',
    });
  }
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;
  }
  return token;
}

export const useAuth = () => useContext(AuthContext);