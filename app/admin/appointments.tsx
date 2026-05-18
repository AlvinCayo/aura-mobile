import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/Button';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

type FilterTab = 'pending' | 'approved' | 'history';

export default function AdminAppointmentsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<FilterTab>('pending');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppointments = async () => {
    if (!user) return;
    try {
      // 1. Obtener ID del centro del usuario
      const { data: centerData, error: centerError } = await supabase
        .from('centers')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (centerError || !centerData) {
        setAppointments([]);
        return;
      }

      // 2. Consulta corregida con inner joins seguros
      let query = supabase
        .from('appointments')
        .select(`
          id, appointment_date, start_time, status,
          profiles:client_id (full_name, phone),
          services:service_id (name, price)
        `)
        .eq('center_id', centerData.id)
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (activeTab === 'pending') query = query.eq('status', 'pending');
      else if (activeTab === 'approved') query = query.eq('status', 'approved');
      else query = query.in('status', ['completed', 'cancelled', 'paid']);

      const { data, error } = await query;
      
      if (error) {
        console.error("Error en citas:", error.message);
        Alert.alert('Error', 'No se pudieron cargar las citas.');
      } else {
        setAppointments(data || []);
      }
    } catch (error) {
      console.error('Error maestro:', error);
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

  // FUNCIÓN CORREGIDA Y BLINDADA
  const handleUpdateStatus = async (appointmentId: string, newStatus: string, clientName: string) => {
    Alert.alert(
      'Confirmar Acción',
      `¿Deseas ${newStatus === 'approved' ? 'Aceptar' : 'Rechazar'} la cita de ${clientName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: newStatus === 'cancelled' ? 'destructive' : 'default',
          onPress: async () => {
            setLoading(true); // Mostramos carga para que la UI no quede congelada
            try {
              const { error } = await supabase
                .from('appointments')
                .update({ status: newStatus })
                .eq('id', appointmentId);
              
              // SI HAY UN ERROR, AHORA SÍ LO VEREMOS
              if (error) throw error;
              
              Alert.alert(
                'Éxito', 
                newStatus === 'approved' 
                  ? 'Cita aceptada. Ahora puedes verla en la pestaña "Aceptadas" esperando el pago.' 
                  : 'Cita rechazada.'
              );
              
              fetchAppointments(); // Recargamos para refrescar la lista
            } catch (error: any) {
              console.error("Update Error:", error);
              Alert.alert('Error de Base de Datos', error.message || 'No se pudo actualizar el estado de la cita.');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const clientName = item.profiles?.full_name || 'Cliente sin nombre';
    const serviceName = item.services?.name || 'Servicio eliminado';
    const price = item.services?.price || 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
             <Feather name="user" size={16} color={AuraColors.primary} />
             <Text style={styles.clientNameText}>{clientName}</Text>
          </View>
          <Text style={styles.priceText}>{parseFloat(price).toFixed(2)} Bs</Text>
        </View>

        <View style={styles.detailsBox}>
          <Text style={styles.detailItem}><Text style={{ fontWeight: '600' }}>Servicio:</Text> {serviceName}</Text>
          <Text style={styles.detailItem}><Text style={{ fontWeight: '600' }}>Fecha y Hora:</Text> {item.appointment_date} | {item.start_time.slice(0, 5)}</Text>
          <Text style={styles.detailItem}><Text style={{ fontWeight: '600' }}>Contacto:</Text> {item.profiles?.phone || 'Sin número'}</Text>
        </View>

        {item.status === 'pending' && (
          <View style={styles.actionsRow}>
            <Button title="Rechazar" variant="outline" onPress={() => handleUpdateStatus(item.id, 'cancelled', clientName)} style={{flex: 1}} />
            <Button title="Aceptar" onPress={() => handleUpdateStatus(item.id, 'approved', clientName)} style={{flex: 1}} />
          </View>
        )}
        
        {item.status === 'approved' && (
          <Text style={{color: '#D97706', textAlign: 'center', fontStyle: 'italic', marginTop: 8}}>Esperando pago de seña del cliente...</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Feather name="arrow-left" size={20} color={AuraColors.textPrimary} /></TouchableOpacity>
        <Text style={styles.topBarTitle}>Control de Citas</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabsContainer}>
        {(['pending', 'approved', 'history'] as FilterTab[]).map(tab => (
          <TouchableOpacity key={tab} style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'pending' ? 'Por Revisar' : tab === 'approved' ? 'Aceptadas' : 'Historial'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
         <View style={styles.centerLoading}><ActivityIndicator size="large" color={AuraColors.primary} /></View>
      ) : (
        <FlatList 
          data={appointments} 
          keyExtractor={item => item.id} 
          renderItem={renderItem} 
          contentContainerStyle={styles.listContent} 
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AuraColors.primary]} />} 
          ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 40, color: AuraColors.textMuted}}>No hay citas en esta categoría.</Text>} 
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
  clientNameText: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary },
  priceText: { fontSize: 16, fontWeight: '800', color: AuraColors.primary },
  detailsBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, gap: 6, marginBottom: 16 },
  detailItem: { fontSize: 14, color: AuraColors.textSecondary },
  actionsRow: { flexDirection: 'row', gap: 12 },
});