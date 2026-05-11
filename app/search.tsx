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
import CategoryCard from '../src/components/ui/CategoryCard';
import CenterCard from '../src/components/ui/CenterCard';
import SearchBar from '../src/components/ui/SearchBar';
import { AuraColors } from '../src/theme/colors';

const RECENT_SEARCHES = ['Facial limpieza', 'Masaje relajante', 'Peluquería hombre'];
const POPULAR_CATEGORIES = [
  { id: '1', icon: 'sun', label: 'Bronceado' },
  { id: '2', icon: 'smile', label: 'Facial' },
  { id: '3', icon: 'droplet', label: 'Spa' },
];
const SEARCH_RESULTS = [
  {
    id: '1',
    name: 'Aura Beauty Center',
    category: 'Estética Facial',
    rating: 4.8,
    reviews: 124,
    distance: '1.2 km',
  },
  {
    id: '2',
    name: 'Zen Spa & Wellness',
    category: 'Spa y Masajes',
    rating: 4.6,
    reviews: 89,
    distance: '2.5 km',
  },
];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const handleSearch = (text: string) => {
    setQuery(text);
    setIsSearching(text.length > 0);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.searchBarWrapper}>
          <SearchBar
            value={query}
            onChangeText={handleSearch}
            placeholder="Buscar centros o tratamientos..."
            autoFocus
            showFilter
            onFilterPress={() => console.log('Open filters')}
          />
        </View>
      </View>

      {/* Contenido */}
      {!isSearching ? (
        <FlatList
          contentContainerStyle={styles.idleContent}
          ListHeaderComponent={
            <>
              {/* Búsquedas recientes */}
              <Text style={styles.sectionTitle}>Recientes</Text>
              <View style={styles.recentList}>
                {RECENT_SEARCHES.map((item, idx) => (
                  <TouchableOpacity key={idx} style={styles.recentItem} onPress={() => handleSearch(item)}>
                    <Feather name="clock" size={14} color={AuraColors.textMuted} />
                    <Text style={styles.recentText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Categorías populares */}
              <Text style={styles.sectionTitle}>Categorías populares</Text>
              <FlatList
                horizontal
                data={POPULAR_CATEGORIES}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesRow}
                renderItem={({ item }) => (
                  <CategoryCard
                    icon={item.icon}
                    label={item.label}
                    onPress={() => handleSearch(item.label)}
                  />
                )}
              />
            </>
          }
          data={[]}
          renderItem={() => null}
        />
      ) : (
        <FlatList
          data={SEARCH_RESULTS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsList}
          renderItem={({ item }) => (
            <CenterCard
              name={item.name}
              category={item.category}
              rating={item.rating}
              reviews={item.reviews}
              distance={item.distance}
              onPress={() => router.push(`/center/${item.id}` as any)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="search" size={40} color={AuraColors.textMuted} />
              <Text style={styles.emptyText}>No se encontraron resultados</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AuraColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 12,
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
  searchBarWrapper: {
    flex: 1,
  },
  idleContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AuraColors.textPrimary,
    marginBottom: 12,
    marginTop: 24,
  },
  recentList: {
    gap: 8,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  recentText: {
    fontSize: 15,
    color: AuraColors.textSecondary,
  },
  categoriesRow: {
    gap: 10,
  },
  resultsList: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 15,
    color: AuraColors.textMuted,
    marginTop: 12,
  },
});