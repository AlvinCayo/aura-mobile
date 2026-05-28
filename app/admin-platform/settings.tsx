import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchPlatformConfig, updatePlatformConfig, uploadPlatformQR } from '../../src/lib/data';
import { AuraColors } from '../../src/theme/colors';

export default function PlatformSettings() {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [commission, setCommission] = useState<string>('10');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    const { data } = await fetchPlatformConfig();
    if (data) {
      if (data.platform_qr_url) setQrUrl(data.platform_qr_url);
      if (data.commission_percentage) setCommission(data.commission_percentage);
    }
    setLoading(false);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setNewImageUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalQrUrl = qrUrl;

      // Si el admin seleccionó una nueva imagen, la subimos primero
      if (newImageUri) {
        const { url, error: uploadErr } = await uploadPlatformQR(newImageUri);
        if (uploadErr || !url) throw new Error('Error al subir la imagen del QR.');
        finalQrUrl = url;
      }

      // Guardamos la URL en la base de datos
      if (finalQrUrl) {
        const { error: dbError } = await updatePlatformConfig('platform_qr_url', finalQrUrl);
        if (dbError) throw new Error('Error al guardar la configuración.');
        setQrUrl(finalQrUrl);
      }

      // Aseguramos que la comisión esté guardada (por defecto 10)
      await updatePlatformConfig('commission_percentage', commission);

      setNewImageUri(null);
      Alert.alert('¡Éxito!', 'Configuración de la plataforma actualizada correctamente.');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={AuraColors.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.headerTitle}>Ajustes de Plataforma</Text>
        <Text style={styles.headerSub}>Configura cómo recibes los pagos</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Código QR para Comisiones</Text>
          <Text style={styles.helperText}>Este QR será visible para todos los clientes al momento de confirmar su reserva.</Text>

          <View style={styles.qrPreviewContainer}>
            {newImageUri || qrUrl ? (
              <Image source={{ uri: newImageUri || qrUrl! }} style={styles.qrImage} />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Feather name="image" size={40} color={AuraColors.border} />
                <Text style={styles.placeholderText}>Sin QR configurado</Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
            <Feather name="upload" size={18} color={AuraColors.primary} />
            <Text style={styles.uploadBtnText}>
              {qrUrl || newImageUri ? 'Cambiar imagen QR' : 'Subir imagen QR'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
          onPress={handleSave} 
          disabled={saving || (!newImageUri && !qrUrl)}
        >
          {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Guardar Configuración</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 24 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: AuraColors.textPrimary },
  headerSub: { fontSize: 14, color: AuraColors.textSecondary, marginTop: 4, marginBottom: 24 },
  card: { backgroundColor: AuraColors.card, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: AuraColors.border, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 8 },
  helperText: { fontSize: 13, color: AuraColors.textSecondary, marginBottom: 20, lineHeight: 18 },
  qrPreviewContainer: { alignItems: 'center', marginBottom: 20 },
  qrImage: { width: 220, height: 220, borderRadius: 16, borderWidth: 1, borderColor: AuraColors.border },
  qrPlaceholder: { width: 220, height: 220, borderRadius: 16, borderWidth: 1, borderColor: AuraColors.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  placeholderText: { color: AuraColors.textSecondary, marginTop: 12, fontWeight: '500' },
  uploadBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: AuraColors.primaryLight, paddingVertical: 14, borderRadius: 12 },
  uploadBtnText: { color: AuraColors.primary, fontWeight: '700', fontSize: 14 },
  saveBtn: { backgroundColor: AuraColors.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 16 }
});