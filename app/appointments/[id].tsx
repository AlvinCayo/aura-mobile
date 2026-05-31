import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/Button';
import { useAuth } from '../../src/contexts/AuthContext';
import { sendNotification } from '../../src/lib/push'; // Asegúrate de que la ruta sea correcta según el archivo
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCenterQR, setShowCenterQR] = useState(false);

  const loadDetails = async () => {
    try {
      // Ajuste de consulta: usamos commission_amount de acuerdo al esquema de BD
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id, status, appointment_date, start_time, commission_amount,
          service:service_id(name, price, duration_min),
          center:center_id(name, address, payment_qr_url, phone)
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

  const handleLogAction = async (action: string, details: any) => {
    await supabase.from('audit_logs').insert({
      appointment_id: id, actor_id: user?.id, action, details
    });
  };

  const handlePayBalanceQR = async () => {
    Alert.alert(
      'Confirmar Pago',
      '¿Ya realizaste la transferencia del servicio al código QR del establecimiento?',
      [
        { text: 'Aún no', style: 'cancel' },
        {
          text: 'Sí, ya pagué',
          onPress: async () => {
            await supabase.from('appointments').update({ status: 'completed' }).eq('id', id);
            if (appointment.center && appointment.center.owner_id) {
              await sendNotification(
              appointment.center.owner_id, // Al dueño del centro
              "¡Servicio Completado!",
              `El cliente ha confirmado el pago final para ${appointment.service.name}.`,
              "check-circle");
            }
            await handleLogAction('BALANCE_PAID_QR', { amount: appointment.service.price });
            Alert.alert('¡Excelente!', 'El servicio ha sido marcado como completado. Gracias por preferir AURA.');
            loadDetails();
            setShowCenterQR(false);
          }
        }
      ]
    );
  };

  const handleCancelAppointment = () => {
    Alert.alert(
      'Cancelar Reserva',
      '¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer.',
      [
        { text: 'No, mantener', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // 1. Actualizamos el estado a 'cancelled' (cancelado por el cliente)
              await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id);
              
              // 2. Notificamos al centro
              if (appointment.center && appointment.center.owner_id) {
                await sendNotification(
                  appointment.center.owner_id,
                  "Cita Cancelada",
                  `El cliente acaba de cancelar su cita para el servicio de ${appointment.service.name}.`,
                  "x-circle"
                );
              }
              
              Alert.alert('Cita Cancelada', 'Has cancelado tu reserva exitosamente.');
              loadDetails();
            } catch (error) {
              Alert.alert('Error', 'No se pudo cancelar la cita.');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={AuraColors.primary} /></View>;

  const getStatusDisplay = () => {
    switch (appointment?.status) {
      case 'pending': return { text: 'En Revisión', color: '#D97706', bg: '#FEF3C7', icon: 'clock' };
      case 'approved': return { text: 'Pago Requerido (Comisión)', color: '#B91C1C', bg: '#FEE2E2', icon: 'alert-circle' };
      case 'verifying_payment': return { text: 'Verificando...', color: '#7C3AED', bg: '#F3E8FF', icon: 'loader' };
      case 'paid': return { text: 'Turno Asegurado', color: '#16A34A', bg: '#DCFCE7', icon: 'check-circle' };
      case 'completed': return { text: 'Completada', color: AuraColors.primary, bg: AuraColors.primaryLight, icon: 'star' };
      case 'cancelled': return { text: 'Cancelada por ti', color: '#9CA3AF', bg: '#F3F4F6', icon: 'x-circle' };
      case 'rejected': return { text: 'Rechazada por el Centro', color: '#DC2626', bg: '#FEE2E2', icon: 'x-octagon' };
      default: return { text: 'Desconocido', color: '#9CA3AF', bg: '#F3F4F6', icon: 'help-circle' };
    }
  };

  const statusInfo = getStatusDisplay();
  const baseServicePrice = parseFloat(appointment?.service?.price || '0');
  
  // Si la comisión no está guardada aún, la calculamos temporalmente solo para la UI
  const commissionCalculated = appointment?.commission_amount ? parseFloat(appointment.commission_amount) : (baseServicePrice * 0.10);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle de Cita</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Tarjeta de Estado */}
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Feather name={statusInfo.icon as any} size={16} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
          </View>
          
          {appointment?.status === 'pending' && <Text style={styles.statusMessage}>El centro está revisando su disponibilidad para atenderte.</Text>}
          {appointment?.status === 'approved' && <Text style={styles.statusMessage}>¡El centro ha aceptado tu turno! Paga la comisión de plataforma para confirmar tu reserva.</Text>}
          {appointment?.status === 'verifying_payment' && <Text style={styles.statusMessage}>El sistema automático está procesando el comprobante de tu comisión.</Text>}
          {appointment?.status === 'paid' && <Text style={styles.statusMessage}>Tu reserva está confirmada. El costo del servicio se paga al centro el día de tu cita.</Text>}
        </View>

        {/* Info del Servicio */}
        <View style={styles.cardBox}>
          <Text style={styles.boxTitle}>Información del Turno</Text>
          <View style={styles.infoRow}><Feather name="scissors" size={16} color={AuraColors.textMuted} /><Text style={styles.infoText}>{appointment?.service?.name}</Text></View>
          <View style={styles.infoRow}><Feather name="calendar" size={16} color={AuraColors.textMuted} /><Text style={styles.infoText}>{appointment?.appointment_date}</Text></View>
          <View style={styles.infoRow}><Feather name="clock" size={16} color={AuraColors.textMuted} /><Text style={styles.infoText}>{appointment?.start_time.slice(0,5)} ({appointment?.service?.duration_min} min)</Text></View>
          <View style={styles.infoRow}><Feather name="map-pin" size={16} color={AuraColors.textMuted} /><Text style={styles.infoText}>{appointment?.center?.name} - {appointment?.center?.address}</Text></View>
        </View>

        {/* Desglose Financiero */}
        <View style={styles.cardBox}>
          <Text style={styles.boxTitle}>Desglose Financiero</Text>
          <View style={styles.financeRow}>
            <Text style={styles.financeLabel}>Precio Base del Servicio</Text>
            <Text style={styles.financeValue}>{baseServicePrice.toFixed(2)} Bs</Text>
          </View>
          
          <View style={styles.financeRow}>
            <Text style={styles.financeLabel}>Comisión Extra AURA (10%)</Text>
            <Text style={[styles.financeValue, { color: AuraColors.primary }]}>
              {appointment?.status !== 'pending' && appointment?.status !== 'approved' ? 'Pagado: ' : 'A pagar: '}
              {commissionCalculated.toFixed(2)} Bs
            </Text>
          </View>

          {appointment?.status !== 'pending' && (
            <View style={[styles.financeRow, { borderTopWidth: 1, borderTopColor: AuraColors.border, paddingTop: 12, marginTop: 4 }]}>
              <Text style={styles.financeTotalLabel}>A Pagar en el Centro</Text>
              <Text style={styles.financeTotalValue}>{baseServicePrice.toFixed(2)} Bs</Text>
            </View>
          )}
        </View>

        {/* CONTROLES INTERACTIVOS SEGÚN ESTADO */}
        {appointment?.status === 'approved' && (
          <Button 
            title="Pagar Comisión y Confirmar" 
            onPress={() => router.push(`/payment/${id}` as any)} 
            icon={<Feather name="shield" size={18} color="white" />}
          />
        )}

        {appointment?.status === 'paid' && (
          <View style={styles.actionContainer}>
             <Text style={styles.instructionText}>¿Llegó el día de tu cita? Paga el costo del servicio de forma digital o en efectivo en el local.</Text>
             
             {showCenterQR ? (
                <View style={styles.qrContainer}>
                  <Text style={styles.qrHeader}>QR del Establecimiento</Text>
                  <Image source={{ uri: appointment.center.payment_qr_url }} style={styles.qrImage} />
                  <Button title="Marcar como Completado" onPress={handlePayBalanceQR} style={{ marginTop: 16 }} />
                  <Button title="Cancelar" variant="outline" onPress={() => setShowCenterQR(false)} style={{ marginTop: 8 }} />
                </View>
             ) : (
                <View style={{ gap: 12 }}>
                  {appointment?.center?.payment_qr_url ? (
                    <Button 
                      title="Pagar Servicio por QR" 
                      onPress={() => setShowCenterQR(true)} 
                      icon={<Feather name="smartphone" size={18} color="white" />}
                    />
                  ) : (
                    <Text style={styles.noQrWarning}>Este centro no acepta pagos por QR digital.</Text>
                  )}
                  <Button 
                    title="Pagar en Efectivo en el Local" 
                    variant="outline" 
                    onPress={() => Alert.alert('Aviso', 'El establecimiento confirmará el pago en efectivo al terminar tu servicio.')} 
                  />
                </View>
             )}
          </View>
        )}
        {appointment?.status === 'completed' && (
          <View style={[styles.actionContainer, { backgroundColor: '#F0FDF4' }]}>
             <Feather name="check-circle" size={24} color="#16A34A" style={{ alignSelf: 'center', marginBottom: 12 }} />
             <Text style={[styles.instructionText, { color: '#16A34A', fontWeight: '700' }]}>¡Servicio Completado!</Text>
             <Text style={styles.instructionText}>Esperamos que hayas tenido una gran experiencia.</Text>
             
             <Button 
               title="Calificar Servicio" 
               onPress={() => router.push(`/review/${appointment.center.id}` as any)} 
               icon={<Feather name="star" size={18} color="white" />}
               style={{ marginTop: 8 }}
             />
          </View>
        )}
        {(appointment?.status === 'pending' || appointment?.status === 'approved' || appointment?.status === 'paid') && (
          <TouchableOpacity onPress={handleCancelAppointment} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Cancelar Reserva</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary },
  content: { padding: 24, paddingBottom: 60 },
  statusCard: { alignItems: 'center', backgroundColor: AuraColors.card, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: AuraColors.border, marginBottom: 20 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 12 },
  statusText: { fontWeight: '700', fontSize: 14 },
  statusMessage: { textAlign: 'center', fontSize: 14, color: AuraColors.textSecondary, lineHeight: 20 },
  cardBox: { backgroundColor: AuraColors.card, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: AuraColors.border, marginBottom: 20 },
  boxTitle: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  infoText: { fontSize: 14, color: AuraColors.textPrimary, flex: 1 },
  financeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  financeLabel: { fontSize: 14, color: AuraColors.textSecondary },
  financeValue: { fontSize: 14, fontWeight: '600', color: AuraColors.textPrimary },
  financeTotalLabel: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary },
  financeTotalValue: { fontSize: 20, fontWeight: '800', color: '#16A34A' },
  actionContainer: { backgroundColor: '#F8FAFC', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: AuraColors.border },
  instructionText: { fontSize: 14, color: AuraColors.textSecondary, textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  noQrWarning: { textAlign: 'center', fontSize: 13, color: '#D97706', marginBottom: 8, fontStyle: 'italic' },
  qrContainer: { alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: AuraColors.border },
  qrHeader: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  qrImage: { width: 200, height: 200, borderRadius: 12 },
  cancelBtn: { marginTop: 24, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: '#DC2626', fontWeight: '700', fontSize: 16 },
});