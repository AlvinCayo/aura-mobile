import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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
import { AuraColors } from '../src/theme/colors';

const STEPS = [
  { id: 1, label: 'Info' },
  { id: 2, label: 'Docs' },
  { id: 3, label: 'Servicios' },
  { id: 4, label: 'Verif.' },
];

export default function RegisterCenterScreen() {
  const [step, setStep] = useState(1);
  const [centerName, setCenterName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const router = useRouter();

  const handleContinue = () => {
    if (step < 4) setStep(step + 1);
    else console.log('Enviar para aprobación');
  };

  const renderStep = () => {
    if (step === 1) {
      return (
        <>
          <Input
            label="Nombre del Centro"
            icon="award"
            placeholder="Nombre de tu centro"
            value={centerName}
            onChangeText={setCenterName}
          />
          <Input
            label="Dirección"
            icon="map-pin"
            placeholder="Dirección completa"
            value={address}
            onChangeText={setAddress}
          />
          <Input
            label="Descripción"
            icon="align-left"
            placeholder="Describe tu centro y servicios"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />
          {/* Zona de upload de licencia */}
          <View style={styles.uploadContainer}>
            <Text style={styles.uploadLabel}>Licencia de Operación</Text>
            <TouchableOpacity style={styles.uploadButton}>
              <Feather name="upload-cloud" size={26} color={AuraColors.primary} />
              <Text style={styles.uploadText}>Subir documento</Text>
              <Text style={styles.uploadHint}>PDF o imagen (máx. 5MB)</Text>
            </TouchableOpacity>
          </View>
        </>
      );
    }
    return (
      <View style={styles.placeholder}>
        <Feather name="clipboard" size={40} color={AuraColors.textMuted} />
        <Text style={styles.placeholderText}>Próximamente</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ProgressSteps steps={STEPS} currentStep={step} />

          <Text style={styles.title}>Registra tu Centro</Text>
          <Text style={styles.subtitle}>Información del establecimiento</Text>

          {renderStep()}

          <Button
            title={step < 4 ? 'Continuar' : 'Enviar para Aprobación'}
            onPress={handleContinue}
            icon={<Feather name="arrow-right" size={18} color="white" />}
            style={styles.continueButton}
          />
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
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  uploadContainer: { marginBottom: 24 },
  uploadLabel: { fontSize: 14, fontWeight: '500', color: AuraColors.textPrimary, marginBottom: 6, marginLeft: 4 },
  uploadButton: {
    backgroundColor: AuraColors.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AuraColors.primary,
    borderStyle: 'dashed',
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  uploadText: { fontSize: 15, fontWeight: '600', color: AuraColors.primary },
  uploadHint: { fontSize: 12, color: AuraColors.textMuted },
  placeholder: { alignItems: 'center', paddingVertical: 40 },
  placeholderText: { fontSize: 16, color: AuraColors.textMuted, marginTop: 12 },
  continueButton: { marginTop: 8 },
});