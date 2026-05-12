import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuraColors } from '../src/theme/colors';

const ANALYSIS_DATA = {
  skinType: 'Mixta',
  hydration: 72,
  wrinkles: 34,
  spots: 18,
  texture: 85,
  recommendations: [
    'Hidratación profunda con ácido hialurónico',
    'Tratamiento antioxidante con vitamina C',
    'Protección solar SPF 50+',
  ],
};

export default function AnalysisResultsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Resultados del Análisis</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Resumen de tu piel</Text>

        {/* Tipo de piel */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Feather name="droplet" size={18} color={AuraColors.primary} />
            <Text style={styles.cardLabel}>Tipo de piel</Text>
          </View>
          <Text style={styles.cardValue}>{ANALYSIS_DATA.skinType}</Text>
        </View>

        {/* Métricas */}
        <Text style={styles.sectionTitle}>Métricas de salud</Text>
        {[
          { label: 'Hidratación', value: ANALYSIS_DATA.hydration, icon: 'droplet' as const },
          { label: 'Arrugas', value: ANALYSIS_DATA.wrinkles, icon: 'activity' as const },
          { label: 'Manchas', value: ANALYSIS_DATA.spots, icon: 'sun' as const },
          { label: 'Textura', value: ANALYSIS_DATA.texture, icon: 'align-center' as const },
        ].map((metric, idx) => (
          <View key={idx} style={styles.metricRow}>
            <Feather name={metric.icon} size={16} color={AuraColors.textSecondary} />
            <Text style={styles.metricLabel}>{metric.label}</Text>
            <View style={styles.barContainer}>
              <View style={[styles.barFill, { width: `${metric.value}%` as any }]} />
            </View>
            <Text style={styles.metricValue}>{metric.value}%</Text>
          </View>
        ))}

        {/* Recomendaciones */}
        <Text style={styles.sectionTitle}>Recomendaciones personalizadas</Text>
        {ANALYSIS_DATA.recommendations.map((rec, idx) => (
          <View key={idx} style={styles.recommendationItem}>
            <Feather name="check-circle" size={16} color={AuraColors.success} />
            <Text style={styles.recommendationText}>{rec}</Text>
          </View>
        ))}

        {/* Botón para simular AR */}
        <TouchableOpacity
          style={styles.arButton}
          onPress={() => router.push('/ar-simulation' as any)}
        >
          <Feather name="rotate-cw" size={18} color="white" />
          <Text style={styles.arButtonText}>Ver simulación en realidad aumentada</Text>
        </TouchableOpacity>
      </ScrollView>
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
  sectionTitle: { fontSize: 18, fontWeight: '600', color: AuraColors.textPrimary, marginBottom: 12, marginTop: 8 },
  card: {
    backgroundColor: AuraColors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: AuraColors.border,
    marginBottom: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardLabel: { fontSize: 15, color: AuraColors.textSecondary },
  cardValue: { fontSize: 24, fontWeight: '700', color: AuraColors.textPrimary },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AuraColors.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: AuraColors.border,
  },
  metricLabel: { width: 90, fontSize: 14, color: AuraColors.textSecondary },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: AuraColors.border,
    borderRadius: 4,
    marginHorizontal: 10,
  },
  barFill: {
    height: 8,
    backgroundColor: AuraColors.primary,
    borderRadius: 4,
  },
  metricValue: { fontSize: 14, fontWeight: '600', color: AuraColors.textPrimary, width: 40 },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  recommendationText: { flex: 1, fontSize: 15, color: AuraColors.textPrimary, lineHeight: 22 },
  arButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AuraColors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  arButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});