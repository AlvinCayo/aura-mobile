import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuraColors } from '../src/theme/colors';

const NOTIFICATIONS = [
  { id: '1', title: 'Recordatorio de cita', message: 'Tienes una cita mañana en Aura Beauty Center a las 10:00.', time: 'Hace 1 hora', icon: 'calendar' },
  { id: '2', title: 'Promoción especial', message: '20% de descuento en tratamientos faciales este mes.', time: 'Ayer', icon: 'tag' },
  { id: '3', title: 'Nuevo centro cerca', message: 'Zen Spa acaba de abrir a 2.5 km de ti.', time: 'Hace 3 días', icon: 'map-pin' },
];

export default function NotificationsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={NOTIFICATIONS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.title}>Notificaciones</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Feather name={item.icon as any} size={20} color={AuraColors.primary} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMessage}>{item.message}</Text>
              <Text style={styles.cardTime}>{item.time}</Text>
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
  title: { fontSize: 24, fontWeight: '700', padding: 24 },
  list: { paddingHorizontal: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: AuraColors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: AuraColors.border,
  },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  cardMessage: { fontSize: 14, color: AuraColors.textSecondary, marginTop: 2 },
  cardTime: { fontSize: 12, color: AuraColors.textMuted, marginTop: 4 },
});