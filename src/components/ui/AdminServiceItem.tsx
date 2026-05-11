import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { AuraColors } from '../../theme/colors';

interface AdminServiceItemProps {
  name: string;
  duration: string;
  price: string;
  onEdit: () => void;
  onDelete: () => void;
  style?: ViewStyle;
}

export default function AdminServiceItem({ name, duration, price, onEdit, onDelete, style }: AdminServiceItemProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <View style={styles.meta}>
          <Feather name="clock" size={14} color={AuraColors.textMuted} />
          <Text style={styles.metaText}>{duration}</Text>
        </View>
        <Text style={styles.price}>{price}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={onEdit} style={styles.iconButton}>
          <Feather name="edit-2" size={18} color={AuraColors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.iconButton}>
          <Feather name="trash-2" size={18} color={AuraColors.destructive} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: AuraColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AuraColors.border,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: AuraColors.textPrimary,
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 13,
    color: AuraColors.textMuted,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: AuraColors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginLeft: 12,
  },
  iconButton: {
    padding: 4,
  },
});