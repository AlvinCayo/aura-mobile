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
}

export default function TimeSlotPicker({ slots, selectedSlot, onSelectSlot }: TimeSlotPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Horarios disponibles</Text>
      <FlatList
        horizontal
        data={slots}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.slot,
              !item.available && styles.slotDisabled,
              selectedSlot === item.id && styles.slotSelected,
            ]}
            onPress={() => item.available && onSelectSlot(item.id)}
            disabled={!item.available}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.slotText,
                !item.available && styles.slotTextDisabled,
                selectedSlot === item.id && styles.slotTextSelected,
              ]}
            >
              {item.time}
            </Text>
          </TouchableOpacity>
        )}
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
    opacity: 0.4,
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
  },
});