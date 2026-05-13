import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { fetchCenterAppointments, updateAppointmentStatus } from '../../src/lib/data';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

export default function AdminAppointmentsScreen() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [centerId, setCenterId] = useState<string | null>(null);

  const loadAdminData = async () => {
    if (!user) return;
    
    // 1. Obtener el ID del centro del usuario actual
    if (!centerId) {
      const { data: centerData } = await supabase
        .from('centers')
        .select('id')
        .eq('owner_id', user.id)
        .single();
      
      if (centerData) {
        setCenterId(centerData.id);
        fetchAppointments(centerData.id);
      } else {
        setLoading(false);
      }
    } else {
      fetchAppointments(centerId);
    }
  };

  const fetchAppointments = async (id: string) => {
    const { data } = await fetchCenterAppointments(id);
    setAppointments(data || []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadAdminData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAdminData();
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    // Actualizamos en la base de datos
    const { error } = await updateAppointmentStatus(appointmentId, newStatus);
    
    if (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado de la cita.');
    } else {
      // Actualizamos la UI localmente para no tener que recargar todo
      setAppointments(prev => 
        prev.map(app => app.id === appointmentId ? { ...app, status: newStatus } : app)
      );
      if (newStatus === 'confirmed') {
         Alert.alert('Aprobada', 'El cliente ha sido notificado y ya puede realizar el pago.');
      }
    }
  };

  const renderAppointment = ({ item }: { item: any }) => {
    const clientName = item.client?.full_name || 'Cliente sin nombre';
    const serviceName = item.service?.name || 'Servicio eliminado';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.clientInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{clientName.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.clientName}>{clientName}</Text>
              <Text style={styles.serviceName}>{serviceName}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, item.status === 'pending' ? styles.badgePending : styles.badgeConfirmed]}>
            <Text style={[styles.statusText, item.status === 'pending' ? styles.textPending : styles.textConfirmed]}>
              {item.status === 'pending' ? 'Nueva Solicitud' : item.status}
            </Text>
          </View>
        </View>

        <View style={styles.dateTimeRow}>
          <Feather name="calendar" size={14} color={AuraColors.textSecondary} />
          <Text style={styles.dateTimeText}>{item.appointment_date}</Text>
          <Feather name="clock" size={14} color={AuraColors.textSecondary} style={{ marginLeft: 12 }} />
          <Text style={styles.dateTimeText}>{item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}</Text>
        </View>

        {/* Solo mostrar botones de acción si está pendiente */}
        {item.status === 'pending' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleStatusChange(item.id, 'cancelled')}
            >
              <Feather name="x" size={18} color={AuraColors.destructive} />
              <Text style={styles.rejectText}>Rechazar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleStatusChange(item.id, 'confirmed')}
            >
              <Feather name="check" size={18} color="white" />
              <Text style={styles.approveText}>Aprobar Reserva</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={AuraColors.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestión de Reservas</Text>
        <Text style={styles.headerSubtitle}>Administra las solicitudes de tus clientes</Text>
      </View>

      <FlatList
        data={appointments}
        keyExtractor={item => item.id}
        renderItem={renderAppointment}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AuraColors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={48} color={AuraColors.border} />
            <Text style={styles.emptyTitle}>No hay reservas</Text>
            <Text style={styles.emptyText}>Las solicitudes de tus clientes aparecerán aquí.</Text>
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
  listContent: { padding: 24, paddingBottom: 40 },
  
  card: { backgroundColor: AuraColors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: AuraColors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  clientInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: AuraColors.primary },
  clientName: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary },
  serviceName: { fontSize: 13, color: AuraColors.textSecondary, marginTop: 2 },
  
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { textTransform: 'capitalize' },
  badgePending: { backgroundColor: '#FDF3E0' },
  textPending: { color: '#F59E0B', fontSize: 12, fontWeight: '600' },
  badgeConfirmed: { backgroundColor: '#EDF7ED' },
  textConfirmed: { color: AuraColors.success, fontSize: 12, fontWeight: '600' },
  
  dateTimeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: AuraColors.background, padding: 12, borderRadius: 10, marginBottom: 16 },
  dateTimeText: { fontSize: 13, color: AuraColors.textSecondary, marginLeft: 6, fontWeight: '500' },
  
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 6 },
  rejectButton: { backgroundColor: '#FDEDED' },
  rejectText: { color: AuraColors.destructive, fontWeight: '600', fontSize: 14 },
  approveButton: { backgroundColor: AuraColors.primary },
  approveText: { color: 'white', fontWeight: '600', fontSize: 14 },
  
  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary, marginTop: 16 },
  emptyText: { fontSize: 14, color: AuraColors.textSecondary, textAlign: 'center', marginTop: 8 },
});