import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

export default function AdminAppointmentsScreen() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchAppointments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('appointments')
      .select('*, client:client_id(full_name, email), service:service_id(name)')
      .eq('center_id', 'ID_DEL_CENTRO') // Reemplazar por el ID del centro del usuario logueado
      .in('status', ['pending', 'confirmed'])
      .order('created_at', { ascending: false });

    if (error) Alert.alert('Error', error.message);
    else setAppointments(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleUpdate = (id: string, status: string) => {
    Alert.alert(status === 'confirmed' ? 'Aprobar cita' : 'Rechazar cita', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí',
        onPress: async () => {
          const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
          if (error) Alert.alert('Error', error.message);
          else fetchAppointments();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Solicitudes de cita</Text>
      </View>
      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={fetchAppointments}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.clientName}>{item.client?.full_name}</Text>
            <Text style={styles.serviceName}>{item.service?.name}</Text>
            <Text>{item.appointment_date} {item.start_time}-{item.end_time}</Text>
            <View style={[styles.statusBadge, { backgroundColor: item.status === 'pending' ? '#FDF3E0' : '#EDF7ED' }]}>
              <Text style={{ color: item.status === 'pending' ? AuraColors.warning : AuraColors.success }}>
                {item.status === 'pending' ? 'Pendiente' : 'Confirmada'}
              </Text>
            </View>
            {item.status === 'pending' && (
              <View style={styles.actions}>
                <TouchableOpacity style={styles.approveBtn} onPress={() => handleUpdate(item.id, 'confirmed')}>
                  <Feather name="check" size={16} color="white" />
                  <Text style={styles.actionText}>Aprobar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => handleUpdate(item.id, 'cancelled')}>
                  <Feather name="x" size={16} color="white" />
                  <Text style={styles.actionText}>Rechazar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: AuraColors.textMuted }}>No hay solicitudes.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  header: { padding: 24, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '700' },
  list: { paddingHorizontal: 24 },
  card: { backgroundColor: AuraColors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: AuraColors.border },
  clientName: { fontSize: 16, fontWeight: '600' },
  serviceName: { fontSize: 14, color: AuraColors.textSecondary },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 6 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  approveBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: AuraColors.success, padding: 8, borderRadius: 8, gap: 4 },
  rejectBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: AuraColors.destructive, padding: 8, borderRadius: 8, gap: 4 },
  actionText: { color: 'white', fontWeight: '600' },
});