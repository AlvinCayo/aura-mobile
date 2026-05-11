import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuraColors } from '../../src/theme/colors';

const LOCATIONS = [
  { id: '1', address: 'Calle Mayor 23, Madrid', main: true },
  { id: '2', address: 'Av. Libertad 10, Madrid', main: false },
];

export default function LocationManagementScreen() {
  const [locations, setLocations] = useState(LOCATIONS);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sucursales</Text>
        <TouchableOpacity style={styles.addButton}>
          <Feather name="plus" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={locations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.locationItem}>
            <Feather name="map-pin" size={18} color={AuraColors.primary} />
            <Text style={styles.address}>{item.address}</Text>
            {item.main && <Text style={styles.mainBadge}>Principal</Text>}
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
  title: { fontSize: 24, fontWeight: '700' },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.primary, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 24 },
  locationItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: AuraColors.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: AuraColors.border, gap: 10 },
  address: { flex: 1, fontSize: 15 },
  mainBadge: { fontSize: 12, color: AuraColors.primary, fontWeight: '600' },
});