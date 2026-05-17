import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

type FilterTab = 'pending' | 'confirmed' | 'history';

export default function AdminAppointmentsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<FilterTab>('pending');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [centerId, setCenterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCenterAndAppointments = async () => {
    if (!user) return;

    try {
      // 1. Obtener el ID del centro asociado al dueño
      let currentCenterId = centerId;
      if (!currentCenterId) {
        const { data: centerData } = await supabase
          .from('centers')
          .select('id')
          .eq('owner_id', user.id)
          .single();
        if (centerData) {
          currentCenterId = centerData.id;
          setCenterId(centerData.id);
        }
      }

      if (!currentCenterId) {
        setLoading(false);
        return;
      }

      // 2. Construir la consulta según la pestaña seleccionada
      let query = supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          start_time,
          status,
          profiles:client_id(full_name, phone),
          service:service_id(name, price)
        `)
        .eq('center_id', currentCenterId)
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (activeTab === 'pending') {
        query = query.eq('status', 'pending');
      } else if (activeTab === 'confirmed') {
        query = query.eq('status', 'confirmed');
      } else {
        // Historial contiene completadas, canceladas o pagadas
        query = query.in('status', ['completed', 'cancelled', 'paid']);
      }

      const { data, error } = await query;
      if (!error && data) {
        setAppointments(data);
      }
    } catch (error) {
      console.error('Error cargando citas para administrador:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchCenterAndAppointments();
  }, [user, activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCenterAndAppointments();
  };

  // Función para cambiar el estado de la cita (Aprobar / Rechazar / Completar)
  const handleUpdateStatus = async (appointmentId: string, newStatus: 'confirmed' | 'cancelled' | 'completed', clientName: string) => {
    let title = 'Actualizar Citas';
    let msg = `¿Deseas cambiar el estado de la cita de ${clientName}?`;

    if (newStatus === 'confirmed') { title = 'Aprobar Cita'; msg = `¿Estás seguro de que deseas aprobar la cita de ${clientName}?`; }
    if (newStatus === 'cancelled') { title = 'Rechazar Cita'; msg = `¿Deseas rechazar la reserva de ${clientName}?`; }
    if (newStatus === 'completed') { title = 'Completar Cita'; msg = `¿Confirmas que el servicio de ${clientName} ya fue realizado?`; }

    Alert.alert(title, msg, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        style: newStatus === 'cancelled' ? 'destructive' : 'default',
        onPress: async () => {
          const { error } = await supabase
            .from('appointments')
            .update({ status: newStatus })
            .eq('id', appointmentId);

          if (error) {
            Alert.alert('Error', 'No se pudo actualizar el estado de la cita.');
          } else {
            Alert.alert('Éxito', 'Estado de la cita actualizado.');
            // Removemos de la lista local para agilizar la UI
            setAppointments(prev => prev.filter(item => item.id !== appointmentId));
          }
        }
      }
    ]);
  };

  const renderAppointmentItem = ({ item }: { item: any }) => {
    const clientName = item.profiles?.full_name || 'Cliente';
    const clientPhone = item.profiles?.phone || 'Sin teléfono';
    const serviceName = item.service?.name || 'Servicio';
    const price = parseFloat(item.service?.price || '0').toFixed(2);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.clientInfo}>
            <Feather name="user" size={16} color={AuraColors.primary} />
            <Text style={styles.clientNameText}>{clientName}</Text>
          </View>
          <Text style={styles.priceText}>{price} Bs</Text>
        </View>

        <View style={styles.detailsBox}>
          <Text style={styles.detailItem}><Text style={{ fontWeight: '600' }}>Servicio:</Text> {serviceName}</Text>
          <Text style={styles.detailItem}><Text style={{ fontWeight: '600' }}>Fecha:</Text> {item.appointment_date}</Text>
          <Text style={styles.detailItem}><Text style={{ fontWeight: '600' }}>Hora:</Text> {item.start_time.slice(0, 5)}</Text>
          <Text style={styles.detailItem}><Text style={{ fontWeight: '600' }}>Contacto:</Text> {clientPhone}</Text>
        </View>

        {/* Acciones interactivas según el estado */}
        {item.status === 'pending' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleUpdateStatus(item.id, 'cancelled', clientName)}
            >
              <Feather name="x" size={16} color={AuraColors.destructive} />
              <Text style={styles.rejectText}>Rechazar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleUpdateStatus(item.id, 'confirmed', clientName)}
            >
              <Feather name="check" size={16} color="white" />
              <Text style={styles.approveText}>Aprobar</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.status === 'confirmed' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => handleUpdateStatus(item.id, 'completed', clientName)}
          >
            <Feather name="check-circle" size={16} color="white" />
            <Text style={styles.completeText}>Marcar como Completado</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Barra superior */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Control de Citas</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Selector de Pestañas (Tabs de Filtrado) */}
      <View style={styles.tabsContainer}>
        {(['pending', 'confirmed', 'history'] as FilterTab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'pending' ? 'Pendientes' : tab === 'confirmed' ? 'Confirmadas' : 'Historial'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Listado Principal de Citas */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={AuraColors.primary} />
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={item => item.id}
          renderItem={renderAppointmentItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AuraColors.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="calendar" size={64} color={AuraColors.border} />
              <Text style={styles.emptyTitle}>Sin registros</Text>
              <Text style={styles.emptySubtitle}>No hay citas en esta categoría en este momento.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  topBarTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary },
  tabsContainer: { flexDirection: 'row', backgroundColor: AuraColors.card, marginHorizontal: 24, marginVertical: 12, padding: 4, borderRadius: 12, borderWidth: 1, borderColor: AuraColors.border },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabButtonActive: { backgroundColor: AuraColors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: AuraColors.textSecondary },
  tabTextActive: { color: 'white' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 24, paddingTop: 12 },
  card: { backgroundColor: AuraColors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: AuraColors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  clientInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  clientNameText: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary },
  priceText: { fontSize: 16, fontWeight: '800', color: AuraColors.primary },
  detailsBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, gap: 6, marginBottom: 16 },
  detailItem: { fontSize: 14, color: AuraColors.textSecondary },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 6 },
  rejectButton: { backgroundColor: '#FDEDED' },
  rejectText: { color: AuraColors.destructive, fontWeight: '600' },
  approveButton: { backgroundColor: AuraColors.success },
  approveText: { color: 'white', fontWeight: '600' },
  completeButton: { backgroundColor: AuraColors.primary, width: '100%' },
  completeText: { color: 'white', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: AuraColors.textSecondary, textAlign: 'center', marginTop: 8 }
});