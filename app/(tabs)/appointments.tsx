import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/Button';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

type Tab = 'upcoming' | 'history';

export default function ClientAppointmentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppointments = async () => {
    if (!user) return;
    try {
      // 1. AÑADIMOS center_id a la consulta para poder enviarlo a la pantalla de reseñas
      let query = supabase
        .from('appointments')
        .select(`
          id, appointment_date, start_time, status, center_id,
          centers (name, address, payment_qr_url),
          services (name, price)
        `)
        .eq('client_id', user.id)
        .order('appointment_date', { ascending: false })
        .order('start_time', { ascending: false });

      // Filtramos en base a la pestaña seleccionada
      if (activeTab === 'upcoming') {
        query = query.in('status', ['pending', 'approved', 'paid']);
      } else {
        query = query.in('status', ['completed', 'cancelled']);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error cargando citas del cliente:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAppointments();
  }, [user, activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'En Revisión', bg: '#FEF3C7', color: '#D97706' };
      case 'approved': return { label: 'Esperando Pago', bg: '#DBEAFE', color: '#2563EB' };
      case 'paid': return { label: 'Confirmada', bg: '#DCFCE7', color: '#16A34A' };
      case 'completed': return { label: 'Completada', bg: '#F1F5F9', color: '#64748B' };
      case 'cancelled': return { label: 'Cancelada', bg: '#FEE2E2', color: '#EF4444' };
      default: return { label: status, bg: '#F1F5F9', color: '#64748B' };
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const statusConfig = getStatusBadge(item.status);
    const centerName = item.centers?.name || 'Centro no disponible';
    const serviceName = item.services?.name || 'Servicio eliminado';
    const price = item.services?.price || 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.centerName} numberOfLines={1}>{centerName}</Text>
          <View style={[styles.badge, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.badgeText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          </View>
        </View>

        <Text style={styles.serviceName}>{serviceName}</Text>
        <Text style={styles.dateTimeText}>
          <Feather name="calendar" size={14} /> {item.appointment_date}  •  <Feather name="clock" size={14} /> {item.start_time.slice(0, 5)}
        </Text>
        
        <View style={styles.divider} />

        <View style={styles.footerRow}>
          <Text style={styles.priceLabel}>Total del servicio:</Text>
          <Text style={styles.priceText}>{parseFloat(price).toFixed(2)} Bs</Text>
        </View>

        {/* LÓGICA DE NEGOCIO: Botón de pago disponible si el estado es 'approved' */}
        {item.status === 'approved' && (
          <Button 
            title="Pagar Seña y Confirmar" 
            onPress={() => router.push(`/payment/${item.id}` as any)} 
            icon={<Feather name="credit-card" size={18} color="white" />}
            style={styles.actionButton}
          />
        )}

        {/* NUEVO: Botón de Reseña disponible si el estado es 'completed' */}
        {item.status === 'completed' && (
          <Button 
            title="Calificar Servicio" 
            onPress={() => router.push(`/review/${item.center_id}` as any)} 
            icon={<Feather name="star" size={18} color="white" />}
            style={styles.actionButton}
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Citas</Text>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'upcoming' && styles.tabBtnActive]} onPress={() => setActiveTab('upcoming')}>
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>Próximas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]} onPress={() => setActiveTab('history')}>
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>Historial</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerLoading}><ActivityIndicator size="large" color={AuraColors.primary} /></View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AuraColors.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Feather name="calendar" size={48} color={AuraColors.border} />
              <Text style={styles.emptyTitle}>Sin citas</Text>
              <Text style={styles.emptySub}>No tienes citas en esta sección.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  header: { padding: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: AuraColors.border },
  headerTitle: { fontSize: 24, fontWeight: '800', color: AuraColors.textPrimary },
  tabsContainer: { flexDirection: 'row', padding: 16, backgroundColor: AuraColors.background },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: AuraColors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: AuraColors.textSecondary },
  tabTextActive: { color: AuraColors.primary },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 24, paddingBottom: 40 },
  card: { backgroundColor: AuraColors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: AuraColors.border, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  centerName: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary, flex: 1, paddingRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  serviceName: { fontSize: 14, color: AuraColors.textSecondary, marginBottom: 12 },
  dateTimeText: { fontSize: 14, fontWeight: '600', color: AuraColors.textPrimary, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8 },
  divider: { height: 1, backgroundColor: AuraColors.border, marginVertical: 16 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 14, color: AuraColors.textMuted },
  priceText: { fontSize: 18, fontWeight: '800', color: AuraColors.primary },
  actionButton: { marginTop: 16 }, // Cambiamos payButton por un nombre más genérico
  emptyBox: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary, marginTop: 16 },
  emptySub: { fontSize: 14, color: AuraColors.textSecondary, marginTop: 8 },
});