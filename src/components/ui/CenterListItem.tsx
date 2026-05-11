import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuraColors } from '../../theme/colors';
import Rating from './Rating';

interface CenterListItemProps {
  name: string;
  category: string;
  rating: number;
  reviews: number;
  distance?: string;
  image?: string;
  onPress: () => void;
}

export default function CenterListItem({ name, category, rating, reviews, distance, image, onPress }: CenterListItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        {image ? <Image source={{ uri: image }} style={styles.image} /> : (
          <View style={styles.placeholder}>
            <Feather name="image" size={24} color={AuraColors.textMuted} />
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.category}>{category}</Text>
        <View style={styles.ratingRow}>
          <Rating value={rating} size={12} />
          <Text style={styles.reviews}>({reviews})</Text>
          {distance && <Text style={styles.distance}>{distance}</Text>}
        </View>
      </View>
      <Feather name="chevron-right" size={18} color={AuraColors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: AuraColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AuraColors.border,
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 12,
  },
  image: { width: '100%', height: '100%' },
  placeholder: {
    flex: 1,
    backgroundColor: AuraColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '600', color: AuraColors.textPrimary },
  category: { fontSize: 13, color: AuraColors.textSecondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reviews: { fontSize: 12, color: AuraColors.textMuted },
  distance: { fontSize: 12, color: AuraColors.primary, marginLeft: 4 },
});