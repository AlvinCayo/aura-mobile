import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterRole>('all');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // CORRECCIÓN 1: Traemos la tabla centers para poder buscar por nombre comercial
      const { data, error } = await supabase
        .from('profiles')
        .select('*, centers:centers(id, name)')
        .neq('role', 'superadmin')
        .order('created_at', { ascending: false })
        .limit(1000); 

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo cargar la arquitectura de usuarios.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // CORRECCIÓN 2: Filtros Inteligentes Optimizados
  const filteredUsers = useMemo(() => {
    let result = users;
    
    // Arreglo del filtro "Clientes" (Abarca nulos, indefinidos y 'user')
    if (activeFilter !== 'all') {
      if (activeFilter === 'client') {
        result = result.filter(u => u.role === 'client' || !u.role || u.role === '' || u.role === 'user');
      } else {
        result = result.filter(u => u.role === activeFilter);
      }
    }

    // Buscador por Nombre, Correo o Nombre del Centro
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(u => {
        const fullName = (u.full_name || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        
        // Extraer nombre del centro de forma segura
        const centerData = u.centers;
        const centerName = (centerData?.name || (Array.isArray(centerData) ? centerData[0]?.name : '') || '').toLowerCase();

        return fullName.includes(q) || email.includes(q) || centerName.includes(q);
      });
    }
    return result;
  }, [users, activeFilter, searchQuery]);

  const onRefresh = () => { setRefreshing(true); fetchUsers(); };

  // Auditoría Rápida del Usuario
  const handleInspectUser = async (targetUser: any) => {
    try {
      const { count: apptCount } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('client_id', targetUser.id);
      const { count: reportCount } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('reporter_id', targetUser.id);
      
      Alert.alert(
        `Auditoría: ${targetUser.full_name}`,
        `Rol Actual: ${(targetUser.role || 'cliente').toUpperCase()}\nCitas Registradas: ${apptCount || 0}\nReportes Emitidos: ${reportCount || 0}\nIngreso al Sistema: ${new Date(targetUser.created_at).toLocaleDateString()}`,
        [{ text: 'Cerrar Inspector', style: 'cancel' }]
      );
    } catch(e) {
      Alert.alert('Aviso', 'No se pudieron recuperar las métricas de este usuario.');
    }
  };

  const handleToggleSuspend = (targetUser: any) => {
    const isSuspending = targetUser.role !== 'suspended';
    const newRole = isSuspending ? 'suspended' : 'client'; 

    Alert.alert(
      isSuspending ? 'Revocar Acceso (Ban)' : 'Restaurar Acceso',
      `Se modificará el acceso de ${targetUser.full_name || 'este usuario'}. ¿Proceder?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          style: isSuspending ? 'destructive' : 'default',
          onPress: async () => {
            try {
              // CORRECCIÓN 3: Agregamos .select() para obligar a Supabase a decirnos si el RLS bloqueó la acción
              const { data, error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', targetUser.id)
                .select(); // <--- Esto es vital para saber si realmente se actualizó
              
              if (error) throw error;

              // Si Supabase devuelve un arreglo vacío, significa que el RLS bloqueó la edición.
              if (!data || data.length === 0) {
                 throw new Error("Supabase bloqueó la acción por seguridad (RLS). Debes agregar la política en el SQL Editor.");
              }

              // Intentar registrar el log (no bloquea si la tabla no existe)
              try {
                await supabase.from('audit_logs').insert({
                  actor_id: user?.id,
                  action: isSuspending ? 'ACCESS_REVOKED' : 'ACCESS_RESTORED',
                  details: { target_user_id: targetUser.id }
                });
              } catch (auditError) {
                // Se ignora silenciosamente si no tienes configurada la tabla logs
              }

              Alert.alert('Éxito', `Usuario ${isSuspending ? 'suspendido' : 'restaurado'} correctamente.`);
              fetchUsers(); // Recarga la lista para mostrar el cambio en tiempo real
            } catch (error: any) {
              Alert.alert('Acción Denegada', error.message || 'Fallo en la manipulación de roles.');
            }
          }
        }
      ]
    );
  };

  const getRoleBadge = (role: string) => {
    if (!role || role === 'client' || role === 'user') return { text: 'Cliente', bg: '#E0E7FF', color: '#3730A3' };
    switch (role) {
      case 'center_owner': return { text: 'Centro Estético', bg: '#DCFCE7', color: '#166534' };
      case 'suspended': return { text: 'Acceso Revocado', bg: '#FEE2E2', color: '#991B1B' };
      default: return { text: role, bg: '#F1F5F9', color: '#475569' };
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const badge = getRoleBadge(item.role);
    const isSuspended = item.role === 'suspended';
    
    // Rescatar el nombre del centro para mostrarlo debajo del nombre
    const centerData = item.centers;
    const associatedCenterName = centerData?.name || (Array.isArray(centerData) ? centerData[0]?.name : null);

    return (
      <View style={[styles.userCard, isSuspended && styles.userCardSuspended]}>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.full_name || 'Sin Nombre'}</Text>
            <Text style={styles.userEmail}>{item.email || 'Correo no disponible'}</Text>
            {associatedCenterName && (
              <Text style={styles.centerSubName}>Centro: {associatedCenterName}</Text>
            )}
          </View>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
          </View>
        </View>

        <View style={styles.userActions}>
          <TouchableOpacity style={styles.auditBtn} onPress={() => handleInspectUser(item)}>
            <Feather name="activity" size={14} color={AuraColors.primary} />
            <Text style={styles.auditBtnText}>Métricas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.suspendButton, isSuspended ? styles.reactivateButton : null]} onPress={() => handleToggleSuspend(item)}>
            <Feather name={isSuspended ? "unlock" : "lock"} size={14} color="white" />
            <Text style={styles.suspendButtonText}>{isSuspended ? "Restaurar" : "Suspender"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={AuraColors.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Feather name="arrow-left" size={20} color={AuraColors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Gestión de Usuarios</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Feather name="search" size={20} color={AuraColors.textMuted} />
          <TextInput style={styles.searchInput} placeholder="Buscar nombre, correo o centro..." value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor={AuraColors.textMuted} />
          {searchQuery !== '' && (<TouchableOpacity onPress={() => setSearchQuery('')}><Feather name="x-circle" size={18} color={AuraColors.textMuted} /></TouchableOpacity>)}
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 24 }}>
          {(['all', 'client', 'center_owner', 'suspended'] as FilterRole[]).map((filter) => (
            <TouchableOpacity key={filter} style={[styles.filterPill, activeFilter === filter && styles.filterPillActive]} onPress={() => setActiveFilter(filter)}>
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>{filter === 'all' ? 'Todos' : filter === 'client' ? 'Clientes' : filter === 'center_owner' ? 'Centros' : 'Suspendidos'}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.statsContainer}><Text style={styles.statsText}>Registros recuperados: {filteredUsers.length}</Text></View>

      <FlatList 
        data={filteredUsers} 
        keyExtractor={item => item.id} 
        renderItem={renderItem} 
        contentContainerStyle={styles.listContent} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AuraColors.primary]} />}
        ListEmptyComponent={
          <View style={{alignItems: 'center', marginTop: 40}}>
            <Text style={{color: AuraColors.textMuted}}>No se encontraron resultados.</Text>
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
  centerSubName: { fontSize: 12, color: AuraColors.primary, fontWeight: '700', marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  userActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: AuraColors.border },
  auditBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: AuraColors.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  auditBtnText: { color: AuraColors.primary, fontSize: 12, fontWeight: '700' },
  suspendButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  reactivateButton: { backgroundColor: '#16A34A' },
  suspendButtonText: { color: 'white', fontSize: 12, fontWeight: '600' },
});