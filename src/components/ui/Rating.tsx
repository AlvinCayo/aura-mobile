import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AuraColors } from '../../theme/colors';

interface RatingProps {
  value: number; // 0-5
  size?: number;
}

export default function Rating({ value, size = 16 }: RatingProps) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Feather
        key={i}
        name={i <= value ? 'star' : 'star'}
        size={size}
        color={i <= value ? AuraColors.warning : AuraColors.border}
        style={i <= value ? {} : { opacity: 0.5 }}
      />
    );
  }
  return <View style={styles.container}>{stars}</View>;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});