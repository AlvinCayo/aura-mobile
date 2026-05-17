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

// Configuración global: Qué hacer si llega una notificación mientras el usuario tiene la app abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, // Propiedad agregada para solucionar el error
    shouldShowList: true,   // Propiedad agregada para solucionar el error
  }),
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);

  useEffect(() => {
    // Función auxiliar para registrar el token en Supabase
    const handlePushToken = async (userId: string) => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await supabase
            .from('profiles')
            .update({ expo_push_token: token })
            .eq('id', userId);
        }
      } catch (error) {
        console.log('Aviso (Push):', error);
      }
    };

    // Buscar la sesión inicial al abrir la app
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setInitialized(true);

      // Si ya estaba logueado al abrir la app, actualizamos su token de notificaciones
      if (session?.user) {
        handlePushToken(session.user.id);
      }
    };

    fetchSession();

    // Escuchar cambios (cuando hace login o registro)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      if (newSession?.user) {
        handlePushToken(newSession.user.id);
      }
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
    // Antes de cerrar sesión, borramos el token de push para que no le lleguen notificaciones fantasma
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

// --- FUNCIÓN DE EXPO PARA GESTIONAR NOTIFICACIONES ---
async function registerForPushNotificationsAsync() {
  let token;

  // En Android se requiere un canal de notificación
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // Verificamos si es un dispositivo físico (los simuladores a veces no soportan push)
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // Si no tiene permisos, se los pedimos
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    // Si el usuario denegó los permisos, no podemos hacer nada
    if (finalStatus !== 'granted') {
      console.log('Permiso de notificaciones denegado por el usuario.');
      return;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    // Obtenemos el token usando el Project ID de Expo
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    })).data;
    
  } else {
    console.log('Las notificaciones Push solo funcionan en dispositivos físicos.');
  }

  return token;
}

export const useAuth = () => useContext(AuthContext);