import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/Button';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

// Función para abrir navegación nativa o Google Maps
const openNavigation = (lat: number, lng: number, label: string) => {
  const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
  const latLng = `${lat},${lng}`;
  const labelEncoded = encodeURIComponent(label);
  const nativeUrl = Platform.select({
    ios: `${scheme}${labelEncoded}@${latLng}`,
    android: `${scheme}${latLng}(${labelEncoded})`
  });
  const webFallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => {
      if (url === nativeUrl) {
        Linking.openURL(webFallbackUrl).catch(() =>
          Alert.alert('Error', 'No se pudo abrir la aplicación de mapas.')
        );
      } else {
        Alert.alert('Error', 'No se pudo abrir el mapa.');
      }
    });
  };

  if (nativeUrl) {
    openUrl(nativeUrl);
  } else {
    openUrl(webFallbackUrl);
  }
};

export default function CenterProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  // --- Paso 1: tipos de pestañas y estado para reseñas ---
  const [activeTab, setActiveTab] = useState<'services' | 'about' | 'reviews'>('services');
  const [reviews, setReviews] = useState<any[]>([]);
  // --- fin Paso 1 ---

  const [center, setCenter] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedServiceDetail, setSelectedServiceDetail] = useState<any>(null);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [reportCategory, setReportCategory] = useState('');
  const [reportText, setReportText] = useState('');

  useEffect(() => {
    const fetchCenterData = async () => {
      if (!id) return;
      try {
        // Datos del centro
        const { data: centerData, error: centerError } = await supabase
          .from('centers')
          .select('*, gallery_urls')
          .eq('id', id)
          .single();
        if (centerError) throw centerError;
        setCenter(centerData);

        // Servicios
        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('center_id', id);
        if (servicesData) setServices(servicesData);

        // --- Paso 2: cargar reseñas con la estructura exacta ---
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('id, rating, comment, created_at, client:client_id(full_name)')
          .eq('center_id', id)
          .order('created_at', { ascending: false });
        setReviews(reviewsData || []);
        // --- fin Paso 2 ---
      } catch (error: any) {
        Alert.alert('Error', 'No se pudo cargar la información del establecimiento.');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchCenterData();
  }, [id]);

  const handleWhatsAppContact = () => {
    if (!center?.phone) return Alert.alert('No disponible', 'Este centro no ha registrado un teléfono.');
    const cleanPhone = center.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone.startsWith('591') ? cleanPhone : '591' + cleanPhone}?text=Hola! Vía AURA me gustaría realizar una consulta.`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'No se pudo abrir WhatsApp.'));
  };

  const handleReportCenter = () => {
    setIsReportModalVisible(true);
  };

  const submitReport = async () => {
    if (!reportCategory) return Alert.alert('Aviso', 'Selecciona un motivo para el reporte.');
    if (!reportText.trim()) return Alert.alert('Aviso', 'Debes detallar el problema.');

    setIsReportModalVisible(false);

    const { error } = await supabase.from('reports').insert({
      reporter_id: user?.id,
      center_id: id,
      reason: reportCategory,
      description: reportText
    });

    if (error) {
      Alert.alert('Error al enviar', `No se pudo guardar: ${error.message}`);
      return;
    }

    setReportText('');
    setReportCategory('');
    Alert.alert('Reporte Enviado', 'Nuestro equipo investigará este caso. Gracias por mantener AURA segura.');
  };

  const renderServiceItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.serviceCard} onPress={() => setSelectedServiceDetail(item)}>
      <View style={styles.serviceMain}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.serviceImage} />
        ) : (
          <View style={styles.serviceImagePlaceholder}>
            <Feather name="scissors" size={20} color={AuraColors.primary} />
          </View>
        )}
        <View style={styles.serviceDetails}>
          <Text style={styles.serviceName}>{item.name}</Text>
          <Text style={styles.serviceDuration}>
            <Feather name="clock" size={12} /> {item.duration_min} min
          </Text>
        </View>
      </View>
      <Text style={styles.servicePrice}>{parseFloat(item.price).toFixed(2)} Bs</Text>
    </TouchableOpacity>
  );

  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AuraColors.primary} />
      </View>
    );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleReportCenter} style={styles.reportButton}>
          <Feather name="flag" size={18} color={AuraColors.destructive} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.imageHeaderContainer}>
          <Image
            source={{
              uri:
                center?.image_url ||
                'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop',
            }}
            style={styles.coverImage}
          />
          <View style={styles.overlayShadow} />
        </View>

        <View style={styles.infoContent}>
          <Text style={styles.centerTitle}>{center?.name}</Text>

          <View style={styles.rowMeta}>
            <View style={styles.ratingBadge}>
              <Feather name="star" size={14} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingText}>{(center?.rating || 4.5).toFixed(1)}</Text>
            </View>
            <Text style={styles.metaDivider}>•</Text>
            <Text style={styles.metaLocationText}>
              {center?.address?.split(',')[0] || 'Local'}
            </Text>
          </View>

          <View style={styles.badgesContainer}>
            <View style={styles.badgeItem}>
              <Feather name="shield" size={14} color="#16A34A" />
              <Text style={styles.badgeText}>Reserva Segura</Text>
            </View>
            {center?.payment_qr_url && (
              <View style={styles.badgeItem}>
                <Feather name="smartphone" size={14} color={AuraColors.primary} />
                <Text style={styles.badgeText}>Acepta QR Digital</Text>
              </View>
            )}
          </View>

          <View style={styles.securityBanner}>
            <Feather name="info" size={16} color="#D97706" />
            <Text style={styles.securityBannerText}>
              <Text style={{ fontWeight: '700' }}>Garantía AURA: </Text>
              Paga el precio exacto que ves aquí. Si el centro te exige un monto diferente al finalizar,
              repórtalo.
            </Text>
          </View>

          {/* --- Paso 3: Pestañas con el botón de Reseñas agregado --- */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'services' && styles.tabBtnActive]}
              onPress={() => setActiveTab('services')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'services' && styles.tabBtnTextActive]}>
                Servicios
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'about' && styles.tabBtnActive]}
              onPress={() => setActiveTab('about')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'about' && styles.tabBtnTextActive]}>
                Nosotros
              </Text>
            </TouchableOpacity>

            {/* Nuevo botón de Reseñas */}
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'reviews' && styles.tabBtnActive]}
              onPress={() => setActiveTab('reviews')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'reviews' && styles.tabBtnTextActive]}>
                Reseñas
              </Text>
            </TouchableOpacity>
          </View>
          {/* --- fin Paso 3 --- */}

          {activeTab === 'services' && (
            <FlatList
              data={services}
              keyExtractor={(item) => item.id}
              renderItem={renderServiceItem}
              scrollEnabled={false}
            />
          )}

          {activeTab === 'about' && (
            <View style={styles.aboutBox}>
              <Text style={styles.aboutDescription}>
                {center?.description || 'Sin descripción disponible.'}
              </Text>

              {center?.gallery_urls && center.gallery_urls.length > 0 && (
                <View style={styles.gallerySection}>
                  <Text style={styles.sectionTitle}>Nuestras Instalaciones</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 12 }}
                  >
                    {center.gallery_urls.map((url: string, index: number) => (
                      <Image key={index} source={{ uri: url }} style={styles.galleryImageItem} />
                    ))}
                  </ScrollView>
                </View>
              )}

              {center?.latitude && center?.longitude && (
                <TouchableOpacity
                  style={styles.bigRouteButton}
                  onPress={() =>
                    openNavigation(
                      parseFloat(center.latitude),
                      parseFloat(center.longitude),
                      center.name
                    )
                  }
                >
                  <Feather name="navigation" size={20} color="white" />
                  <Text style={styles.bigRouteText}>Cómo llegar (Abrir Mapas)</Text>
                </TouchableOpacity>
              )}

              <View style={styles.locationDetailRow}>
                <Feather name="map-pin" size={16} color={AuraColors.primary} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.locationTitle}>Dirección Exacta</Text>
                  <Text style={styles.locationBody}>{center?.address}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsAppContact}>
                <Feather name="message-circle" size={18} color="#16A34A" />
                <Text style={styles.whatsappButtonText}>Consultar por WhatsApp</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* --- Paso 4: Sección de reseñas con resumen y lista --- */}
          {activeTab === 'reviews' && (
            <View style={styles.tabContent}>
              {/* Resumen de Estrellas */}
              <View style={styles.reviewsSummaryCard}>
                <Text style={styles.reviewsSummaryTitle}>
                  {center?.rating || '0.0'}
                </Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Feather
                      key={star}
                      name="star"
                      size={24}
                      color={star <= Math.round(center?.rating || 0) ? '#F59E0B' : '#E2E8F0'}
                      fill={star <= Math.round(center?.rating || 0) ? '#F59E0B' : 'transparent'}
                    />
                  ))}
                </View>
                <Text style={styles.reviewsSummaryText}>
                  Basado en {center?.reviews_count || 0} reseñas verificadas
                </Text>
              </View>

              {/* Lista de comentarios */}
              {reviews.length === 0 ? (
                <Text style={styles.emptyText}>
                  Aún no hay reseñas para este centro. ¡Sé el primero en calificarlo al reservar!
                </Text>
              ) : (
                reviews.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewUser}>
                        <View style={styles.reviewAvatar}>
                          <Text style={styles.reviewAvatarText}>
                            {review.client?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.reviewUserName}>
                            {review.client?.full_name || 'Usuario de AURA'}
                          </Text>
                          <Text style={styles.reviewDate}>
                            {new Date(review.created_at).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.starsRowSmall}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Feather
                            key={star}
                            name="star"
                            size={14}
                            color={star <= review.rating ? '#F59E0B' : '#E2E8F0'}
                            fill={star <= review.rating ? '#F59E0B' : 'transparent'}
                          />
                        ))}
                      </View>
                    </View>
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                  </View>
                ))
              )}
            </View>
          )}
          {/* --- fin Paso 4 --- */}
        </View>
      </ScrollView>

      <View style={styles.floatingActionFooter}>
        <Button
          title="Agendar una Cita"
          onPress={() => router.push(`/booking/${id}` as any)}
          icon={<Feather name="calendar" size={18} color="white" />}
        />
      </View>

      {/* Modal de detalle de servicio */}
      <Modal visible={!!selectedServiceDetail} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.serviceModalContent}>
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setSelectedServiceDetail(null)}
            >
              <Feather name="x" size={24} color={AuraColors.textPrimary} />
            </TouchableOpacity>

            {selectedServiceDetail?.image_url ? (
              <Image
                source={{ uri: selectedServiceDetail.image_url }}
                style={styles.serviceModalImage}
              />
            ) : (
              <View style={styles.serviceModalImagePlaceholder}>
                <Feather name="image" size={48} color={AuraColors.primary} />
              </View>
            )}

            <Text style={styles.serviceModalTitle}>{selectedServiceDetail?.name}</Text>
            <Text style={styles.serviceModalPrice}>{selectedServiceDetail?.price} Bs</Text>

            <View style={styles.serviceModalRow}>
              <Feather name="clock" size={16} color={AuraColors.textSecondary} />
              <Text style={styles.serviceModalDuration}>
                {selectedServiceDetail?.duration_min} minutos aprox.
              </Text>
            </View>

            <Text style={styles.serviceModalDescTitle}>Detalles del servicio</Text>
            <Text style={styles.serviceModalDesc}>
              {selectedServiceDetail?.description ||
                'Este servicio no cuenta con una descripción detallada por el momento.'}
            </Text>

            <Button
              title="Cerrar Detalles"
              onPress={() => setSelectedServiceDetail(null)}
              style={{ marginTop: 24 }}
            />
          </View>
        </View>
      </Modal>

      {/* Modal de reporte */}
      <Modal visible={isReportModalVisible} animationType="fade" transparent={true}>
        <View style={styles.reportModalOverlay}>
          <View style={styles.reportModalContent}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ backgroundColor: '#FEE2E2', padding: 12, borderRadius: 30, marginBottom: 12 }}>
                <Feather name="flag" size={24} color={AuraColors.destructive} />
              </View>
              <Text style={styles.reportModalTitle}>Reportar Centro</Text>
              <Text style={styles.reportModalSub}>Selecciona el motivo principal:</Text>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16, justifyContent: 'center' }}>
              {['Cobro excesivo', 'Mal comportamiento', 'Fotos falsas', 'Otro'].map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.reportCategoryBtn, reportCategory === cat && { backgroundColor: AuraColors.primary, borderColor: AuraColors.primary }]}
                  onPress={() => setReportCategory(cat)}
                >
                  <Text style={[styles.reportCategoryText, reportCategory === cat && { color: 'white' }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.reportInput}
              multiline
              numberOfLines={4}
              placeholder="Detalla lo ocurrido para que podamos investigar..."
              value={reportText}
              onChangeText={setReportText}
              textAlignVertical="top"
            />
            <View style={styles.reportActions}>
              <Button title="Cancelar" variant="outline" onPress={() => setIsReportModalVisible(false)} style={{ flex: 1, marginRight: 8 }} />
              <Button title="Enviar Reporte" onPress={submitReport} style={{ flex: 1, backgroundColor: AuraColors.destructive }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    position: 'absolute',
    top: 20,
    left: 24,
    right: 24,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageHeaderContainer: { width: '100%', height: 240, position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  overlayShadow: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 80,
    backgroundColor: 'transparent',
  },
  infoContent: { paddingHorizontal: 24, paddingTop: 20 },
  centerTitle: { fontSize: 26, fontWeight: '800', color: AuraColors.textPrimary },
  rowMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 12 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: { fontSize: 13, fontWeight: '700', color: '#D97706' },
  metaDivider: { marginHorizontal: 10, color: AuraColors.textMuted },
  metaLocationText: { fontSize: 14, color: AuraColors.textSecondary, fontWeight: '500' },
  badgesContainer: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: AuraColors.textSecondary },
  securityBanner: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  securityBannerText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },

  // Estilos de pestañas (renombrados para que coincidan con las instrucciones)
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: AuraColors.border,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingBottom: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: AuraColors.primary,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: AuraColors.textMuted,
  },
  tabBtnTextActive: {
    color: AuraColors.primary,
  },

  // Servicios
  serviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: AuraColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AuraColors.border,
    marginBottom: 12,
  },
  serviceMain: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  serviceImage: { width: 50, height: 50, borderRadius: 10 },
  serviceImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: AuraColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceDetails: { flex: 1, gap: 2 },
  serviceName: { fontSize: 15, fontWeight: '600', color: AuraColors.textPrimary },
  serviceDuration: { fontSize: 12, color: AuraColors.textMuted },
  servicePrice: { fontSize: 15, fontWeight: '700', color: AuraColors.primary, marginLeft: 8 },

  // Sobre el centro
  aboutBox: { gap: 20 },
  aboutDescription: { fontSize: 15, color: AuraColors.textSecondary, lineHeight: 22 },
  gallerySection: { marginVertical: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 12 },
  galleryImageItem: {
    width: 140,
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AuraColors.border,
  },
  bigRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AuraColors.primary,
    padding: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
    marginBottom: 16,
  },
  bigRouteText: { color: 'white', fontWeight: '700', fontSize: 16 },
  locationDetailRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AuraColors.border,
  },
  locationTitle: { fontSize: 14, fontWeight: '700', color: AuraColors.textPrimary },
  locationBody: { fontSize: 13, color: AuraColors.textSecondary, marginTop: 4, lineHeight: 18 },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16A34A',
    backgroundColor: '#E0FDEE',
  },
  whatsappButtonText: { color: '#16A34A', fontWeight: '600', fontSize: 14 },

  // --- Paso 5: Estilos nuevos para las reseñas ---
  tabContent: {
    // Contenedor extra, si se necesita padding
  },
  reviewsSummaryCard: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: AuraColors.border,
  },
  reviewsSummaryTitle: {
    fontSize: 48,
    fontWeight: '800',
    color: AuraColors.textPrimary,
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  reviewsSummaryText: {
    fontSize: 14,
    color: AuraColors.textSecondary,
    fontWeight: '500',
  },
  reviewCard: {
    backgroundColor: AuraColors.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: AuraColors.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AuraColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewAvatarText: {
    color: AuraColors.primary,
    fontWeight: '700',
    fontSize: 18,
  },
  reviewUserName: {
    fontSize: 15,
    fontWeight: '700',
    color: AuraColors.textPrimary,
  },
  reviewDate: {
    fontSize: 12,
    color: AuraColors.textSecondary,
    marginTop: 4,
  },
  starsRowSmall: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: AuraColors.textSecondary,
    lineHeight: 22,
  },
  emptyText: {
    textAlign: 'center',
    color: AuraColors.textSecondary,
    marginTop: 24,
    fontStyle: 'italic',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  // --- fin Paso 5 ---

  // Footer
  floatingActionFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: AuraColors.border,
  },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  serviceModalContent: {
    backgroundColor: AuraColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    minHeight: '50%',
  },
  closeModalBtn: {
    alignSelf: 'flex-end',
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    marginBottom: 16,
  },
  serviceModalImage: { width: '100%', height: 200, borderRadius: 16, marginBottom: 16 },
  serviceModalImagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    backgroundColor: AuraColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  serviceModalTitle: { fontSize: 22, fontWeight: '800', color: AuraColors.textPrimary, marginBottom: 4 },
  serviceModalPrice: { fontSize: 20, fontWeight: '700', color: AuraColors.primary, marginBottom: 12 },
  serviceModalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  serviceModalDuration: { fontSize: 14, color: AuraColors.textSecondary, fontWeight: '500' },
  serviceModalDescTitle: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 8 },
  serviceModalDesc: { fontSize: 14, color: AuraColors.textSecondary, lineHeight: 22 },
  reportModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  reportModalContent: {
    backgroundColor: AuraColors.background,
    borderRadius: 24,
    padding: 24,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  reportModalTitle: { fontSize: 20, fontWeight: '800', color: AuraColors.textPrimary },
  reportModalSub: { fontSize: 14, color: AuraColors.textSecondary, textAlign: 'center' },
  reportCategoryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AuraColors.border,
    backgroundColor: AuraColors.card,
  },
  reportCategoryText: { fontSize: 13, fontWeight: '600', color: AuraColors.textSecondary },
  reportInput: {
    backgroundColor: AuraColors.card,
    borderWidth: 1,
    borderColor: AuraColors.border,
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    marginBottom: 24,
    color: AuraColors.textPrimary,
  },
  reportActions: { flexDirection: 'row', justifyContent: 'space-between' },
});