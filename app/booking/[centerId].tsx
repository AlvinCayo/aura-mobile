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

// Número mágico para el porcentaje de la plataforma
const PLATFORM_COMMISSION = 0.10; // 10%

function generateTimeSlots(opening: string, closing: string, slotDuration: number, booked: { start_time: string; end_time: string }[]) {
  const slots: string[] = [];
  const [openH, openM] = opening.split(':').map(Number);
  const [closeH, closeM] = closing.split(':').map(Number);
  let current = new Date();
  current.setHours(openH, openM, 0, 0);
  const closeDate = new Date();
  closeDate.setHours(closeH, closeM, 0, 0);

  while (current < closeDate) {
    const timeStr = current.toTimeString().slice(0, 5);
    const endCurrent = new Date(current.getTime() + slotDuration * 60000);
    const endStr = endCurrent.toTimeString().slice(0, 5);

    const isBooked = booked.some(
      (b) => (timeStr >= b.start_time && timeStr < b.end_time) || (endStr > b.start_time && endStr <= b.end_time)
    );

    if (!isBooked) slots.push(timeStr);

    current = new Date(current.getTime() + slotDuration * 60000);
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
      const { data } = await fetchCenterById(centerId);
      setCenter(data);
    })();
    fetchServicesByCenter(centerId).then(({ data }) => setServices(data || []));
  }, [centerId]);

  useEffect(() => {
    if (!center || !center.opening_time || !center.closing_time || !date) return;
    const dateStr = date.toISOString().slice(0, 10);
    setLoadingSlots(true);
    fetchBookedSlots(centerId as string, dateStr).then(({ data }) => {
      const booked = (data || []).map((b: any) => ({
        start_time: b.start_time.slice(0, 5),
        end_time: b.end_time.slice(0, 5),
      }));
      const slots = generateTimeSlots(
        center.opening_time,
        center.closing_time,
        center.slot_duration_min || 60,
        booked
      );
      // Filtra slots pasados si la fecha es hoy (con 1h de anticipación)
      const now = new Date();
      const filteredSlots = dateStr === now.toISOString().slice(0, 10)
        ? slots.filter((t) => {
            const [h, m] = t.split(':').map(Number);
            const slotDate = new Date(now);
            slotDate.setHours(h, m, 0, 0);
            return slotDate.getTime() - now.getTime() >= 60 * 60 * 1000;
          })
        : slots;
      setTimeSlots(filteredSlots);
      setLoadingSlots(false);
    });
  }, [center, date]);

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const servicePrice = selectedService ? parseFloat(selectedService.price) : 0;
  const commission = servicePrice * PLATFORM_COMMISSION;
  const total = servicePrice + commission;

  const handleConfirm = async () => {
    if (!user || !selectedServiceId || !selectedSlot || !center) return;
    const dateStr = date.toISOString().slice(0, 10);
    const endTime = new Date(`${dateStr}T${selectedSlot}`);
    endTime.setMinutes(endTime.getMinutes() + (selectedService?.duration_min || 60));
    const endTimeStr = endTime.toTimeString().slice(0, 5);

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
      Alert.alert('Solicitud enviada', 'Tu reserva está pendiente de aprobación.');
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
          <Text style={styles.title}>Reservar cita</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Seleccionar servicio */}
        {!serviceId && (
          <>
            <Text style={styles.sectionTitle}>Selecciona un servicio</Text>
            {services.map((s) => (
              <TouchableOpacity key={s.id} onPress={() => setSelectedServiceId(s.id)} style={{ marginBottom: 10 }}>
                <ServiceItem
                  name={s.name}
                  duration={`${s.duration_min} min`}
                  price={`${s.price} €`}
                  onPress={() => setSelectedServiceId(s.id)}
                />
                {selectedServiceId === s.id && (
                  <Feather name="check-circle" size={20} color={AuraColors.primary} style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Fecha */}
        <Text style={styles.sectionTitle}>Fecha</Text>
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

        {/* Horarios */}
        <Text style={styles.sectionTitle}>Horarios disponibles</Text>
        {loadingSlots ? (
          <Text style={{ color: AuraColors.textMuted }}>Cargando...</Text>
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
          <Text style={{ color: AuraColors.textMuted }}>No hay horarios disponibles para esta fecha.</Text>
        )}

        {/* Resumen del costo */}
        {selectedService && (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Resumen</Text>
            <View style={styles.summaryRow}>
              <Text>Servicio</Text>
              <Text>{servicePrice.toFixed(2)} €</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text>Comisión plataforma (10%)</Text>
              <Text>{commission.toFixed(2)} €</Text>
            </View>
            <View style={[styles.summaryRow, { borderTopWidth: 1, borderColor: AuraColors.border, paddingTop: 8 }]}>
              <Text style={{ fontWeight: '700' }}>Total</Text>
              <Text style={{ fontWeight: '700', color: AuraColors.primary }}>{total.toFixed(2)} €</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          title="Enviar solicitud"
          onPress={handleConfirm}
          disabled={!selectedServiceId || !selectedSlot}
          icon={<Feather name="arrow-right" size={18} color="white" />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  scroll: { padding: 24, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  title: { fontSize: 22, fontWeight: '700', color: AuraColors.textPrimary },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, marginTop: 16 },
  dateButton: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: AuraColors.card, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: AuraColors.border,
  },
  dateText: { fontSize: 16, color: AuraColors.textPrimary },
  slotsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  slotChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: AuraColors.card, borderWidth: 1, borderColor: AuraColors.border,
  },
  slotChipActive: { backgroundColor: AuraColors.primary, borderColor: AuraColors.primary },
  slotText: { fontSize: 14, color: AuraColors.textSecondary },
  slotTextActive: { color: 'white', fontWeight: '600' },
  summary: {
    backgroundColor: AuraColors.card, borderRadius: 12, padding: 16,
    marginTop: 20, borderWidth: 1, borderColor: AuraColors.border,
  },
  summaryTitle: { fontWeight: '600', fontSize: 16, marginBottom: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, backgroundColor: AuraColors.card, borderTopWidth: 1, borderTopColor: AuraColors.border },
  checkIcon: { position: 'absolute', right: -8, top: -8 },
});