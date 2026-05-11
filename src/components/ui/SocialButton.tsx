import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { AuraColors } from '../../theme/colors';

interface SocialButtonProps {
  provider: 'google' | 'facebook';
  onPress: () => void;
  label?: string;
}

export default function SocialButton({ provider, onPress, label }: SocialButtonProps) {
  const bgColor = provider === 'google' ? AuraColors.googleRed : AuraColors.facebookBlue;
  const iconName = provider === 'google' ? 'google' : 'facebook';
  const displayLabel = label || (provider === 'google' ? 'Google' : 'Facebook');

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: bgColor }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <MaterialCommunityIcons name={iconName} size={20} color="white" />
      <Text style={styles.text}>{displayLabel}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});