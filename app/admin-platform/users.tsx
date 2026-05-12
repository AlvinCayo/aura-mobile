import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuraColors } from '../../src/theme/colors';

const ALL_USERS = [
  { id: '1', name: 'María García', type: 'user', email: 'maria@email.com', status: 'active', joined: '15 Ene, 2024', activity: 'Hace 2 horas' },
  { id: '2', name: 'Spa Serenity', type: 'center', email: 'info@spaserenity.com', status: 'active', joined: '10 Dic, 2023', activity: 'Hace 30 min' },
  { id: '3', name: 'Carlos Mendez', type: 'user', email: 'carlos@email.com', status: 'suspended', joined: '5 Feb, 2024', activity: 'Hace 5 días' },
  { id: '4', name: 'Centro Belle', type: 'center', email: 'contact@centrobelle.com', status: 'pending', joined: '20 Ene, 2025', activity: 'Pendiente' },
  { id: '5', name: 'Laura Sánchez', type: 'user', email: 'laura@email.com', status: 'active', joined: '8 Mar, 2024', activity: 'Hace 1 hora' },
];

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  active: { color: AuraColors.success, bg: '#EDF7ED', label: 'Activo' },
  suspended: { color: AuraColors.destructive, bg: '#FDEDED', label: 'Suspendido' },
  pending: { color: AuraColors.warning, bg: '#FDF3E0', label: 'Pendiente' },
};

export default function AdminUserPanelScreen() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const router = useRouter();

  const filtered = ALL_USERS.filter((u) => {
    if (filter !== 'all' && u.status !== filter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Panel de Usuarios</Text>

      <View style={styles.searchContainer}>
        <Feather name="search" size={18} color={AuraColors.textMuted} style={{ marginRight: 10 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar usuarios..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.tabsRow}>
        {[
          { key: 'all', label: 'Todos', count: 1458 },
          { key: 'active', label: 'Activos', count: 1234 },
          { key: 'suspended', label: 'Suspendidos', count: 42 },
          { key: 'pending', label: 'Pendientes', count: 182 },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, filter === tab.key && styles.tabActive]}
            onPress={() => setFilter(tab.key)}
          >
            <Text style={[styles.tabText, filter === tab.key && styles.tabTextActive]}>
              {tab.label} ({tab.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <View style={styles.avatar}>
              <Feather name={item.type === 'user' ? 'user' : 'briefcase'} size={20} color={AuraColors.textMuted} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userEmail}>{item.email}</Text>
              <Text style={styles.userMeta}>Desde: {item.joined} · Actividad: {item.activity}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_STYLE[item.status].bg }]}>
              <Feather
                name={item.status === 'active' ? 'check-circle' : item.status === 'suspended' ? 'x-circle' : 'clock'}
                size={12}
                color={STATUS_STYLE[item.status].color}
              />
              <Text style={[styles.statusText, { color: STATUS_STYLE[item.status].color }]}>
                {STATUS_STYLE[item.status].label}
              </Text>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background, paddingTop: 20 },
  title: { fontSize: 24, fontWeight: '700', color: AuraColors.textPrimary, paddingHorizontal: 24, marginBottom: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AuraColors.card,
    marginHorizontal: 24,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: AuraColors.inputBorder,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 15 },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 6, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: AuraColors.card, alignItems: 'center' },
  tabActive: { backgroundColor: AuraColors.primary },
  tabText: { fontSize: 12, color: AuraColors.textSecondary },
  tabTextActive: { color: 'white', fontWeight: '600' },
  list: { paddingHorizontal: 24 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: AuraColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AuraColors.border,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: AuraColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: { fontSize: 15, fontWeight: '600', color: AuraColors.textPrimary },
  userEmail: { fontSize: 13, color: AuraColors.textSecondary },
  userMeta: { fontSize: 11, color: AuraColors.textMuted, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  statusText: { fontSize: 12, fontWeight: '500' },
});