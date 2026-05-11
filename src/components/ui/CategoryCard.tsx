import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { AuraColors } from '../../theme/colors';

interface CategoryCardProps {
  icon: string;
  label: string;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export default function CategoryCard({ icon, label, selected = false, onPress, style }: CategoryCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, selected && styles.iconCircleSelected]}>
        <Feather name={icon as any} size={20} color={selected ? 'white' : AuraColors.primary} />
      </View>
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: AuraColors.card,
    borderWidth: 1,
    borderColor: AuraColors.border,
    minWidth: 80,
  },
  cardSelected: {
    backgroundColor: AuraColors.primary,
    borderColor: AuraColors.primary,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AuraColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleSelected: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: AuraColors.textPrimary,
    textAlign: 'center',
  },
  labelSelected: {
    color: 'white',
  },
});