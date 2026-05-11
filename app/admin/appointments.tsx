import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdminAppointmentItem from '../../src/components/ui/AdminAppointmentItem';
import { AuraColors } from '../../src/theme/colors';

const ALL_APPOINTMENTS = [
  { id: '1', clientName: 'María García', serviceName: 'Limpieza facial', time: '10:00', status: 'pending' as const },
  { id: '2', clientName: 'Carlos López', serviceName: 'Masaje relajante', time: '11:30', status: 'confirmed' as const },
  { id: '3', clientName: 'Ana Martínez', serviceName: 'Peeling químico', time: '13:00', status: 'completed' as const },
  { id: '4', clientName: 'Lucía Fernández', serviceName: 'Manicura', time: '09:00', status: 'cancelled' as const },
];

const FILTERS = [
  { key: 'all', label: 'Todas' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'confirmed', label: 'Confirmadas' },
  { key: 'completed', label: 'Completadas' },
  { key: 'cancelled', label: 'Canceladas' },
] as const;

type FilterKey = typeof FILTERS[number]['key'];

export default function AppointmentsManagerScreen() {
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = filter === 'all'
    ? ALL_APPOINTMENTS
    : ALL_APPOINTMENTS.filter((a) => a.status === filter);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestión de citas</Text>
      </View>

      {/* Filtros horizontales */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
            onPress={() => setFilter(item.key)}
          >
            <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <AdminAppointmentItem
            clientName={item.clientName}
            serviceName={item.serviceName}
            time={item.time}
            status={item.status}
            onConfirm={() => console.log('Confirmar', item.id)}
            onCancel={() => console.log('Cancelar', item.id)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="calendar" size={48} color={AuraColors.textMuted} />
            <Text style={styles.emptyText}>No hay citas con este filtro</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AuraColors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: AuraColors.textPrimary,
  },
  filtersList: {
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 20,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: AuraColors.card,
    borderWidth: 1,
    borderColor: AuraColors.border,
  },
  filterChipActive: {
    backgroundColor: AuraColors.primary,
    borderColor: AuraColors.primary,
  },
  filterText: {
    fontSize: 13,
    color: AuraColors.textSecondary,
  },
  filterTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: AuraColors.textMuted,
    marginTop: 12,
  },
});