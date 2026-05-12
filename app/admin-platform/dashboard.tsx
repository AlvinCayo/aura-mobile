import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KpiCard from '../../src/components/ui/KpiCard';
import { AuraColors } from '../../src/theme/colors';

export default function AdminDashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Dashboard Admin</Text>
        <Text style={styles.subtitle}>Vista general de la plataforma</Text>

        {/* KPIs */}
        <View style={styles.kpiRow}>
          <KpiCard icon="users" label="Total Usuarios" value="1,234" trend="+12%" trendUp style={{ flex: 1, marginRight: 10 }} />
          <KpiCard icon="briefcase" label="Total Centros" value="224" trend="+8%" trendUp style={{ flex: 1 }} />
        </View>
        <View style={styles.kpiRow}>
          <KpiCard icon="calendar" label="Citas Hoy" value="89" trend="-5%" trendUp={false} style={{ flex: 1, marginRight: 10 }} />
          <KpiCard icon="dollar-sign" label="Ingresos (Mes)" value="$45K" trend="+18%" trendUp style={{ flex: 1 }} />
        </View>

        {/* Acciones pendientes */}
        <Text style={styles.sectionTitle}>Acciones Pendientes</Text>
        {[
          { label: 'Centros por aprobar', count: 5 },
          { label: 'Reportes de usuarios', count: 3 },
          { label: 'Disputas de pago', count: 2 },
        ].map((action, i) => (
          <TouchableOpacity key={i} style={styles.actionItem}>
            <Text style={styles.actionLabel}>{action.label}</Text>
            <View style={styles.actionBadge}>
              <Text style={styles.actionBadgeText}>{action.count}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Actividad reciente */}
        <Text style={styles.sectionTitle}>Actividad Reciente</Text>
        {[
          { action: 'Nuevo centro registrado', detail: 'Centro Wellness Plus', time: 'Hace 2h', icon: 'briefcase' },
          { action: 'Usuario suspendido', detail: 'Carlos M. - Spam', time: 'Hace 5h', icon: 'alert-triangle' },
          { action: 'Centro aprobado', detail: 'Spa Relax', time: 'Ayer', icon: 'check-circle' },
          { action: 'Pago procesado', detail: '$1,234.00', time: 'Ayer', icon: 'credit-card' },
        ].map((item, i) => (
          <View key={i} style={styles.activityItem}>
            <Feather name={item.icon as any} size={18} color={AuraColors.textMuted} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.activityAction}>{item.action}</Text>
              <Text style={styles.activityDetail}>{item.detail}</Text>
            </View>
            <Text style={styles.activityTime}>{item.time}</Text>
          </View>
        ))}

        {/* Estado de la plataforma */}
        <Text style={styles.sectionTitle}>Estado de la Plataforma</Text>
        {[
          { label: 'API', status: 'online' },
          { label: 'Pagos', status: 'online' },
          { label: 'Análisis', status: 'online' },
        ].map((service, i) => (
          <View key={i} style={styles.statusRow}>
            <Text style={styles.statusLabel}>{service.label}</Text>
            <View style={styles.statusOnline}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Online</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  scroll: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 14, color: AuraColors.textSecondary, marginBottom: 24 },
  kpiRow: { flexDirection: 'row', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: AuraColors.textPrimary, marginTop: 28, marginBottom: 12 },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: AuraColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AuraColors.border,
    marginBottom: 8,
  },
  actionLabel: { fontSize: 15, color: AuraColors.textPrimary },
  actionBadge: {
    backgroundColor: AuraColors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  actionBadgeText: { color: 'white', fontSize: 13, fontWeight: '600' },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: AuraColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AuraColors.border,
    marginBottom: 8,
  },
  activityAction: { fontSize: 14, fontWeight: '600', color: AuraColors.textPrimary },
  activityDetail: { fontSize: 13, color: AuraColors.textSecondary },
  activityTime: { fontSize: 12, color: AuraColors.textMuted },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: AuraColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AuraColors.border,
    marginBottom: 8,
  },
  statusLabel: { fontSize: 15, color: AuraColors.textPrimary },
  statusOnline: { flexDirection: 'row', alignItems: 'center' },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AuraColors.success,
    marginRight: 6,
  },
  statusText: { fontSize: 13, color: AuraColors.success },
});