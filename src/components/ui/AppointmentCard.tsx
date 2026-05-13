import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuraColors } from '../../theme/colors';

type AppointmentStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled';

interface AppointmentCardProps {
  centerName: string;
  serviceName: string;
  date: string;
  time: string;
  price?: string; // <-- Ahora acepta precio (opcional)
  status: AppointmentStatus;
  onPress?: () => void; // <-- Ahora es opcional
}

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; color: string; bg: string; icon: keyof typeof Feather.glyphMap }
> = {
  confirmed: { label: 'Confirmada', color: AuraColors.success, bg: '#EDF7ED', icon: 'check-circle' },
  pending: { label: 'Pendiente', color: AuraColors.warning, bg: '#FDF3E0', icon: 'clock' },
  completed: { label: 'Completada', color: AuraColors.primary, bg: AuraColors.primaryLight, icon: 'check' },
  cancelled: { label: 'Cancelada', color: AuraColors.destructive, bg: '#FDEDED', icon: 'x-circle' },
};

export default function AppointmentCard({
  centerName,
  serviceName,
  date,
  time,
  price,
  status,
  onPress,
}: AppointmentCardProps) {
  const config = STATUS_CONFIG[status];

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress} 
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <Feather name="calendar" size={22} color={AuraColors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.centerName} numberOfLines={1}>{centerName}</Text>
          <Text style={styles.serviceName}>{serviceName}</Text>
          <View style={styles.meta}>
            <Feather name="clock" size={12} color={AuraColors.textMuted} />
            <Text style={styles.metaText}>{date} · {time}</Text>
          </View>
        </View>
        <View style={styles.rightColumn}>
          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <Feather name={config.icon as any} size={12} color={config.color} />
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
          {/* Muestra el precio si fue proporcionado */}
          {price && <Text style={styles.priceText}>{price}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AuraColors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: AuraColors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: AuraColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  centerName: {
    fontSize: 16,
    fontWeight: '600',
    color: AuraColors.textPrimary,
  },
  serviceName: {
    fontSize: 14,
    color: AuraColors.textSecondary,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    fontSize: 13,
    color: AuraColors.textMuted,
  },
  rightColumn: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: AuraColors.primary,
  },
});