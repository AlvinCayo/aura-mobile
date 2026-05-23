import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Linking, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

type Tab = 'centers' | 'payments';

export default function ApprovalsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('payments');
  const [centers, setCenters] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Centros pendientes: traemos nombre, propietario y licencia
      const { data: cData } = await supabase
        .from('centers')
        .select('*, profiles(full_name)')
        .eq('status', 'pending');
      if (cData) setCenters(cData);

      // Pagos pendientes
      const { data: pData } = await supabase
        .from('appointments')
        .select(`id, receipt_url, payment_code, commission_amount, profiles(full_name), centers(name)`)
        .eq('status', 'verifying_payment');
      if (pData) setPayments(pData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- LÓGICA DE PAGOS ---
  const handleVerifyPayment = (appointmentId: string, paymentCode: string) => {
    Alert.alert('Validar Ingreso AURA', `¿Confirmas que recibiste el depósito con la glosa: ${paymentCode}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sí, Aprobar', onPress: async () => {
          const { error } = await supabase.from('appointments').update({ status: 'paid' }).eq('id', appointmentId);
          if (!error) { Alert.alert('Éxito', 'Pago validado.'); fetchData(); }
        }
      }
    ]);
  };

  const handleRejectPayment = (appointmentId: string) => {
    Alert.alert('Rechazar Pago', 'Se cancelará la cita.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Rechazar', style: 'destructive', onPress: async () => {
          await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', appointmentId);
          fetchData();
      }}
    ]);
  };

  // --- LÓGICA DE CENTROS NUEVOS ---
  const handleApproveCenter = async (centerId: string) => {
    await supabase.from('centers').update({ status: 'approved' }).eq('id', centerId);
    Alert.alert('Éxito', 'Centro aprobado y publicado.');
    fetchData();
  };

  const handleRejectCenter = async (centerId: string) => {
    await supabase.from('centers').update({ status: 'rejected' }).eq('id', centerId);
    Alert.alert('Aviso', 'Centro rechazado.');
    fetchData();
  };

  const renderPaymentItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Reserva de: {item.profiles?.full_name}</Text>
      <Text style={styles.cardSubtitle}>Para: {item.centers?.name}</Text>
      <View style={styles.securityBox}>
        <Feather name="hash" size={20} color="#D97706" />
        <View>
          <Text style={{fontSize: 12, color: '#D97706'}}>Glosa bancaria:</Text>
          <Text style={styles.securityText}>{item.payment_code}</Text>
        </View>
      </View>
      <Text style={styles.amountText}>Monto: {item.commission_amount} Bs</Text>
      <TouchableOpacity onPress={() => Linking.openURL(item.receipt_url)}>
        <Image source={{ uri: item.receipt_url }} style={styles.receiptThumb} resizeMode="cover" />
        <Text style={styles.viewFullText}>Ver comprobante</Text>
      </TouchableOpacity>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#FEE2E2'}]} onPress={() => handleRejectPayment(item.id)}><Text style={{color: '#991B1B', fontWeight:'700'}}>Rechazar</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#DCFCE7'}]} onPress={() => handleVerifyPayment(item.id, item.payment_code)}><Text style={{color: '#166534', fontWeight:'700'}}>Aprobar</Text></TouchableOpacity>
      </View>
    </View>
  );

  const renderCenterItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.cardSubtitle}>Dueño: {item.profiles?.full_name || 'Desconocido'}</Text>
      
      <TouchableOpacity style={styles.licenseBtn} onPress={() => Linking.openURL(item.license_url)}>
        <Feather name="file-text" size={16} color={AuraColors.primary} />
        <Text style={{color: AuraColors.primary, marginLeft: 8, fontWeight: '600'}}>Ver Licencia de Funcionamiento</Text>
      </TouchableOpacity>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#FEE2E2'}]} onPress={() => handleRejectCenter(item.id)}><Text style={{color: '#991B1B', fontWeight:'700'}}>Rechazar</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#DCFCE7'}]} onPress={() => handleApproveCenter(item.id)}><Text style={{color: '#166534', fontWeight:'700'}}>Aprobar</Text></TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Feather name="arrow-left" size={20} color={AuraColors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Auditoría AURA</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'payments' && styles.tabBtnActive]} onPress={() => setActiveTab('payments')}>
          <Text style={[styles.tabText, activeTab === 'payments' && styles.tabTextActive]}>Validar Pagos ({payments.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'centers' && styles.tabBtnActive]} onPress={() => setActiveTab('centers')}>
          <Text style={[styles.tabText, activeTab === 'centers' && styles.tabTextActive]}>Centros Nuevos ({centers.length})</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator size="large" color={AuraColors.primary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={activeTab === 'payments' ? payments : centers}
          keyExtractor={item => item.id}
          renderItem={activeTab === 'payments' ? renderPaymentItem : renderCenterItem}
          contentContainerStyle={{ padding: 24 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary },
  tabs: { flexDirection: 'row', paddingHorizontal: 24, marginBottom: 12 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: AuraColors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: AuraColors.textSecondary },
  tabTextActive: { color: AuraColors.primary },
  card: { backgroundColor: AuraColors.card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: AuraColors.border, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary },
  cardSubtitle: { fontSize: 14, color: AuraColors.textSecondary, marginBottom: 12 },
  securityBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FEF3C7', padding: 14, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#FDE68A' },
  securityText: { fontSize: 22, fontWeight: '900', color: '#B45309', letterSpacing: 1 },
  amountText: { fontSize: 16, fontWeight: '800', color: AuraColors.primary, marginBottom: 12, textAlign: 'center' },
  receiptThumb: { width: '100%', height: 180, borderRadius: 12, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: AuraColors.border },
  viewFullText: { textAlign: 'center', fontSize: 12, color: AuraColors.textMuted, marginTop: 8, marginBottom: 16, fontWeight: '600' },
  licenseBtn: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: AuraColors.primaryLight, borderRadius: 8, marginBottom: 16 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  actionText: { fontWeight: '700', fontSize: 15 },
});