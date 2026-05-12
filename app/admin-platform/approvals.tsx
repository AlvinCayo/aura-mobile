import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuraColors } from '../../src/theme/colors';

const PENDING_CENTERS = [
  { id: '1', name: 'Centro Wellness Plus', address: 'Calle Norte #456', submitted: 'Hace 2 horas', documents: 3, complete: true },
  { id: '2', name: 'Spa Natural Beauty', address: 'Av. Sur #789', submitted: 'Hace 1 día', documents: 2, complete: false },
  { id: '3', name: 'Estética Premium', address: 'Centro Comercial #12', submitted: 'Hace 2 días', documents: 3, complete: true },
];

const REVIEWED_CENTERS = [
  { id: '4', name: 'Spa Relax', status: 'approved', date: 'Ayer' },
  { id: '5', name: 'Beauty Center', status: 'rejected', date: 'Hace 3 días' },
];

export default function AdminApprovalPanelScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        contentContainerStyle={styles.scroll}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Aprobaciones</Text>
            <Text style={styles.subtitle}>5 centros pendientes</Text>
          </>
        }
        data={[]}
        renderItem={() => null}
        ListFooterComponent={
          <>
            {/* Pendientes */}
            <Text style={styles.sectionTitle}>Nuevos ({PENDING_CENTERS.length})</Text>
            {PENDING_CENTERS.map((center) => (
              <TouchableOpacity
                key={center.id}
                style={styles.card}
                onPress={() => router.push(`/admin-platform/approvals/${center.id}` as any)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{center.name}</Text>
                  <Text style={styles.cardAddress}>{center.address}</Text>
                  <Text style={styles.cardMeta}>{center.submitted} · {center.documents} documentos</Text>
                </View>
                <View style={[styles.completenessBadge, { backgroundColor: center.complete ? '#EDF7ED' : '#FDF3E0' }]}>
                  <Text style={{ color: center.complete ? AuraColors.success : AuraColors.warning, fontSize: 12 }}>
                    {center.complete ? 'Completo' : 'Incompleto'}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={AuraColors.textMuted} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            ))}

            {/* Revisados */}
            <Text style={styles.sectionTitle}>Revisados Recientemente</Text>
            {REVIEWED_CENTERS.map((center) => (
              <View key={center.id} style={styles.card}>
                <Feather
                  name={center.status === 'approved' ? 'check-circle' : 'x-circle'}
                  size={20}
                  color={center.status === 'approved' ? AuraColors.success : AuraColors.destructive}
                  style={{ marginRight: 12 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{center.name}</Text>
                  <Text style={styles.cardAddress}>{center.date}</Text>
                </View>
                <Text style={{ color: center.status === 'approved' ? AuraColors.success : AuraColors.destructive, fontWeight: '600' }}>
                  {center.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                </Text>
              </View>
            ))}
          </>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  scroll: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: AuraColors.textPrimary },
  subtitle: { fontSize: 14, color: AuraColors.textSecondary, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: AuraColors.textPrimary, marginTop: 20, marginBottom: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: AuraColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AuraColors.border,
    marginBottom: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: AuraColors.textPrimary },
  cardAddress: { fontSize: 13, color: AuraColors.textSecondary },
  cardMeta: { fontSize: 12, color: AuraColors.textMuted, marginTop: 2 },
  completenessBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
});