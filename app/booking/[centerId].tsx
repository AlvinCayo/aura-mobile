import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ServiceItem from '../../src/components/ui/ServiceItem';
import TimeSlotPicker from '../../src/components/ui/TimeSlotPicker';
import { AuraColors } from '../../src/theme/colors';

// Simulación de servicios y horarios
const SERVICES = [
  { id: '1', name: 'Limpieza facial profunda', duration: '60 min', price: '45 €' },
  { id: '2', name: 'Peeling químico', duration: '45 min', price: '65 €' },
  { id: '3', name: 'Masaje relajante', duration: '90 min', price: '80 €' },
];

const TIME_SLOTS = [
  { id: '1', time: '09:00', available: true },
  { id: '2', time: '10:00', available: true },
  { id: '3', time: '11:00', available: false },
  { id: '4', time: '12:00', available: true },
  { id: '5', time: '13:00', available: true },
];

export default function BookingScreen() {
  const { centerId, serviceId } = useLocalSearchParams<{ centerId: string; serviceId?: string }>();
  const router = useRouter();
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(serviceId || null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const selectedService = SERVICES.find((s) => s.id === selectedServiceId);

  const handleConfirm = () => {
    console.log('Reservar:', {
      centerId,
      serviceId: selectedServiceId,
      slotId: selectedSlotId,
    });
    // Lógica de confirmación
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Reservar cita</Text>
        </View>

        {/* Seleccionar servicio (solo si no viene desde un servicio concreto) */}
        {!serviceId && (
          <>
            <Text style={styles.sectionTitle}>Selecciona un servicio</Text>
            {SERVICES.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceOption}
                onPress={() => setSelectedServiceId(service.id)}
              >
                <ServiceItem
                  name={service.name}
                  duration={service.duration}
                  price={service.price}
                  onPress={() => setSelectedServiceId(service.id)}
                />
                {selectedServiceId === service.id && (
                  <Feather name="check-circle" size={20} color={AuraColors.primary} style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Servicio seleccionado */}
        {selectedService && (
          <View style={styles.selectedService}>
            <Text style={styles.sectionTitle}>Servicio elegido</Text>
            <ServiceItem
              name={selectedService.name}
              duration={selectedService.duration}
              price={selectedService.price}
              onPress={() => {}}
            />
          </View>
        )}

        {/* Selección de horario */}
        <TimeSlotPicker
          slots={TIME_SLOTS}
          selectedSlot={selectedSlotId}
          onSelectSlot={setSelectedSlotId}
        />

        {/* Nota */}
        <View style={styles.note}>
          <Feather name="info" size={14} color={AuraColors.textMuted} />
          <Text style={styles.noteText}>
            Recibirás una confirmación por correo electrónico.
          </Text>
        </View>
      </ScrollView>

      {/* Botón confirmar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (!selectedServiceId || !selectedSlotId) && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={!selectedServiceId || !selectedSlotId}
          activeOpacity={0.9}
        >
          <Text style={styles.confirmButtonText}>Confirmar reserva</Text>
          <Feather name="check" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AuraColors.background,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AuraColors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AuraColors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: AuraColors.textPrimary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AuraColors.textPrimary,
    marginBottom: 12,
  },
  serviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkIcon: {
    marginLeft: -30,
    backgroundColor: AuraColors.card,
    borderRadius: 10,
  },
  selectedService: {
    marginBottom: 24,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  noteText: {
    fontSize: 13,
    color: AuraColors.textMuted,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: AuraColors.card,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: AuraColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 10,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AuraColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});