import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuraColors } from '../../src/theme/colors';

const INITIAL_STAFF = [
  { id: '1', name: 'Laura Sánchez', role: 'Esteticista', active: true },
  { id: '2', name: 'Miguel Torres', role: 'Masajista', active: true },
  { id: '3', name: 'Sofía Ruiz', role: 'Recepcionista', active: false },
];

export default function StaffManagementScreen() {
  const [staff, setStaff] = useState(INITIAL_STAFF);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Personal</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => console.log('Añadir')}>
          <Feather name="user-plus" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={staff}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.staffItem}>
            <View style={styles.avatar}>
              <Feather name="user" size={22} color={AuraColors.textMuted} />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.role}>{item.role}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: item.active ? '#EDF7ED' : '#FDEDED' }]}>
              <Text style={{ fontSize: 12, color: item.active ? AuraColors.success : AuraColors.destructive }}>
                {item.active ? 'Activo' : 'Inactivo'}
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
  container: { flex: 1, backgroundColor: AuraColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: AuraColors.textPrimary },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.primary, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 24 },
  staffItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: AuraColors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: AuraColors.border },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: AuraColors.border, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: AuraColors.textPrimary },
  role: { fontSize: 13, color: AuraColors.textSecondary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
});