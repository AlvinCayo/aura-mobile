import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { AuraColors } from '../../theme/colors';
import Rating from './Rating';

interface CenterCardProps {
  name: string;
  category: string;
  rating: number;
  reviews: number;
  distance?: string;
  image?: string;
  onPress: () => void;
  style?: ViewStyle;
}

export default function CenterCard({ name, category, rating, reviews, distance, image, onPress, style }: CenterCardProps) {
  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Feather name="image" size={28} color={AuraColors.textMuted} />
          </View>
        )}
        {distance && (
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>{distance}</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.category}>{category}</Text>
        <View style={styles.ratingRow}>
          <Rating value={rating} size={14} />
          <Text style={styles.reviews}>({reviews})</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AuraColors.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: AuraColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    height: 140,
    backgroundColor: AuraColors.background,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AuraColors.border,
  },
  distanceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  distanceText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  info: {
    padding: 14,
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: AuraColors.textPrimary,
  },
  category: {
    fontSize: 13,
    color: AuraColors.textSecondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviews: {
    fontSize: 12,
    color: AuraColors.textMuted,
  },
});