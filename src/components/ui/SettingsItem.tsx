import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuraColors } from '../../theme/colors';

interface SettingsItemProps {
  icon: string;
  label: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
}

export default function SettingsItem({
  icon,
  label,
  onPress,
  rightElement,
  showChevron = true,
}: SettingsItemProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.6}
    >
      <Feather name={icon as any} size={20} color={AuraColors.textPrimary} style={styles.icon} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.right}>
        {rightElement}
        {showChevron && <Feather name="chevron-right" size={18} color={AuraColors.textMuted} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: AuraColors.card,
    borderBottomWidth: 1,
    borderBottomColor: AuraColors.border,
  },
  icon: {
    marginRight: 14,
  },
  label: {
    flex: 1,
    fontSize: 16,
    color: AuraColors.textPrimary,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});