import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuraColors } from '../../../src/theme/colors';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Cliente</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Nombre</Text>
          <Text style={styles.value}>María García</Text>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>maria@email.com</Text>
          <Text style={styles.label}>Teléfono</Text>
          <Text style={styles.value}>+1 234 567 8900</Text>
          <Text style={styles.label}>Visitas totales</Text>
          <Text style={styles.value}>6</Text>
        </View>
        <Text style={styles.sectionTitle}>Historial de visitas</Text>
        {[
          { date: '15 Mar 2025', service: 'Limpieza facial' },
          { date: '22 Feb 2025', service: 'Masaje relajante' },
          { date: '10 Ene 2025', service: 'Peeling químico' },
        ].map((visit, i) => (
          <View key={i} style={styles.visitRow}>
            <Feather name="calendar" size={16} color={AuraColors.textMuted} />
            <Text style={styles.visitDate}>{visit.date}</Text>
            <Text style={styles.visitService}>{visit.service}</Text>
          </View>
        ))}
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
  title: { fontSize: 20, fontWeight: '700', color: AuraColors.textPrimary },
  content: { padding: 24 },
  card: {
    backgroundColor: AuraColors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: AuraColors.border,
    marginBottom: 20,
  },
  label: { fontSize: 13, color: AuraColors.textMuted, marginTop: 10 },
  value: { fontSize: 16, fontWeight: '500', color: AuraColors.textPrimary },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: AuraColors.textPrimary, marginBottom: 10 },
  visitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: AuraColors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AuraColors.border,
    marginBottom: 6,
    gap: 8,
  },
  visitDate: { fontSize: 14, color: AuraColors.textPrimary, fontWeight: '500' },
  visitService: { fontSize: 14, color: AuraColors.textSecondary, marginLeft: 8 },
});