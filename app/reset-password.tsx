import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Button from '../src/components/ui/Button';
import Input from '../src/components/ui/Input';
import { supabase } from '../src/lib/supabase';
import { AuraColors } from '../src/theme/colors';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Éxito', 'Tu contraseña ha sido actualizada.');
      router.replace('/login');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nueva Contraseña</Text>
      <Text style={styles.subtitle}>Escribe tu nueva clave de acceso</Text>
      <Input
        label="Nueva Contraseña"
        placeholder="******"
        isPassword
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Actualizar Contraseña" onPress={handleReset} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: AuraColors.background, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: AuraColors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 16, color: AuraColors.textSecondary, marginBottom: 32 },
});