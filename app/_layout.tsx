import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import DevFloatingButton from '../src/components/ui/DevFloatingButton';
import { AuthProvider } from '../src/contexts/AuthContext';
import { supabase } from '../src/lib/supabase';

export default function RootLayout() {
  const router = useRouter();
  useEffect(() => {
    // Escuchar eventos de autenticación de Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Cuando el usuario viene del link de Gmail, lo mandamos a reset-password
        router.replace('../reset-password');
      }
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  return (
    <AuthProvider>
      <View style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="register-center" />
          <Stack.Screen name="recovery" />
          <Stack.Screen name="edit-profile" />
          <Stack.Screen name="center/[id]" />
          <Stack.Screen name="center/[id]/gallery" />
          <Stack.Screen name="center/[id]/reviews" />
          <Stack.Screen name="category/[id]" />
          <Stack.Screen name="map" />
          <Stack.Screen name="booking/[centerId]" />
          <Stack.Screen name="admin" />
          <Stack.Screen name="admin-platform" />
          <Stack.Screen name="appointments/[id]" />
          <Stack.Screen name="booking/confirmation" />
          <Stack.Screen name="qr-scanner" />
          <Stack.Screen name="facial-analysis" />
          <Stack.Screen name="review/[centerId]" />
          <Stack.Screen name="favorites" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="analysis-results" />
          <Stack.Screen name="ar-simulation" />
          <Stack.Screen name="geo-services" />
        </Stack>
        <DevFloatingButton />
      </View>
    </AuthProvider>
  );
}