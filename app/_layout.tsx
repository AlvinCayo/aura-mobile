import { Feather } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { supabase } from '../src/lib/supabase';
import { AuraColors } from '../src/theme/colors';

// Evita que la pantalla de inicio (splash screen) se oculte automáticamente
SplashScreen.preventAutoHideAsync();

function InitialLayout() {
  const { session, initialized } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  
  // NUEVO: Atrapamos la URL con la que se abrió la aplicación (ej. desde el correo)
  const url = Linking.useURL(); 

  useEffect(() => {
    if (!initialized) return;

    let isRecoveryScenario = false;

    // 1. Parseo manual del Deep Link para recuperación de contraseñas
    if (url) {
      const params: any = {};
      const queryString = url.includes('#') ? url.split('#')[1] : url.split('?')[1];
      
      if (queryString) {
        queryString.split('&').forEach(pair => {
          const [key, value] = pair.split('=');
          params[key] = value;
        });
      }

      // Detectamos si el link entrante es de recuperación
      if (params.type === 'recovery' || url.includes('recovery') || url.includes('reset-password')) {
        isRecoveryScenario = true;
        
        // Extraemos los tokens y creamos una sesión temporal para poder cambiar la clave
        if (params.access_token) {
          supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
        }
        
        // Forzamos el salto a la pantalla de resetear contraseña
        router.replace('/reset-password' as any);
      }
    }

    // 2. Escuchador oficial de Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/reset-password' as any);
      }
    });

    const currentSegment = segments[0] as string;
    
    // Lista de rutas exclusivas para usuarios NO logueados
    const publicRoutes = ['login', 'register', 'recovery', 'reset-password'];

    // 3. EXCEPCIÓN CRÍTICA: Si el usuario está recuperando su contraseña o ya está en esa pantalla, 
    // pausamos al guardia de seguridad para que no lo expulse al Login ni a los Tabs.
    if (isRecoveryScenario || currentSegment === 'reset-password') {
      return () => {
        authListener.subscription.unsubscribe();
      };
    }

    // 4. Lógica original del Guardia
    if (session && publicRoutes.includes(currentSegment)) {
      router.replace('/(tabs)');
    } else if (!session && !publicRoutes.includes(currentSegment) && currentSegment !== undefined) {
      router.replace('/login');
    }

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [session, initialized, segments, url]);

  // Mientras inicializa la autenticación, mostramos la pantalla de carga
  if (!initialized) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.logoCircle}>
          <Feather name={'sparkles' as any} size={40} color={AuraColors.primary} />
        </View>
        <Text style={styles.appName}>AURA</Text>
        <ActivityIndicator size="large" color={AuraColors.primary} style={{ marginTop: 24 }} />
      </View>
    );
  }

  // Si ya inicializó, mostramos el Stack principal de navegación
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="become-center" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      <Stack.Screen name="payment" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // Aquí puedes cargar tus fuentes personalizadas si las tienes
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <InitialLayout />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: AuraColors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: AuraColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: AuraColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  appName: {
    fontSize: 40,
    fontWeight: '800',
    color: AuraColors.textPrimary,
    letterSpacing: 2,
  },
});