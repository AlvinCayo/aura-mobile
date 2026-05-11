import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KpiCard from '../../src/components/ui/KpiCard';
import SimpleBarChart from '../../src/components/ui/SimpleBarChart';
import { AuraColors } from '../../src/theme/colors';

// Datos de ejemplo
const WEEKLY_APPOINTMENTS = [
  { label: 'Lun', value: 5 },
  { label: 'Mar', value: 8 },
  { label: 'Mié', value: 6 },
  { label: 'Jue', value: 10 },
  { label: 'Vie', value: 12 },
  { label: 'Sáb', value: 9 },
  { label: 'Dom', value: 0 },
];

const MONTHLY_INCOME = [
  { label: 'Sep', value: 3200 },
  { label: 'Oct', value: 2800 },
  { label: 'Nov', value: 3600 },
  { label: 'Dic', value: 4100 },
  { label: 'Ene', value: 3800 },
  { label: 'Feb', value: 4200 },
];

export default function AnalyticsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Estadísticas</Text>
        <Text style={styles.subtitle}>Rendimiento de tu centro</Text>

        {/* KPIs resumidos */}
        <View style={styles.kpiRow}>
          <KpiCard icon="calendar" label="Citas/Mes" value={124} trend="+8%" trendUp style={{ flex: 1, marginRight: 12 }} />
          <KpiCard icon="dollar-sign" label="Ingresos" value="€4.2k" trend="+12%" trendUp style={{ flex: 1 }} />
        </View>

        {/* Citas por semana */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Citas por día (última semana)</Text>
          <SimpleBarChart data={WEEKLY_APPOINTMENTS} height={130} />
        </View>

        {/* Ingresos mensuales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingresos mensuales (últimos 6 meses)</Text>
          <SimpleBarChart data={MONTHLY_INCOME} height={130} />
        </View>

        {/* Servicios más populares */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Servicios más demandados</Text>
          <SimpleBarChart
            data={[
              { label: 'Limpieza', value: 45 },
              { label: 'Masaje', value: 38 },
              { label: 'Peeling', value: 27 },
              { label: 'Manicura', value: 15 },
            ]}
            height={130}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  scrollContent: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 14, color: AuraColors.textSecondary, marginBottom: 24 },
  kpiRow: { flexDirection: 'row', marginBottom: 24 },
  section: {
    backgroundColor: AuraColors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: AuraColors.border,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: AuraColors.textPrimary, marginBottom: 16 },
});