import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/Button'; // IMPORTACIÓN DEL BOTÓN AÑADIDA
import CategoryCard from '../../src/components/ui/CategoryCard';
import CenterCard from '../../src/components/ui/CenterCard';
import { useAuth } from '../../src/contexts/AuthContext';
import { registerForPushNotificationsAsync } from '../../src/lib/push';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

const CATEGORIES = [
  { id: '1', name: 'Barbería', icon: 'scissors', color: '#DBEAFE' },
  { id: '2', name: 'Peluquería', icon: 'wind', color: '#FCE7F3' },
  { id: '3', name: 'Uñas', icon: 'edit-2', color: '#FEF3C7' },
  { id: '4', name: 'Spa & Masajes', icon: 'smile', color: '#DCFCE7' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    fetchData();
    if (user) {
    registerForPushNotificationsAsync(user.id);
  }
  }, [user]);

  const fetchData = async () => {
    try {
      if (user) {
        const { data: pData } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single();
        if (pData) setProfileData(pData);
      }

      const { data, error } = await supabase.from('centers').select('*').eq('status', 'approved').limit(5);
      if (error) throw error;
      setCenters(data || []);
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayName = profileData?.full_name || user?.user_metadata?.full_name?.split(' ')[0] || 'Usuario';
  const displayAvatar = profileData?.avatar_url || user?.user_metadata?.avatar_url;

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={AuraColors.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.greeting}>Hola, {displayName} 👋</Text>
          <Text style={styles.subtitle}>¿Qué servicio buscas hoy?</Text>
        </View>
        <TouchableOpacity style={styles.avatarContainer} onPress={() => router.push('/profile')}>
          {displayAvatar ? (
            <Image source={{ uri: displayAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}><Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={[]} 
        keyExtractor={() => "dummy"}
        renderItem={null}
        ListHeaderComponent={
          <>
            <TouchableOpacity style={styles.searchBarContainer} onPress={() => router.push('/search')}>
              <Feather name="search" size={20} color={AuraColors.textMuted} />
              <Text style={styles.searchBarPlaceholder}>Buscar centros, servicios...</Text>
            </TouchableOpacity>

            {/* ================= SECCIÓN DEL BANNER IA (AÑADIDA) ================= */}
            <View style={styles.iaBanner}>
              <View style={styles.iaInfo}>
                <View style={styles.iaIconBox}>
                  <Feather name="zap" size={20} color={AuraColors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.iaTitle}>¿No sabes qué estilo elegir?</Text>
                  <Text style={styles.iaDesc}>
                    Usa nuestro escáner visagista para descubrir los cortes que mejor van con tu rostro.
                  </Text>
                </View>
              </View>
              
              <Button 
                title="Análisis Facial con IA" 
                onPress={() => router.push('/facial-analysis')} 
                icon={<Feather name="aperture" size={18} color="white" />}
                style={styles.iaButton}
              />
            </View>
            {/* ==================================================================== */}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categorías</Text>
            </View>
            <View style={styles.categoriesGrid}>
              {CATEGORIES.map((cat) => (
                // CORRECCIÓN: Se usa 'label' en lugar de 'title'
                <CategoryCard key={cat.id} label={cat.name} icon={cat.icon as any} onPress={() => router.push('/search')} />
              ))}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Centros Destacados</Text>
              <TouchableOpacity onPress={() => router.push('/search')}><Text style={styles.seeAll}>Ver todos</Text></TouchableOpacity>
            </View>
          </>
        }
        ListFooterComponent={
          <View style={styles.centersList}>
            {centers.length > 0 ? (
              centers.map(center => (
                // CORRECCIÓN: Se eliminaron propiedades inexistentes y se ajustó image
                <CenterCard 
                  key={center.id} 
                  name={center.name} 
                  category={center.category || 'Belleza'} 
                  rating={center.rating || 4.5} 
                  reviews={center.reviews_count || 0} 
                  image={center.image_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop'} 
                  onPress={() => router.push(`/center/${center.id}` as any)} 
                />
              ))
            ) : (
              <Text style={styles.emptyText}>No hay centros aprobados aún.</Text>
            )}
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 16 },
  headerInfo: { flex: 1 },
  greeting: { fontSize: 24, fontWeight: '800', color: AuraColors.textPrimary },
  subtitle: { fontSize: 14, color: AuraColors.textSecondary, marginTop: 4 },
  avatarContainer: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: AuraColors.primaryLight },
  avatar: { width: '100%', height: '100%' },
  avatarFallback: { flex: 1, backgroundColor: AuraColors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: 'white', fontWeight: '700', fontSize: 20 },
  searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: AuraColors.card, marginHorizontal: 24, paddingHorizontal: 16, height: 50, borderRadius: 12, borderWidth: 1, borderColor: AuraColors.border, marginBottom: 24 },
  searchBarPlaceholder: { color: AuraColors.textMuted, marginLeft: 12, fontSize: 15 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary },
  seeAll: { fontSize: 14, fontWeight: '600', color: AuraColors.primary },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 12, marginBottom: 32 },
  centersList: { paddingHorizontal: 24, gap: 16, paddingBottom: 40 },
  emptyText: { textAlign: 'center', color: AuraColors.textMuted, fontStyle: 'italic', marginTop: 20 },
  
  // ======== ESTILOS AÑADIDOS PARA EL BANNER IA ========
  iaBanner: {
    backgroundColor: AuraColors.card,
    borderWidth: 1,
    borderColor: AuraColors.border,
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 24, // Para alinearlo con los demás elementos
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iaInfo: { flexDirection: 'row', gap: 14, marginBottom: 16, alignItems: 'center' },
  iaIconBox: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    backgroundColor: AuraColors.primaryLight, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  iaTitle: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary },
  iaDesc: { fontSize: 13, color: AuraColors.textSecondary, marginTop: 2, lineHeight: 18 },
  iaButton: { width: '100%' }
  // ====================================================
});