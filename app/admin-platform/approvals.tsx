import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

interface Center {
  id: string;
  name: string;
  address: string;
  owner: { full_name: string; email: string };
  license_url: string;
  created_at: string;
}

export default function AdminApprovalPanelScreen() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchPending = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('centers')
      .select('id, name, address, license_url, created_at, owner:profiles!owner_id ( full_name, email )')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      // Supabase devuelve owner como array de un elemento, lo convertimos a objeto
      const formatted = (data || []).map((item: any) => ({
        ...item,
        owner: Array.isArray(item.owner) ? item.owner[0] : item.owner,
      }));
      setCenters(formatted);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = (id: string) => {
    Alert.alert('Aprobar centro', '¿Confirmar aprobación?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Aprobar',
        onPress: async () => {
          const { error } = await supabase.from('centers').update({ status: 'approved' }).eq('id', id);
          if (error) Alert.alert('Error', error.message);
          else fetchPending();
        },
      },
    ]);
  };

  const handleReject = (id: string) => {
    Alert.alert('Rechazar centro', '¿Confirmar rechazo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Rechazar',
        onPress: async () => {
          const { error } = await supabase.from('centers').update({ status: 'rejected' }).eq('id', id);
          if (error) Alert.alert('Error', error.message);
          else fetchPending();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Aprobaciones</Text>
        <Text style={styles.subtitle}>{centers.length} centros pendientes</Text>
      </View>

      <FlatList
        data={centers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={fetchPending}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.centerName}>{item.name}</Text>
              <Text style={styles.address}>{item.address}</Text>
              {item.owner && (
                <Text style={styles.owner}>Dueño: {item.owner.full_name} ({item.owner.email})</Text>
              )}
              <Text style={styles.date}>Solicitud: {new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.approveButton} onPress={() => handleApprove(item.id)}>
                <Feather name="check" size={16} color="white" />
                <Text style={styles.actionText}>Aprobar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectButton} onPress={() => handleReject(item.id)}>
                <Feather name="x" size={16} color="white" />
                <Text style={styles.actionText}>Rechazar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="inbox" size={48} color={AuraColors.textMuted} />
            <Text style={styles.emptyText}>No hay solicitudes pendientes</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  header: { padding: 24, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: AuraColors.textPrimary },
  subtitle: { fontSize: 14, color: AuraColors.textSecondary, marginTop: 4 },
  list: { paddingHorizontal: 24, paddingBottom: 32 },
  card: {
    backgroundColor: AuraColors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: AuraColors.border,
  },
  centerName: { fontSize: 16, fontWeight: '600', color: AuraColors.textPrimary },
  address: { fontSize: 14, color: AuraColors.textSecondary },
  owner: { fontSize: 13, color: AuraColors.textMuted, marginTop: 4 },
  date: { fontSize: 12, color: AuraColors.textMuted, marginTop: 4 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
  approveButton: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: AuraColors.success, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8,
  },
  rejectButton: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: AuraColors.destructive, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8,
  },
  actionText: { color: 'white', fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: AuraColors.textMuted, marginTop: 12 },
});