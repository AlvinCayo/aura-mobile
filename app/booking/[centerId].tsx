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

// Generador de los próximos 14 días para el carrusel
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

// Horarios de ejemplo para el TimeSlotPicker
const AVAILABLE_SLOTS = [
  { id: '09:00:00', time: '09:00 AM', available: true },
  { id: '10:00:00', time: '10:00 AM', available: true },
  { id: '11:30:00', time: '11:30 AM', available: false }, // Simula ocupado
  { id: '14:00:00', time: '02:00 PM', available: true },
  { id: '15:30:00', time: '03:30 PM', available: true },
  { id: '17:00:00', time: '05:00 PM', available: true },
];

export default function BookingScreen() {
  const { centerId } = useLocalSearchParams<{ centerId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [center, setCenter] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados de selección del usuario
  const availableDates = generateNextDays(14);
  const [selectedDate, setSelectedDate] = useState(availableDates[0].dateString);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<any>(null);

  useEffect(() => {
    const fetchCenterAndServices = async () => {
      if (!centerId) return;

      try {
        const { data: centerData } = await supabase
          .from('centers')
          .select('name, address, rating')
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

  const handleConfirmBooking = async () => {
    if (!selectedService) return Alert.alert('Aviso', 'Por favor, selecciona un servicio.');
    if (!selectedTime) return Alert.alert('Aviso', 'Por favor, selecciona un horario.');
    if (!user) return Alert.alert('Error', 'Debes iniciar sesión para reservar.');

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('appointments').insert({
        client_id: user.id,
        center_id: centerId,
        service_id: selectedService.id,
        appointment_date: selectedDate,
        start_time: selectedTime,
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
      <TouchableOpacity
        style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}
        onPress={() => setSelectedService(item)}
      >
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
      <TouchableOpacity
        style={[styles.dateCard, isSelected && styles.dateCardSelected]}
        onPress={() => { setSelectedDate(item.dateString); setSelectedTime(null); }}
      >
        <Text style={[styles.dateDayName, isSelected && { color: 'white' }]}>{item.dayName}</Text>
        <Text style={[styles.dateDayNumber, isSelected && { color: 'white' }]}>{item.dayNumber}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={AuraColors.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agendar Cita</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.centerSummary}>
          <View style={styles.iconContainer}>
            <Feather name="briefcase" size={24} color={AuraColors.primary} />
          </View>
          <View>
            <Text style={styles.centerName}>{center?.name || 'Centro Estético'}</Text>
            <Text style={styles.centerAddress}>{center?.address || 'Ubicación'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>1. Elige un Servicio</Text>
        {services.length === 0 ? (
          <Text style={styles.emptyText}>Este centro aún no tiene servicios registrados.</Text>
        ) : (
          <FlatList
            data={services}
            keyExtractor={(item) => item.id}
            renderItem={renderServiceCard}
            scrollEnabled={false}
          />
        )}

        <Text style={styles.sectionTitle}>2. Selecciona una Fecha</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={availableDates}
          keyExtractor={(item) => item.dateString}
          renderItem={renderDateItem}
          contentContainerStyle={{ gap: 12, paddingVertical: 8 }}
        />

        <Text style={styles.sectionTitle}>3. Horarios Disponibles</Text>
        {/* AQUÍ ESTÁ LA CORRECCIÓN CLAVE: Enviando los props que pide tu componente */}
        <TimeSlotPicker 
          slots={AVAILABLE_SLOTS} 
          selectedSlot={selectedTime} 
          onSelectSlot={setSelectedTime} 
        />

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Resumen de la Cita</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Servicio:</Text>
            <Text style={styles.summaryValue}>{selectedService?.name || '---'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Fecha:</Text>
            <Text style={styles.summaryValue}>{selectedDate}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Hora:</Text>
            <Text style={styles.summaryValue}>
              {selectedTime ? AVAILABLE_SLOTS.find(s => s.id === selectedTime)?.time : '---'}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.totalLabel}>Total a Pagar (Aprox):</Text>
            <Text style={styles.totalValue}>Bs {selectedService ? (selectedService.price * 1.10).toFixed(2) : '0.00'}</Text>
          </View>
        </View>

        <Button
          title="Confirmar Reserva"
          onPress={handleConfirmBooking}
          loading={isSubmitting}
          style={{ marginTop: 24 }}
        />
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
  emptyText: { color: AuraColors.textMuted, fontStyle: 'italic', marginBottom: 16 },
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