import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuraColors } from '../src/theme/colors';

export default function FacialAnalysisScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Análisis Facial</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.content}>
        <View style={styles.uploadArea}>
          <Feather name="camera" size={48} color={AuraColors.primary} />
          <Text style={styles.uploadText}>Sube una selfie o toma una foto</Text>
          <Text style={styles.uploadHint}>Analizaremos tu piel y te recomendaremos tratamientos</Text>
        </View>
        <View style={styles.previewPlaceholder}>
          <Feather name="user" size={64} color={AuraColors.textMuted} />
          <Text style={styles.previewHint}>Vista previa del análisis</Text>
        </View>
        <TouchableOpacity style={styles.analyzeButton}>
          <Text style={styles.analyzeText}>Iniciar análisis</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  title: { fontSize: 20, fontWeight: '700' },
  content: { paddingHorizontal: 24, paddingTop: 20 },
  uploadArea: {
    backgroundColor: AuraColors.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: AuraColors.primary,
    borderStyle: 'dashed',
    paddingVertical: 40,
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadText: { fontSize: 16, fontWeight: '600', color: AuraColors.textPrimary, marginTop: 12 },
  uploadHint: { fontSize: 14, color: AuraColors.textMuted, marginTop: 8, textAlign: 'center' },
  previewPlaceholder: {
    height: 200,
    backgroundColor: AuraColors.border,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  previewHint: { fontSize: 14, color: AuraColors.textMuted, marginTop: 12 },
  analyzeButton: {
    backgroundColor: AuraColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  analyzeText: { color: 'white', fontSize: 16, fontWeight: '600' },
});