import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuraColors } from '../src/theme/colors';

const NEARBY_CENTERS = [
  { id: '1', name: 'Aura Beauty Center', distance: '1.2 km', lat: 40.4168, lon: -3.7038 },
  { id: '2', name: 'Zen Spa & Wellness', distance: '2.5 km', lat: 40.4200, lon: -3.7050 },
];

export default function MapScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Cerca de ti</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Placeholder del mapa */}
      <View style={styles.mapPlaceholder}>
        <Feather name="map" size={48} color={AuraColors.textMuted} />
        <Text style={styles.placeholderText}>Mapa de centros cercanos</Text>
        <Text style={styles.hint}>Integra react-native-maps aquí</Text>
      </View>

      {/* Lista debajo del mapa */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Centros cercanos</Text>
        {NEARBY_CENTERS.map((center) => (
          <TouchableOpacity
            key={center.id}
            style={styles.centerRow}
            onPress={() => router.push(`/center/${center.id}` as any)}
          >
            <Feather name="map-pin" size={16} color={AuraColors.primary} />
            <Text style={styles.centerName}>{center.name}</Text>
            <Text style={styles.distance}>{center.distance}</Text>
            <Feather name="chevron-right" size={16} color={AuraColors.textMuted} />
          </TouchableOpacity>
        ))}
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
    paddingBottom: 16,
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
  title: { fontSize: 20, fontWeight: '700', color: AuraColors.textPrimary },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: AuraColors.border,
    margin: 24,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { fontSize: 18, color: AuraColors.textSecondary, marginTop: 12 },
  hint: { fontSize: 13, color: AuraColors.textMuted, marginTop: 4 },
  listContainer: { paddingHorizontal: 24, paddingBottom: 32 },
  listTitle: { fontSize: 16, fontWeight: '600', color: AuraColors.textPrimary, marginBottom: 12 },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AuraColors.border,
    gap: 8,
  },
  centerName: { flex: 1, fontSize: 15, color: AuraColors.textPrimary },
  distance: { fontSize: 14, color: AuraColors.primary },
});