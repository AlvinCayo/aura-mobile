import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ScrollView, StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CategoryCard from '../../src/components/ui/CategoryCard';
import CenterCard from '../../src/components/ui/CenterCard';
import SearchBar from '../../src/components/ui/SearchBar';
import { fetchCategories, fetchCenters } from '../../src/lib/data';
import { AuraColors } from '../../src/theme/colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [centers, setCenters] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [centersRes, categoriesRes] = await Promise.all([
      fetchCenters(),
      fetchCategories(),
    ]);
    if (centersRes.data) setCenters(centersRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);
    setLoading(false);
  };

  // Filtrar centros si hay categoría seleccionada
  const filteredCenters = selectedCategory
    ? centers.filter((c) => c.category === selectedCategory)
    : centers;

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AuraColors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>¡Hola! 👋</Text>
            <Text style={styles.subtitle}>Encuentra tu centro ideal</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <View style={styles.avatarPlaceholder}>
              <Feather name="user" size={24} color={AuraColors.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        {/* SearchBar */}
        <View style={styles.searchContainer}>
          <SearchBar
            placeholder="Buscar centros o tratamientos..."
            onFilterPress={() => router.push('/search' as any)}
            onFocus={() => router.push('/search' as any)}
          />
        </View>

        {/* Categorías */}
        {categories.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categorías</Text>
            </View>
            <FlatList
              horizontal
              data={categories}
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesList}
              renderItem={({ item }) => (
                <CategoryCard
                  icon="tag"
                  label={item}
                  selected={selectedCategory === item}
                  onPress={() => setSelectedCategory(selectedCategory === item ? null : item)}
                />
              )}
            />
          </>
        )}

        {/* Centros destacados */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Centros disponibles</Text>
        </View>
        {filteredCenters.length > 0 ? (
          filteredCenters.map((center) => (
            <CenterCard
              key={center.id}
              name={center.name}
              category={center.category}
              rating={center.rating || 0}
              reviews={center.reviews_count || 0}
              distance={center.address}
              onPress={() => router.push(`/center/${center.id}` as any)}
              style={{ marginBottom: 16 }}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>No hay centros disponibles en esta categoría.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: AuraColors.background },
  container: { flex: 1, backgroundColor: AuraColors.background },
  scrollContent: { paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 20 },
  greeting: { fontSize: 24, fontWeight: '700', color: AuraColors.textPrimary },
  subtitle: { fontSize: 14, color: AuraColors.textSecondary, marginTop: 4 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: AuraColors.border, justifyContent: 'center', alignItems: 'center' },
  searchContainer: { paddingHorizontal: 24, marginBottom: 24 },
  sectionHeader: { paddingHorizontal: 24, marginBottom: 16, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: AuraColors.textPrimary },
  categoriesList: { paddingLeft: 24, gap: 10, marginBottom: 16 },
  emptyText: { textAlign: 'center', color: AuraColors.textMuted, marginTop: 20 },
});