import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert, Platform,
  ScrollView, StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/Button';
import ServiceItem from '../../src/components/ui/ServiceItem';
import { useAuth } from '../../src/contexts/AuthContext';
import {
  createAppointment,
  fetchBookedSlots,
  fetchCenterById,
  fetchServicesByCenter,
} from '../../src/lib/data';
import { AuraColors } from '../../src/theme/colors';

const PLATFORM_COMMISSION = 0.10; // 10% de comisión

// Función mejorada: Verifica que el servicio entero quepa en el horario
function generateAvailableSlots(
  opening: string, 
  closing: string, 
  serviceDurationMin: number, 
  booked: { start_time: string; end_time: string }[],
  isToday: boolean
) {
  const slots: string[] = [];
  const [openH, openM] = opening.split(':').map(Number);
  const [closeH, closeM] = closing.split(':').map(Number);
  
  let current = new Date();
  current.setHours(openH, openM, 0, 0);
  
  const closeDate = new Date();
  closeDate.setHours(closeH, closeM, 0, 0);

  const now = new Date();
  // Margen de 1 hora de anticipación si es hoy
  const minimumTime = new Date(now.getTime() + 60 * 60 * 1000); 

  // Avanzamos en intervalos de 30 minutos (estándar para agendas)
  const intervalMinutes = 30;

  while (current < closeDate) {
    const slotEnd = new Date(current.getTime() + serviceDurationMin * 60000);
    
    // 1. Validar que el servicio termine antes de la hora de cierre
    if (slotEnd > closeDate) break;

    // 2. Validar anticipación de 1 hora
    if (isToday && current < minimumTime) {
      current = new Date(current.getTime() + intervalMinutes * 60000);
      continue;
    }

    const timeStr = current.toTimeString().slice(0, 5);
    const endStr = slotEnd.toTimeString().slice(0, 5);

    // 3. Validar choque con otras reservas
    const isOverlapping = booked.some(b => {
      // Un choque ocurre si el inicio del slot cae dentro de una reserva,
      // o si el final del slot cae dentro de una reserva,
      // o si el slot engloba completamente a una reserva.
      return (timeStr < b.end_time && endStr > b.start_time);
    });

    if (!isOverlapping) {
      slots.push(timeStr);
    }

    current = new Date(current.getTime() + intervalMinutes * 60000);
  }
  return slots;
}

export default function BookingScreen() {
  const { centerId, serviceId } = useLocalSearchParams<{ centerId: string; serviceId?: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [center, setCenter] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(serviceId || null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!centerId) return;
    (async () => {
      const { data } = await fetchCenterById(centerId as string);
      setCenter(data);
    })();
    fetchServicesByCenter(centerId as string).then(({ data }) => setServices(data || []));
  }, [centerId]);

  useEffect(() => {
    if (!center || !center.opening_time || !center.closing_time || !date || !selectedServiceId) return;
    
    const selectedService = services.find(s => s.id === selectedServiceId);
    if (!selectedService) return;

    const dateStr = date.toISOString().slice(0, 10);
    const nowStr = new Date().toISOString().slice(0, 10);
    const isToday = dateStr === nowStr;

    setLoadingSlots(true);
    // Reiniciar el slot seleccionado al cambiar fecha o servicio
    setSelectedSlot(null); 

    fetchBookedSlots(centerId as string, dateStr).then(({ data }) => {
      const booked = (data || []).map((b: any) => ({
        start_time: b.start_time.slice(0, 5),
        end_time: b.end_time.slice(0, 5),
      }));

      const slots = generateAvailableSlots(
        center.opening_time,
        center.closing_time,
        selectedService.duration_min,
        booked,
        isToday
      );
      
      setTimeSlots(slots);
      setLoadingSlots(false);
    });
  }, [center, date, selectedServiceId, services]);

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const servicePrice = selectedService ? parseFloat(selectedService.price) : 0;
  const commission = servicePrice * PLATFORM_COMMISSION;
  const total = servicePrice + commission;

  const handleConfirm = async () => {
    if (!user || !selectedServiceId || !selectedSlot || !center) return;
    
    const dateStr = date.toISOString().slice(0, 10);
    const endTime = new Date(`${dateStr}T${selectedSlot}:00`);
    endTime.setMinutes(endTime.getMinutes() + (selectedService?.duration_min || 60));
    const endTimeStr = endTime.toTimeString().slice(0, 5);

    // Creamos la cita en estado "pending"
    const { error } = await createAppointment({
      center_id: center.id,
      service_id: selectedServiceId,
      client_id: user.id,
      appointment_date: dateStr,
      start_time: selectedSlot,
      end_time: endTimeStr,
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      router.push({
        pathname: '/booking/confirmation',
        params: {
          total: total.toFixed(2),
          commission: commission.toFixed(2),
          serviceName: selectedService?.name,
          centerName: center.name,
          date: dateStr,
          time: selectedSlot,
        },
      } as any);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Solicitar Cita</Text>
          <View style={{ width: 40 }} />
        </View>

        {!serviceId && (
          <>
            <Text style={styles.sectionTitle}>1. Selecciona un servicio</Text>
            {services.map((s) => (
              <TouchableOpacity key={s.id} onPress={() => setSelectedServiceId(s.id)} style={{ marginBottom: 10 }}>
                <ServiceItem
                  name={s.name}
                  duration={`${s.duration_min} min`}
                  price={`${s.price} Bs`}
                  onPress={() => setSelectedServiceId(s.id)}
                />
                {selectedServiceId === s.id && (
                  <Feather name="check-circle" size={20} color={AuraColors.primary} style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            ))}
          </>
        )}

        <Text style={styles.sectionTitle}>2. Elige la Fecha</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
          <Feather name="calendar" size={18} color={AuraColors.primary} />
          <Text style={styles.dateText}>{date.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            minimumDate={new Date()}
            onChange={(event, selected) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selected) setDate(selected);
            }}
          />
        )}

        {selectedServiceId && (
          <>
            <Text style={styles.sectionTitle}>3. Horarios disponibles</Text>
            <Text style={styles.helperText}>Calculado para {selectedService?.duration_min} min de duración</Text>
            {loadingSlots ? (
              <Text style={{ color: AuraColors.textMuted }}>Buscando espacios libres...</Text>
            ) : timeSlots.length > 0 ? (
              <View style={styles.slotsContainer}>
                {timeSlots.map((slot) => (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.slotChip, selectedSlot === slot && styles.slotChipActive]}
                    onPress={() => setSelectedSlot(slot)}
                  >
                    <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextActive]}>{slot}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={{ color: AuraColors.destructive, marginTop: 8 }}>
                No hay espacio de {selectedService?.duration_min} min disponible para esta fecha.
              </Text>
            )}
          </>
        )}

        {selectedService && selectedSlot && (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Desglose a pagar (Al aprobarse)</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Costo del servicio</Text>
              <Text style={styles.summaryValue}>{servicePrice.toFixed(2)} Bs</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tarifa por reserva AURA (10%)</Text>
              <Text style={styles.summaryValue}>{commission.toFixed(2)} Bs</Text>
            </View>
            <View style={[styles.summaryRow, { borderTopWidth: 1, borderColor: AuraColors.border, paddingTop: 12, marginTop: 8 }]}>
              <Text style={{ fontWeight: '700', fontSize: 16 }}>Total</Text>
              <Text style={{ fontWeight: '800', color: AuraColors.primary, fontSize: 18 }}>{total.toFixed(2)} Bs</Text>
            </View>
            <Text style={styles.warningText}>No se te cobrará nada ahora. El pago se habilitará cuando el centro apruebe tu solicitud.</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          title="Enviar Solicitud al Centro"
          onPress={handleConfirm}
          disabled={!selectedServiceId || !selectedSlot}
          icon={<Feather name="send" size={18} color="white" />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  scroll: { padding: 24, paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  title: { fontSize: 22, fontWeight: '700', color: AuraColors.textPrimary },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 12, marginTop: 24 },
  helperText: { fontSize: 13, color: AuraColors.textSecondary, marginBottom: 12, marginTop: -8 },
  dateButton: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: AuraColors.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: AuraColors.border,
  },
  dateText: { fontSize: 16, color: AuraColors.textPrimary, fontWeight: '500' },
  slotsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  slotChip: {
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12,
    backgroundColor: AuraColors.card, borderWidth: 1, borderColor: AuraColors.border,
  },
  slotChipActive: { backgroundColor: AuraColors.primary, borderColor: AuraColors.primary },
  slotText: { fontSize: 15, color: AuraColors.textSecondary, fontWeight: '500' },
  slotTextActive: { color: 'white', fontWeight: '700' },
  summary: {
    backgroundColor: AuraColors.primaryLight, borderRadius: 16, padding: 20,
    marginTop: 10, borderWidth: 1, borderColor: '#D1E8FA',
  },
  summaryTitle: { fontWeight: '700', fontSize: 16, marginBottom: 12, color: AuraColors.primary },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
  summaryLabel: { color: AuraColors.textSecondary, fontSize: 14 },
  summaryValue: { color: AuraColors.textPrimary, fontWeight: '600', fontSize: 15 },
  warningText: { fontSize: 12, color: AuraColors.textSecondary, marginTop: 12, fontStyle: 'italic', textAlign: 'center' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, backgroundColor: AuraColors.background, borderTopWidth: 1, borderTopColor: AuraColors.border },
  checkIcon: { position: 'absolute', right: -8, top: -8 },
});