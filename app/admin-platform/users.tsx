import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

type FilterRole = 'all' | 'client' | 'center_owner' | 'suspended';

export default function AdminUsersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterRole>('all');

  const fetchUsers = async () => {
    try {
      // 1. Obtenemos TODOS los perfiles EXCEPTO a los superadmins (para no degradarse a sí mismos)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'superadmin')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo cargar la lista de usuarios.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Motor de Búsqueda y Filtrado en Tiempo Real
  useEffect(() => {
    let result = users;

    // Filtro por Rol
    if (activeFilter !== 'all') {
      result = result.filter(u => u.role === activeFilter);
    }

    // Filtro por Texto (Nombre o Correo)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(u => 
        (u.full_name && u.full_name.toLowerCase().includes(q)) || 
        (u.email && u.email.toLowerCase().includes(q))
      );
    }

    setFilteredUsers(result);
  }, [searchQuery, activeFilter, users]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleToggleSuspend = (targetUser: any) => {
    const isSuspending = targetUser.role !== 'suspended';
    const newRole = isSuspending ? 'suspended' : 'client'; // Si reactivamos, lo dejamos como cliente por defecto

    Alert.alert(
      isSuspending ? 'Suspender Usuario' : 'Reactivar Usuario',
      `¿Estás seguro de que quieres ${isSuspending ? 'suspender' : 'reactivar'} el acceso de ${targetUser.full_name || 'este usuario'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          style: isSuspending ? 'destructive' : 'default',
          onPress: async () => {
            try {
              // 1. Actualizar el rol del usuario
              const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', targetUser.id);
              
              if (error) throw error;

              // 2. Registrar la acción en Audit Logs (Requisito de Tesis)
              await supabase.from('audit_logs').insert({
                actor_id: user?.id,
                action: isSuspending ? 'SUSPEND_USER' : 'REACTIVATE_USER',
                details: { target_user_id: targetUser.id, target_email: targetUser.email }
              });

              Alert.alert('Éxito', `El usuario ha sido ${isSuspending ? 'suspendido' : 'reactivado'}.`);
              fetchUsers(); // Refrescar lista

            } catch (error: any) {
              Alert.alert('Error', error.message || 'Hubo un fallo al realizar la acción.');
            }
          }
        }
      ]
    );
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'client': return { text: 'Cliente', bg: '#E0E7FF', color: '#3730A3' };
      case 'center_owner': return { text: 'Centro Estético', bg: '#DCFCE7', color: '#166534' };
      case 'suspended': return { text: 'Suspendido', bg: '#FEE2E2', color: '#991B1B' };
      default: return { text: role, bg: '#F1F5F9', color: '#475569' };
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const badge = getRoleBadge(item.role);
    const isSuspended = item.role === 'suspended';

    return (
      <View style={[styles.userCard, isSuspended && styles.userCardSuspended]}>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.full_name || 'Sin Nombre'}</Text>
            <Text style={styles.userEmail}>{item.email || 'Correo no disponible'}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
          </View>
        </View>

        <View style={styles.userActions}>
          <Text style={styles.dateText}>Registrado: {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</Text>
          <TouchableOpacity 
            style={[styles.suspendButton, isSuspended ? styles.reactivateButton : null]} 
            onPress={() => handleToggleSuspend(item)}
          >
            <Feather name={isSuspended ? "check-circle" : "slash"} size={14} color="white" />
            <Text style={styles.suspendButtonText}>{isSuspended ? "Reactivar" : "Suspender"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={AuraColors.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestión de Usuarios</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Feather name="search" size={20} color={AuraColors.textMuted} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Buscar por nombre o correo..." 
            value={searchQuery} 
            onChangeText={setSearchQuery} 
            placeholderTextColor={AuraColors.textMuted} 
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x-circle" size={18} color={AuraColors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* NUEVO: Filtros Rapidos SuperAdmin */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 24 }}>
          {(['all', 'client', 'center_owner', 'suspended'] as FilterRole[]).map((filter) => (
            <TouchableOpacity 
              key={filter} 
              style={[styles.filterPill, activeFilter === filter && styles.filterPillActive]} 
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                {filter === 'all' ? 'Todos' : filter === 'client' ? 'Clientes' : filter === 'center_owner' ? 'Centros' : 'Suspendidos'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>Mostrando {filteredUsers.length} usuarios</Text>
      </View>

      <FlatList 
        data={filteredUsers} 
        keyExtractor={item => item.id} 
        renderItem={renderItem} 
        contentContainerStyle={styles.listContent} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AuraColors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Feather name="users" size={48} color={AuraColors.border} />
            <Text style={styles.emptyTitle}>Sin resultados</Text>
            <Text style={styles.emptySub}>No se encontraron usuarios con ese criterio.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  headerTitle: { fontSize: 20, fontWeight: '700', color: AuraColors.textPrimary },
  
  searchContainer: { paddingHorizontal: 24, marginBottom: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: AuraColors.card, paddingHorizontal: 16, height: 50, borderRadius: 12, borderWidth: 1, borderColor: AuraColors.border },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, color: AuraColors.textPrimary, height: '100%' },
  
  filtersContainer: { marginBottom: 12 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: AuraColors.card, borderWidth: 1, borderColor: AuraColors.border },
  filterPillActive: { backgroundColor: AuraColors.primary, borderColor: AuraColors.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: AuraColors.textSecondary },
  filterTextActive: { color: 'white' },
  
  statsContainer: { paddingHorizontal: 24, marginBottom: 8 },
  statsText: { fontSize: 12, color: AuraColors.textMuted, fontWeight: '500' },
  
  listContent: { paddingHorizontal: 24, paddingBottom: 40 },
  userCard: { backgroundColor: AuraColors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: AuraColors.border },
  userCardSuspended: { opacity: 0.6, borderColor: '#FCA5A5' },
  userHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  userInfo: { flex: 1, paddingRight: 12 },
  userName: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 2 },
  userEmail: { fontSize: 13, color: AuraColors.textSecondary },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  
  userActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: AuraColors.border },
  dateText: { fontSize: 12, color: AuraColors.textMuted },
  suspendButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  reactivateButton: { backgroundColor: '#16A34A' },
  suspendButtonText: { color: 'white', fontSize: 12, fontWeight: '600' },
  
  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary, marginTop: 16 },
  emptySub: { fontSize: 14, color: AuraColors.textSecondary, marginTop: 8 },
});