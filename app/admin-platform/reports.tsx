import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

export default function ReportsScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`id, reason, description, status, created_at, reporter:reporter_id(full_name), center:center_id(id, name)`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error cargando reportes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchReports(); };

  const handleAction = async (reportId: string, centerId: string, action: 'dismiss' | 'suspend') => {
    Alert.alert(
      action === 'dismiss' ? 'Descartar Reporte' : 'Suspender Centro',
      action === 'dismiss' ? '¿Marcar este reporte como resuelto o falso?' : '¿Suspender este centro por violar las normas de precios?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: action === 'suspend' ? 'destructive' : 'default',
          onPress: async () => {
            // 1. Marcar reporte como resuelto
            await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId);
            
            // 2. Si es suspender, bajamos el centro
            if (action === 'suspend' && centerId) {
              await supabase.from('centers').update({ status: 'suspended' }).eq('id', centerId);
            }
            
            Alert.alert('Éxito', 'Acción ejecutada correctamente.');
            setReports(prev => prev.filter(r => r.id !== reportId));
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.badge}><Text style={styles.badgeText}>Posible Fraude</Text></View>
        <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      
      <Text style={styles.centerName}>Acusado: {item.center?.name || 'Centro Desconocido'}</Text>
      <Text style={styles.reporterName}>Reportado por: {item.reporter?.full_name}</Text>
      
      <View style={styles.descriptionBox}>
        <Text style={styles.descriptionText}>"{item.description}"</Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.btn, styles.btnDismiss]} onPress={() => handleAction(item.id, item.center?.id, 'dismiss')}>
          <Feather name="check" size={16} color={AuraColors.textSecondary} />
          <Text style={styles.textDismiss}>Descartar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnSuspend]} onPress={() => handleAction(item.id, item.center?.id, 'suspend')}>
          <Feather name="slash" size={16} color="white" />
          <Text style={styles.textSuspend}>Suspender Centro</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Feather name="arrow-left" size={20} color={AuraColors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Gestión de Reportes</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? <View style={styles.centerLoading}><ActivityIndicator size="large" color={AuraColors.primary} /></View> : (
        <FlatList
          data={reports}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AuraColors.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Feather name="shield" size={48} color={AuraColors.success} />
              <Text style={styles.emptyTitle}>Plataforma Segura</Text>
              <Text style={styles.emptySub}>No hay reportes de fraude pendientes.</Text>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge: { backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#EF4444', fontSize: 12, fontWeight: '700' },
  dateText: { fontSize: 12, color: AuraColors.textMuted },
  centerName: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary },
  reporterName: { fontSize: 13, color: AuraColors.textSecondary, marginTop: 4, marginBottom: 12 },
  descriptionBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: '#F59E0B', marginBottom: 16 },
  descriptionText: { fontSize: 14, color: AuraColors.textPrimary, fontStyle: 'italic', lineHeight: 20 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 10 },
  btnDismiss: { backgroundColor: '#F1F5F9' },
  textDismiss: { color: AuraColors.textSecondary, fontWeight: '600' },
  btnSuspend: { backgroundColor: '#EF4444' },
  textSuspend: { color: 'white', fontWeight: '700' },
  emptyBox: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: AuraColors.textPrimary, marginTop: 16 },
  emptySub: { fontSize: 14, color: AuraColors.textSecondary, marginTop: 8 },
});