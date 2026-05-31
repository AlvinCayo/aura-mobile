import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuraColors } from '../../theme/colors';

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedSlot: string | null;
  onSelectSlot: (slotId: string) => void;
  bookedSlots?: string[]; // NUEVO: recibe los slots ocupados desde la DB
  selectedDate?: string;  // NUEVO: recibe la fecha elegida para comparar con "hoy"
}

export default function TimeSlotPicker({ slots, selectedSlot, onSelectSlot, bookedSlots = [], selectedDate }: TimeSlotPickerProps) {

  // Lógica para comprobar si la hora ya pasó (solo afecta si se selecciona el día de hoy)
  const isPastTime = (slotTime: string) => {
    if (!selectedDate) return false;
    
    const now = new Date();
    // Formatear hoy como YYYY-MM-DD para igualar el formato de selectedDate
    const todayStr = now.getFullYear() + '-' + 
                     String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(now.getDate()).padStart(2, '0');

    if (selectedDate === todayStr) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [slotHour, slotMinute] = slotTime.split(':').map(Number);
      const slotTimeMinutes = slotHour * 60 + slotMinute;
      
      return slotTimeMinutes <= currentMinutes;
    }
    return false;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Horarios disponibles</Text>
      <FlatList
        horizontal
        data={slots}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          // Evaluamos todas las condiciones de disponibilidad
          const isBooked = bookedSlots.includes(item.id);
          const isPast = isPastTime(item.id);
          // Un slot está disponible solo si cumple las 3 condiciones
          const isAvailable = item.available && !isBooked && !isPast;

          return (
            <TouchableOpacity
              style={[
                styles.slot,
                !isAvailable && styles.slotDisabled,
                selectedSlot === item.id && styles.slotSelected,
              ]}
              onPress={() => isAvailable && onSelectSlot(item.id)}
              disabled={!isAvailable}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.slotText,
                  !isAvailable && styles.slotTextDisabled,
                  selectedSlot === item.id && styles.slotTextSelected,
                ]}
              >
                {item.time}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: AuraColors.textPrimary,
    marginBottom: 12,
  },
  list: {
    gap: 10,
    paddingRight: 24,
  },
  slot: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: AuraColors.card,
    borderWidth: 1,
    borderColor: AuraColors.border,
  },
  slotSelected: {
    backgroundColor: AuraColors.primary,
    borderColor: AuraColors.primary,
  },
  slotDisabled: {
    opacity: 0.5,
    backgroundColor: '#F3F4F6', // Fondo un poco más gris para indicar que está apagado
  },
  slotText: {
    fontSize: 14,
    fontWeight: '500',
    color: AuraColors.textPrimary,
  },
  slotTextSelected: {
    color: 'white',
  },
  slotTextDisabled: {
    color: AuraColors.textMuted,
    textDecorationLine: 'line-through', // Efecto visual de tachado
  },
});