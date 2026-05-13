import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/Button';
import Input from '../../src/components/ui/Input';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

export default function AddServiceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { centerId } = useLocalSearchParams<{ centerId: string }>();

  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a la galería para seleccionar una foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0]);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !duration.trim() || !price.trim()) {
      Alert.alert('Campos incompletos', 'Por favor llena el nombre, duración y precio.');
      return;
    }

    setLoading(true);

    try {
      let imageUrl = '';

      // Subir imagen si existe usando FormData
      if (image && user) {
        const formData = new FormData();
        const fileExt = image.uri.split('.').pop() || 'jpg';
        const fileName = `${user.id}_new_service_${Date.now()}.${fileExt}`;
        
        formData.append('file', {
          uri: image.uri,
          name: fileName,
          type: `image/${fileExt}`,
        } as any);

        const { error: uploadError } = await supabase.storage
          .from('service-images')
          .upload(fileName, formData);

        if (uploadError) {
          throw new Error('No se pudo subir la imagen del servicio.');
        }

        imageUrl = supabase.storage.from('service-images').getPublicUrl(fileName).data.publicUrl;
      }

      // Guardar el servicio en la base de datos
      const { error: insertError } = await supabase.from('services').insert({
        center_id: centerId,
        name: name.trim(),
        duration_min: parseInt(duration, 10),
        price: parseFloat(price),
        image_url: imageUrl,
      });

      if (insertError) throw insertError;

      Alert.alert('Éxito', 'El servicio ha sido añadido a tu catálogo.', [
        { text: 'OK', onPress: () => router.back() } // Regresamos a la lista
      ]);

    } catch (error: any) {
      Alert.alert('Error', error.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Añadir Nuevo Servicio</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image.uri }} style={styles.previewImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Feather name="camera" size={32} color={AuraColors.primary} />
                <Text style={styles.imagePickerText}>Añadir foto del servicio</Text>
              </View>
            )}
          </TouchableOpacity>

          <Input
            label="Nombre del Servicio"
            placeholder="Ej. Corte clásico, Masaje relajante..."
            value={name}
            onChangeText={setName}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input
                label="Duración (minutos)"
                placeholder="Ej. 45"
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
              />
            </View>
            <View style={{ width: 16 }} />
            <View style={{ flex: 1 }}>
              <Input
                label="Precio (Bs)"
                placeholder="Ej. 50"
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.footer}>
            <Button title="Guardar Servicio" onPress={handleSave} loading={loading} />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary },
  content: { padding: 24 },
  imagePicker: { width: '100%', height: 180, borderRadius: 16, backgroundColor: AuraColors.primaryLight, marginBottom: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#D1E8FA', borderStyle: 'dashed' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  imagePickerText: { color: AuraColors.primary, fontWeight: '600' },
  previewImage: { width: '100%', height: '100%' },
  row: { flexDirection: 'row' },
  footer: { marginTop: 40 },
});