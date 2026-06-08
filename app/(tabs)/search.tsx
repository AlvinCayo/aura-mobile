import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SearchBar from '../../src/components/ui/SearchBar'; // Importamos tu componente
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

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1)); 
};

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  
  // Estado para el modal de filtros
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);

  // Estados para Filtros Avanzados
  const [minRating, setMinRating] = useState(0);
  const [maxDistance, setMaxDistance] = useState(50);
  const [sortBy, setSortBy] = useState<'distance' | 'rating'>('distance');

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setUserLocation(location);
        }
      } catch (error) {
        console.log('No se pudo obtener GPS rápido');
      }
      fetchCenters();
    })();
  }, []);

  const fetchCenters = async () => {
    setLoading(true);
    try {
      // 1. Buscamos TODOS los centros aprobados (Base)
      let centerQuery = supabase.from('centers').select('*').eq('status', 'approved');

      // 2. Filtro por categoría (buscamos en la columna correcta "category")
      if (selectedCategory !== 'all') {
        const cat = CATEGORIES.find(c => c.id === selectedCategory);
        if (cat) {
          // Buscamos flexibilidad por si lo guardaste como id ("barberia") o nombre ("Barbería")
          centerQuery = centerQuery.or(`category.ilike.%${cat.name}%,category.ilike.%${cat.id}%`);
        }
      }

      const { data: initialCenters, error: centerError } = await centerQuery;
      if (centerError) throw centerError;

      let finalCenters = initialCenters || [];

      // 3. Búsqueda Mixta: Por texto en Centros Y Servicios
      if (searchQuery.trim() !== '') {
        const lowerQuery = searchQuery.toLowerCase();
        
        // Coincidencias en nombre o dirección del centro
        const matchingCenters = finalCenters.filter(c => 
          c.name.toLowerCase().includes(lowerQuery) || 
          (c.address && c.address.toLowerCase().includes(lowerQuery))
        );

        // Búsqueda en la tabla de servicios
        const { data: matchedServices, error: serviceError } = await supabase
          .from('services')
          .select('center_id')
          .ilike('name', `%${searchQuery}%`);

        if (serviceError) throw serviceError;

        const serviceCenterIds = (matchedServices || []).map(s => s.center_id);

        // Extraer los centros que poseen ese servicio (y que ya pasaron el filtro de categoría)
        const centersFromServMatch = finalCenters.filter(c => serviceCenterIds.includes(c.id));

        // Combinar resultados evitando duplicados usando un Map
        const combinedSet = new Map();

        // Agregamos los que coincidieron por nombre (sin etiqueta de servicio)
        matchingCenters.forEach(c => combinedSet.set(c.id, { ...c, matchedService: false }));

        // Agregamos los que coincidieron por servicio
        centersFromServMatch.forEach(c => {
          if (!combinedSet.has(c.id)) {
            combinedSet.set(c.id, { ...c, matchedService: true }); // Es un centro nuevo por servicio
          } else {
            combinedSet.set(c.id, { ...combinedSet.get(c.id), matchedService: true }); // Ya estaba, pero le añadimos la etiqueta
          }
        });

        finalCenters = Array.from(combinedSet.values());
      } else {
          // Si no hay búsqueda de texto, aseguramos que la bandera sea false
          finalCenters = finalCenters.map(c => ({ ...c, matchedService: false }));
      }

      // 4. ORDENAMIENTO INTELIGENTE POR DISTANCIA
      if (userLocation && finalCenters.length > 0) {
        finalCenters = finalCenters.map(center => {
          if (center.latitude && center.longitude) {
            const dist = calculateDistance(
              userLocation.coords.latitude, 
              userLocation.coords.longitude, 
              parseFloat(center.latitude), 
              parseFloat(center.longitude)
            );
            return { ...center, distanceKm: dist };
          }
          return { ...center, distanceKm: 9999 };
        });
      } else {
        finalCenters = finalCenters.map(center => ({ ...center, distanceKm: 9999 }));
      }

      // APLICAR FILTROS AVANZADOS
      finalCenters = finalCenters.filter(c => (c.rating || 0) >= minRating && c.distanceKm <= maxDistance);
      
      // APLICAR ORDENAMIENTO
      finalCenters.sort((a, b) => sortBy === 'rating' ? (b.rating || 0) - (a.rating || 0) : a.distanceKm - b.distanceKm);

      setCenters(finalCenters);
    } catch (error) {
      console.error('Error en búsqueda:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCenters();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedCategory, userLocation]);

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

  const renderCenterItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.centerCard} onPress={() => router.push(`/center/${item.id}`)} activeOpacity={0.9}>
      <Image source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop' }} style={styles.centerImage} />
      
      {/* Indicador de coincidencia de servicio flotante sobre la imagen */}
      {item.matchedService && (
        <View style={styles.serviceBadge}>
          <Feather name="check-circle" size={12} color="white" />
          <Text style={styles.serviceBadgeText}>Ofrece el servicio que buscas</Text>
        </View>
      )}

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
        
        {item.distanceKm !== 9999 && (
          <Text style={styles.distanceHighlight}>
            <Feather name="navigation" size={12}/> A {item.distanceKm} km de tu ubicación
          </Text>
        )}

        <Text style={styles.centerDescription} numberOfLines={2}>{item.description || 'Sin descripción disponible.'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explorar en AURA</Text>
        <Text style={styles.headerSubtitle}>Encuentra el servicio más cercano a ti</Text>
      </View>

      {/* Integración del SearchBar */}
      <View style={styles.searchSection}>
        <SearchBar 
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFilterPress={() => setFilterModalVisible(true)}
          showFilter={true}
        />
      </View>

      <View>
        <FlatList horizontal showsHorizontalScrollIndicator={false} data={CATEGORIES} keyExtractor={item => item.id} renderItem={renderCategoryItem} contentContainerStyle={styles.categoriesList} />
      </View>

      {loading ? (
        <View style={styles.centerLoading}><ActivityIndicator size="large" color={AuraColors.primary} /></View>
      ) : (
        <FlatList 
          data={centers} 
          keyExtractor={item => item.id} 
          renderItem={renderCenterItem} 
          contentContainerStyle={styles.resultsList} 
          showsVerticalScrollIndicator={false} 
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Feather name="search" size={48} color={AuraColors.border} />
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.emptySub}>No encontramos centros o servicios con ese criterio.</Text>
            </View>
          } 
        />
      )}

      <TouchableOpacity style={styles.fabMap} onPress={() => router.push('/map')}>
        <Feather name="map" size={20} color="white" />
        <Text style={styles.fabText}>Mapa de Centros</Text>
      </TouchableOpacity>

      {/* Modal de Filtros Avanzados */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isFilterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros Avanzados</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Feather name="x" size={24} color={AuraColors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.label}>Distancia máxima: {maxDistance} km</Text>
            <View style={styles.row}>
              {[5, 10, 20, 50].map((dist) => (
                <TouchableOpacity key={dist} style={[styles.pill, maxDistance === dist && styles.pillActive]} onPress={() => setMaxDistance(dist)}>
                  <Text style={maxDistance === dist ? styles.pillTextActive : styles.pillText}>{dist} km</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Calificación mínima</Text>
            <View style={styles.row}>
              {[0, 3, 4, 4.5].map((rate) => (
                <TouchableOpacity key={rate} style={[styles.pill, minRating === rate && styles.pillActive]} onPress={() => setMinRating(rate)}>
                  <Text style={minRating === rate ? styles.pillTextActive : styles.pillText}>{rate}+ estrellas</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Ordenar por</Text>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.pill, sortBy === 'distance' && styles.pillActive]} onPress={() => setSortBy('distance')}>
                <Text style={sortBy === 'distance' ? styles.pillTextActive : styles.pillText}>Distancia</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pill, sortBy === 'rating' && styles.pillActive]} onPress={() => setSortBy('rating')}>
                <Text style={sortBy === 'rating' ? styles.pillTextActive : styles.pillText}>Calificación</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={() => { fetchCenters(); setFilterModalVisible(false); }}>
              <Text style={styles.modalButtonText}>Aplicar Filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  header: { padding: 24, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: AuraColors.textPrimary },
  headerSubtitle: { fontSize: 14, color: AuraColors.textSecondary, marginTop: 4 },
  searchSection: { paddingHorizontal: 24, marginBottom: 16 },
  categoriesList: { paddingHorizontal: 24, gap: 10, paddingBottom: 16 },
  categoryPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: AuraColors.card, borderRadius: 20, borderWidth: 1, borderColor: AuraColors.border },
  categoryPillSelected: { backgroundColor: AuraColors.primary, borderColor: AuraColors.primary },
  categoryText: { fontSize: 14, fontWeight: '600', color: AuraColors.textSecondary },
  categoryTextSelected: { color: 'white' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  resultsList: { paddingHorizontal: 24, paddingBottom: 80 },
  centerCard: { backgroundColor: AuraColors.card, borderRadius: 16, borderWidth: 1, borderColor: AuraColors.border, overflow: 'hidden', marginBottom: 16 },
  centerImage: { width: '100%', height: 160 },
  serviceBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: AuraColors.primary, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, zIndex: 10 },
  serviceBadgeText: { color: 'white', fontSize: 12, fontWeight: '700' },
  centerInfo: { padding: 16 },
  centerHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  centerName: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary, flex: 1, marginRight: 10 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#D97706' },
  centerAddress: { fontSize: 13, color: AuraColors.textSecondary, marginBottom: 4 },
  distanceHighlight: { fontSize: 13, color: AuraColors.primary, fontWeight: '700', marginBottom: 6 },
  centerDescription: { fontSize: 13, color: AuraColors.textMuted, lineHeight: 18 },
  emptyBox: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary, marginTop: 16 },
  emptySub: { fontSize: 14, color: AuraColors.textSecondary, marginTop: 8, textAlign: 'center', paddingHorizontal: 20 },
  fabMap: { position: 'absolute', bottom: 24, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: AuraColors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 30, shadowColor: AuraColors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  fabText: { color: 'white', fontWeight: '700', fontSize: 16 },
  
  // ESTILOS MODAL Y FILTROS
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: AuraColors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 350 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: AuraColors.textPrimary },
  label: { fontSize: 14, fontWeight: '700', color: AuraColors.textPrimary, marginTop: 16, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: AuraColors.card, borderWidth: 1, borderColor: AuraColors.border },
  pillActive: { backgroundColor: AuraColors.primary, borderColor: AuraColors.primary },
  pillText: { color: AuraColors.textSecondary, fontSize: 12 },
  pillTextActive: { color: 'white', fontSize: 12, fontWeight: '700' },
  modalButton: { backgroundColor: AuraColors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  modalButtonText: { color: 'white', fontSize: 16, fontWeight: '700' }
});