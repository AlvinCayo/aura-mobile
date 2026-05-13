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
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../src/components/ui/Button';
import Input from '../src/components/ui/Input';
import ProgressSteps from '../src/components/ui/ProgressSteps';
import { useAuth } from '../src/contexts/AuthContext';
import { supabase } from '../src/lib/supabase';
import { AuraColors } from '../src/theme/colors';

const STEPS = [
  { id: 1, label: 'Personal' },
  { id: 2, label: 'Preferencias' },
  { id: 3, label: 'Verificación' },
];

const PREFERENCE_OPTIONS = [
  'Barbería',
  'Peluquería',
  'Spa',
  'Masajes',
  'Faciales',
  'Uñas',
  'Depilación',
  'Maquillaje',
];

export default function RegisterEndUserScreen() {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const router = useRouter();
  const { signUp } = useAuth();

  const togglePreference = (pref: string) => {
    if (selectedPreferences.includes(pref)) {
      setSelectedPreferences(selectedPreferences.filter(p => p !== pref));
    } else {
      setSelectedPreferences([...selectedPreferences, pref]);
    }
  };

  const handleContinue = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Registrar usuario
      const { error } = await signUp(email, password, fullName, 'user');
      if (error) {
        Alert.alert('Error al registrarse', error.message);
        return;
      }

      // Guardar preferencias en el perfil
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Error', 'No se pudo obtener el usuario.');
        return;
      }

      const { error: prefError } = await supabase
        .from('profiles')
        .update({ preferences: selectedPreferences })
        .eq('id', user.id);

      if (prefError) {
        Alert.alert('Error al guardar preferencias', prefError.message);
      } else {
        Alert.alert('Registro exitoso', 'Revisa tu correo para confirmar tu cuenta.');
        router.replace('/login');
      }
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Input
              label="Nombre completo"
              icon="user"
              placeholder="Tu nombre completo"
              value={fullName}
              onChangeText={setFullName}
            />
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
              label="Teléfono"
              icon="phone"
              placeholder="+1 234 567 890"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Input
              label="Contraseña"
              icon="lock"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChangeText={setPassword}
              isPassword
            />
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
            >
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms && <Feather name="check" size={12} color="white" />}
              </View>
              <Text style={styles.termsText}>
                Acepto los Términos y la Política de Privacidad
              </Text>
            </TouchableOpacity>
          </>
        );
      case 2:
        return (
          <>
            <Text style={styles.sectionTitle}>¿Qué servicios te interesan?</Text>
            <View style={styles.preferencesGrid}>
              {PREFERENCE_OPTIONS.map((pref) => {
                const isSelected = selectedPreferences.includes(pref);
                return (
                  <TouchableOpacity
                    key={pref}
                    style={[styles.preferenceChip, isSelected && styles.preferenceChipActive]}
                    onPress={() => togglePreference(pref)}
                  >
                    <Text style={[styles.preferenceChipText, isSelected && styles.preferenceChipTextActive]}>
                      {pref}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        );
      case 3:
        return (
          <View style={styles.placeholder}>
            <Feather name="mail" size={40} color={AuraColors.textMuted} />
            <Text style={styles.placeholderText}>Te enviaremos un correo de verificación</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ProgressSteps steps={STEPS} currentStep={step} />

          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>
            Paso {step} de {STEPS.length} – {STEPS[step - 1].label}
          </Text>

          <View style={styles.formContainer}>{renderStepContent()}</View>

          <Button
            title={step < 3 ? 'Continuar' : 'Crear Cuenta'}
            onPress={handleContinue}
            icon={<Feather name="arrow-right" size={18} color="white" />}
            style={styles.continueButton}
          />

          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.loginLink}>¿Ya tienes cuenta? Inicia sesión</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  keyboardView: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: AuraColors.textSecondary, marginBottom: 32 },
  formContainer: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 24 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: AuraColors.border, justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: AuraColors.primary, borderColor: AuraColors.primary },
  termsText: { flex: 1, fontSize: 13, color: AuraColors.textSecondary },
  preferencesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  preferenceChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: AuraColors.card, borderWidth: 1, borderColor: AuraColors.border,
  },
  preferenceChipActive: { backgroundColor: AuraColors.primary, borderColor: AuraColors.primary },
  preferenceChipText: { fontSize: 14, color: AuraColors.textSecondary },
  preferenceChipTextActive: { color: 'white', fontWeight: '600' },
  placeholder: { alignItems: 'center', paddingVertical: 40 },
  placeholderText: { fontSize: 16, color: AuraColors.textMuted, marginTop: 12 },
  continueButton: { marginBottom: 20 },
  loginLink: { textAlign: 'center', fontSize: 15, color: AuraColors.primary, fontWeight: '500' },
});