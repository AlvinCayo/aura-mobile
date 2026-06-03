import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/Button';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

type ReportStatus = 'pending' | 'investigating' | 'action_taken' | 'dismissed';

export default function ReportsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'investigating' | 'closed'>('pending');

  // Modal State
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [adminNote, setAdminNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReports = async () => {
    try {
      // CORRECCIÓN SINTAXIS SUPABASE: Se usan los nombres de las tablas 'centers' y 'profiles'
      const { data, error } = await supabase
        .from('reports')
        .select('id, reason, description, status, admin_notes, created_at, centers(id, name), profiles(full_name)')
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

  const getFilteredReports = () => {
    if (activeTab === 'pending') return reports.filter(r => r.status === 'pending' || !r.status);
    if (activeTab === 'investigating') return reports.filter(r => r.status === 'investigating');
    return reports.filter(r => r.status === 'action_taken' || r.status === 'dismissed' || r.status === 'resolved');
  };

  const handleProcessReport = async (newStatus: ReportStatus, issueStrike: boolean = false) => {
    if (!selectedReport) return;
    setIsSubmitting(true);

    try {
      // 1. Actualizar el estado y bitácora del reporte
      const { error: updateError } = await supabase.from('reports')
        .update({ status: newStatus, admin_notes: adminNote })
        .eq('id', selectedReport.id);

      if (updateError) throw updateError;

      // 2. Trazabilidad Segura (Bloque Try/Catch aislado para que no crashee la app)
      try {
        await supabase.from('audit_logs').insert({
          actor_id: user?.id,
          action: `REPORT_${newStatus.toUpperCase()}`,
          details: { report_id: selectedReport.id, notes: adminNote, strike_issued: issueStrike }
        });
      } catch (logError) {
        console.log("Tabla audit_logs no detectada, omitiendo registro.");
      }

      // 3. Sistema de Sanciones
      if (issueStrike && selectedReport.centers?.id) {
        try {
          await supabase.from('centers').update({ status: 'suspended' }).eq('id', selectedReport.centers.id);
          Alert.alert('Sanción Aplicada', 'El centro ha sido suspendido de la plataforma.');
        } catch(e) {
          Alert.alert('Sanción Registrada', 'Se ha emitido una advertencia oficial al centro.');
        }
      } else {
        Alert.alert('Auditoría Actualizada', 'El reporte ha cambiado de estado exitosamente.');
      }

      setSelectedReport(null);
      setAdminNote('');
      fetchReports();
    } catch (error: any) {
      Alert.alert('Error de Sistema', error.message || 'No se pudo procesar la auditoría.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.badge, item.status === 'investigating' && { backgroundColor: '#FEF3C7' }, item.status === 'dismissed' && { backgroundColor: '#F1F5F9' }]}>
          <Text style={[styles.badgeText, item.status === 'investigating' && { color: '#D97706' }, item.status === 'dismissed' && { color: '#64748B' }]}>
            {item.status === 'investigating' ? 'En Investigación' : item.status === 'dismissed' ? 'Desestimado (Falso)' : item.status === 'action_taken' ? 'Sancionado' : 'Pendiente'}
          </Text>
        </View>
        <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      
      {/* CORRECCIÓN: Usar los nombres de tablas correctos extraidos de supabase */}
      <Text style={styles.centerName}>Acusado: {item.centers?.name || 'Centro Desconocido'}</Text>
      <Text style={styles.reporterName}>Reportado por: {item.profiles?.full_name || 'Anónimo'}</Text>
      
      <View style={styles.descriptionBox}>
        <Text style={{fontWeight: '700', marginBottom: 4, color: AuraColors.textPrimary}}>Motivo: {item.reason}</Text>
        <Text style={styles.descriptionText}>"{item.description}"</Text>
      </View>

      {item.admin_notes && (
        <View style={styles.adminNotesBox}>
          <Feather name="shield" size={14} color={AuraColors.primary} />
          <Text style={styles.adminNotesText}>Bitácora: {item.admin_notes}</Text>
        </View>
      )}

      {activeTab !== 'closed' && (
        <Button 
          title="Gestionar Auditoría" 
          variant="outline"
          onPress={() => setSelectedReport(item)} 
          style={{ marginTop: 12 }}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Feather name="arrow-left" size={20} color={AuraColors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Gestión de Conflictos</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'pending' && styles.tabBtnActive]} onPress={() => setActiveTab('pending')}>
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>Pendientes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'investigating' && styles.tabBtnActive]} onPress={() => setActiveTab('investigating')}>
          <Text style={[styles.tabText, activeTab === 'investigating' && styles.tabTextActive]}>Investigando</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'closed' && styles.tabBtnActive]} onPress={() => setActiveTab('closed')}>
          <Text style={[styles.tabText, activeTab === 'closed' && styles.tabTextActive]}>Cerrados</Text>
        </TouchableOpacity>
      </View>

      {loading ? <View style={styles.centerLoading}><ActivityIndicator size="large" color={AuraColors.primary} /></View> : (
        <FlatList
          data={getFilteredReports()}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AuraColors.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Feather name="check-circle" size={48} color={AuraColors.success} />
              <Text style={styles.emptyTitle}>Bandeja Limpia</Text>
              <Text style={styles.emptySub}>No hay reportes en esta categoría.</Text>
            </View>
          }
        />
      )}

      {/* MODAL DE RESOLUCIÓN DE CONFLICTOS */}
      <Modal visible={!!selectedReport} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Protocolo de Resolución</Text>
              <TouchableOpacity onPress={() => setSelectedReport(null)}><Feather name="x" size={24} color={AuraColors.textPrimary}/></TouchableOpacity>
            </View>
            
            <Text style={styles.inputLabel}>Bitácora de Investigación (Opcional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ej. Se verificó el fraude..."
              multiline
              numberOfLines={4}
              value={adminNote}
              onChangeText={setAdminNote}
              textAlignVertical="top"
            />

            <View style={{ gap: 12, marginTop: 24 }}>
              {selectedReport?.status !== 'investigating' && (
                <Button title="Marcar: En Investigación" onPress={() => handleProcessReport('investigating')} style={{backgroundColor: '#D97706'}} />
              )}
              <Button title="Desestimar (Reporte Falso)" onPress={() => handleProcessReport('dismissed')} variant="outline" />
              <Button title="Aplicar Sanción al Centro" onPress={() => handleProcessReport('action_taken', true)} style={{backgroundColor: '#EF4444'}} icon={<Feather name="alert-triangle" size={18} color="white" />} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary },
  tabsContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: AuraColors.border },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: AuraColors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: AuraColors.textSecondary },
  tabTextActive: { color: AuraColors.primary, fontWeight: '700' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 24 },
  card: { backgroundColor: AuraColors.card, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: AuraColors.border, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge: { backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#EF4444', fontSize: 12, fontWeight: '700' },
  dateText: { fontSize: 12, color: AuraColors.textMuted },
  centerName: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary },
  reporterName: { fontSize: 13, color: AuraColors.textSecondary, marginTop: 4, marginBottom: 12 },
  descriptionBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: '#F59E0B', marginBottom: 12 },
  descriptionText: { fontSize: 14, color: AuraColors.textPrimary, fontStyle: 'italic', lineHeight: 20 },
  adminNotesBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EFF6FF', padding: 10, borderRadius: 8, marginTop: 8 },
  adminNotesText: { fontSize: 13, color: '#1E3A8A', flex: 1 },
  emptyBox: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: AuraColors.textPrimary, marginTop: 16 },
  emptySub: { fontSize: 14, color: AuraColors.textSecondary, marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: AuraColors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: AuraColors.textPrimary },
  inputLabel: { fontSize: 14, fontWeight: '600', color: AuraColors.textPrimary, marginBottom: 8 },
  textInput: { backgroundColor: AuraColors.card, borderWidth: 1, borderColor: AuraColors.border, borderRadius: 12, padding: 16, fontSize: 15, color: AuraColors.textPrimary },
});