import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  const [historyFilter, setHistoryFilter] = useState<'all' | 'completed' | 'rejected' | 'cancelled'>('all');
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

      // 2. Consulta con inner joins
      let query = supabase
        .from('appointments')
        .select(`
          id, appointment_date, start_time, status, payment_preference,
          profiles:client_id (full_name, phone),
          services:service_id (name, price)
        `)
        .eq('center_id', centerData.id)
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true });

      // ... (código anterior del query) ...

      if (activeTab === 'pending') query = query.eq('status', 'pending');
      // --- CAMBIA ESTA LÍNEA PARA QUE INCLUYA LAS PAGADAS ---
      else if (activeTab === 'approved') query = query.in('status', ['approved', 'paid']);
      // ------------------------------------------------------
      else {
        // Lógica de Historial (Filtros)
        if (historyFilter === 'all') {
          query = query.in('status', ['completed', 'cancelled', 'rejected']);
        } else if (historyFilter === 'completed') {
          query = query.eq('status', 'completed');
        } else {
          query = query.eq('status', historyFilter);
        }
      }

      const { data, error } = await query;
      // ... (resto del código) ...
      
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
  }, [user, activeTab, historyFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const handleUpdateStatus = async (appointmentId: string, newStatus: string, clientName: string) => {
    let actionText = newStatus === 'approved' ? 'Aceptar' : newStatus === 'rejected' ? 'Rechazar' : 'Finalizar';
    
    Alert.alert(
      'Confirmar Acción',
      `¿Deseas ${actionText} la cita de ${clientName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: newStatus === 'rejected' ? 'destructive' : 'default',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', appointmentId);
              if (error) throw error;
              Alert.alert('Éxito', 'Estado actualizado correctamente.');
              fetchAppointments();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo actualizar.');
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
            <Button title="Rechazar" variant="outline" onPress={() => handleUpdateStatus(item.id, 'rejected', clientName)} style={{flex: 1}} />
            <Button title="Aceptar" onPress={() => handleUpdateStatus(item.id, 'approved', clientName)} style={{flex: 1}} />
          </View>
        )}
        
        {item.status === 'approved' && (
          <Text style={{color: '#D97706', textAlign: 'center', fontStyle: 'italic', marginTop: 8}}>Esperando pago de seña del cliente...</Text>
        )}
        {item.status === 'paid' && (
          <View style={{ marginTop: 16, backgroundColor: '#F0FDF4', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#BBF7D0' }}>
             <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12}}>
               <View style={{backgroundColor: '#16A34A', padding: 6, borderRadius: 20}}>
                 <Feather name="check" size={16} color="white" />
               </View>
               <View style={{flex: 1}}>
                 <Text style={{color: '#166534', fontWeight: '800', fontSize: 14}}>Cita Confirmada</Text>
                 <Text style={{color: '#15803D', fontSize: 13, marginTop: 4, lineHeight: 18}}>
                   Cobrarás <Text style={{fontWeight: '700'}}>{parseFloat(price).toFixed(2)} Bs</Text> mediante: <Text style={{fontWeight: '700', textTransform: 'uppercase'}}>{item.payment_preference === 'qr' ? 'QR' : 'Efectivo'}</Text>
                 </Text>
               </View>
             </View>
             {/* --- AQUÍ ESTÁ EL BOTÓN QUE NECESITABAS --- */}
             <Button 
               title="Marcar Servicio como Completado" 
               onPress={() => handleUpdateStatus(item.id, 'completed', clientName)} 
               style={{ backgroundColor: '#16A34A' }} 
             />
          </View>
        )}

        {/* Etiquetas de estado en el historial */}
        {item.status === 'completed' && (
          <Text style={{color: '#16A34A', textAlign: 'center', fontWeight: '700', marginTop: 12}}>
            Servicio Completado
          </Text>
        )}
        {item.status === 'cancelled' && (
          <Text style={{color: '#DC2626', textAlign: 'center', fontWeight: '700', marginTop: 12}}>
            Cancelada por el cliente
          </Text>
        )}
        {item.status === 'rejected' && (
          <Text style={{color: '#DC2626', textAlign: 'center', fontWeight: '700', marginTop: 12}}>
            Rechazada por ti
          </Text>
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

      {activeTab === 'history' && (
        <View style={styles.subTabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 8, paddingHorizontal: 24, paddingBottom: 12}}>
            {['all', 'completed', 'rejected', 'cancelled'].map(f => (
              <TouchableOpacity key={f} style={[styles.subTabBtn, historyFilter === f && styles.subTabBtnActive]} onPress={() => setHistoryFilter(f as any)}>
                <Text style={[styles.subTabText, historyFilter === f && styles.subTabTextActive]}>
                  {f === 'all' ? 'Todas' : f === 'completed' ? 'Completadas' : f === 'rejected' ? 'Rechazadas' : 'Canceladas'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

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
  subTabsContainer: { borderBottomWidth: 1, borderBottomColor: AuraColors.border, marginBottom: 4 },
  subTabBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  subTabBtnActive: { backgroundColor: AuraColors.primaryLight, borderColor: AuraColors.primary },
  subTabText: { fontSize: 13, fontWeight: '600', color: AuraColors.textSecondary },
  subTabTextActive: { color: AuraColors.primary },
});