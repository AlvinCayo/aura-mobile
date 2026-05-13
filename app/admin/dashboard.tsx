import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KpiCard from '../../src/components/ui/KpiCard';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState<any>(null);
  const [stats, setStats] = useState({ pending: 0, today: 0, services: 0 });

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      // 1. Obtener el centro del usuario
      const { data: centerData, error: centerError } = await supabase
        .from('centers')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (centerError || !centerData) {
        // Si por alguna razón no tiene centro, lo devolvemos
        Alert.alert('Error', 'No se encontró un centro asociado a tu cuenta.');
        router.replace('/(tabs)/profile');
        return;
      }
      setCenter(centerData);

      // 2. Obtener estadísticas (Citas pendientes)
      const { count: pendingCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('center_id', centerData.id)
        .eq('status', 'pending');

      // 3. Obtener citas de hoy (aprobadas o completadas)
      const today = new Date().toISOString().slice(0, 10);
      const { count: todayCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('center_id', centerData.id)
        .eq('appointment_date', today)
        .in('status', ['confirmed', 'completed']);

      // 4. Obtener cantidad de servicios activos
      const { count: servicesCount } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('center_id', centerData.id);

      setStats({
        pending: pendingCount || 0,
        today: todayCount || 0,
        services: servicesCount || 0,
      });

    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AuraColors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)/profile')} style={styles.backButton}>
            <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Panel de Control</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Hola,</Text>
          <Text style={styles.centerName}>{center?.name}</Text>
          
          {/* Alerta visible si AURA aún no aprueba el centro */}
          {center?.status === 'pending' && (
            <View style={styles.pendingBadge}>
              <Feather name="clock" size={14} color="#F59E0B" />
              <Text style={styles.pendingBadgeText}>Cuenta en revisión por AURA</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Resumen General</Text>
        <View style={styles.kpiGrid}>
          <KpiCard title="Citas Hoy" value={stats.today.toString()} icon="calendar" color={AuraColors.primary} />
          <KpiCard title="Pendientes" value={stats.pending.toString()} icon="clock" color="#F59E0B" />
          <KpiCard title="Servicios" value={stats.services.toString()} icon="grid" color={AuraColors.success} />
        </View>

        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.actionsGrid}>
          
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/admin/appointments')}>
            <View style={[styles.actionIconContainer, { backgroundColor: AuraColors.primaryLight }]}>
              <Feather name="inbox" size={24} color={AuraColors.primary} />
              {stats.pending > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{stats.pending}</Text>
                </View>
              )}
            </View>
            <Text style={styles.actionText}>Solicitudes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/admin/services')}>
            <View style={[styles.actionIconContainer, { backgroundColor: '#EDF7ED' }]}>
              <Feather name="list" size={24} color={AuraColors.success} />
            </View>
            <Text style={styles.actionText}>Mis Servicios</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/admin/qr-generator')}>
            <View style={[styles.actionIconContainer, { backgroundColor: '#F3E8FF' }]}>
              <Feather name="maximize" size={24} color="#9333EA" />
            </View>
            <Text style={styles.actionText}>Mi QR Simple</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 24, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  headerTitle: { fontSize: 20, fontWeight: '700', color: AuraColors.textPrimary },
  welcomeSection: { marginBottom: 32 },
  welcomeText: { fontSize: 16, color: AuraColors.textSecondary },
  centerName: { fontSize: 28, fontWeight: '800', color: AuraColors.primary, marginTop: 4 },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDF3E0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start', marginTop: 12, gap: 6 },
  pendingBadgeText: { color: '#F59E0B', fontWeight: '600', fontSize: 13 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 16 },
  kpiGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 32 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  actionCard: { width: '30%', alignItems: 'center', gap: 8 },
  actionIconContainer: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  actionText: { fontSize: 13, fontWeight: '500', color: AuraColors.textSecondary, textAlign: 'center' },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: AuraColors.destructive, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white' },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
});