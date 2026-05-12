import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuraColors } from '../../src/theme/colors';

export default function WriteReviewScreen() {
  const { centerId } = useLocalSearchParams<{ centerId: string }>();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Dejar Reseña</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.content}>
        <Text style={styles.centerName}>Aura Beauty Center</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Feather name={star <= rating ? 'star' : 'star'} size={36} color={star <= rating ? AuraColors.warning : AuraColors.border} />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Tu comentario</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Cuéntanos tu experiencia..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={comment}
          onChangeText={setComment}
        />
        <TouchableOpacity style={styles.submitButton} onPress={() => router.back()}>
          <Text style={styles.submitText}>Enviar reseña</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  title: { fontSize: 20, fontWeight: '700' },
  content: { padding: 24 },
  centerName: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  textArea: {
    backgroundColor: AuraColors.card,
    borderWidth: 1,
    borderColor: AuraColors.border,
    borderRadius: 12,
    padding: 14,
    minHeight: 100,
    fontSize: 15,
    color: AuraColors.textPrimary,
    marginBottom: 24,
  },
  submitButton: { backgroundColor: AuraColors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  submitText: { color: 'white', fontWeight: '600', fontSize: 16 },
});