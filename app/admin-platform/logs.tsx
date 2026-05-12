import { Feather } from '@expo/vector-icons';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuraColors } from '../../src/theme/colors';

const LOGS = [
  { id: '1', action: 'Centro aprobado', detail: 'Spa Relax', time: 'Hoy, 14:30', icon: 'check-circle' },
  { id: '2', action: 'Usuario suspendido', detail: 'carlos@email.com', time: 'Hoy, 10:15', icon: 'x-circle' },
  { id: '3', action: 'Nuevo registro', detail: 'Centro Belle', time: 'Ayer, 16:45', icon: 'plus-circle' },
];

export default function AdminLogsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={LOGS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.title}>Registros del Sistema</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Feather name={item.icon as any} size={18} color={AuraColors.primary} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.action}</Text>
              <Text style={styles.cardDetail}>{item.detail}</Text>
            </View>
            <Text style={styles.cardTime}>{item.time}</Text>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  title: { fontSize: 24, fontWeight: '700', padding: 24 },
  list: { paddingHorizontal: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AuraColors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: AuraColors.border,
  },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  cardDetail: { fontSize: 13, color: AuraColors.textSecondary },
  cardTime: { fontSize: 12, color: AuraColors.textMuted },
});