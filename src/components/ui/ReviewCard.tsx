import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AuraColors } from '../../theme/colors';
import Rating from './Rating';

interface ReviewCardProps {
  userName: string;
  rating: number;
  date: string;
  comment: string;
}

export default function ReviewCard({ userName, rating, date, comment }: ReviewCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Feather name="user" size={18} color={AuraColors.textMuted} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        <Rating value={rating} size={14} />
      </View>
      <Text style={styles.comment} numberOfLines={3}>{comment}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AuraColors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: AuraColors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AuraColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: AuraColors.textPrimary,
  },
  date: {
    fontSize: 12,
    color: AuraColors.textMuted,
  },
  comment: {
    fontSize: 14,
    color: AuraColors.textSecondary,
    lineHeight: 20,
  },
});