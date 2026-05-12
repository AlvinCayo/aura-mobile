import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdminAppointmentItem from '../../src/components/ui/AdminAppointmentItem';
import KpiCard from '../../src/components/ui/KpiCard';
import { AuraColors } from '../../src/theme/colors';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (width - 48 - CARD_GAP) / 2;

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
];

const RECENT_CLIENTS = [
  { id: '1', name: 'María García', lastVisit: 'Limpieza facial' },
  { id: '2', name: 'Carlos López', lastVisit: 'Masaje relajante' },
  { id: '3', name: 'Ana Martínez', lastVisit: 'Peeling químico' },
];

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Resumen de hoy</Text>

        {/* KPIs */}
        <View style={styles.kpiRow}>
          <KpiCard
            icon="calendar"
            label="Citas Hoy"
            value={8}
            trend="+12%"
            trendUp
            style={{ width: CARD_WIDTH }}
          />
          <KpiCard
            icon="dollar-sign"
            label="Ingresos"
            value="€320"
            trend="+5%"
            trendUp
            style={{ width: CARD_WIDTH }}
          />
        </View>
        <View style={styles.kpiRow}>
          <KpiCard
            icon="user-plus"
            label="Nuevos"
            value={3}
            style={{ width: CARD_WIDTH }}
          />
          <KpiCard
            icon="star"
            label="Reseñas"
            value={12}
            style={{ width: CARD_WIDTH }}
          />
        </View>

        {/* Próximas citas */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Próximas citas</Text>
          <TouchableOpacity onPress={() => router.push('/admin/appointments' as any)}>
            <Text style={styles.seeAll}>Ver todas</Text>
          </TouchableOpacity>
        </View>
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

        {/* Clientes recientes */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Clientes recientes</Text>
          <TouchableOpacity onPress={() => router.push('/admin/clients' as any)}>
            <Text style={styles.seeAll}>Ver todos</Text>
          </TouchableOpacity>
        </View>
        {RECENT_CLIENTS.map((client) => (
          <TouchableOpacity
            key={client.id}
            style={styles.clientItem}
            onPress={() => router.push(`/admin/clients/${client.id}` as any)}
          >
            <View style={styles.clientAvatar}>
              <Feather name="user" size={18} color={AuraColors.textMuted} />
            </View>
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>{client.name}</Text>
              <Text style={styles.clientLastVisit}>Última visita: {client.lastVisit}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={AuraColors.textMuted} />
          </TouchableOpacity>
        ))}
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
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AuraColors.textPrimary,
  },
  seeAll: {
    fontSize: 14,
    color: AuraColors.primary,
    fontWeight: '500',
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AuraColors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: AuraColors.border,
  },
  clientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AuraColors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
    color: AuraColors.textPrimary,
  },
  clientLastVisit: {
    fontSize: 13,
    color: AuraColors.textSecondary,
  },
});