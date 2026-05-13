import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

const CATEGORIES = ['Todos', 'Barbería', 'Peluquería', 'Spa', 'Masajes', 'Uñas', 'Faciales'];

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Función que busca en Supabase
  const fetchSearchResults = async (query: string, category: string) => {
    setLoading(true);
    try {
      // 1. Iniciamos la consulta base: Solo centros aprobados
      let dbQuery = supabase
        .from('centers')
        .select('*')
        .eq('status', 'approved');

      // 2. Si hay texto escrito, buscamos coincidencias en nombre, categoría o descripción
      if (query.trim().length > 0) {
        dbQuery = dbQuery.or(`name.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`);
      }

      // 3. Si seleccionó una categoría específica (y no es "Todos"), filtramos exactamente por esa
      if (category !== 'Todos') {
        // Asumiendo que guardan la categoría en el campo 'category', o lo buscamos en el texto
        dbQuery = dbQuery.ilike('category', `%${category}%`); 
      }

      const { data, error } = await dbQuery;

      if (!error && data) {
        setResults(data);
      }
    } catch (error) {
      console.error('Error en la búsqueda:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cada vez que cambia el texto o la categoría, disparamos la búsqueda
  useEffect(() => {
    // Usamos un pequeño "debounce" manual para no saturar la base de datos si escribe muy rápido
    const delayDebounceFn = setTimeout(() => {
      fetchSearchResults(searchQuery, selectedCategory);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedCategory]);

  const renderCenterCard = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push(`/center/${item.id}` as any)}
      activeOpacity={0.8}
    >
      {item.license_url ? (
        <Image source={{ uri: item.license_url }} style={styles.cardImage} /> // Idealmente usar una foto de portada, aquí reciclamos la licencia temporalmente para la UI
      ) : (
        <View style={styles.cardImagePlaceholder}>
          <Feather name="image" size={32} color={AuraColors.textMuted} />
        </View>
      )}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.centerName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.ratingBadge}>
            <Feather name="star" size={12} color="#F59E0B" />
            <Text style={styles.ratingText}>{item.rating || 'N/A'}</Text>
          </View>
        </View>
        <Text style={styles.centerCategory}>{item.category || 'Centro de Estética'}</Text>
        <View style={styles.locationRow}>
          <Feather name="map-pin" size={14} color={AuraColors.textSecondary} />
          <Text style={styles.addressText} numberOfLines={1}>{item.address || 'Ubicación no especificada'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explorar</Text>
        
        {/* Barra de Búsqueda */}
        <View style={styles.searchBar}>
          <Feather name="search" size={20} color={AuraColors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, servicio o categoría..."
            placeholderTextColor={AuraColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x-circle" size={20} color={AuraColors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtros de Categorías */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          style={styles.categoriesList}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
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
      </View>

      {/* Resultados de la búsqueda */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={AuraColors.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderCenterCard}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="search" size={64} color={AuraColors.border} />
              <Text style={styles.emptyTitle}>No encontramos resultados</Text>
              <Text style={styles.emptyText}>Intenta buscar con otras palabras o cambiar de categoría.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  header: { paddingTop: 24, backgroundColor: AuraColors.background, borderBottomWidth: 1, borderBottomColor: AuraColors.border, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: AuraColors.textPrimary, paddingHorizontal: 24, marginBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: AuraColors.card, marginHorizontal: 24, paddingHorizontal: 16, height: 50, borderRadius: 16, borderWidth: 1, borderColor: AuraColors.border, marginBottom: 20 },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, color: AuraColors.textPrimary },
  categoriesList: { maxHeight: 40 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: AuraColors.card, borderWidth: 1, borderColor: AuraColors.border },
  categoryChipActive: { backgroundColor: AuraColors.primary, borderColor: AuraColors.primary },
  categoryText: { fontSize: 14, color: AuraColors.textSecondary, fontWeight: '500' },
  categoryTextActive: { color: 'white', fontWeight: '700' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  resultsList: { padding: 24, paddingBottom: 100 },
  card: { backgroundColor: AuraColors.card, borderRadius: 20, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: AuraColors.border, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  cardImage: { width: '100%', height: 160 },
  cardImagePlaceholder: { width: '100%', height: 160, backgroundColor: AuraColors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  cardContent: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  centerName: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary, flex: 1, marginRight: 12 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  ratingText: { fontSize: 13, fontWeight: '700', color: '#B45309' },
  centerCategory: { fontSize: 14, color: AuraColors.primary, fontWeight: '600', marginBottom: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addressText: { fontSize: 14, color: AuraColors.textSecondary, flex: 1 },
  emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: AuraColors.textPrimary, marginTop: 24, textAlign: 'center' },
  emptyText: { fontSize: 15, color: AuraColors.textSecondary, textAlign: 'center', marginTop: 12, lineHeight: 22 },
});