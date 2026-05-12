import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppointmentCard from '../../src/components/ui/AppointmentCard';
import { AuraColors } from '../../src/theme/colors';

const APPOINTMENTS = [
  {
    id: '1',
    centerName: 'Aura Beauty Center',
    serviceName: 'Limpieza facial profunda',
    date: '15 Mar 2025',
    time: '10:00',
    status: 'confirmed' as const,
  },
  {
    id: '2',
    centerName: 'Zen Spa & Wellness',
    serviceName: 'Masaje relajante',
    date: '22 Mar 2025',
    time: '16:30',
    status: 'pending' as const,
  },
  {
    id: '3',
    centerName: 'Glow Esthetics',
    serviceName: 'Peeling químico',
    date: '10 Mar 2025',
    time: '09:00',
    status: 'completed' as const,
  },
  {
    id: '4',
    centerName: 'Aura Beauty Center',
    serviceName: 'Masaje relajante',
    date: '5 Mar 2025',
    time: '11:00',
    status: 'cancelled' as const,
  },
];

const FILTERS: Array<{ key: 'all' | 'upcoming' | 'past'; label: string }> = [
  { key: 'all', label: 'Todas' },
  { key: 'upcoming', label: 'Próximas' },
  { key: 'past', label: 'Pasadas' },
];

export default function AppointmentsScreen() {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const router = useRouter();

  const filteredAppointments = APPOINTMENTS.filter((a) => {
    if (filter === 'upcoming') return a.status === 'confirmed' || a.status === 'pending';
    if (filter === 'past') return a.status === 'completed' || a.status === 'cancelled';
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Citas</Text>
      </View>

      {/* Filtros */}
      <View style={styles.filtersRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterButton, filter === f.key && styles.filterButtonActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredAppointments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <AppointmentCard
            centerName={item.centerName}
            serviceName={item.serviceName}
            date={item.date}
            time={item.time}
            status={item.status}
            onPress={() => router.push(`/appointments/${item.id}` as any)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="calendar" size={48} color={AuraColors.textMuted} />
            <Text style={styles.emptyText}>No tienes citas {filter === 'upcoming' ? 'próximas' : 'pasadas'}</Text>
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
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 10,
    marginBottom: 20,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: AuraColors.card,
    borderWidth: 1,
    borderColor: AuraColors.border,
  },
  filterButtonActive: {
    backgroundColor: AuraColors.primary,
    borderColor: AuraColors.primary,
  },
  filterText: {
    fontSize: 14,
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