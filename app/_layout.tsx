import { Feather } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { supabase } from '../src/lib/supabase';
import { AuraColors } from '../src/theme/colors';

SplashScreen.preventAutoHideAsync();

function InitialLayout() {
  const { session, initialized } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const url = Linking.useURL(); 
  
  // Nuevo estado para evitar el bucle infinito de recuperación
  const [hasProcessedRecovery, setHasProcessedRecovery] = useState(false);

  useEffect(() => {
    if (!initialized) return;

    let isRecoveryScenario = hasProcessedRecovery;

    // Procesamos el Deep Link SOLO si no lo hemos hecho ya
    if (url && !hasProcessedRecovery) {
      const params: any = {};
      const queryString = url.includes('#') ? url.split('#')[1] : url.split('?')[1];
      
      if (queryString) {
        queryString.split('&').forEach(pair => {
          const [key, value] = pair.split('=');
          params[key] = value;
        });
      }

      if (params.type === 'recovery' || url.includes('recovery') || url.includes('reset-password')) {
        isRecoveryScenario = true;
        setHasProcessedRecovery(true); // Marcamos que ya atendimos este enlace
        
        if (params.access_token) {
          supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
        }
        
        // Vamos a la pantalla usando un timeout pequeño para garantizar que la sesión se registre
        setTimeout(() => {
             router.replace('/reset-password' as any);
        }, 100);
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setHasProcessedRecovery(true);
        router.replace('/reset-password' as any);
      }
    });

    const currentSegment = segments[0] as string;
    const publicRoutes = ['login', 'register', 'recovery', 'reset-password'];

    // Si estamos en medio de una recuperación, el guardia global se pausa
    if (isRecoveryScenario || currentSegment === 'reset-password') {
      return () => {
        authListener.subscription.unsubscribe();
      };
    }

    if (session && publicRoutes.includes(currentSegment)) {
      router.replace('/(tabs)');
    } else if (!session && !publicRoutes.includes(currentSegment) && currentSegment !== undefined) {
      router.replace('/login');
    }

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [session, initialized, segments, url, hasProcessedRecovery]);

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
  const [fontsLoaded] = useFonts({});

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