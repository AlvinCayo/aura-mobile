import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuraColors } from '../../src/theme/colors';

const ALL_CLIENTS = [
  { id: '1', name: 'María García', email: 'maria@email.com', totalVisits: 6 },
  { id: '2', name: 'Carlos López', email: 'carlos@email.com', totalVisits: 4 },
  { id: '3', name: 'Ana Martínez', email: 'ana@email.com', totalVisits: 3 },
  { id: '4', name: 'Pedro Sánchez', email: 'pedro@email.com', totalVisits: 1 },
];

export default function ClientListScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Clientes</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={ALL_CLIENTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.clientItem}
            onPress={() => router.push(`/admin/clients/${item.id}` as any)}
          >
            <View style={styles.avatar}>
              <Feather name="user" size={20} color={AuraColors.textMuted} />
            </View>
            <View style={styles.info}>
              <Text style={styles.clientName}>{item.name}</Text>
              <Text style={styles.clientEmail}>{item.email}</Text>
            </View>
            <View style={styles.visitsBadge}>
              <Text style={styles.visitsText}>{item.totalVisits} visitas</Text>
            </View>
            <Feather name="chevron-right" size={18} color={AuraColors.textMuted} />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
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
  title: { fontSize: 22, fontWeight: '700', color: AuraColors.textPrimary },
  list: { paddingHorizontal: 24, paddingBottom: 32 },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AuraColors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: AuraColors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AuraColors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: { flex: 1 },
  clientName: { fontSize: 16, fontWeight: '600', color: AuraColors.textPrimary },
  clientEmail: { fontSize: 13, color: AuraColors.textSecondary },
  visitsBadge: {
    backgroundColor: AuraColors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  visitsText: { fontSize: 12, color: AuraColors.primary },
});