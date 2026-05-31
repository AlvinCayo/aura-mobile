import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/Button';
import TimeSlotPicker from '../../src/components/ui/TimeSlotPicker';
import { useAuth } from '../../src/contexts/AuthContext';
import { sendNotification } from '../../src/lib/push';
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
  
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  // NUEVO: Aquí guardaremos las horas reales generadas por el horario del centro
  const [dynamicSlots, setDynamicSlots] = useState<any[]>([]);

  useEffect(() => {
    const fetchCenterAndServices = async () => {
      if (!centerId) return;
      try {
        // CORRECCIÓN: Agregamos 'schedule' y 'owner_id' a la consulta
        const { data: centerData } = await supabase
          .from('centers')
          .select('name, address, rating, schedule, owner_id')
          .eq('id', centerId)
          .single();
        if (centerData) setCenter(centerData);

        const { data: servicesData } = await supabase.from('services').select('*').eq('center_id', centerId);
        if (servicesData) setServices(servicesData);
      } catch (error) {
        console.error('Error cargando reservas:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCenterAndServices();
  }, [centerId]);

  // Efecto que busca los turnos ocupados
  useEffect(() => {
    const fetchBookedSlots = async () => {
      if (!centerId || !selectedDate) return;
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('start_time')
          .eq('center_id', centerId)
          .eq('appointment_date', selectedDate)
          .in('status', ['pending', 'approved', 'paid', 'completed']);

        if (error) throw error;

        if (data) {
          const occupied = data.map(apt => apt.start_time);
          setBookedSlots(occupied);
        }
      } catch (error) {
        console.error('Error fetching booked slots:', error);
      }
    };
    fetchBookedSlots();
  }, [centerId, selectedDate]);

  // LA MAGIA OCURRE AQUÍ: Generar horarios basados en el día y la configuración del local
  useEffect(() => {
    if (!center || !center.schedule || !selectedDate) {
      setDynamicSlots([]);
      return;
    }

    // 1. Averiguamos qué día de la semana seleccionó el usuario (lunes, martes, etc.)
    const [y, m, d] = selectedDate.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const daysOfWeek = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const dayName = daysOfWeek[date.getDay()];

    // 2. Extraemos el horario de ese día específico
    const dayConfig = center.schedule[dayName];
    
    // Si el día está marcado como inactivo o el horario de apertura es 00:00, no hay citas
    if (!dayConfig || !dayConfig.active || dayConfig.open === "00:00") {
      setDynamicSlots([]);
      setSelectedTime(null);
      return;
    }

    // 3. Convertimos horas (ej. 09:00) a minutos para poder calcular
    const [openH, openM] = dayConfig.open.split(':').map(Number);
    const [closeH, closeM] = dayConfig.close.split(':').map(Number);

    let currentMins = openH * 60 + openM;
    const closeMins = closeH * 60 + closeM;
    
    // Proteger hora de cierre: Asegurarnos de que el servicio alcance a terminar
    const duration = selectedService ? selectedService.duration_min : 30; 
    const interval = 30; // Generar botones cada 30 minutos

    const slots = [];

    // 4. Creamos los bloques de hora mientras el servicio alcance dentro del horario
    while (currentMins + duration <= closeMins) {
      const h = Math.floor(currentMins / 60);
      const mins = currentMins % 60;
      
      const id = `${String(h).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const time = `${String(displayH).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${ampm}`;

      slots.push({ id, time, available: true });
      
      currentMins += interval;
    }
    
    setDynamicSlots(slots);
    
    // Si el usuario cambia de fecha o de servicio, se limpia la hora que había seleccionado
    setSelectedTime(null); 
  }, [selectedDate, center, selectedService]);

  const handleConfirmBooking = async () => {
    if (!selectedService) return Alert.alert('Aviso', 'Por favor, selecciona un servicio.');
    if (!selectedTime) return Alert.alert('Aviso', 'Por favor, selecciona un horario.');
    if (!user) return Alert.alert('Error', 'Debes iniciar sesión para reservar.');

    setIsSubmitting(true);

    try {
      const { data: profileCheck } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle();
      if (!profileCheck) {
        await supabase.from('profiles').insert([{ id: user.id, email: user.email, role: 'client', full_name: user.user_metadata?.full_name || 'Usuario' }]);
      }

      const duration = selectedService.duration_min;
      const startTimeParts = selectedTime.split(':');
      
      const startDate = new Date();
      startDate.setHours(parseInt(startTimeParts[0], 10));
      startDate.setMinutes(parseInt(startTimeParts[1], 10));
      startDate.setSeconds(0);
      
      const endDate = new Date(startDate.getTime() + duration * 60000);
      
      const endTimeString = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}:00`;

      const { data, error } = await supabase.from('appointments').insert({
        client_id: user.id,
        center_id: centerId,
        service_id: selectedService.id,
        appointment_date: selectedDate,
        start_time: selectedTime,
        end_time: endTimeString,
        status: 'pending',
      });

      if (center?.owner_id) {
        await sendNotification(
          center.owner_id, 
          "¡Nueva Solicitud de Reserva!",
          "Un cliente quiere agendar un turno. Revisa tu panel para aprobarlo.",
          "calendar"
        );
      }

      if (error) throw error;
      router.replace('/booking/confirmation');
    } catch (error: any) {
      console.error("Booking error:", error);
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
      <TouchableOpacity style={[styles.dateCard, isSelected && styles.dateCardSelected]} onPress={() => { setSelectedDate(item.dateString); setSelectedTime(null); }}>
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
        {services.length === 0 ? <Text style={styles.emptyText}>Este centro aún no tiene servicios registrados.</Text> : <FlatList data={services} keyExtractor={(item) => item.id} renderItem={renderServiceCard} scrollEnabled={false} />}

        <Text style={styles.sectionTitle}>2. Selecciona una Fecha</Text>
        <FlatList horizontal showsHorizontalScrollIndicator={false} data={availableDates} keyExtractor={(item) => item.dateString} renderItem={renderDateItem} contentContainerStyle={{ gap: 12, paddingVertical: 8 }} />

        <Text style={styles.sectionTitle}>3. Horarios Disponibles</Text>
        {dynamicSlots.length > 0 ? (
          <TimeSlotPicker 
            slots={dynamicSlots} 
            selectedSlot={selectedTime} 
            onSelectSlot={setSelectedTime}
            bookedSlots={bookedSlots}
            selectedDate={selectedDate}
          />
        ) : (
          <Text style={styles.emptyText}>El local no atiende en la fecha seleccionada o los servicios sobrepasan la hora de cierre.</Text>
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
  emptyText: { color: AuraColors.textMuted, fontStyle: 'italic', marginBottom: 16, lineHeight: 20 },
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