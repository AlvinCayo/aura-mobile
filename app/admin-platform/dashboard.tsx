import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KpiCard from '../../src/components/ui/KpiCard';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [stats, setStats] = useState({
    totalCenters: 0,
    pendingApprovals: 0,
    activeReports: 0,
    totalAuraRevenue: 0,
  });

  const fetchGlobalData = async () => {
    try {
      // 1. Centros Activos
      const { count: activeCenters } = await supabase.from('centers').select('*', { count: 'exact', head: true }).eq('status', 'approved');
      
      // 2. Solicitudes Pendientes
      const { count: pendingCenters } = await supabase.from('centers').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      
      // 3. Reportes de Fraude Pendientes
      const { count: pendingReports } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      
      // 4. Ingresos Totales de AURA (Suma de las señas de reserva pagadas)
      const { data: appointments } = await supabase.from('appointments').select('reservation_fee').in('status', ['confirmed', 'paid', 'completed']);
      
      let revenue = 0;
      if (appointments) {
        revenue = appointments.reduce((sum, app) => sum + parseFloat(app.reservation_fee || '0'), 0);
      }

      setStats({
        totalCenters: activeCenters || 0,
        pendingApprovals: pendingCenters || 0,
        activeReports: pendingReports || 0,
        totalAuraRevenue: revenue,
      });
    } catch (error) {
      console.error('Error cargando datos globales:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchGlobalData(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchGlobalData(); };

  if (loading) return <View style={styles.centerLoading}><ActivityIndicator size="large" color={AuraColors.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Feather name="arrow-left" size={20} color={AuraColors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>AURA SuperAdmin</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AuraColors.primary]} />}>
        
        {/* Gráfico Financiero Simplificado */}
        <View style={styles.revenueCard}>
          <Text style={styles.revenueTitle}>Ganancias Históricas AURA</Text>
          <Text style={styles.revenueValue}>{stats.totalAuraRevenue.toFixed(2)} Bs</Text>
          <View style={styles.chartContainer}>
            <View style={styles.chartBar}><View style={[styles.chartFill, { height: '40%' }]} /><Text style={styles.chartLabel}>Lun</Text></View>
            <View style={styles.chartBar}><View style={[styles.chartFill, { height: '70%' }]} /><Text style={styles.chartLabel}>Mar</Text></View>
            <View style={styles.chartBar}><View style={[styles.chartFill, { height: '50%' }]} /><Text style={styles.chartLabel}>Mie</Text></View>
            <View style={styles.chartBar}><View style={[styles.chartFill, { height: '90%' }]} /><Text style={styles.chartLabel}>Jue</Text></View>
            <View style={styles.chartBar}><View style={[styles.chartFill, { height: '100%' }]} /><Text style={styles.chartLabel}>Vie</Text></View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Métricas Globales</Text>
        <View style={styles.kpiGrid}>
          <View style={{ width: '48%' }}><KpiCard title="Centros Activos" value={stats.totalCenters.toString()} icon="briefcase" color="#10B981" /></View>
          <View style={{ width: '48%' }}><KpiCard title="Reportes" value={stats.activeReports.toString()} icon="flag" color="#EF4444" /></View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Módulos Operativos</Text>
        <View style={styles.menuContainer}>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin-platform/approvals')}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}><Feather name="shield" size={24} color="#D97706" /></View>
              <View>
                <Text style={styles.menuItemTitle}>Aprobación de Centros</Text>
                <Text style={styles.menuItemSub}>Revisar licencias y nuevos registros</Text>
              </View>
            </View>
            {stats.pendingApprovals > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{stats.pendingApprovals}</Text></View>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin-platform/reports')}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}><Feather name="alert-triangle" size={24} color="#EF4444" /></View>
              <View>
                <Text style={styles.menuItemTitle}>Centro de Reportes</Text>
                <Text style={styles.menuItemSub}>Investigar fraudes y quejas</Text>
              </View>
            </View>
            {stats.activeReports > 0 && <View style={[styles.badge, { backgroundColor: '#EF4444' }]}><Text style={styles.badgeText}>{stats.activeReports}</Text></View>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin-platform/users')}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}><Feather name="users" size={24} color="#0284C7" /></View>
              <View>
                <Text style={styles.menuItemTitle}>Gestión de Usuarios</Text>
                <Text style={styles.menuItemSub}>Bloquear o suspender cuentas</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={AuraColors.textMuted} />
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary },
  content: { padding: 24, paddingBottom: 60 },
  revenueCard: { backgroundColor: AuraColors.primary, borderRadius: 20, padding: 24, marginBottom: 24, shadowColor: AuraColors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
  revenueTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  revenueValue: { color: 'white', fontSize: 32, fontWeight: '800', marginTop: 4, marginBottom: 20 },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  chartBar: { alignItems: 'center', height: '100%', justifyContent: 'flex-end', width: '15%' },
  chartFill: { width: '100%', backgroundColor: 'white', borderRadius: 6 },
  chartLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 16 },
  kpiGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  menuContainer: { gap: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: AuraColors.card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: AuraColors.border },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuItemTitle: { fontSize: 16, fontWeight: '600', color: AuraColors.textPrimary },
  menuItemSub: { fontSize: 13, color: AuraColors.textSecondary, marginTop: 2 },
  badge: { backgroundColor: '#F59E0B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: 'white', fontSize: 12, fontWeight: '700' },
});