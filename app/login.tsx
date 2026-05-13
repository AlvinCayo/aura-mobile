import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../src/components/ui/Button';
import Input from '../src/components/ui/Input';
import SocialButton from '../src/components/ui/SocialButton';
import { useAuth } from '../src/contexts/AuthContext';
import { createDeepLink } from '../src/lib/deeplink';
import { supabase } from '../src/lib/supabase';
import { AuraColors } from '../src/theme/colors';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { signIn } = useAuth();

  // Función para login con email/contraseña
  const handleLogin = async () => {
    const { error } = await signIn(email, password);
    if (error) {
      Alert.alert('Error al iniciar sesión', error.message);
    } else {
      router.replace('/(tabs)');
    }
  };

  // Función para Google
  const handleGoogleSignIn = async () => {
    const redirectUrl = createDeepLink();
    
    // 1. Obtenemos la URL de autenticación de Supabase
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: redirectUrl,
        queryParams: {
          prompt: 'select_account', // <-- ESTO FUERZA LA PANTALLA DE SELECCIÓN DE CUENTA
        }
      },
    });

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    // 2. Abrimos el navegador nativo del celular con esa URL
    if (data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      
      // Si el login es exitoso, redirigimos al usuario
      if (result.type === 'success') {
        router.replace('/(tabs)');
      }
    }
  };

  // Función para Facebook
  const handleFacebookSignIn = async () => {
    const redirectUrl = createDeepLink();
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: redirectUrl },
    });

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    if (data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      if (result.type === 'success') {
        router.replace('/(tabs)');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Feather name={'sparkles' as any} size={28} color={AuraColors.primary} />
            </View>
            <Text style={styles.appName}>AURA</Text>
            <Text style={styles.tagline}>Bienestar & Estética</Text>
          </View>

          <Text style={styles.title}>Bienvenido de vuelta</Text>
          <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

          <View style={styles.socialRow}>
            <SocialButton provider="google" onPress={handleGoogleSignIn} />
            <SocialButton provider="facebook" onPress={handleFacebookSignIn} />
          </View>

          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>o continúa con email</Text>
            <View style={styles.separatorLine} />
          </View>

          <Input
            label="Correo Electrónico"
            icon="mail"
            placeholder="tu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Contraseña"
            icon="lock"
            placeholder="Tu contraseña"
            value={password}
            onChangeText={setPassword}
            isPassword
          />

          <TouchableOpacity onPress={() => router.push('/recovery')}>
            <Text style={styles.forgotPassword}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <Button
            title="Iniciar Sesión"
            onPress={handleLogin}
            icon={<Feather name="arrow-right" size={18} color="white" />}
            style={styles.loginButton}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.footerLink}>Regístrate</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => router.push('/register-center')}>
              <Text style={styles.centerLink}>¿Eres dueño de un centro? Regístrate aquí</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AuraColors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 44,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: AuraColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: AuraColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: AuraColors.textPrimary,
  },
  tagline: {
    fontSize: 14,
    color: AuraColors.textSecondary,
    marginTop: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: AuraColors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: AuraColors.textSecondary,
    marginBottom: 32,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: AuraColors.border,
  },
  separatorText: {
    fontSize: 14,
    color: AuraColors.textMuted,
  },
  forgotPassword: {
    fontSize: 14,
    color: AuraColors.primary,
    fontWeight: '500',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 20,
  },
  loginButton: {
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 15,
    color: AuraColors.textSecondary,
  },
  footerLink: {
    fontSize: 15,
    color: AuraColors.primary,
    fontWeight: '600',
  },
  centerLink: {
  marginTop: 16,
  textAlign: 'center',
  fontSize: 14,
  color: AuraColors.primary,
  fontWeight: '500',
},
});