import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../src/lib/supabase';
import { AuraColors } from '../src/theme/colors';

const { width } = Dimensions.get('window');

export default function MapScreen() {
  const router = useRouter();
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCenter, setSelectedCenter] = useState<any | null>(null);
  
  // NUEVO: Estado para controlar el permiso y evitar el cierre de la app
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  
  // Coordenadas por defecto (Centro de La Paz, Bolivia)
  const [region, setRegion] = useState({
    latitude: -16.4958,
    longitude: -68.1335,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    // Función 1: Traer los centros SIEMPRE, sin importar el GPS
    const fetchCenters = async () => {
      try {
        const { data, error } = await supabase
          .from('centers')
          .select('*')
          .eq('status', 'approved')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null);

        if (!error && data) {
          setCenters(data);
        }
      } catch (error) {
        console.error('Error cargando centros en el mapa:', error);
      } finally {
        setLoading(false);
      }
    };

    // Función 2: Intentar obtener el GPS del usuario sin bloquear la app
    const getUserLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          // Si el usuario da permiso, autorizamos al mapa a mostrar el Punto Azul
          setHasLocationPermission(true); 
          let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setRegion(prev => ({
            ...prev,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }));
        }
      } catch (error) {
        console.log('No se pudo obtener la ubicación rápida del usuario, usando La Paz por defecto.');
      }
    };

    fetchCenters();
    getUserLocation();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AuraColors.primary} />
        <Text style={{ marginTop: 12, color: AuraColors.textSecondary, fontWeight: '600' }}>Cargando centros cercanos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* MAPA NATIVO BLINDADO CONTRA CRASHES */}
      <MapView 
        style={styles.map} 
        region={region} 
        showsUserLocation={hasLocationPermission} // CORRECCIÓN: Solo muestra la ubicación si hay permiso
        showsMyLocationButton={hasLocationPermission} // CORRECCIÓN: Evita botones del sistema sin permiso
      >
        {centers.map((center) => {
          const lat = parseFloat(center.latitude);
          const lon = parseFloat(center.longitude);
          if (isNaN(lat) || isNaN(lon)) return null;

          return (
            <Marker
              key={center.id}
              coordinate={{ latitude: lat, longitude: lon }}
              onPress={() => setSelectedCenter(center)}
            >
              <View style={styles.markerContainer}>
                <View style={styles.markerCircle}>
                  <Feather name="briefcase" size={16} color="white" />
                </View>
                <View style={styles.markerTriangle} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* BOTÓN DE RETROCESO FLOTANTE */}
      <SafeAreaView style={styles.headerAbsolute} edges={['top']}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={AuraColors.textPrimary} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* TARJETA FLOTANTE AL TOCAR UN PIN */}
      {selectedCenter && (
        <View style={styles.bottomCardContainer}>
          <TouchableOpacity 
            style={styles.centerCard} 
            activeOpacity={0.9} 
            onPress={() => router.push(`/center/${selectedCenter.id}`)}
          >
            <TouchableOpacity style={styles.closeCardBtn} onPress={() => setSelectedCenter(null)}>
              <Feather name="x" size={20} color={AuraColors.textMuted} />
            </TouchableOpacity>
            
            <Image 
              source={{ uri: selectedCenter.image_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop' }} 
              style={styles.cardImage} 
            />
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>{selectedCenter.name}</Text>
              <Text style={styles.cardAddress} numberOfLines={2}>
                <Feather name="map-pin" size={12} /> {selectedCenter.address}
              </Text>
              <View style={styles.cardActionRow}>
                <View style={styles.ratingBadge}>
                  <Feather name="star" size={12} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.ratingText}>{(selectedCenter.rating || 4.5).toFixed(1)}</Text>
                </View>
                <Text style={styles.bookText}>Agendar Cita <Feather name="arrow-right" size={14} /></Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map: { width: '100%', height: '100%' },
  headerAbsolute: { position: 'absolute', top: 0, left: 24, zIndex: 10 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5, marginTop: 16 },
  markerContainer: { alignItems: 'center', justifyContent: 'center' },
  markerCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: AuraColors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 4 },
  markerTriangle: { width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 10, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: AuraColors.primary, transform: [{ rotate: '180deg' }], marginTop: -2 },
  bottomCardContainer: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' },
  centerCard: { width: width * 0.9, backgroundColor: 'white', borderRadius: 20, flexDirection: 'row', padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  closeCardBtn: { position: 'absolute', top: 8, right: 8, zIndex: 5, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 12, padding: 4 },
  cardImage: { width: 80, height: 80, borderRadius: 12 },
  cardInfo: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 4, paddingRight: 20 },
  cardAddress: { fontSize: 13, color: AuraColors.textSecondary, marginBottom: 8, lineHeight: 18 },
  cardActionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#D97706' },
  bookText: { color: AuraColors.primary, fontWeight: '700', fontSize: 14 },
});