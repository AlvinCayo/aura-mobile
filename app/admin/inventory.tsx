import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuraColors } from '../../src/theme/colors';

const ITEMS = [
  { id: '1', name: 'Crema facial', stock: 12 },
  { id: '2', name: 'Aceite esencial', stock: 5 },
];

export default function InventoryScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Inventario</Text>
      <FlatList
        data={ITEMS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemStock}>Stock: {item.stock}</Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background, paddingTop: 40 },
  title: { fontSize: 24, fontWeight: '700', paddingHorizontal: 24, marginBottom: 16 },
  list: { paddingHorizontal: 24 },
  item: { backgroundColor: AuraColors.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: AuraColors.border },
  itemName: { fontSize: 16, fontWeight: '600' },
  itemStock: { fontSize: 14, color: AuraColors.textSecondary },
});