import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuraColors } from '../../../src/theme/colors';

const APPOINTMENT_DATA = {
  id: '1',
  clientName: 'María García',
  service: 'Limpieza facial profunda',
  date: '15 Mar 2025',
  time: '10:00 - 11:00',
  status: 'confirmed',
  price: '45 €',
  notes: 'Cliente alérgica al látex.',
};

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Detalle de cita</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Cliente</Text>
          <Text style={styles.value}>{APPOINTMENT_DATA.clientName}</Text>

          <Text style={styles.label}>Servicio</Text>
          <Text style={styles.value}>{APPOINTMENT_DATA.service}</Text>

          <Text style={styles.label}>Fecha</Text>
          <Text style={styles.value}>{APPOINTMENT_DATA.date}</Text>

          <Text style={styles.label}>Hora</Text>
          <Text style={styles.value}>{APPOINTMENT_DATA.time}</Text>

          <Text style={styles.label}>Precio</Text>
          <Text style={styles.valuePrice}>{APPOINTMENT_DATA.price}</Text>

          <Text style={styles.label}>Estado</Text>
          <View style={[styles.statusBadge, { backgroundColor: '#EDF7ED' }]}>
            <Text style={{ color: AuraColors.success, fontWeight: '600' }}>Confirmada</Text>
          </View>

          <Text style={styles.label}>Notas</Text>
          <Text style={styles.value}>{APPOINTMENT_DATA.notes}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.editButton}>
            <Feather name="edit-2" size={16} color="white" />
            <Text style={styles.editText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton}>
            <Feather name="x" size={16} color={AuraColors.destructive} />
            <Text style={styles.cancelText}>Cancelar cita</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AuraColors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AuraColors.border,
  },
  title: { fontSize: 20, fontWeight: '700', color: AuraColors.textPrimary },
  content: { padding: 24, paddingBottom: 40 },
  card: { backgroundColor: AuraColors.card, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: AuraColors.border },
  label: { fontSize: 13, color: AuraColors.textMuted, marginTop: 14, marginBottom: 2 },
  value: { fontSize: 16, color: AuraColors.textPrimary, fontWeight: '500' },
  valuePrice: { fontSize: 20, color: AuraColors.primary, fontWeight: '700' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 28 },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AuraColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  editText: { color: 'white', fontWeight: '600' },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AuraColors.destructive,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  cancelText: { color: AuraColors.destructive, fontWeight: '600' },
});