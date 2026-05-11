import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuraColors } from '../../theme/colors';

interface ServiceItemProps {
  name: string;
  duration: string;
  price: string;
  onPress: () => void;
}

export default function ServiceItem({ name, duration, price, onPress }: ServiceItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <View style={styles.meta}>
          <Feather name="clock" size={14} color={AuraColors.textMuted} />
          <Text style={styles.metaText}>{duration}</Text>
        </View>
      </View>
      <View style={styles.priceContainer}>
        <Text style={styles.price}>{price}</Text>
        <Feather name="chevron-right" size={18} color={AuraColors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: AuraColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AuraColors.border,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: AuraColors.textPrimary,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: AuraColors.textMuted,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: AuraColors.primary,
  },
});