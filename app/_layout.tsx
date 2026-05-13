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
    // Si la autenticación aún no se inicializa, no hacemos nada
    if (!initialized) return;

    // Lógica para detectar el evento de recuperación de contraseña (Deep Link)
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/reset-password' as any);
      }
    });

    // Lógica principal de redirección basada en la sesión
    // Lógica principal de redirección basada en la sesión
    const currentSegment = segments[0] as string; // <-- Soluciona el segundo error
    const inAuthGroup = currentSegment === '(tabs)' || currentSegment === 'admin' || currentSegment === 'payment';

    if (session && !inAuthGroup) {
      // Si hay sesión pero no está en un grupo protegido, enviarlo a (tabs)
      router.replace('/(tabs)');
    } else if (!session && inAuthGroup) {
      // Si NO hay sesión pero intenta acceder a un grupo protegido, enviarlo a login
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