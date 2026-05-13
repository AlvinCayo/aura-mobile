import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppointmentCard from '../../src/components/ui/AppointmentCard';
import { useAuth } from '../../src/contexts/AuthContext';
import { fetchMyAppointments } from '../../src/lib/data';
import { AuraColors } from '../../src/theme/colors';

export default function AppointmentsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAppointments = async () => {
    if (!user) return;
    const { data } = await fetchMyAppointments(user.id);
    setAppointments(data || []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadAppointments();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  // Función para obtener el color según el estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return AuraColors.success;
      case 'pending': return '#F59E0B'; // Ambar/Naranja
      case 'completed': return AuraColors.primary;
      case 'cancelled': return AuraColors.destructive;
      default: return AuraColors.textMuted;
    }
  };

  const renderAppointment = ({ item }: { item: any }) => {
    // Cálculo del total con la comisión del 10%
    const servicePrice = parseFloat(item.service?.price || '0');
    const total = servicePrice + (servicePrice * 0.10);

    return (
      <View style={styles.cardWrapper}>
        <View style={styles.statusHeader}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status === 'confirmed' ? 'Aprobada' : item.status === 'pending' ? 'Pendiente de aprobación' : item.status}
          </Text>
        </View>

        <AppointmentCard
          centerName={item.center?.name || 'Centro'}
          serviceName={item.service?.name || 'Servicio'}
          date={item.appointment_date}
          time={item.start_time.slice(0, 5)}
          price={`${total.toFixed(2)} Bs`}
          status={item.status}
        />

        {/* Lógica de Pago: Solo si está confirmada y no ha pagado aún */}
        {item.status === 'confirmed' && (
          <TouchableOpacity 
            style={styles.payButton}
            onPress={() => router.push({
              pathname: '/payment/[appointmentId]',
              params: { appointmentId: item.id, amount: total.toFixed(2) }
            } as any)}
          >
            <Feather name="grid" size={18} color="white" />
            <Text style={styles.payButtonText}>Pagar con QR (Habilitado)</Text>
          </TouchableOpacity>
        )}
        
        {item.status === 'pending' && (
          <View style={styles.infoBox}>
            <Feather name="info" size={14} color={AuraColors.textMuted} />
            <Text style={styles.infoText}>El pago se habilitará cuando el centro apruebe tu cita.</Text>
          </View>
        )}
      </View>
    );
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Citas</Text>
        <Text style={styles.headerSubtitle}>Gestiona tus reservas y pagos</Text>
      </View>

      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        renderItem={renderAppointment}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AuraColors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="calendar" size={64} color={AuraColors.border} />
            <Text style={styles.emptyTitle}>No tienes citas aún</Text>
            <Text style={styles.emptyText}>Explora los mejores centros en La Paz y reserva tu primer servicio.</Text>
            <TouchableOpacity style={styles.exploreButton} onPress={() => router.push('/(tabs)')}>
              <Text style={styles.exploreButtonText}>Explorar Centros</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 24, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: AuraColors.textPrimary },
  headerSubtitle: { fontSize: 15, color: AuraColors.textSecondary, marginTop: 4 },
  listContent: { padding: 24, paddingTop: 12, paddingBottom: 40 },
  cardWrapper: { marginBottom: 20, backgroundColor: AuraColors.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: AuraColors.border },
  statusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  payButton: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: AuraColors.success, padding: 14, borderRadius: 12, marginTop: 16 
  },
  payButtonText: { color: 'white', fontWeight: '700', fontSize: 15 },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, opacity: 0.7 },
  infoText: { fontSize: 12, color: AuraColors.textMuted, fontStyle: 'italic' },
  emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: AuraColors.textPrimary, marginTop: 20 },
  emptyText: { fontSize: 15, color: AuraColors.textSecondary, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  exploreButton: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: AuraColors.primaryLight, borderRadius: 12 },
  exploreButtonText: { color: AuraColors.primary, fontWeight: '700' }
});