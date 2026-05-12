import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CenterListItem from '../src/components/ui/CenterListItem';
import { AuraColors } from '../src/theme/colors';

const FAVORITES = [
  { id: '1', name: 'Aura Beauty Center', category: 'Estética', rating: 4.8, reviews: 124, distance: '1.2 km' },
  { id: '2', name: 'Zen Spa', category: 'Masajes', rating: 4.6, reviews: 89, distance: '2.5 km' },
];

export default function FavoritesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={FAVORITES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.title}>Favoritos</Text>}
        renderItem={({ item }) => (
          <CenterListItem
            name={item.name}
            category={item.category}
            rating={item.rating}
            reviews={item.reviews}
            distance={item.distance}
            onPress={() => router.push(`/center/${item.id}` as any)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="heart" size={48} color={AuraColors.textMuted} />
            <Text style={styles.emptyText}>No tienes favoritos</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  title: { fontSize: 24, fontWeight: '700', padding: 24, paddingBottom: 16 },
  list: { paddingHorizontal: 24 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: AuraColors.textMuted, marginTop: 12 },
});