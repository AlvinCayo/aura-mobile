import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

export default function ApprovalsScreen() {
  const router = useRouter();
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPendingCenters = async () => {
    try {
      const { data, error } = await supabase
        .from('centers')
        .select(`id, name, address, description, license_url, created_at, owner:owner_id(full_name, email)`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCenters(data || []);
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchPendingCenters(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchPendingCenters(); };

  const handleOpenLicense = async (url: string) => {
    if (!url) return Alert.alert('Sin Documento', 'Este centro no adjuntó una licencia PDF.');
    await WebBrowser.openBrowserAsync(url);
  };

  const updateCenterStatus = async (id: string, status: 'approved' | 'rejected', centerName: string, ownerId: string) => {
    Alert.alert(
      status === 'approved' ? 'Aprobar Centro' : 'Rechazar Centro',
      `¿Deseas ${status === 'approved' ? 'aprobar' : 'rechazar'} a "${centerName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: status === 'rejected' ? 'destructive' : 'default',
          onPress: async () => {
            // 1. Actualizamos el estado del centro
            const { error } = await supabase.from('centers').update({ status }).eq('id', id);
            
            if (error) {
              Alert.alert('Error', 'No se pudo procesar la solicitud.');
            } else {
              // 2. SI SE APRUEBA, LE DAMOS EL ROL AL DUEÑO OFICIALMENTE
              if (status === 'approved' && ownerId) {
                await supabase.from('profiles').update({ role: 'center_owner' }).eq('id', ownerId);
              }
              
              Alert.alert('Éxito', `Centro ${status === 'approved' ? 'aprobado' : 'rechazado'} correctamente.`);
              setCenters(prev => prev.filter(c => c.id !== id));
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.centerName}>{item.name}</Text>
        <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <View style={styles.infoRow}><Feather name="map-pin" size={14} color={AuraColors.textSecondary} /><Text style={styles.infoText}>{item.address}</Text></View>
      <View style={styles.infoRow}><Feather name="user" size={14} color={AuraColors.textSecondary} /><Text style={styles.infoText}>{item.owner?.full_name} ({item.owner?.email})</Text></View>
      
      <TouchableOpacity style={styles.documentButton} onPress={() => handleOpenLicense(item.license_url)}>
        <Feather name="file-text" size={18} color="#0284C7" />
        <Text style={styles.documentText}>Ver Licencia de Funcionamiento PDF</Text>
      </TouchableOpacity>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={() => updateCenterStatus(item.id, 'approved', item.name, item.owner?.id)}>
          <Feather name="x" size={18} color="#EF4444" />
          <Text style={styles.textReject}>Rechazar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnApprove]} onPress={() => updateCenterStatus(item.id, 'approved', item.name, item.owner?.id)}>
          <Feather name="check" size={18} color="white" />
          <Text style={styles.textApprove}>Aprobar Operación</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Feather name="arrow-left" size={20} color={AuraColors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Solicitudes Nuevas</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? <View style={styles.centerLoading}><ActivityIndicator size="large" color={AuraColors.primary} /></View> : (
        <FlatList
          data={centers}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AuraColors.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Feather name="check-circle" size={48} color={AuraColors.success} />
              <Text style={styles.emptyTitle}>Todo al día</Text>
              <Text style={styles.emptySub}>No hay centros pendientes de aprobación.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 24 },
  card: { backgroundColor: AuraColors.card, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: AuraColors.border, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  centerName: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary, flex: 1 },
  dateText: { fontSize: 12, color: AuraColors.textMuted },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoText: { fontSize: 14, color: AuraColors.textSecondary },
  documentButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#E0F2FE', padding: 12, borderRadius: 10, marginTop: 12, marginBottom: 16 },
  documentText: { color: '#0284C7', fontWeight: '600', fontSize: 14 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 10 },
  btnReject: { backgroundColor: '#FEE2E2' },
  textReject: { color: '#EF4444', fontWeight: '700' },
  btnApprove: { backgroundColor: AuraColors.success },
  textApprove: { color: 'white', fontWeight: '700' },
  emptyBox: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: AuraColors.textPrimary, marginTop: 16 },
  emptySub: { fontSize: 14, color: AuraColors.textSecondary, marginTop: 8 },
});