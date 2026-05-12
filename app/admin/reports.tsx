import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuraColors } from '../../src/theme/colors';

export default function ReportsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Reportes</Text>
      {[
        { label: 'Citas del mes', icon: 'calendar' },
        { label: 'Ingresos', icon: 'dollar-sign' },
        { label: 'Clientes frecuentes', icon: 'users' },
        { label: 'Servicios más vendidos', icon: 'bar-chart-2' },
      ].map((r, i) => (
        <TouchableOpacity key={i} style={styles.row}>
          <Feather name={r.icon as any} size={18} color={AuraColors.primary} />
          <Text style={styles.rowLabel}>{r.label}</Text>
          <Feather name="download" size={18} color={AuraColors.textMuted} />
        </TouchableOpacity>
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background, paddingTop: 40 },
  title: { fontSize: 24, fontWeight: '700', paddingHorizontal: 24, marginBottom: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: AuraColors.card,
    marginHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AuraColors.border,
    marginBottom: 10,
    gap: 12,
  },
  rowLabel: { flex: 1, fontSize: 16 },
});