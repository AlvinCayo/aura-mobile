import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { AuraColors } from '../../theme/colors';

interface KpiCardProps {
  icon: string;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  style?: ViewStyle;
}

export default function KpiCard({ icon, label, value, trend, trendUp, style }: KpiCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.iconCircle}>
        <Feather name={icon as any} size={20} color={AuraColors.primary} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {trend ? (
        <View style={styles.trendContainer}>
          <Feather
            name={trendUp ? 'trending-up' : 'trending-down'}
            size={14}
            color={trendUp ? AuraColors.success : AuraColors.destructive}
          />
          <Text style={[styles.trendText, { color: trendUp ? AuraColors.success : AuraColors.destructive }]}>
            {trend}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AuraColors.card,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AuraColors.border,
    minWidth: 100,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AuraColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: AuraColors.textPrimary,
    marginBottom: 2,
  },
  label: {
    fontSize: 13,
    color: AuraColors.textSecondary,
    marginBottom: 6,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
});