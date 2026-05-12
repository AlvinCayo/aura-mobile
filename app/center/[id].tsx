import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Rating from '../../src/components/ui/Rating';
import ReviewCard from '../../src/components/ui/ReviewCard';
import ServiceItem from '../../src/components/ui/ServiceItem';
import { AuraColors } from '../../src/theme/colors';

const { width } = Dimensions.get('window');

// Datos de ejemplo
const CENTER_DATA = {
  id: '1',
  name: 'Aura Beauty Center',
  category: 'Estética Facial',
  rating: 4.8,
  reviews: 124,
  distance: '1.2 km',
  address: 'Calle Mayor 23, Madrid',
  description:
    'Centro especializado en tratamientos faciales avanzados con tecnología de última generación. Ofrecemos una experiencia personalizada para realzar tu belleza natural.',
  images: [
    'https://picsum.photos/400/300',
    'https://picsum.photos/400/301',
  ],
  services: [
    { id: '1', name: 'Limpieza facial profunda', duration: '60 min', price: '45 €' },
    { id: '2', name: 'Peeling químico', duration: '45 min', price: '65 €' },
    { id: '3', name: 'Masaje relajante', duration: '90 min', price: '80 €' },
  ],
  reviewsList: [
    { id: '1', userName: 'María G.', rating: 5, date: 'hace 1 semana', comment: '¡Increíble! Me hice una limpieza y mi piel quedó radiante.' },
    { id: '2', userName: 'Carlos L.', rating: 4, date: 'hace 2 semanas', comment: 'Muy profesionales, el ambiente es muy acogedor.' },
  ],
};

export default function CenterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Galería de imágenes */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setSelectedImageIndex(index);
            }}
          >
            {CENTER_DATA.images.map((img, idx) => (
              <Image key={idx} source={{ uri: img }} style={styles.image} />
            ))}
          </ScrollView>
          {CENTER_DATA.images.length > 1 && (
            <View style={styles.dotsContainer}>
              {CENTER_DATA.images.map((_, idx) => (
                <View
                  key={idx}
                  style={[styles.dot, idx === selectedImageIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}
          {/* Botón volver */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Información principal */}
        <View style={styles.content}>
          <Text style={styles.centerName}>{CENTER_DATA.name}</Text>
          <Text style={styles.category}>{CENTER_DATA.category}</Text>

          <View style={styles.ratingRow}>
            <Rating value={CENTER_DATA.rating} size={16} />
            <Text style={styles.reviewCount}>({CENTER_DATA.reviews} reseñas)</Text>
            <View style={styles.distanceBadge}>
              <Feather name="map-pin" size={12} color={AuraColors.primary} />
              <Text style={styles.distanceText}>{CENTER_DATA.distance}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>{CENTER_DATA.description}</Text>

          <Text style={styles.sectionTitle}>Servicios</Text>
          {CENTER_DATA.services.map((service) => (
            <View key={service.id} style={styles.serviceSpacing}>
              <ServiceItem
                name={service.name}
                duration={service.duration}
                price={service.price}
                onPress={() => router.push(`/booking/${CENTER_DATA.id}?serviceId=${service.id}` as any)}
              />
            </View>
          ))}

          <Text style={styles.sectionTitle}>Reseñas</Text>
          {CENTER_DATA.reviewsList.map((review) => (
            <View key={review.id} style={styles.reviewSpacing}>
              <ReviewCard
                userName={review.userName}
                rating={review.rating}
                date={review.date}
                comment={review.comment}
              />
            </View>
          ))}
          <TouchableOpacity style={styles.seeAllReviews}>
            <Text style={styles.seeAllText}>Ver todas las reseñas</Text>
          </TouchableOpacity>

          {/* NUEVO: Botón para dejar reseña */}
          <TouchableOpacity
            style={styles.leaveReviewButton}
            onPress={() => router.push(`/review/${CENTER_DATA.id}` as any)}
          >
            <Feather name="edit-3" size={16} color="white" />
            <Text style={styles.leaveReviewText}>Dejar reseña</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Botón fijo para reservar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bookButton}
          activeOpacity={0.9}
          onPress={() => router.push(`/booking/${CENTER_DATA.id}` as any)}
        >
          <Text style={styles.bookButtonText}>Reservar cita</Text>
          <Feather name="calendar" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AuraColors.background,
  },
  imageContainer: {
    height: 240,
    position: 'relative',
  },
  image: {
    width: width,
    height: 240,
    resizeMode: 'cover',
  },
  dotsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: 'white',
    width: 24,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  centerName: {
    fontSize: 26,
    fontWeight: '700',
    color: AuraColors.textPrimary,
  },
  category: {
    fontSize: 15,
    color: AuraColors.textSecondary,
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  reviewCount: {
    fontSize: 14,
    color: AuraColors.textMuted,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AuraColors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    marginLeft: 8,
  },
  distanceText: {
    fontSize: 13,
    color: AuraColors.primary,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AuraColors.textPrimary,
    marginBottom: 12,
    marginTop: 8,
  },
  description: {
    fontSize: 14,
    color: AuraColors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  serviceSpacing: {
    marginBottom: 10,
  },
  reviewSpacing: {
    marginBottom: 10,
  },
  seeAllReviews: {
    alignSelf: 'center',
    marginTop: 8,
  },
  seeAllText: {
    fontSize: 14,
    color: AuraColors.primary,
    fontWeight: '500',
  },
  // Nuevos estilos para el botón de dejar reseña
  leaveReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AuraColors.accent,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  leaveReviewText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: AuraColors.card,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: AuraColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 10,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AuraColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});