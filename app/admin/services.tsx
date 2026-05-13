import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { fetchServicesByCenter } from '../../src/lib/data';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

export default function AdminServicesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [centerId, setCenterId] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    try {
      // 1. Obtener el ID del centro
      let currentCenterId = centerId;
      if (!currentCenterId) {
        const { data: centerData } = await supabase
          .from('centers')
          .select('id')
          .eq('owner_id', user.id)
          .single();
        if (centerData) {
          currentCenterId = centerData.id;
          setCenterId(centerData.id);
        }
      }

      // 2. Obtener los servicios de ese centro
      if (currentCenterId) {
        const { data } = await fetchServicesByCenter(currentCenterId);
        setServices(data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDeleteService = async (serviceId: string, serviceName: string) => {
    Alert.alert(
      'Eliminar Servicio',
      `¿Estás seguro de que deseas eliminar "${serviceName}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('services').delete().eq('id', serviceId);
            if (error) {
              Alert.alert('Error', 'No se pudo eliminar el servicio.');
            } else {
              setServices(services.filter(s => s.id !== serviceId));
            }
          }
        }
      ]
    );
  };

  const renderServiceItem = ({ item }: { item: any }) => (
    <View style={styles.serviceCard}>
      <View style={styles.serviceInfoRow}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.serviceImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Feather name="image" size={24} color={AuraColors.textMuted} />
          </View>
        )}
        <View style={styles.serviceDetails}>
          <Text style={styles.serviceName}>{item.name}</Text>
          <Text style={styles.serviceMeta}>
            <Feather name="clock" size={12} /> {item.duration_min} min  |  <Feather name="tag" size={12} /> {item.price} Bs
          </Text>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteService(item.id, item.name)}>
          <Feather name="trash-2" size={18} color={AuraColors.destructive} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={AuraColors.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Servicios</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        renderItem={renderServiceItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AuraColors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="grid" size={48} color={AuraColors.border} />
            <Text style={styles.emptyTitle}>Sin servicios</Text>
            <Text style={styles.emptyText}>Aún no has añadido ningún servicio a tu catálogo.</Text>
          </View>
        }
      />

      {/* Botón Flotante para añadir un nuevo servicio */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push({ pathname: '/admin/add-service', params: { centerId } } as any)}
      >
        <Feather name="plus" size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  headerTitle: { fontSize: 20, fontWeight: '700', color: AuraColors.textPrimary },
  listContent: { padding: 24, paddingBottom: 100 },
  serviceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: AuraColors.card, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: AuraColors.border },
  serviceInfoRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 16 },
  serviceImage: { width: 60, height: 60, borderRadius: 12 },
  placeholderImage: { width: 60, height: 60, borderRadius: 12, backgroundColor: AuraColors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  serviceDetails: { flex: 1, justifyContent: 'center' },
  serviceName: { fontSize: 16, fontWeight: '600', color: AuraColors.textPrimary, marginBottom: 4 },
  serviceMeta: { fontSize: 13, color: AuraColors.textSecondary },
  actionButtons: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 8, backgroundColor: '#FDEDED', borderRadius: 8 },
  fab: { position: 'absolute', bottom: 30, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: AuraColors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: AuraColors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary, marginTop: 16 },
  emptyText: { fontSize: 14, color: AuraColors.textSecondary, textAlign: 'center', marginTop: 8 },
});