import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/Button';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

export default function QrGeneratorScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [center, setCenter] = useState<any>(null);
  const [qrImage, setQrImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [existingQrUrl, setExistingQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCenterData();
  }, [user]);

  const loadCenterData = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('centers')
      .select('id, payment_qr_url')
      .eq('owner_id', user.id)
      .single();

    if (data) {
      setCenter(data);
      if (data.payment_qr_url) {
        setExistingQrUrl(data.payment_qr_url);
      }
    }
    setLoading(false);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a la galería para seleccionar el QR.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // El QR suele ser cuadrado
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setQrImage(result.assets[0]);
      setExistingQrUrl(null); // Ocultamos el viejo si elige uno nuevo
    }
  };

  const handleSaveQR = async () => {
    if (!qrImage) {
      Alert.alert('Atención', 'Selecciona una imagen de tu galería primero.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Subir imagen a Storage usando FormData
      const formData = new FormData();
      const fileExt = qrImage.uri.split('.').pop() || 'jpg';
      const fileName = `qr_${center.id}_${Date.now()}.${fileExt}`;
      
      formData.append('file', {
        uri: qrImage.uri,
        name: fileName,
        type: `image/${fileExt}`,
      } as any);

      const { error: uploadError } = await supabase.storage
        .from('payment-qrs')
        .upload(fileName, formData);

      if (uploadError) throw uploadError;

      const publicUrl = supabase.storage.from('payment-qrs').getPublicUrl(fileName).data.publicUrl;

      // 2. Actualizar la tabla centers
      const { error: updateError } = await supabase
        .from('centers')
        .update({ payment_qr_url: publicUrl })
        .eq('id', center.id);

      if (updateError) throw updateError;

      Alert.alert('¡Éxito!', 'Tu código QR ha sido actualizado. Los clientes lo verán al momento de pagar.');
      setExistingQrUrl(publicUrl);
      setQrImage(null);

    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo subir el QR.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={AuraColors.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi QR de Pago</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <Feather name="info" size={24} color={AuraColors.primary} style={{ marginBottom: 12 }} />
          <Text style={styles.infoTitle}>¿Cómo funciona?</Text>
          <Text style={styles.infoText}>
            Sube una captura de pantalla del código QR Simple de tu banco. Cuando apruebes una reserva, le mostraremos esta imagen al cliente para que realice la transferencia.
          </Text>
        </View>

        <TouchableOpacity style={styles.uploadArea} onPress={pickImage}>
          {qrImage ? (
            <Image source={{ uri: qrImage.uri }} style={styles.qrPreview} resizeMode="contain" />
          ) : existingQrUrl ? (
            <Image source={{ uri: existingQrUrl }} style={styles.qrPreview} resizeMode="contain" />
          ) : (
            <View style={styles.placeholderContent}>
              <Feather name="upload-cloud" size={48} color={AuraColors.primary} />
              <Text style={styles.placeholderText}>Toca para subir tu imagen QR</Text>
              <Text style={styles.placeholderSubtext}>Formato JPG o PNG</Text>
            </View>
          )}
        </TouchableOpacity>

        {(qrImage || existingQrUrl) && (
          <TouchableOpacity style={styles.changeButton} onPress={pickImage}>
            <Feather name="refresh-cw" size={16} color={AuraColors.primary} />
            <Text style={styles.changeButtonText}>Seleccionar otra imagen</Text>
          </TouchableOpacity>
        )}

        <Button 
          title="Guardar Código QR" 
          onPress={handleSaveQR} 
          loading={isSubmitting} 
          disabled={!qrImage} // Solo se habilita si hay una NUEVA imagen
          style={{ marginTop: 32 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  headerTitle: { fontSize: 20, fontWeight: '700', color: AuraColors.textPrimary },
  content: { padding: 24, paddingBottom: 60 },
  infoCard: { backgroundColor: AuraColors.primaryLight, padding: 20, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: '#D1E8FA' },
  infoTitle: { fontSize: 16, fontWeight: '700', color: AuraColors.primary, marginBottom: 8 },
  infoText: { fontSize: 14, color: AuraColors.textSecondary, lineHeight: 22 },
  uploadArea: { width: '100%', aspectRatio: 1, backgroundColor: AuraColors.card, borderRadius: 24, borderWidth: 2, borderColor: AuraColors.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  qrPreview: { width: '100%', height: '100%', backgroundColor: 'white' },
  placeholderContent: { alignItems: 'center', padding: 20 },
  placeholderText: { fontSize: 16, fontWeight: '600', color: AuraColors.textPrimary, marginTop: 16 },
  placeholderSubtext: { fontSize: 13, color: AuraColors.textMuted, marginTop: 8 },
  changeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, padding: 12 },
  changeButtonText: { color: AuraColors.primary, fontWeight: '600', fontSize: 15 },
});