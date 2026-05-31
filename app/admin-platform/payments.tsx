import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

export default function PlatformPaymentsLog() {
  const router = useRouter();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending_audit' | 'verified' | 'disputed'>('pending_audit');

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    // Incorporamos la lectura de 'payment_status' para la conciliación
    const { data, error } = await supabase
      .from('appointments')
      .select('id, payment_code, receipt_url, commission_amount, payment_status, created_at, client:client_id(full_name, email), center:center_id(name)')
      .not('payment_code', 'is', null)
      .order('created_at', { ascending: false });

    if (!error && data) setPayments(data);
    setLoading(false);
  };

  const handleConciliation = async (id: string, newStatus: 'verified' | 'disputed') => {
    Alert.alert(
      newStatus === 'verified' ? 'Consolidar Fondos' : 'Disputar Pago',
      newStatus === 'verified' 
        ? '¿Confirmas que el dinero ya ingresó físicamente a las cuentas bancarias de la plataforma?'
        : '¿Marcar este voucher como ilegítimo o fraudulento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar Acción',
          style: newStatus === 'disputed' ? 'destructive' : 'default',
          onPress: async () => {
            // Actualiza el campo de auditoría financiera
            const { error } = await supabase.from('appointments').update({ payment_status: newStatus }).eq('id', id);
            if (!error) {
              Alert.alert('Éxito', 'Estado contable actualizado.');
              fetchLogs(); // Refrescar los datos estructurados
            }
          }
        }
      ]
    );
  };

  const filteredPayments = payments.filter(p => {
    const status = p.payment_status || 'pending_audit'; // Si es null, asume que falta auditar
    return status === activeTab;
  });

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.clientName}>{item.client?.full_name}</Text>
          <Text style={styles.centerName}>Locación: {item.center?.name}</Text>
        </View>
        <View style={[styles.badge, activeTab === 'disputed' && { backgroundColor: '#FEE2E2' }, activeTab === 'pending_audit' && { backgroundColor: '#FEF3C7' }]}>
          <Feather name={activeTab === 'verified' ? "check-circle" : activeTab === 'disputed' ? "x-circle" : "clock"} size={12} color={activeTab === 'verified' ? "#10B981" : activeTab === 'disputed' ? "#EF4444" : "#D97706"} />
          <Text style={[styles.badgeText, activeTab === 'disputed' && { color: '#EF4444' }, activeTab === 'pending_audit' && { color: '#D97706' }]}>
            {activeTab === 'verified' ? 'Conciliado' : activeTab === 'disputed' ? 'Disputado' : 'Por Revisar'}
          </Text>
        </View>
      </View>

      <View style={styles.dataRow}>
        <View>
          <Text style={styles.label}>ID de Transacción Bancaria</Text>
          <Text style={styles.value}>{item.payment_code}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.label}>Valor Auditado</Text>
          <Text style={styles.amount}>Bs. {item.commission_amount}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.viewReceiptBtn} onPress={() => Linking.openURL(item.receipt_url)}>
        <Feather name="file-text" size={16} color={AuraColors.primary} />
        <Text style={styles.viewReceiptText}>Revisar Evidencia Documental (Voucher)</Text>
      </TouchableOpacity>

      {/* Herramientas de Decisión Financiera (Solo visibles si está pendiente) */}
      {activeTab === 'pending_audit' && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]} onPress={() => handleConciliation(item.id, 'disputed')}>
            <Text style={{ color: '#EF4444', fontWeight: '700' }}>Rechazar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10B981', flex: 2 }]} onPress={() => handleConciliation(item.id, 'verified')}>
            <Text style={{ color: 'white', fontWeight: '700' }}>Verificar Ingreso</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Feather name="arrow-left" size={20} color={AuraColors.textPrimary} /></TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Auditoría Financiera</Text>
          <Text style={styles.headerSub}>Conciliación de comisiones de plataforma</Text>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'pending_audit' && styles.tabBtnActive]} onPress={() => setActiveTab('pending_audit')}>
          <Text style={[styles.tabText, activeTab === 'pending_audit' && styles.tabTextActive]}>Por Revisar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'verified' && styles.tabBtnActive]} onPress={() => setActiveTab('verified')}>
          <Text style={[styles.tabText, activeTab === 'verified' && styles.tabTextActive]}>Consolidados</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'disputed' && styles.tabBtnActive]} onPress={() => setActiveTab('disputed')}>
          <Text style={[styles.tabText, activeTab === 'disputed' && styles.tabTextActive]}>Disputados</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={AuraColors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredPayments}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 80 }}>
              <Feather name="dollar-sign" size={40} color={AuraColors.border} />
              <Text style={{ textAlign: 'center', marginTop: 16, fontSize: 16, color: AuraColors.textSecondary, fontWeight: '600' }}>Flujo de caja limpio</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 24, paddingBottom: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  headerTitle: { fontSize: 22, fontWeight: '800', color: AuraColors.textPrimary },
  headerSub: { fontSize: 13, color: AuraColors.textSecondary, marginTop: 2 },
  tabsContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: AuraColors.border, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: AuraColors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: AuraColors.textSecondary },
  tabTextActive: { color: AuraColors.primary, fontWeight: '700' },
  list: { paddingHorizontal: 24, paddingBottom: 40 },
  card: { backgroundColor: AuraColors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: AuraColors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  clientName: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary },
  centerName: { fontSize: 13, color: AuraColors.textSecondary, marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#059669' },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  label: { fontSize: 11, color: AuraColors.textSecondary, marginBottom: 4, textTransform: 'uppercase', fontWeight: '700' },
  value: { fontSize: 15, fontWeight: '600', color: AuraColors.textPrimary },
  amount: { fontSize: 18, fontWeight: '800', color: AuraColors.primary },
  viewReceiptBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 12, backgroundColor: AuraColors.primaryLight, borderRadius: 12 },
  viewReceiptText: { color: AuraColors.primary, fontWeight: '700', fontSize: 14 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }
});