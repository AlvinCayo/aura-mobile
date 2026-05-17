import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/Button';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

type TabType = 'services' | 'info' | 'reviews';

export default function CenterProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('services');
  const [center, setCenter] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCenterData = async () => {
      if (!id) return;
      try {
        const { data: centerData, error: centerError } = await supabase
          .from('centers')
          .select('*')
          .eq('id', id)
          .single();
        if (centerError) throw centerError;
        setCenter(centerData);

        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('center_id', id);
        if (servicesData) setServices(servicesData);

        const { data: reviewsData } = await supabase
          .from('reviews')
          .select(`id, rating, comment, created_at, profiles:client_id(full_name, avatar_url)`)
          .eq('center_id', id);
        if (reviewsData) setReviews(reviewsData);

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
    Alert.prompt(
      'Reportar Centro',
      '¿El centro cobra montos diferentes a los de la app o tiene mal comportamiento? Describe el problema:',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Enviar Reporte', 
          style: 'destructive',
          // CORRECCIÓN: Agregado el tipo string al parámetro text
          onPress: async (text?: string) => {
            if (!text) return;
            await supabase.from('reports').insert({
              reporter_id: user?.id, center_id: id, reason: 'PRICE_DISCREPANCY_OR_FRAUD', description: text
            });
            Alert.alert('Reporte Enviado', 'Nuestro equipo investigará este caso. Gracias por mantener AURA segura.');
          }
        }
      ]
    );
  };

  const renderServiceItem = ({ item }: { item: any }) => (
    <View style={styles.serviceCard}>
      <View style={styles.serviceMain}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.serviceImage} />
        ) : (
          <View style={styles.serviceImagePlaceholder}><Feather name="scissors" size={20} color={AuraColors.primary} /></View>
        )}
        <View style={styles.serviceDetails}>
          <Text style={styles.serviceName}>{item.name}</Text>
          <Text style={styles.serviceDuration}><Feather name="clock" size={12} /> {item.duration_min} min</Text>
        </View>
      </View>
      <Text style={styles.servicePrice}>{parseFloat(item.price).toFixed(2)} Bs</Text>
    </View>
  );

  const renderReviewItem = ({ item }: { item: any }) => {
    const clientName = item.profiles?.full_name || 'Usuario';
    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewUser}>
            {item.profiles?.avatar_url ? (
              <Image source={{ uri: item.profiles.avatar_url }} style={styles.userAvatar} />
            ) : (
              <View style={styles.avatarPlaceholder}><Feather name="user" size={14} color={AuraColors.textMuted} /></View>
            )}
            <Text style={styles.reviewUserName}>{clientName}</Text>
          </View>
          <View style={styles.ratingStars}>
            <Feather name="star" size={12} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.ratingValueText}>{item.rating}</Text>
          </View>
        </View>
        <Text style={styles.reviewComment}>{item.comment}</Text>
      </View>
    );
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={AuraColors.primary} /></View>;

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
          <Image source={{ uri: center?.image_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop' }} style={styles.coverImage} />
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
            <Text style={styles.metaLocationText}>{center?.address?.split(',')[0] || 'Local'}</Text>
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
              Paga el precio exacto que ves aquí. Si el centro te exige un monto diferente al finalizar, repórtalo.
            </Text>
          </View>

          <View style={styles.tabsContainer}>
            {(['services', 'info', 'reviews'] as TabType[]).map((tab) => (
              <TouchableOpacity key={tab} style={[styles.tabItem, activeTab === tab && styles.tabItemActive]} onPress={() => setActiveTab(tab)}>
                <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
                  {tab === 'services' ? 'Servicios' : tab === 'info' ? 'Nosotros' : `Reseñas (${reviews.length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'services' && (
            <FlatList data={services} keyExtractor={(item) => item.id} renderItem={renderServiceItem} scrollEnabled={false} />
          )}

          {activeTab === 'info' && (
            <View style={styles.aboutBox}>
              <Text style={styles.aboutDescription}>{center?.description}</Text>
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

          {activeTab === 'reviews' && (
            <FlatList data={reviews} keyExtractor={(item) => item.id} renderItem={renderReviewItem} scrollEnabled={false} />
          )}
        </View>
      </ScrollView>

      <View style={styles.floatingActionFooter}>
        <Button title="Agendar una Cita" onPress={() => router.push(`/booking/${id}` as any)} icon={<Feather name="calendar" size={18} color="white" />} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: { position: 'absolute', top: 20, left: 24, right: 24, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
  reportButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
  imageHeaderContainer: { width: '100%', height: 240, position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  overlayShadow: { position: 'absolute', bottom: 0, width: '100%', height: 80, backgroundColor: 'transparent' },
  infoContent: { paddingHorizontal: 24, paddingTop: 20 },
  centerTitle: { fontSize: 26, fontWeight: '800', color: AuraColors.textPrimary },
  rowMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 12 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingText: { fontSize: 13, fontWeight: '700', color: '#D97706' },
  metaDivider: { marginHorizontal: 10, color: AuraColors.textMuted },
  metaLocationText: { fontSize: 14, color: AuraColors.textSecondary, fontWeight: '500' },
  badgesContainer: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  badgeItem: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '600', color: AuraColors.textSecondary },
  securityBanner: { flexDirection: 'row', gap: 10, backgroundColor: '#FEF3C7', padding: 12, borderRadius: 10, marginBottom: 20 },
  securityBannerText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },
  tabsContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: AuraColors.border, marginBottom: 20 },
  tabItem: { flex: 1, paddingBottom: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: AuraColors.primary },
  tabLabel: { fontSize: 14, fontWeight: '600', color: AuraColors.textMuted },
  tabLabelActive: { color: AuraColors.primary },
  serviceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: AuraColors.card, borderRadius: 14, borderWidth: 1, borderColor: AuraColors.border, marginBottom: 12 },
  serviceMain: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  serviceImage: { width: 50, height: 50, borderRadius: 10 },
  serviceImagePlaceholder: { width: 50, height: 50, borderRadius: 10, backgroundColor: AuraColors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  serviceDetails: { flex: 1, gap: 2 },
  serviceName: { fontSize: 15, fontWeight: '600', color: AuraColors.textPrimary },
  serviceDuration: { fontSize: 12, color: AuraColors.textMuted },
  servicePrice: { fontSize: 15, fontWeight: '700', color: AuraColors.primary, marginLeft: 8 },
  aboutBox: { gap: 20 },
  aboutDescription: { fontSize: 15, color: AuraColors.textSecondary, lineHeight: 22 },
  locationDetailRow: { flexDirection: 'row', gap: 12, backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: AuraColors.border },
  locationTitle: { fontSize: 14, fontWeight: '700', color: AuraColors.textPrimary },
  locationBody: { fontSize: 13, color: AuraColors.textSecondary, marginTop: 4, lineHeight: 18 },
  whatsappButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#16A34A', backgroundColor: '#E0FDEE' },
  whatsappButtonText: { color: '#16A34A', fontWeight: '600', fontSize: 14 },
  reviewCard: { backgroundColor: AuraColors.card, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: AuraColors.border },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reviewUser: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userAvatar: { width: 28, height: 28, borderRadius: 14 },
  avatarPlaceholder: { width: 28, height: 28, borderRadius: 14, backgroundColor: AuraColors.border, justifyContent: 'center', alignItems: 'center' },
  reviewUserName: { fontSize: 14, fontWeight: '600', color: AuraColors.textPrimary },
  ratingStars: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingValueText: { fontSize: 12, fontWeight: '600', color: AuraColors.textSecondary },
  reviewComment: { fontSize: 14, color: AuraColors.textSecondary, lineHeight: 20 },
  floatingActionFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: AuraColors.border },
});