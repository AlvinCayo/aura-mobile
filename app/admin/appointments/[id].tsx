import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../../src/components/ui/Button';
import { useAuth } from '../../../src/contexts/AuthContext';
import { sendNotification } from '../../../src/lib/push';
import { supabase } from '../../../src/lib/supabase';
import { AuraColors } from '../../../src/theme/colors';

export default function AdminAppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [reportCategory, setReportCategory] = useState('');
  const [reportText, setReportText] = useState('');

  const loadDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id, status, appointment_date, start_time, end_time, notes, client_id, center_id, commission_amount,
          service:service_id(name, price, duration_min),
          client:client_id(full_name, phone, email)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      setAppointment(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la cita.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDetails(); }, [id]);

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setLoading(true);
      await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
      
      // Notificaciones Push basadas en la acción
      if (newStatus === 'approved') {
        await sendNotification(appointment.client_id, "¡Cita Aceptada!", `El centro ha aceptado tu turno. Paga la comisión para confirmarlo.`, "check");
      } else if (newStatus === 'rejected') {
        await sendNotification(appointment.client_id, "Cita Rechazada", `Lo sentimos, el centro no tiene disponibilidad y ha rechazado tu solicitud.`, "x-circle");
      }

      await loadDetails();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la cita.');
      setLoading(false);
    }
  };

  const handleReportClient = () => {
    setIsReportModalVisible(true);
  };

  const submitReport = async () => {
    if (!reportCategory) return Alert.alert('Aviso', 'Selecciona un motivo.');
    if (!reportText.trim()) return Alert.alert('Aviso', 'Debes detallar el problema.');
    
    setIsReportModalVisible(false);
    
    const { error } = await supabase.from('reports').insert({ 
      reporter_id: user?.id, 
      center_id: appointment.center_id, 
      reason: reportCategory, 
      description: `Cliente: ${appointment.client?.full_name}. Detalle: ${reportText}` 
    });
    
    if (error) {
      Alert.alert('Error al enviar', `No se pudo guardar: ${error.message}`);
      return;
    }

    setReportText(''); 
    setReportCategory('');
    Alert.alert('Reporte Enviado', 'El SuperAdministrador revisará este caso.');
  };

  if (loading || !appointment) return <View style={styles.center}><ActivityIndicator size="large" color={AuraColors.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={24} color={AuraColors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Gestión de Turno</Text>
        <TouchableOpacity onPress={handleReportClient}><Feather name="flag" size={20} color={AuraColors.destructive} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Datos del Cliente</Text>
          <Text style={styles.clientName}>{appointment.client?.full_name || 'Cliente sin nombre'}</Text>
          <Text style={styles.clientContact}><Feather name="phone" size={14}/> {appointment.client?.phone || 'Sin teléfono'}</Text>
          <Text style={styles.clientContact}><Feather name="mail" size={14}/> {appointment.client?.email || 'Sin correo'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Detalles del Servicio</Text>
          <View style={styles.row}><Feather name="scissors" size={16} color={AuraColors.textSecondary}/><Text style={styles.value}>{appointment.service?.name}</Text></View>
          <View style={styles.row}><Feather name="calendar" size={16} color={AuraColors.textSecondary}/><Text style={styles.value}>{appointment.appointment_date}</Text></View>
          <View style={styles.row}><Feather name="clock" size={16} color={AuraColors.textSecondary}/><Text style={styles.value}>{appointment.start_time.slice(0,5)} - {appointment.end_time.slice(0,5)}</Text></View>
          <View style={styles.row}><Feather name="dollar-sign" size={16} color={AuraColors.textSecondary}/><Text style={styles.value}>{appointment.service?.price} Bs</Text></View>
        </View>

        <Text style={styles.statusLabel}>Estado Actual: <Text style={{fontWeight: '700', color: AuraColors.primary}}>{appointment.status.toUpperCase()}</Text></Text>

        <View style={styles.actions}>
          {appointment.status === 'pending' && (
            <>
              <Button title="Aprobar Cita" onPress={() => handleUpdateStatus('approved')} icon={<Feather name="check" size={18} color="white"/>} style={{marginBottom: 12}} />
              <Button title="Rechazar / Sin espacio" variant="outline" onPress={() => handleUpdateStatus('rejected')} />
            </>
          )}
          {appointment.status === 'paid' && (
            <Button title="Marcar como Completada" onPress={() => handleUpdateStatus('completed')} icon={<Feather name="star" size={18} color="white"/>} />
          )}
          {appointment.status === 'completed' && (
             <Text style={styles.finishedText}>Esta cita finalizó con éxito.</Text>
          )}
          {appointment.status === 'cancelled' && (
             <Text style={[styles.finishedText, {color: '#DC2626'}]}>El cliente canceló esta cita.</Text>
          )}
          {appointment.status === 'rejected' && (
             <Text style={[styles.finishedText, {color: '#DC2626'}]}>Rechazaste esta solicitud de cita.</Text>
          )}
        </View>
      </ScrollView>
      <Modal visible={isReportModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.reportModalContent}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ backgroundColor: '#FEE2E2', padding: 12, borderRadius: 30, marginBottom: 12 }}>
                <Feather name="flag" size={24} color={AuraColors.destructive} />
              </View>
              <Text style={styles.reportModalTitle}>Reportar Cliente</Text>
              <Text style={styles.reportModalSub}>Selecciona el motivo principal:</Text>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16, justifyContent: 'center' }}>
              {['No se presentó', 'Llegó muy tarde', 'Comportamiento abusivo', 'Otro'].map(cat => (
                <TouchableOpacity 
                  key={cat} 
                  style={[styles.reportCategoryBtn, reportCategory === cat && { backgroundColor: AuraColors.primary, borderColor: AuraColors.primary }]}
                  onPress={() => setReportCategory(cat)}
                >
                  <Text style={[styles.reportCategoryText, reportCategory === cat && { color: 'white' }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.reportInput}
              multiline
              numberOfLines={4}
              placeholder="Detalla lo ocurrido..."
              value={reportText}
              onChangeText={setReportText}
              textAlignVertical="top"
            />
            <View style={styles.reportActions}>
              <Button title="Cancelar" variant="outline" onPress={() => setIsReportModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Enviar Reporte" onPress={submitReport} style={{ flex: 1, backgroundColor: AuraColors.destructive }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: AuraColors.textPrimary },
  scroll: { padding: 24 },
  card: { backgroundColor: AuraColors.card, padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: AuraColors.border },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: AuraColors.textSecondary, marginBottom: 12 },
  clientName: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 8 },
  clientContact: { fontSize: 14, color: AuraColors.textPrimary, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  value: { fontSize: 15, color: AuraColors.textPrimary, fontWeight: '500' },
  statusLabel: { fontSize: 16, textAlign: 'center', marginVertical: 20, color: AuraColors.textSecondary },
  actions: { marginTop: 10 },
  finishedText: { textAlign: 'center', color: '#16A34A', fontWeight: '700', fontSize: 16, marginTop: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 20 },
  reportModalContent: { backgroundColor: AuraColors.background, borderRadius: 24, padding: 24, width: '90%', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 },
  reportModalTitle: { fontSize: 20, fontWeight: '800', color: AuraColors.textPrimary },
  reportModalSub: { fontSize: 14, color: AuraColors.textSecondary, textAlign: 'center' },
  reportCategoryBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: AuraColors.border, backgroundColor: AuraColors.card },
  reportCategoryText: { fontSize: 13, fontWeight: '600', color: AuraColors.textSecondary },
  reportInput: { backgroundColor: AuraColors.card, borderWidth: 1, borderColor: AuraColors.border, borderRadius: 12, padding: 16, minHeight: 100, marginBottom: 24, color: AuraColors.textPrimary },
  reportActions: { flexDirection: 'row', justifyContent: 'space-between' },
});