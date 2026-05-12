import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SearchBar from '../src/components/ui/SearchBar';
import { AuraColors } from '../src/theme/colors';

const NEARBY_SERVICES = [
  { id: '1', service: 'Masaje relajante', center: 'Zen Spa', distance: '1.8 km', price: '50 €', category: 'Masajes' },
  { id: '2', service: 'Limpieza facial', center: 'Aura Beauty', distance: '2.1 km', price: '45 €', category: 'Facial' },
  { id: '3', service: 'Manicura', center: 'Nails & Co', distance: '0.9 km', price: '30 €', category: 'Manicura' },
  { id: '4', service: 'Peeling químico', center: 'Glow Esthetics', distance: '1.2 km', price: '65 €', category: 'Facial' },
  { id: '5', service: 'Masaje deportivo', center: 'Zen Spa', distance: '1.8 km', price: '60 €', category: 'Masajes' },
];

const CATEGORIES = ['Todos', 'Facial', 'Masajes', 'Manicura'];

export default function GeoServicesScreen() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const router = useRouter();

  const filtered = NEARBY_SERVICES.filter((s) => {
    const matchCategory = selectedCategory === 'Todos' || s.category === selectedCategory;
    const matchSearch = s.service.toLowerCase().includes(search.toLowerCase()) || s.center.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Servicios Cercanos</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Placeholder del mapa */}
      <View style={styles.mapPlaceholder}>
        <Feather name="map-pin" size={32} color={AuraColors.primary} />
        <Text style={styles.mapHint}>Mapa de servicios en tu zona</Text>
      </View>

      <View style={styles.content}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar servicio..."
          showFilter={false}
        />

        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryChip, selectedCategory === item && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text style={[styles.categoryText, selectedCategory === item && styles.categoryTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.serviceCard} onPress={() => router.push(`/center/${item.id}` as any)}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{item.service}</Text>
                <Text style={styles.centerName}>{item.center}</Text>
                <View style={styles.metaRow}>
                  <Feather name="map-pin" size={13} color={AuraColors.textMuted} />
                  <Text style={styles.distance}>{item.distance}</Text>
                </View>
              </View>
              <Text style={styles.price}>{item.price}</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      </View>
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
    paddingBottom: 12,
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
  title: { fontSize: 22, fontWeight: '700', color: AuraColors.textPrimary },
  mapPlaceholder: {
    height: 150,
    backgroundColor: AuraColors.border,
    marginHorizontal: 24,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapHint: { fontSize: 14, color: AuraColors.textMuted, marginTop: 8 },
  content: { paddingHorizontal: 24, paddingTop: 12 },
  categoriesList: {
    marginTop: 16,
    marginBottom: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: AuraColors.card,
    borderWidth: 1,
    borderColor: AuraColors.border,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: AuraColors.primary,
    borderColor: AuraColors.primary,
  },
  categoryText: { fontSize: 13, color: AuraColors.textSecondary },
  categoryTextActive: { color: 'white', fontWeight: '600' },
  list: { paddingBottom: 32 },
  serviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: AuraColors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: AuraColors.border,
  },
  serviceInfo: { flex: 1, gap: 2 },
  serviceName: { fontSize: 15, fontWeight: '600', color: AuraColors.textPrimary },
  centerName: { fontSize: 13, color: AuraColors.textSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  distance: { fontSize: 12, color: AuraColors.textMuted },
  price: { fontSize: 16, fontWeight: '700', color: AuraColors.primary },
});