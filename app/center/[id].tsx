import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/Button';
import { fetchCenterById, fetchServicesByCenter } from '../../src/lib/data';
import { AuraColors } from '../../src/theme/colors';

export default function CenterProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [center, setCenter] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadCenterData();
    }
  }, [id]);

  const loadCenterData = async () => {
    setLoading(true);
    // Usamos las funciones de tu archivo data.ts
    const [centerRes, servicesRes] = await Promise.all([
      fetchCenterById(id as string),
      fetchServicesByCenter(id as string),
    ]);

    if (centerRes.data) setCenter(centerRes.data);
    if (servicesRes.data) setServices(servicesRes.data);
    setLoading(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AuraColors.primary} />
      </SafeAreaView>
    );
  }

  if (!center) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={{ color: AuraColors.textSecondary }}>Centro no encontrado.</Text>
        <Button title="Volver" onPress={() => router.back()} style={{ marginTop: 20 }} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Imagen o Placeholder del Centro */}
        <View style={styles.imageContainer}>
          {center.license_url ? ( // Idealmente aquí va una foto de portada, usamos la licencia como ejemplo si no tienes
             <View style={[styles.coverImage, { backgroundColor: AuraColors.primaryLight }]} />
          ) : (
            <View style={[styles.coverImage, { backgroundColor: AuraColors.border }]} />
          )}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color={AuraColors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.centerName}>{center.name}</Text>
            <View style={styles.ratingBadge}>
              <Feather name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingText}>{center.rating || 'Nuevo'}</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Feather name="map-pin" size={16} color={AuraColors.textSecondary} />
            <Text style={styles.addressText}>{center.address}</Text>
          </View>

          <Text style={styles.description}>{center.description || 'Sin descripción disponible.'}</Text>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Servicios</Text>
          </View>

          {/* Lista de Servicios Reales */}
          {services.length > 0 ? (
            services.map((service) => (
              <View key={service.id} style={styles.serviceCard}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceDuration}>{service.duration_min} min</Text>
                </View>
                <View style={styles.servicePriceContainer}>
                  <Text style={styles.servicePrice}>Bs {service.price}</Text>
                  {/* El botón de reservar pasará el servicio y el centro a la pantalla de reservas */}
                  <TouchableOpacity 
                    style={styles.bookSmallButton}
                    onPress={() => router.push({
                      pathname: '/booking/[centerId]',
                      params: { centerId: center.id, serviceId: service.id, serviceName: service.name }
                    })}
                  >
                    <Text style={styles.bookSmallButtonText}>Reservar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Este centro aún no ha agregado servicios.</Text>
          )}
        </View>
      </ScrollView>

      {/* Footer Fijo para reservar directamente sin elegir servicio específico (opcional) */}
      <View style={styles.footer}>
        <Button
          title="Ver Horarios Disponibles"
          onPress={() => router.push(`/booking/${center.id}` as any)}
          icon={<Feather name="calendar" size={18} color="white" />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: AuraColors.background },
  container: { flex: 1, backgroundColor: AuraColors.background },
  scrollContent: { paddingBottom: 100 },
  imageContainer: { height: 250, position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  backButton: { position: 'absolute', top: 50, left: 24, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.8)', justifyContent: 'center', alignItems: 'center' },
  infoContainer: { padding: 24, backgroundColor: AuraColors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  centerName: { fontSize: 24, fontWeight: 'bold', color: AuraColors.textPrimary, flex: 1 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  ratingText: { fontSize: 14, fontWeight: '600', color: '#B45309' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  addressText: { fontSize: 14, color: AuraColors.textSecondary, flex: 1 },
  description: { fontSize: 15, color: AuraColors.textSecondary, lineHeight: 22, marginBottom: 24 },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: AuraColors.textPrimary },
  serviceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: AuraColors.card, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: AuraColors.border },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 16, fontWeight: '600', color: AuraColors.textPrimary, marginBottom: 4 },
  serviceDuration: { fontSize: 14, color: AuraColors.textSecondary },
  servicePriceContainer: { alignItems: 'flex-end', gap: 8 },
  servicePrice: { fontSize: 16, fontWeight: '700', color: AuraColors.primary },
  bookSmallButton: { backgroundColor: AuraColors.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  bookSmallButtonText: { color: AuraColors.primary, fontSize: 12, fontWeight: '600' },
  emptyText: { color: AuraColors.textMuted, fontStyle: 'italic' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, backgroundColor: AuraColors.background, borderTopWidth: 1, borderTopColor: AuraColors.border },
});