import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

export default function PlatformPaymentsLog() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    // Obtenemos las citas donde se pagó una comisión y tiene código
    const { data, error } = await supabase
      .from('appointments')
      .select('id, payment_code, receipt_url, commission_amount, status, created_at, client:client_id(full_name, email), center:center_id(name)')
      .not('payment_code', 'is', null)
      .order('created_at', { ascending: false });

    if (!error && data) setPayments(data);
    setLoading(false);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.clientName}>{item.client?.full_name}</Text>
          <Text style={styles.centerName}>Centro: {item.center?.name}</Text>
        </View>
        <View style={styles.badge}>
          <Feather name="check-circle" size={12} color="#10B981" />
          <Text style={styles.badgeText}>Auto-Verificado</Text>
        </View>
      </View>

      <View style={styles.dataRow}>
        <View>
          <Text style={styles.label}>Nro. Transacción</Text>
          <Text style={styles.value}>{item.payment_code}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.label}>Comisión Pagada</Text>
          <Text style={styles.amount}>Bs. {item.commission_amount}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.viewReceiptBtn} 
        onPress={() => Linking.openURL(item.receipt_url)}
      >
        <Feather name="image" size={16} color={AuraColors.primary} />
        <Text style={styles.viewReceiptText}>Ver Imagen del Comprobante</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Auditoría de Pagos</Text>
        <Text style={styles.headerSub}>Control automático de comisiones (10%)</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={AuraColors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 50 }}>No hay pagos registrados.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  header: { padding: 24, paddingBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: AuraColors.textPrimary },
  headerSub: { fontSize: 14, color: AuraColors.textSecondary, marginTop: 4 },
  list: { paddingHorizontal: 24, paddingBottom: 40 },
  card: { backgroundColor: AuraColors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: AuraColors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  clientName: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary },
  centerName: { fontSize: 13, color: AuraColors.textSecondary, marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#059669' },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: AuraColors.background, padding: 12, borderRadius: 12, marginBottom: 16 },
  label: { fontSize: 12, color: AuraColors.textSecondary, marginBottom: 4 },
  value: { fontSize: 14, fontWeight: '600', color: AuraColors.textPrimary },
  amount: { fontSize: 16, fontWeight: '800', color: AuraColors.primary },
  viewReceiptBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 12, borderTopWidth: 1, borderTopColor: AuraColors.border },
  viewReceiptText: { color: AuraColors.primary, fontWeight: '600', fontSize: 14 }
});