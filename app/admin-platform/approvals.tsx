import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

export default function ApprovalsScreen() {
  const router = useRouter();
  const [pendingCenters, setPendingCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPendingCenters = async () => {
    // Buscamos solo los centros con estado "pending"
    const { data, error } = await supabase
      .from('centers')
      .select('*')
      .eq('status', 'pending');

    if (error) {
      console.error('Error cargando centros:', error);
    } else {
      setPendingCenters(data || []);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadPendingCenters();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadPendingCenters();
  };

  const handleUpdateStatus = async (centerId: string, newStatus: 'approved' | 'rejected', centerName: string) => {
    Alert.alert(
      newStatus === 'approved' ? 'Aprobar Centro' : 'Rechazar Centro',
      `¿Estás seguro de que deseas ${newStatus === 'approved' ? 'aprobar' : 'rechazar'} a "${centerName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: newStatus === 'approved' ? 'Sí, Aprobar' : 'Sí, Rechazar',
          style: newStatus === 'approved' ? 'default' : 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('centers')
              .update({ status: newStatus })
              .eq('id', centerId);

            if (error) {
              Alert.alert('Error', 'No se pudo actualizar el estado.');
            } else {
              Alert.alert('Éxito', `El centro ha sido ${newStatus === 'approved' ? 'aprobado y ya es visible' : 'rechazado'}.`);
              // Quitamos el centro de la lista local
              setPendingCenters((prev) => prev.filter((c) => c.id !== centerId));
            }
          },
        },
      ]
    );
  };

  const openLicense = async (url: string) => {
    if (url) {
      await WebBrowser.openBrowserAsync(url);
    } else {
      Alert.alert('Sin documento', 'Este centro no subió una licencia válida.');
    }
  };

  const renderCenterItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerIcon}>
          <Feather name="award" size={24} color={AuraColors.primary} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.centerName}>{item.name}</Text>
          <Text style={styles.centerAddress}>{item.address}</Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={3}>
        {item.description || 'Sin descripción.'}
      </Text>

      <TouchableOpacity 
        style={styles.documentButton} 
        onPress={() => openLicense(item.license_url)}
      >
        <Feather name="file-text" size={16} color={AuraColors.primary} />
        <Text style={styles.documentText}>Ver Licencia de Funcionamiento</Text>
      </TouchableOpacity>

      <View style={styles.actionsRow}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.rejectButton]} 
          onPress={() => handleUpdateStatus(item.id, 'rejected', item.name)}
        >
          <Feather name="x" size={18} color={AuraColors.destructive} />
          <Text style={styles.rejectText}>Rechazar</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.approveButton]} 
          onPress={() => handleUpdateStatus(item.id, 'approved', item.name)}
        >
          <Feather name="check" size={18} color="white" />
          <Text style={styles.approveText}>Aprobar</Text>
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
        <Text style={styles.headerTitle}>Aprobaciones Pendientes</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={pendingCenters}
        keyExtractor={(item) => item.id}
        renderItem={renderCenterItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AuraColors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="check-circle" size={48} color={AuraColors.success} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyTitle}>¡Todo al día!</Text>
            <Text style={styles.emptyText}>No hay ningún centro esperando aprobación en este momento.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary },
  listContent: { padding: 24, paddingBottom: 40 },
  card: { backgroundColor: AuraColors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: AuraColors.border },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  headerIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: AuraColors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1 },
  centerName: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary },
  centerAddress: { fontSize: 13, color: AuraColors.textSecondary, marginTop: 2 },
  description: { fontSize: 14, color: AuraColors.textSecondary, lineHeight: 20, marginBottom: 16 },
  documentButton: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16, justifyContent: 'center' },
  documentText: { color: AuraColors.primary, fontWeight: '600', fontSize: 14 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 6 },
  rejectButton: { backgroundColor: '#FDEDED' },
  rejectText: { color: AuraColors.destructive, fontWeight: '600', fontSize: 14 },
  approveButton: { backgroundColor: AuraColors.primary },
  approveText: { color: 'white', fontWeight: '600', fontSize: 14 },
  emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: AuraColors.textPrimary, marginTop: 16 },
  emptyText: { fontSize: 14, color: AuraColors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 22 },
});