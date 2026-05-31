import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/Button';
import { useAuth } from '../../src/contexts/AuthContext';
import { sendNotification } from '../../src/lib/push';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

export default function ReviewScreen() {
  const { centerId } = useLocalSearchParams<{ centerId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    // ELIMINAMOS la validación del comentario para que sea 100% opcional.
    // Solo procedemos directo a guardar.

    setSubmitting(true);
    try {
      // 1. Guardar la reseña en la base de datos
      const { error } = await supabase.from('reviews').insert({
        center_id: centerId,
        client_id: user?.id,
        rating,
        // Si el comentario está vacío, mandamos null para mantener limpia la BD
        comment: comment.trim() !== '' ? comment.trim() : null,
      });

      if (error) throw error;

      // 2. Obtener el dueño del centro para mandarle una notificación feliz
      const { data: centerData } = await supabase
        .from('centers')
        .select('owner_id, name')
        .eq('id', centerId)
        .single();

      if (centerData?.owner_id) {
        await sendNotification(
          centerData.owner_id,
          "¡Nueva Reseña de 5 Estrellas!",
          `Un cliente te ha calificado con ${rating} estrellas. ¡Sigue así!`,
          "star"
        );
      }

      Alert.alert(
        '¡Gracias por tu opinión!',
        'Tu reseña ayuda a otros usuarios de AURA a encontrar los mejores servicios.',
        [{ text: 'Volver al Inicio', onPress: () => router.push('/(tabs)/appointments') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo guardar la reseña.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starButton}>
            <Feather
              name="star"
              size={40}
              color={star <= rating ? '#F59E0B' : AuraColors.border}
              fill={star <= rating ? '#F59E0B' : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="x" size={24} color={AuraColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Califica tu Experiencia</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>¿Cómo te fue en el centro estético?</Text>
          <Text style={styles.subtitle}>Selecciona una calificación</Text>
          
          {renderStars()}
          
          <Text style={styles.ratingText}>
            {rating === 5 ? '¡Excelente!' : rating === 4 ? 'Muy bueno' : rating === 3 ? 'Aceptable' : rating === 2 ? 'Pudo ser mejor' : 'Mala experiencia'}
          </Text>

          <View style={styles.inputContainer}>
            {/* Añadido indicador de "Opcional" en la etiqueta */}
            <Text style={styles.inputLabel}>Cuéntanos más sobre el servicio (Opcional):</Text>
            <TextInput
              style={styles.textInput}
              // Añadido indicador de "Opcional" en el placeholder
              placeholder="Ej. Me encantó la atención... (Opcional)"
              multiline
              numberOfLines={5}
              value={comment}
              onChangeText={setComment}
              textAlignVertical="top"
            />
          </View>

        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={submitting ? "Enviando..." : "Publicar Reseña"}
            onPress={handleSubmit}
            disabled={submitting}
            icon={!submitting ? <Feather name="send" size={18} color="white" /> : undefined}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary },
  scroll: { padding: 24, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: AuraColors.textPrimary, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: AuraColors.textSecondary, textAlign: 'center', marginBottom: 32 },
  starsContainer: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  starButton: { padding: 4 },
  ratingText: { fontSize: 18, fontWeight: '700', color: '#F59E0B', marginBottom: 40 },
  inputContainer: { width: '100%', marginBottom: 24 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: AuraColors.textPrimary, marginBottom: 8 },
  textInput: { width: '100%', backgroundColor: AuraColors.card, borderWidth: 1, borderColor: AuraColors.border, borderRadius: 16, padding: 16, fontSize: 15, minHeight: 120, color: AuraColors.textPrimary },
  footer: { padding: 24, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: AuraColors.border },
});