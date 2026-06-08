import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

export default function AdminTicketsScreen() {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      // Traemos los tickets y el nombre/correo del usuario que lo envió
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*, profiles(full_name, email, role)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error cargando tickets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchTickets(); };

  const handleResolve = async (ticketId: string) => {
    Alert.alert(
      'Marcar como Resuelto',
      '¿Ya revisaste o solucionaste este reporte?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'default',
          onPress: async () => {
            try {
              const { error } = await supabase.from('support_tickets').update({ status: 'resolved' }).eq('id', ticketId);
              if (error) throw error;
              setTickets(prev => prev.filter(t => t.id !== ticketId));
            } catch (err) {
              Alert.alert('Error', 'No se pudo actualizar el estado.');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const isBug = item.type === 'bug';
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: isBug ? '#FEE2E2' : '#E0E7FF' }]}>
            {/* AQUÍ ESTÁ EL CAMBIO: usamos 'as any' para ignorar la advertencia de tipo */}
            <Feather 
              name={(isBug ? "alert-triangle" : "help-circle") as any} 
              size={12} 
              color={isBug ? '#EF4444' : '#3730A3'} 
              style={{marginRight: 4}} 
            />
            <Text style={[styles.badgeText, { color: isBug ? '#EF4444' : '#3730A3' }]}>
              {isBug ? 'Error Técnico' : 'Sugerencia'}
            </Text>
          </View>
          <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        
        <Text style={styles.userName}>{item.profiles?.full_name || 'Usuario Anónimo'}</Text>
        <Text style={styles.userEmail}>{item.profiles?.email || 'Sin correo'}</Text>
        
        <View style={[styles.contentBox, { borderLeftColor: isBug ? '#EF4444' : '#3B82F6' }]}>
          <Text style={styles.contentText}>"{item.content}"</Text>
        </View>

        <TouchableOpacity style={styles.resolveBtn} onPress={() => handleResolve(item.id)}>
          <Feather name="check" size={16} color="white" />
          <Text style={styles.resolveBtnText}>Marcar como Resuelto</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buzón de Soporte</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? <View style={styles.centerLoading}><ActivityIndicator size="large" color={AuraColors.primary} /></View> : (
        <FlatList
          data={tickets.filter(t => t.status !== 'resolved')}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AuraColors.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Feather name="inbox" size={48} color={AuraColors.border} />
              <Text style={styles.emptyTitle}>Buzón Vacío</Text>
              <Text style={styles.emptySub}>No hay mensajes o reportes pendientes.</Text>
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
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  dateText: { fontSize: 12, color: AuraColors.textMuted },
  userName: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary },
  userEmail: { fontSize: 13, color: AuraColors.textSecondary, marginBottom: 12 },
  contentBox: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 10, borderLeftWidth: 4, marginBottom: 16 },
  contentText: { fontSize: 14, color: AuraColors.textPrimary, fontStyle: 'italic', lineHeight: 22 },
  resolveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 10, backgroundColor: '#10B981' },
  resolveBtnText: { color: 'white', fontWeight: '700' },
  emptyBox: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: AuraColors.textPrimary, marginTop: 16 },
  emptySub: { fontSize: 14, color: AuraColors.textSecondary, marginTop: 8 },
});