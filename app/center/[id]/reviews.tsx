import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ReviewCard from '../../../src/components/ui/ReviewCard';
import { AuraColors } from '../../../src/theme/colors';

const ALL_REVIEWS = [
  { id: '1', userName: 'María G.', rating: 5, date: 'hace 1 semana', comment: '¡Increíble! Volveré sin duda.' },
  { id: '2', userName: 'Carlos L.', rating: 4, date: 'hace 2 semanas', comment: 'Muy buen ambiente, profesionales.' },
  { id: '3', userName: 'Ana R.', rating: 5, date: 'hace 3 semanas', comment: 'El peeling fue maravilloso.' },
  { id: '4', userName: 'Pedro M.', rating: 3, date: 'hace 1 mes', comment: 'Bien, pero un poco caro.' },
];

export default function CenterReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Reseñas</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={ALL_REVIEWS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ReviewCard
            userName={item.userName}
            rating={item.rating}
            date={item.date}
            comment={item.comment}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="message-square" size={48} color={AuraColors.textMuted} />
            <Text style={styles.emptyText}>No hay reseñas aún</Text>
          </View>
        }
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
  title: { fontSize: 20, fontWeight: '700', color: AuraColors.textPrimary },
  list: { paddingHorizontal: 24, paddingBottom: 32 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: AuraColors.textMuted, marginTop: 12 },
});