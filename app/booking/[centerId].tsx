import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/Button';
import TimeSlotPicker from '../../src/components/ui/TimeSlotPicker';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

const generateNextDays = (days: number) => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + i);
    dates.push({
      dateString: nextDate.toISOString().split('T')[0],
      dayName: nextDate.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase(),
      dayNumber: nextDate.getDate(),
    });
  }
  return dates;
};

export default function BookingScreen() {
  const { centerId } = useLocalSearchParams<{ centerId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [center, setCenter] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableDates = generateNextDays(14);
  const [selectedDate, setSelectedDate] = useState(availableDates[0].dateString);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  
  // Horarios generados dinámicamente según el día y el centro
  const [dynamicSlots, setDynamicSlots] = useState<any[]>([]);

  useEffect(() => {
    const fetchCenterAndServices = async () => {
      if (!centerId) return;
      try {
        const { data: centerData } = await supabase
          .from('centers')
          .select('name, address, rating, schedule')
          .eq('id', centerId)
          .single();
        if (centerData) setCenter(centerData);

        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('center_id', centerId);
        if (servicesData) setServices(servicesData);
      } catch (error) {
        console.error('Error cargando reservas:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCenterAndServices();
  }, [centerId]);

  // Generador inteligente de horarios
  useEffect(() => {
    if (!center || !center.schedule) return;

    const generateSlotsForDay = async () => {
      // 1. Identificar qué día de la semana es (0 = Domingo, 1 = Lunes)
      // Forzamos la zona horaria añadiendo T00:00:00 para evitar desfasajes locales
      const dayOfWeek = new Date(selectedDate + 'T00:00:00').getDay();
      const daysMap = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      const dayName = daysMap[dayOfWeek];
      const daySchedule = center.schedule[dayName];

      if (!daySchedule || !daySchedule.active) {
        setDynamicSlots([]); // Cerrado ese día
        return;
      }

      // 2. Traer las citas que ya están reservadas para ese día en el centro
      const { data: bookedAppointments } = await supabase
        .from('appointments')
        .select('start_time')
        .eq('center_id', centerId)
        .eq('appointment_date', selectedDate)
        .in('status', ['pending', 'approved', 'paid', 'confirmed']);
      
      const bookedTimes = bookedAppointments ? bookedAppointments.map(a => a.start_time) : [];

      // 3. Generar la lista de horas
      let slots = [];
      let current = new Date(`${selectedDate}T${daySchedule.open}:00`);
      const closeTime = new Date(`${selectedDate}T${daySchedule.close}:00`);
      const now = new Date();
      // REGLA: 1 Hora mínima de anticipación
      const oneHourFromNow = new Date(now.getTime() + 60 * 60000);

      while (current < closeTime) {
        const timeString = current.toTimeString().split(' ')[0]; // HH:mm:ss
        
        // Verificamos si la hora ya pasó (o es muy pronto) y si ya está reservada
        const isTooSoon = current <= oneHourFromNow;
        const isBooked = bookedTimes.includes(timeString);

        slots.push({
          id: timeString,
          time: current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          available: !isTooSoon && !isBooked,
        });

        current = new Date(current.getTime() + 30 * 60000); // Bloques de 30 min
      }
      setDynamicSlots(slots);
    };

    generateSlotsForDay();
    setSelectedTime(null); // Resetear tiempo al cambiar de día
  }, [selectedDate, center]);

  const handleConfirmBooking = async () => {
    if (!selectedService) return Alert.alert('Aviso', 'Por favor, selecciona un servicio.');
    if (!selectedTime) return Alert.alert('Aviso', 'Por favor, selecciona un horario.');
    if (!user) return Alert.alert('Error', 'Debes iniciar sesión para reservar.');

    setIsSubmitting(true);

    try {
      // CORRECCIÓN: Calcular el end_time sumándole la duración al start_time
      const startDateTime = new Date(`${selectedDate}T${selectedTime}`);
      const endDateTime = new Date(startDateTime.getTime() + selectedService.duration_min * 60000);
      const end_time = endDateTime.toTimeString().split(' ')[0]; // Retorna HH:mm:ss

      const { error } = await supabase.from('appointments').insert({
        client_id: user.id,
        center_id: centerId,
        service_id: selectedService.id,
        appointment_date: selectedDate,
        start_time: selectedTime,
        end_time: end_time, // ¡Soluciona el error null_constraint!
        status: 'pending',
      });

      if (error) throw error;
      router.replace('/booking/confirmation');

    } catch (error: any) {
      Alert.alert('Error al reservar', error.message || 'No se pudo completar la reserva.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderServiceCard = ({ item }: { item: any }) => {
    const isSelected = selectedService?.id === item.id;
    return (
      <TouchableOpacity style={[styles.serviceCard, isSelected && styles.serviceCardSelected]} onPress={() => setSelectedService(item)}>
        <View style={styles.serviceInfo}>
          <Text style={[styles.serviceName, isSelected && { color: AuraColors.primary }]}>{item.name}</Text>
          <Text style={styles.serviceDuration}>{item.duration_min} min</Text>
        </View>
        <Text style={[styles.servicePrice, isSelected && { color: AuraColors.primary }]}>Bs {item.price}</Text>
      </TouchableOpacity>
    );
  };

  const renderDateItem = ({ item }: { item: any }) => {
    const isSelected = selectedDate === item.dateString;
    return (
      <TouchableOpacity style={[styles.dateCard, isSelected && styles.dateCardSelected]} onPress={() => setSelectedDate(item.dateString)}>
        <Text style={[styles.dateDayName, isSelected && { color: 'white' }]}>{item.dayName}</Text>
        <Text style={[styles.dateDayNumber, isSelected && { color: 'white' }]}>{item.dayNumber}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={AuraColors.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Feather name="arrow-left" size={20} color={AuraColors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Agendar Cita</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.centerSummary}>
          <View style={styles.iconContainer}><Feather name="briefcase" size={24} color={AuraColors.primary} /></View>
          <View>
            <Text style={styles.centerName}>{center?.name || 'Centro Estético'}</Text>
            <Text style={styles.centerAddress}>{center?.address || 'Ubicación'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>1. Elige un Servicio</Text>
        {services.length === 0 ? (
          <Text style={styles.emptyText}>Este centro aún no tiene servicios registrados.</Text>
        ) : (
          <FlatList data={services} keyExtractor={(item) => item.id} renderItem={renderServiceCard} scrollEnabled={false} />
        )}

        <Text style={styles.sectionTitle}>2. Selecciona una Fecha</Text>
        <FlatList horizontal showsHorizontalScrollIndicator={false} data={availableDates} keyExtractor={(item) => item.dateString} renderItem={renderDateItem} contentContainerStyle={{ gap: 12, paddingVertical: 8 }} />

        <Text style={styles.sectionTitle}>3. Horarios Disponibles</Text>
        {dynamicSlots.length === 0 ? (
          <Text style={styles.emptyText}>El establecimiento está cerrado en este día o ya no hay turnos disponibles.</Text>
        ) : (
          <TimeSlotPicker slots={dynamicSlots} selectedSlot={selectedTime} onSelectSlot={setSelectedTime} />
        )}

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Resumen de la Cita</Text>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Servicio:</Text><Text style={styles.summaryValue}>{selectedService?.name || '---'}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Fecha:</Text><Text style={styles.summaryValue}>{selectedDate}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Hora:</Text><Text style={styles.summaryValue}>{selectedTime ? dynamicSlots.find(s => s.id === selectedTime)?.time : '---'}</Text></View>
          <View style={[styles.summaryRow, styles.summaryTotal]}><Text style={styles.totalLabel}>Total a Pagar (Aprox):</Text><Text style={styles.totalValue}>Bs {selectedService ? (selectedService.price * 1.10).toFixed(2) : '0.00'}</Text></View>
        </View>

        <Button title="Confirmar Reserva" onPress={handleConfirmBooking} loading={isSubmitting} style={{ marginTop: 24 }} />
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
  content: { padding: 24 },
  centerSummary: { flexDirection: 'row', alignItems: 'center', backgroundColor: AuraColors.primaryLight, padding: 16, borderRadius: 16, marginBottom: 32 },
  iconContainer: { width: 48, height: 48, backgroundColor: 'white', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  centerName: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary },
  centerAddress: { fontSize: 13, color: AuraColors.textSecondary, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 16, marginTop: 16 },
  emptyText: { color: '#D97706', fontStyle: 'italic', marginBottom: 16, backgroundColor: '#FEF3C7', padding: 12, borderRadius: 8 },
  serviceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: AuraColors.card, borderRadius: 12, borderWidth: 1, borderColor: AuraColors.border, marginBottom: 12 },
  serviceCardSelected: { borderColor: AuraColors.primary, backgroundColor: AuraColors.primaryLight },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 16, fontWeight: '600', color: AuraColors.textPrimary },
  serviceDuration: { fontSize: 13, color: AuraColors.textSecondary, marginTop: 4 },
  servicePrice: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary },
  dateCard: { width: 64, height: 80, backgroundColor: AuraColors.card, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  dateCardSelected: { backgroundColor: AuraColors.primary, borderColor: AuraColors.primary },
  dateDayName: { fontSize: 13, color: AuraColors.textSecondary, marginBottom: 4, fontWeight: '500' },
  dateDayNumber: { fontSize: 20, fontWeight: '700', color: AuraColors.textPrimary },
  summaryBox: { marginTop: 32, padding: 20, backgroundColor: AuraColors.card, borderRadius: 16, borderWidth: 1, borderColor: AuraColors.border },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 14, color: AuraColors.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: '600', color: AuraColors.textPrimary },
  summaryTotal: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: AuraColors.border, alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary },
  totalValue: { fontSize: 20, fontWeight: '800', color: AuraColors.primary },
});