import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuraColors } from '../src/theme/colors';

export default function ARSimulationScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Simulación AR</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.cameraPlaceholder}>
          <Feather name="camera" size={80} color={AuraColors.textMuted} />
          <Text style={styles.placeholderText}>
            Apunta la cámara a tu rostro para simular el tratamiento
          </Text>
        </View>

        <View style={styles.treatmentOptions}>
          <Text style={styles.optionsTitle}>Tratamientos disponibles</Text>
          {[
            'Limpieza facial profunda',
            'Peeling químico',
            'Rejuvenecimiento con láser',
          ].map((treatment, idx) => (
            <TouchableOpacity key={idx} style={styles.optionButton}>
              <Feather name="play-circle" size={20} color={AuraColors.primary} />
              <Text style={styles.optionText}>{treatment}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AuraColors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AuraColors.border,
  },
  title: { fontSize: 22, fontWeight: '700', color: AuraColors.textPrimary },
  content: { padding: 24 },
  cameraPlaceholder: {
    height: 280,
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: AuraColors.border,
  },
  placeholderText: {
    fontSize: 16,
    color: AuraColors.textMuted,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  treatmentOptions: {},
  optionsTitle: { fontSize: 18, fontWeight: '600', color: AuraColors.textPrimary, marginBottom: 12 },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AuraColors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: AuraColors.border,
    gap: 12,
  },
  optionText: { fontSize: 16, color: AuraColors.textPrimary, fontWeight: '500' },
});