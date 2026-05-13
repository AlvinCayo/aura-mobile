import { Feather } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
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

useEffect(() => {
    if (!initialized) return;

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/reset-password' as any);
      }
    });

    const currentSegment = segments[0] as string;
    
    // Lista de rutas exclusivas para usuarios NO logueados
    const publicRoutes = ['login', 'register', 'recovery', 'reset-password'];

    if (session && publicRoutes.includes(currentSegment)) {
      // Si ya inició sesión e intenta ir al Login/Registro, lo mandamos a Tabs
      router.replace('/(tabs)');
    } else if (!session && !publicRoutes.includes(currentSegment) && currentSegment !== undefined) {
      // Si NO ha iniciado sesión e intenta ir a Tabs, Become Center o Admin, lo mandamos a Login
      router.replace('/login');
    }

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [session, initialized, segments]);

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
    // Aquí puedes cargar tus fuentes personalizadas si las tienes (ej. 'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'))
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