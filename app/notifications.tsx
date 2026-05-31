import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/contexts/AuthContext';
import { supabase } from '../src/lib/supabase';
import { AuraColors } from '../src/theme/colors';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
      
      // Opcional: Marcar todas como leídas al entrar a la pantalla
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
      
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  // Helper para mostrar formato "Hace 2 horas", "Ayer", etc.
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Hace un momento';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Ayer';
    return `Hace ${diffInDays} días`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={AuraColors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AuraColors.primary]} />}
        ListHeaderComponent={<Text style={styles.title}>Notificaciones</Text>}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="bell-off" size={48} color={AuraColors.border} />
            <Text style={styles.emptyTitle}>Nada por aquí</Text>
            <Text style={styles.emptyText}>No tienes notificaciones nuevas en este momento.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, !item.is_read && styles.cardUnread]}>
            <View style={styles.iconContainer}>
              <Feather name={item.icon as any} size={20} color={AuraColors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMessage}>{item.message}</Text>
              <Text style={styles.cardTime}>{formatTimeAgo(item.created_at)}</Text>
            </View>
            {!item.is_read && <View style={styles.unreadDot} />}
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  title: { fontSize: 24, fontWeight: '800', padding: 24, paddingBottom: 16, color: AuraColors.textPrimary },
  list: { paddingHorizontal: 24, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: AuraColors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: AuraColors.border,
  },
  cardUnread: {
    backgroundColor: AuraColors.primaryLight,
    borderColor: 'transparent',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: AuraColors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 4 },
  cardMessage: { fontSize: 14, color: AuraColors.textSecondary, lineHeight: 20 },
  cardTime: { fontSize: 12, color: AuraColors.textMuted, marginTop: 8, fontWeight: '500' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: AuraColors.primary, marginTop: 6 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary, marginTop: 16 },
  emptyText: { fontSize: 14, color: AuraColors.textSecondary, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 },
});