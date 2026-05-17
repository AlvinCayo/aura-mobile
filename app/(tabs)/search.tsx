import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
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

const CATEGORIES = [
  { id: 'all', name: 'Todos', icon: 'grid' },
  { id: 'barberia', name: 'Barbería', icon: 'scissors' },
  { id: 'peluqueria', name: 'Peluquería', icon: 'wind' },
  { id: 'unas', name: 'Uñas', icon: 'edit-2' },
  { id: 'spa', name: 'Spa & Masajes', icon: 'smile' },
  { id: 'cejas', name: 'Cejas y Pestañas', icon: 'eye' },
];

// Fórmula matemática para calcular distancia en Kilómetros entre dos coordenadas GPS
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1); // Retorna string con 1 decimal
};

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    (async () => {
      // Pedimos permiso de GPS de forma silenciosa
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation(location);
      }
      fetchCenters();
    })();
  }, []);

  const fetchCenters = async () => {
    setLoading(true);
    try {
      let query = supabase.from('centers').select('*').eq('status', 'approved');

      if (searchQuery.trim() !== '') {
        query = query.ilike('name', `%${searchQuery}%`);
      }
      if (selectedCategory !== 'all') {
        const categoryKeyword = CATEGORIES.find(c => c.id === selectedCategory)?.name || '';
        query = query.ilike('description', `%${categoryKeyword}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setCenters(data || []);
    } catch (error) {
      console.error('Error en búsqueda:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => { fetchCenters(); }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedCategory]);

  const renderCategoryItem = ({ item }: { item: typeof CATEGORIES[0] }) => {
    const isSelected = selectedCategory === item.id;
    return (
      <TouchableOpacity
        style={[styles.categoryPill, isSelected && styles.categoryPillSelected]}
        onPress={() => setSelectedCategory(item.id)}
      >
        <Feather name={item.icon as any} size={16} color={isSelected ? 'white' : AuraColors.textSecondary} />
        <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  const renderCenterItem = ({ item }: { item: any }) => {
    // Si tenemos el GPS del usuario y el centro tiene coordenadas, calculamos la distancia
    let distanceText = '';
    if (userLocation && item.latitude && item.longitude) {
      const distKm = calculateDistance(userLocation.coords.latitude, userLocation.coords.longitude, parseFloat(item.latitude), parseFloat(item.longitude));
      distanceText = `A ${distKm} km de ti`;
    }

    return (
      <TouchableOpacity style={styles.centerCard} onPress={() => router.push(`/center/${item.id}`)} activeOpacity={0.9}>
        <Image source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop' }} style={styles.centerImage} />
        <View style={styles.centerInfo}>
          <View style={styles.centerHeaderRow}>
            <Text style={styles.centerName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.ratingBadge}>
              <Feather name="star" size={12} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingText}>{(item.rating || 4.5).toFixed(1)}</Text>
            </View>
          </View>
          <Text style={styles.centerAddress} numberOfLines={1}>
            <Feather name="map-pin" size={12} /> {item.address || 'Ubicación no especificada'}
          </Text>
          
          {/* Mostramos la distancia si existe */}
          {distanceText ? (
            <Text style={styles.distanceHighlight}><Feather name="navigation" size={12}/> {distanceText}</Text>
          ) : null}

          <Text style={styles.centerDescription} numberOfLines={2}>{item.description || 'Sin descripción disponible.'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explorar en AURA</Text>
        <Text style={styles.headerSubtitle}>Encuentra tu próximo servicio ideal</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Feather name="search" size={20} color={AuraColors.textMuted} />
          <TextInput style={styles.searchInput} placeholder="Buscar por nombre..." value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor={AuraColors.textMuted} />
          {searchQuery !== '' && (<TouchableOpacity onPress={() => setSearchQuery('')}><Feather name="x-circle" size={18} color={AuraColors.textMuted} /></TouchableOpacity>)}
        </View>
      </View>

      <View>
        <FlatList horizontal showsHorizontalScrollIndicator={false} data={CATEGORIES} keyExtractor={item => item.id} renderItem={renderCategoryItem} contentContainerStyle={styles.categoriesList} />
      </View>

      {loading ? (
        <View style={styles.centerLoading}><ActivityIndicator size="large" color={AuraColors.primary} /></View>
      ) : (
        <FlatList data={centers} keyExtractor={item => item.id} renderItem={renderCenterItem} contentContainerStyle={styles.resultsList} showsVerticalScrollIndicator={false} ListEmptyComponent={<View style={styles.emptyBox}><Feather name="search" size={48} color={AuraColors.border} /><Text style={styles.emptyTitle}>Sin resultados</Text><Text style={styles.emptySub}>Prueba con otra palabra o categoría.</Text></View>} />
      )}

      {/* BOTÓN FLOTANTE PARA VER MAPA */}
      <TouchableOpacity style={styles.fabMap} onPress={() => router.push('/map')}>
        <Feather name="map" size={20} color="white" />
        <Text style={styles.fabText}>Ver Mapa</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  header: { padding: 24, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: AuraColors.textPrimary },
  headerSubtitle: { fontSize: 16, color: AuraColors.textSecondary, marginTop: 4 },
  searchSection: { paddingHorizontal: 24, marginBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: AuraColors.card, paddingHorizontal: 16, height: 50, borderRadius: 16, borderWidth: 1, borderColor: AuraColors.border },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, color: AuraColors.textPrimary, height: '100%' },
  categoriesList: { paddingHorizontal: 24, gap: 10, paddingBottom: 16 },
  categoryPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: AuraColors.card, borderRadius: 20, borderWidth: 1, borderColor: AuraColors.border },
  categoryPillSelected: { backgroundColor: AuraColors.primary, borderColor: AuraColors.primary },
  categoryText: { fontSize: 14, fontWeight: '600', color: AuraColors.textSecondary },
  categoryTextSelected: { color: 'white' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  resultsList: { paddingHorizontal: 24, paddingBottom: 80 },
  centerCard: { backgroundColor: AuraColors.card, borderRadius: 16, borderWidth: 1, borderColor: AuraColors.border, overflow: 'hidden', marginBottom: 16 },
  centerImage: { width: '100%', height: 160 },
  centerInfo: { padding: 16 },
  centerHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  centerName: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary, flex: 1, marginRight: 10 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#D97706' },
  centerAddress: { fontSize: 13, color: AuraColors.textSecondary, marginBottom: 4 },
  distanceHighlight: { fontSize: 13, color: AuraColors.primary, fontWeight: '700', marginBottom: 8 },
  centerDescription: { fontSize: 13, color: AuraColors.textMuted, lineHeight: 18 },
  emptyBox: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary, marginTop: 16 },
  emptySub: { fontSize: 14, color: AuraColors.textSecondary, marginTop: 8 },
  fabMap: { position: 'absolute', bottom: 24, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: AuraColors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 30, shadowColor: AuraColors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  fabText: { color: 'white', fontWeight: '700', fontSize: 16 },
});