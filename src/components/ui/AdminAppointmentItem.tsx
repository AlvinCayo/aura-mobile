import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { AuraColors } from '../../theme/colors';

type AppointmentStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled';

interface AdminAppointmentItemProps {
  clientName: string;
  serviceName: string;
  time: string;
  status: AppointmentStatus;
  onConfirm?: () => void;
  onCancel?: () => void;
  style?: ViewStyle;
}

const STATUS_CONFIG = {
  confirmed: { label: 'Confirmada', color: AuraColors.success, bg: '#EDF7ED' },
  pending: { label: 'Pendiente', color: AuraColors.warning, bg: '#FDF3E0' },
  completed: { label: 'Completada', color: AuraColors.primary, bg: AuraColors.primaryLight },
  cancelled: { label: 'Cancelada', color: AuraColors.destructive, bg: '#FDEDED' },
};

export default function AdminAppointmentItem({ clientName, serviceName, time, status, onConfirm, onCancel, style }: AdminAppointmentItemProps) {
  const config = STATUS_CONFIG[status];
  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        <Text style={styles.clientName} numberOfLines={1}>{clientName}</Text>
        <Text style={styles.serviceName}>{serviceName}</Text>
        <View style={styles.timeRow}>
          <Feather name="clock" size={12} color={AuraColors.textMuted} />
          <Text style={styles.timeText}>{time}</Text>
        </View>
      </View>
      <View style={styles.right}>
        <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
          <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
        </View>
        {status === 'pending' && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={onConfirm}>
              <Feather name="check" size={16} color={AuraColors.success} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={onCancel}>
              <Feather name="x" size={16} color={AuraColors.destructive} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: AuraColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AuraColors.border,
  },
  left: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: AuraColors.textPrimary,
    marginBottom: 2,
  },
  serviceName: {
    fontSize: 14,
    color: AuraColors.textSecondary,
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 13,
    color: AuraColors.textMuted,
  },
  right: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
});