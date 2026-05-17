import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

export default function UsersManagementScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'superadmin')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredUsers(users);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const filtered = users.filter(
      user => 
        (user.full_name?.toLowerCase() || '').includes(lowerQuery) || 
        (user.email?.toLowerCase() || '').includes(lowerQuery)
    );
    setFilteredUsers(filtered);
  };

  const handleToggleSuspend = async (userId: string, currentRole: string, userName: string) => {
    const isSuspended = currentRole === 'suspended';
    const newRole = isSuspended ? 'client' : 'suspended';

    Alert.alert(
      isSuspended ? 'Reactivar Usuario' : 'Suspender Usuario',
      `¿Estás seguro de que deseas ${isSuspended ? 'reactivar' : 'suspender'} la cuenta de ${userName || 'este usuario'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: isSuspended ? 'default' : 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('profiles')
              .update({ role: newRole })
              .eq('id', userId);

            if (error) {
              Alert.alert('Error', 'No se pudo actualizar el estado.');
            } else {
              Alert.alert('Éxito', `Usuario ${isSuspended ? 'reactivado' : 'suspendido'} correctamente.`);
              const updatedUsers = users.map(u => u.id === userId ? { ...u, role: newRole } : u);
              setUsers(updatedUsers);
              setFilteredUsers(updatedUsers.filter(
                user => 
                  (user.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                  (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
              ));
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const isSuspended = item.role === 'suspended';
    return (
      <View style={[styles.card, isSuspended && styles.cardSuspended]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.userName, isSuspended && { color: AuraColors.textMuted }]}>
            {item.full_name || 'Sin Nombre'}
          </Text>
          <View style={[styles.roleBadge, isSuspended ? styles.roleBadgeSuspended : (item.role === 'center_owner' ? styles.roleBadgeOwner : styles.roleBadgeClient)]}>
            <Text style={[styles.roleText, isSuspended ? styles.roleTextSuspended : (item.role === 'center_owner' ? styles.roleTextOwner : styles.roleTextClient)]}>
              {isSuspended ? 'Suspendido' : (item.role === 'center_owner' ? 'Dueño de Centro' : 'Cliente')}
            </Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Feather name="mail" size={14} color={AuraColors.textSecondary} />
          <Text style={styles.infoText}>{item.email || 'Sin correo registrado'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Feather name="phone" size={14} color={AuraColors.textSecondary} />
          <Text style={styles.infoText}>{item.phone || 'Sin teléfono'}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.actionButton, isSuspended ? styles.btnActivate : styles.btnSuspend]}
          onPress={() => handleToggleSuspend(item.id, item.role, item.full_name)}
        >
          <Feather name={isSuspended ? "check-circle" : "slash"} size={16} color="white" />
          <Text style={styles.actionButtonText}>
            {isSuspended ? 'Reactivar Cuenta' : 'Suspender Cuenta'}
          </Text>
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
        <Text style={styles.headerTitle}>Gestión de Usuarios</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color={AuraColors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o correo..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor={AuraColors.textMuted}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearSearch}>
            <Feather name="x-circle" size={18} color={AuraColors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={AuraColors.primary} />
        </View>
      ) : (
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
              <Text style={styles.emptySub}>No se encontraron usuarios que coincidan con la búsqueda.</Text>
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
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: AuraColors.card, marginHorizontal: 24, marginBottom: 16, borderRadius: 12, borderWidth: 1, borderColor: AuraColors.border, paddingHorizontal: 12, height: 48 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: AuraColors.textPrimary, height: '100%' },
  clearSearch: { padding: 4 },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 24, paddingBottom: 40 },
  card: { backgroundColor: AuraColors.card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: AuraColors.border, marginBottom: 16 },
  cardSuspended: { backgroundColor: '#F9FAFB', borderColor: '#E2E8F0', opacity: 0.8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  userName: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary, flex: 1, marginRight: 8 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  roleText: { fontSize: 11, fontWeight: '700' }, // <-- CORRECCIÓN: Agregado estilo base
  roleBadgeClient: { backgroundColor: '#E0F2FE' },
  roleTextClient: { color: '#0284C7' },
  roleBadgeOwner: { backgroundColor: '#FEF3C7' },
  roleTextOwner: { color: '#D97706' },
  roleBadgeSuspended: { backgroundColor: '#FEE2E2' },
  roleTextSuspended: { color: '#EF4444' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoText: { fontSize: 13, color: AuraColors.textSecondary },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 10, marginTop: 12 },
  btnSuspend: { backgroundColor: '#EF4444' },
  btnActivate: { backgroundColor: '#10B981' },
  actionButtonText: { color: 'white', fontWeight: '700', fontSize: 14 },
  emptyBox: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary, marginTop: 16 },
  emptySub: { fontSize: 14, color: AuraColors.textSecondary, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
});