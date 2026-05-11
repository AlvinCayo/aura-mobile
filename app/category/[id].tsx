import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CenterListItem from '../../src/components/ui/CenterListItem';
import { AuraColors } from '../../src/theme/colors';

const CENTERS_BY_CATEGORY: Record<string, Array<{
  id: string;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  distance: string;
  image?: string;
}>> = {
  '1': [
    { id: 'c1', name: 'Aura Beauty Center', category: 'Estética Facial', rating: 4.8, reviews: 124, distance: '1.2 km' },
    { id: 'c2', name: 'Zen Spa & Wellness', category: 'Spa y Masajes', rating: 4.6, reviews: 89, distance: '2.5 km' },
  ],
  '2': [
    { id: 'c3', name: 'Glow Esthetics', category: 'Cuidado de la Piel', rating: 4.9, reviews: 210, distance: '0.8 km' },
  ],
  '3': [
    { id: 'c4', name: 'Sun Studio', category: 'Bronceado', rating: 4.3, reviews: 56, distance: '3.1 km' },
  ],
  // ... otras categorías
};

export default function CategoryCentersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const centers = CENTERS_BY_CATEGORY[id] || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Centros de la categoría</Text>
        <View style={{ width: 40 }} />
      </View>
      <FlatList
        data={centers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <CenterListItem
            name={item.name}
            category={item.category}
            rating={item.rating}
            reviews={item.reviews}
            distance={item.distance}
            image={item.image}
            onPress={() => router.push(`/center/${item.id}` as any)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="map-pin" size={48} color={AuraColors.textMuted} />
            <Text style={styles.emptyText}>No se encontraron centros</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AuraColors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AuraColors.border,
  },
  title: { fontSize: 20, fontWeight: '700', color: AuraColors.textPrimary },
  list: { paddingHorizontal: 24, paddingBottom: 32 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: AuraColors.textMuted, marginTop: 12 },
});