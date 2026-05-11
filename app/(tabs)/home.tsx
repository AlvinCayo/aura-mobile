import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CategoryCard from '../../src/components/ui/CategoryCard';
import CenterCard from '../../src/components/ui/CenterCard';
import SearchBar from '../../src/components/ui/SearchBar';
import { AuraColors } from '../../src/theme/colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;

const CATEGORIES = [
  { id: '1', icon: 'scissors', label: 'Peluquería' },
  { id: '2', icon: 'droplet', label: 'Spa' },
  { id: '3', icon: 'sun', label: 'Bronceado' },
  { id: '4', icon: 'heart', label: 'Bienestar' },
  { id: '5', icon: 'smile', label: 'Facial' },
  { id: '6', icon: 'activity', label: 'Fitness' },
];

const FEATURED_CENTERS = [
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
  {
    id: '3',
    name: 'Glow Esthetics',
    category: 'Cuidado de la Piel',
    rating: 4.9,
    reviews: 210,
    distance: '0.8 km',
  },
];

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>¡Hola, Alvin! 👋</Text>
            <Text style={styles.subtitle}>Encuentra tu centro ideal</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile' as any)}>
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
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categorías</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Ver todas</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => (
            <CategoryCard
              icon={item.icon}
              label={item.label}
              selected={selectedCategory === item.id}
              onPress={() => setSelectedCategory(selectedCategory === item.id ? null : item.id)}
            />
          )}
        />

        {/* Centros Destacados */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Destacados</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Ver más</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          data={FEATURED_CENTERS}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.centersList}
          snapToInterval={CARD_WIDTH + 16}
          decelerationRate="fast"
          renderItem={({ item }) => (
            <CenterCard
              name={item.name}
              category={item.category}
              rating={item.rating}
              reviews={item.reviews}
              distance={item.distance}
              onPress={() => router.push(`/center/${item.id}` as any)}
              style={{ width: CARD_WIDTH }}
            />
          )}
        />

        {/* Cerca de ti */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cerca de ti</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Ver más</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.nearbyList}>
          {FEATURED_CENTERS.map((center) => (
            <CenterCard
              key={center.id}
              name={center.name}
              category={center.category}
              rating={center.rating}
              reviews={center.reviews}
              distance={center.distance}
              onPress={() => router.push(`/center/${center.id}` as any)}
              style={{ marginBottom: 16 }}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AuraColors.background,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: AuraColors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: AuraColors.textSecondary,
    marginTop: 4,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AuraColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AuraColors.textPrimary,
  },
  seeAll: {
    fontSize: 14,
    color: AuraColors.primary,
    fontWeight: '500',
  },
  categoriesList: {
    paddingLeft: 24,
    gap: 10,
  },
  centersList: {
    paddingLeft: 24,
    gap: 16,
  },
  nearbyList: {
    paddingHorizontal: 24,
  },
});