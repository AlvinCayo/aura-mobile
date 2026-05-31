import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KpiCard from '../../src/components/ui/KpiCard';
import { useAuth } from '../../src/contexts/AuthContext';
import { registerForPushNotificationsAsync } from '../../src/lib/push';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [center, setCenter] = useState<any>(null);
  
  const [stats, setStats] = useState({
    pendingCount: 0,
    confirmedCount: 0,
    estimatedEarnings: 0,
  });

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const { data: centerData, error: centerError } = await supabase
        .from('centers')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (centerError || !centerData) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setCenter(centerData);

      const { data: appointments, error: appError } = await supabase
        .from('appointments')
        .select('status, service:services(price)')
        .eq('center_id', centerData.id);

      if (!appError && appointments) {
        let pending = 0;
        let confirmed = 0;
        let earnings = 0;

        appointments.forEach((app: any) => {
          if (app.status === 'pending') pending++;
          if (app.status === 'confirmed') confirmed++;
          if (app.status === 'confirmed' || app.status === 'completed' || app.status === 'paid') {
            const price = parseFloat(app.service?.price || '0');
            earnings += price;
          }
        });

        setStats({
          pendingCount: pending,
          confirmedCount: confirmed,
          estimatedEarnings: earnings,
        });
      }
    } catch (error) {
      console.error('Error cargando el dashboard de administración:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    if (user) {
    registerForPushNotificationsAsync(user.id);
  }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AuraColors.primary} />
      </View>
    );
  }

  if (!center) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={64} color={AuraColors.textMuted} />
          <Text style={styles.errorTitle}>No se encontró un Centro</Text>
          <Text style={styles.errorSubtitle}>
            Tu cuenta no tiene un centro registrado o aún no ha sido aprobado.
          </Text>
          <TouchableOpacity style={styles.backButtonCenter} onPress={() => router.replace('/(tabs)/profile')}>
            <Text style={styles.backButtonText}>Volver al Perfil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AuraColors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Panel de Gestión</Text>
            <Text style={styles.centerName}>{center.name}</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileBadge} 
            onPress={() => router.push('/admin/center-profile')}
          >
            <Feather name="settings" size={20} color={AuraColors.textPrimary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Resumen del Negocio</Text>
        <View style={styles.kpiRow}>
          <KpiCard
            title="Por Aprobar"
            value={stats.pendingCount.toString()}
            icon="clock"
            color="#F59E0B"
          />
          <KpiCard
            title="Confirmadas"
            value={stats.confirmedCount.toString()}
            icon="calendar"
            color={AuraColors.success}
          />
        </View>
        <View style={{ marginTop: 12 }}>
          <KpiCard
            title="Ingresos Estimados"
            value={`${stats.estimatedEarnings.toFixed(2)} Bs`}
            icon="dollar-sign"
            color={AuraColors.primary}
          />
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Herramientas de Gestión</Text>
        
        <View style={styles.menuGrid}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin/appointments')}>
            <View style={[styles.iconWrapper, { backgroundColor: '#E0F2FE' }]}>
              <Feather name="list" size={24} color="#0284C7" />
            </View>
            <Text style={styles.menuLabel}>Gestión de Citas</Text>
            {stats.pendingCount > 0 && (
              <View style={styles.badgeNotification}>
                <Text style={styles.badgeText}>{stats.pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin/services')}>
            <View style={[styles.iconWrapper, { backgroundColor: '#E0FDEE' }]}>
              <Feather name="scissors" size={24} color="#16A34A" />
            </View>
            <Text style={styles.menuLabel}>Mis Servicios</Text>
          </TouchableOpacity>

          {/* AQUÍ ESTÁ LA CORRECCIÓN DEL ÍCONO (Cambiado de qr-code a grid) */}
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin/qr-generator')}>
            <View style={[styles.iconWrapper, { backgroundColor: '#FEE2E2' }]}>
              <Feather name="grid" size={24} color={AuraColors.destructive} />
            </View>
            <Text style={styles.menuLabel}>Configurar QR</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.replace('/(tabs)/profile')}>
            <View style={[styles.iconWrapper, { backgroundColor: '#F3E8FF' }]}>
              <Feather name="user" size={24} color="#7C3AED" />
            </View>
            <Text style={styles.menuLabel}>Modo Cliente</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  welcomeText: { fontSize: 14, color: AuraColors.textSecondary, fontWeight: '500' },
  centerName: { fontSize: 24, fontWeight: '800', color: AuraColors.textPrimary, marginTop: 2 },
  profileBadge: { width: 44, height: 44, borderRadius: 14, backgroundColor: AuraColors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 16 },
  kpiRow: { flexDirection: 'row', gap: 12 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 4 },
  menuItem: { width: '47%', backgroundColor: AuraColors.card, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: AuraColors.border, position: 'relative' },
  iconWrapper: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  menuLabel: { fontSize: 15, fontWeight: '600', color: AuraColors.textPrimary },
  badgeNotification: { position: 'absolute', top: 12, right: 12, backgroundColor: '#EF4444', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: 'white', fontSize: 11, fontWeight: '700' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorTitle: { fontSize: 20, fontWeight: '700', color: AuraColors.textPrimary, marginTop: 16 },
  errorSubtitle: { fontSize: 14, color: AuraColors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  backButtonCenter: { marginTop: 24, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: AuraColors.primary, borderRadius: 12 },
  backButtonText: { color: 'white', fontWeight: '700' }
});