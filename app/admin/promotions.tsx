import { Feather } from '@expo/vector-icons';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuraColors } from '../../src/theme/colors';

const PROMOS = [
  { id: '1', title: '20% en Facial', valid: 'Hasta 31 Mar', active: true },
  { id: '2', title: '2x1 en Masajes', valid: 'Hasta 15 Abr', active: false },
];

export default function PromotionsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Promociones</Text>
        <TouchableOpacity style={styles.addButton}>
          <Feather name="plus" size={20} color="white" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={PROMOS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardValidity}>{item.valid}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: item.active ? '#EDF7ED' : '#F5F5F5' }]}>
              <Text style={{ color: item.active ? AuraColors.success : AuraColors.textMuted }}>{item.active ? 'Activa' : 'Inactiva'}</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '700' },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.primary, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 24 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: AuraColors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: AuraColors.border },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardValidity: { fontSize: 13, color: AuraColors.textMuted },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
});