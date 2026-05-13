import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Dimensions, ScrollView, StyleSheet,
  Text, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Rating from '../../src/components/ui/Rating';
import ReviewCard from '../../src/components/ui/ReviewCard';
import ServiceItem from '../../src/components/ui/ServiceItem';
import { fetchCenterById, fetchReviewsByCenter, fetchServicesByCenter } from '../../src/lib/data';
import { AuraColors } from '../../src/theme/colors';

const { width } = Dimensions.get('window');

export default function CenterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [center, setCenter] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    const [centerRes, servicesRes, reviewsRes] = await Promise.all([
      fetchCenterById(id!),
      fetchServicesByCenter(id!),
      fetchReviewsByCenter(id!),
    ]);
    if (centerRes.data) setCenter(centerRes.data);
    if (servicesRes.data) setServices(servicesRes.data);
    if (reviewsRes.data) setReviews(reviewsRes.data);
    setLoading(false);
  };

  if (loading || !center) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AuraColors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Imagen placeholder */}
        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder}>
            <Feather name="image" size={40} color={AuraColors.textMuted} />
          </View>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.centerName}>{center.name}</Text>
          <Text style={styles.category}>{center.category}</Text>

          <View style={styles.ratingRow}>
            <Rating value={center.rating || 0} size={16} />
            <Text style={styles.reviewCount}>({center.reviews_count || 0} reseñas)</Text>
          </View>

          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>{center.description || 'Sin descripción.'}</Text>

          <Text style={styles.sectionTitle}>Servicios</Text>
          {services.length > 0 ? services.map((service) => (
            <View key={service.id} style={styles.serviceSpacing}>
              <ServiceItem
                name={service.name}
                duration={`${service.duration_min} min`}
                price={`${service.price} €`}
                onPress={() => router.push(`/booking/${center.id}?serviceId=${service.id}` as any)}
              />
            </View>
          )) : <Text style={styles.emptyText}>No hay servicios registrados.</Text>}

          <Text style={styles.sectionTitle}>Reseñas</Text>
          {reviews.length > 0 ? reviews.map((review) => (
            <View key={review.id} style={styles.reviewSpacing}>
              <ReviewCard
                userName={review.client?.full_name || 'Anónimo'}
                rating={review.rating}
                date={new Date(review.created_at).toLocaleDateString()}
                comment={review.comment}
              />
            </View>
          )) : <Text style={styles.emptyText}>No hay reseñas aún.</Text>}

          {/* Botón para dejar reseña */}
          <TouchableOpacity
            style={styles.leaveReviewButton}
            onPress={() => router.push(`/review/${center.id}` as any)}
          >
            <Feather name="edit-3" size={16} color="white" />
            <Text style={styles.leaveReviewText}>Dejar reseña</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bookButton}
          activeOpacity={0.9}
          onPress={() => router.push(`/booking/${center.id}` as any)}
        >
          <Text style={styles.bookButtonText}>Reservar cita</Text>
          <Feather name="calendar" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: AuraColors.background },
  container: { flex: 1, backgroundColor: AuraColors.background },
  imageContainer: { height: 200, position: 'relative', backgroundColor: AuraColors.border },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backButton: {
    position: 'absolute', top: 16, left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center',
  },
  content: { padding: 24, paddingBottom: 100 },
  centerName: { fontSize: 26, fontWeight: '700', color: AuraColors.textPrimary },
  category: { fontSize: 15, color: AuraColors.textSecondary, marginBottom: 12 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  reviewCount: { fontSize: 14, color: AuraColors.textMuted },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: AuraColors.textPrimary, marginBottom: 12, marginTop: 8 },
  description: { fontSize: 14, color: AuraColors.textSecondary, lineHeight: 22, marginBottom: 24 },
  serviceSpacing: { marginBottom: 10 },
  reviewSpacing: { marginBottom: 10 },
  emptyText: { fontSize: 14, color: AuraColors.textMuted },
  leaveReviewButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: AuraColors.accent, paddingVertical: 14, borderRadius: 12, marginTop: 16, gap: 8,
  },
  leaveReviewText: { color: 'white', fontSize: 15, fontWeight: '600' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: AuraColors.card, paddingHorizontal: 24, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: AuraColors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05, shadowRadius: 12, elevation: 10,
  },
  bookButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: AuraColors.primary, paddingVertical: 16, borderRadius: 12, gap: 8,
  },
  bookButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});