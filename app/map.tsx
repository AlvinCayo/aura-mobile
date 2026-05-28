import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Dimensions, Image,
  Linking,
  Platform,
  StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../src/lib/supabase';
import { AuraColors } from '../src/theme/colors';

const { width } = Dimensions.get('window');

// Función de navegación nativa universal
const openNavigation = (lat: number, lng: number, label: string) => {
  const url = Platform.select({
    ios: `maps://app?daddr=${lat},${lng}`,
    android: `google.navigation:q=${lat},${lng}`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  });
  Linking.openURL(url!).catch(() => 
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`)
  );
};

export default function MapScreen() {
  const router = useRouter();
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCenter, setSelectedCenter] = useState<any | null>(null);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);

  const [region, setRegion] = useState({
    latitude: -16.4958,
    longitude: -68.1335,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    fetchCenters();
    initializeUserLocation();
  }, []);

  const fetchCenters = async () => {
    try {
      const { data, error } = await supabase
        .from('centers')
        .select('*')
        .eq('status', 'approved')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (!error && data) setCenters(data);
    } catch (error) {
      console.error('Error cargando centros:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeUserLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
        setUserLocation(coords);
        setRegion({ ...coords, latitudeDelta: 0.03, longitudeDelta: 0.03 });
      }
    } catch (error) {
      console.log('Permiso denegado o GPS apagado');
    }
  };

  const handleLocateMe = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Aviso', 'Permiso de ubicación denegado.');
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      setUserLocation(coords);
      setRegion({ ...coords, latitudeDelta: 0.015, longitudeDelta: 0.015 });
    } catch (error) {
      Alert.alert('Error', 'Asegúrate de que tu GPS esté encendido.');
    }
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={AuraColors.primary} /></View>;

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region} showsUserLocation={false} showsMyLocationButton={false}>
        {userLocation && (
          <Marker coordinate={userLocation} zIndex={999}>
            <View style={styles.userDotContainer}>
              <View style={styles.userDotHalo} /><View style={styles.userDotCore} />
            </View>
          </Marker>
        )}
        {centers.map((center) => {
          const lat = parseFloat(center.latitude);
          const lon = parseFloat(center.longitude);
          if (isNaN(lat) || isNaN(lon)) return null;
          return (
            <Marker key={center.id} coordinate={{ latitude: lat, longitude: lon }} onPress={() => setSelectedCenter(center)}>
              <View style={styles.markerContainer}>
                <View style={styles.markerCircle}><Feather name="briefcase" size={16} color="white" /></View>
                <View style={styles.markerTriangle} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      <SafeAreaView style={styles.headerAbsolute} edges={['top']}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Feather name="arrow-left" size={24} color={AuraColors.textPrimary} /></TouchableOpacity>
      </SafeAreaView>

      <TouchableOpacity style={styles.locateButton} onPress={handleLocateMe}><Feather name="navigation" size={24} color={AuraColors.primary} /></TouchableOpacity>

      {selectedCenter && (
        <View style={styles.bottomCardContainer}>
          <TouchableOpacity style={styles.centerCard} activeOpacity={0.9} onPress={() => router.push(`/center/${selectedCenter.id}` as any)}>
            <TouchableOpacity style={styles.closeCardBtn} onPress={() => setSelectedCenter(null)}><Feather name="x" size={20} color={AuraColors.textMuted} /></TouchableOpacity>
            <Image source={{ uri: selectedCenter.image_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop' }} style={styles.cardImage} />
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>{selectedCenter.name}</Text>
              <Text style={styles.cardAddress} numberOfLines={2}><Feather name="map-pin" size={12} /> {selectedCenter.address}</Text>
              <View style={styles.cardActionRow}>
                <View style={styles.ratingBadge}><Feather name="star" size={12} color="#F59E0B" fill="#F59E0B" /><Text style={styles.ratingText}>{(selectedCenter.rating || 4.5).toFixed(1)}</Text></View>
                
                {/* BOTÓN "CÓMO LLEGAR" */}
                <TouchableOpacity style={styles.routeBtn} onPress={() => openNavigation(parseFloat(selectedCenter.latitude), parseFloat(selectedCenter.longitude), selectedCenter.name)}>
                  <Text style={styles.routeBtnText}>Cómo llegar</Text>
                </TouchableOpacity>
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
  locateButton: { position: 'absolute', top: 60, right: 24, zIndex: 10, width: 50, height: 50, borderRadius: 25, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  userDotContainer: { justifyContent: 'center', alignItems: 'center', width: 40, height: 40 },
  userDotHalo: { position: 'absolute', width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(59, 130, 246, 0.3)', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.5)' },
  userDotCore: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#2563EB', borderWidth: 2, borderColor: 'white' },
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
  routeBtn: { backgroundColor: AuraColors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  routeBtnText: { color: 'white', fontSize: 12, fontWeight: '700' }
});