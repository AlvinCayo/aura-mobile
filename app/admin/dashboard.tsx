import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdminAppointmentItem from '../../src/components/ui/AdminAppointmentItem';
import KpiCard from '../../src/components/ui/KpiCard';
import { AuraColors } from '../../src/theme/colors';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const KPIS_PER_ROW = 2;
const KPI_CARD_WIDTH = (width - 48 - CARD_GAP * (KPIS_PER_ROW - 1)) / KPIS_PER_ROW;

const TODAY_APPOINTMENTS = [
  {
    id: '1',
    clientName: 'María García',
    serviceName: 'Limpieza facial',
    time: '10:00',
    status: 'pending' as const,
  },
  {
    id: '2',
    clientName: 'Carlos López',
    serviceName: 'Masaje relajante',
    time: '11:30',
    status: 'confirmed' as const,
  },
  {
    id: '3',
    clientName: 'Ana Martínez',
    serviceName: 'Peeling químico',
    time: '13:00',
    status: 'pending' as const,
  },
];

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Resumen de hoy</Text>

        {/* KPIs */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiRow}>
            <KpiCard
              icon="calendar"
              label="Citas Hoy"
              value={8}
              trend="+12%"
              trendUp
              style={{ width: KPI_CARD_WIDTH }}
            />
            <KpiCard
              icon="dollar-sign"
              label="Ingresos"
              value="€320"
              trend="+5%"
              trendUp
              style={{ width: KPI_CARD_WIDTH }}
            />
          </View>
          <View style={styles.kpiRow}>
            <KpiCard
              icon="user-plus"
              label="Nuevos"
              value={3}
              style={{ width: KPI_CARD_WIDTH }}
            />
            <KpiCard
              icon="star"
              label="Reseñas"
              value={12}
              trend="+2"
              trendUp
              style={{ width: KPI_CARD_WIDTH }}
            />
          </View>
        </View>

        {/* Próximas citas */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próximas citas</Text>
          <Feather name="chevron-right" size={18} color={AuraColors.textMuted} />
        </View>
        <View style={styles.appointmentsList}>
          {TODAY_APPOINTMENTS.map((appt) => (
            <AdminAppointmentItem
              key={appt.id}
              clientName={appt.clientName}
              serviceName={appt.serviceName}
              time={appt.time}
              status={appt.status}
              onConfirm={() => console.log('Confirmar', appt.id)}
              onCancel={() => console.log('Cancelar', appt.id)}
              style={{ marginBottom: 10 }}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AuraColors.background,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: AuraColors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: AuraColors.textSecondary,
    marginBottom: 24,
  },
  kpiGrid: {
    marginBottom: 32,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: CARD_GAP,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AuraColors.textPrimary,
  },
  appointmentsList: {
    gap: 10,
  },
});