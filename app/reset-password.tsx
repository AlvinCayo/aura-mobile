import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../src/components/ui/Button';
import Input from '../src/components/ui/Input';
import { supabase } from '../src/lib/supabase';
import { AuraColors } from '../src/theme/colors';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleResetPassword = async () => {
    // Validaciones básicas de seguridad
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Por favor, completa ambos campos.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Seguridad', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      // Comando de Supabase para actualizar la contraseña del usuario actual
      // (Recordemos que el _layout ya le dio una sesión temporal mediante el token del correo)
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      Alert.alert(
        '¡Éxito!',
        'Tu contraseña ha sido actualizada correctamente. Ahora puedes iniciar sesión.',
        [{ text: 'Ir al Login', onPress: () => router.replace('/login') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerSection}>
            <View style={styles.iconCircle}>
              <Feather name="shield" size={32} color={AuraColors.primary} />
            </View>
            <Text style={styles.title}>Nueva Contraseña</Text>
            <Text style={styles.subtitle}>
              Crea una contraseña segura que no hayas usado antes.
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Nueva Contraseña"
              icon="lock"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              isPassword
            />

            <Input
              label="Confirmar Contraseña"
              icon="check-circle"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword
            />

            <Button
              title="Actualizar Contraseña"
              onPress={handleResetPassword}
              loading={loading}
              style={styles.button}
            />
          </View>
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
  content: {
    padding: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 30,
    backgroundColor: AuraColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: AuraColors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: AuraColors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  button: {
    marginTop: 16,
  },
});