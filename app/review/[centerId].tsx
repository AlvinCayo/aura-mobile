import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/Button';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

export default function SubmitReviewScreen() {
  const { centerId } = useLocalSearchParams<{ centerId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [centerName, setCenterName] = useState('Centro de Estética');

  // Buscar el nombre del centro para personalizar la pantalla
  useEffect(() => {
    const fetchCenterInfo = async () => {
      const { data } = await supabase.from('centers').select('name').eq('id', centerId).single();
      if (data?.name) setCenterName(data.name);
    };
    if (centerId) fetchCenterInfo();
  }, [centerId]);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Calificación requerida', 'Por favor, selecciona al menos una estrella.');
      return;
    }
    if (!user || !centerId) return;

    setIsSubmitting(true);

    try {
      // 1. Insertar la nueva reseña
      const { error: insertError } = await supabase.from('reviews').insert({
        center_id: centerId,
        client_id: user.id,
        rating: rating,
        comment: comment.trim(),
      });

      if (insertError) throw insertError;

      // 2. Recalcular el promedio del centro
      const { data: reviewsData, error: fetchError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('center_id', centerId);

      if (!fetchError && reviewsData && reviewsData.length > 0) {
        const totalRating = reviewsData.reduce((acc, curr) => acc + curr.rating, 0);
        const newAverage = (totalRating / reviewsData.length).toFixed(1);

        // 3. Actualizar el centro con el nuevo promedio y contador
        await supabase
          .from('centers')
          .update({ 
            rating: parseFloat(newAverage),
            reviews_count: reviewsData.length
          })
          .eq('id', centerId);
      }

      Alert.alert('¡Gracias!', 'Tu reseña ha sido publicada exitosamente.', [
        { text: 'Volver a Mis Citas', onPress: () => router.back() }
      ]);

    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo enviar la reseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
            <Feather
              name="star"
              size={48}
              color={star <= rating ? '#F59E0B' : AuraColors.border}
              style={{ marginHorizontal: 4 }}
              fill={star <= rating ? '#F59E0B' : 'transparent'} // Llena la estrella de color si está seleccionada
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
            <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Calificar Servicio</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.questionTitle}>¿Cómo fue tu experiencia en</Text>
          <Text style={styles.centerNameHighlight}>{centerName}?</Text>

          {renderStars()}

          <Text style={styles.ratingTextLabel}>
            {rating === 1 && 'Muy mala 😞'}
            {rating === 2 && 'Mala 😕'}
            {rating === 3 && 'Regular 😐'}
            {rating === 4 && 'Buena 🙂'}
            {rating === 5 && '¡Excelente! 🤩'}
            {rating === 0 && 'Selecciona una calificación'}
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Cuéntanos más (Opcional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="¿Qué te gustó más del servicio? ¿Algo podría mejorar?"
              placeholderTextColor={AuraColors.textMuted}
              multiline
              numberOfLines={6}
              value={comment}
              onChangeText={setComment}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
        
        <View style={styles.footer}>
          <Button 
            title="Enviar Reseña" 
            onPress={handleSubmit} 
            loading={isSubmitting} 
            icon={<Feather name="send" size={18} color="white" />}
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
  content: { padding: 24, alignItems: 'center' },
  questionTitle: { fontSize: 16, color: AuraColors.textSecondary, marginTop: 12 },
  centerNameHighlight: { fontSize: 24, fontWeight: '800', color: AuraColors.primary, marginTop: 4, textAlign: 'center', marginBottom: 32 },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
  ratingTextLabel: { fontSize: 16, fontWeight: '600', color: AuraColors.textPrimary, marginBottom: 40, height: 24 },
  inputContainer: { width: '100%' },
  inputLabel: { fontSize: 14, fontWeight: '600', color: AuraColors.textPrimary, marginBottom: 8 },
  textInput: { backgroundColor: AuraColors.card, borderWidth: 1, borderColor: AuraColors.border, borderRadius: 16, padding: 16, fontSize: 15, color: AuraColors.textPrimary, minHeight: 120 },
  footer: { padding: 24, backgroundColor: AuraColors.background, borderTopWidth: 1, borderTopColor: AuraColors.border },
});