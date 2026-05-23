import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/Button';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

export default function SettingsScreen() {
  const [qrUrl, setQrUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    const { data } = await supabase.from('platform_config').select('value').eq('key', 'platform_qr_url').single();
    if (data) setQrUrl(data.value);
    setLoading(false);
  };

  const uploadQR = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (result.canceled) return;

    setUploading(true);
    const file = result.assets[0];
    const fileName = `aura_platform_qr_${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage.from('platform-assets').upload(fileName, {
      uri: file.uri,
      name: fileName,
      type: 'image/png',
    } as any);

    if (uploadError) {
      Alert.alert('Error', 'No se pudo subir la imagen.');
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from('platform-assets').getPublicUrl(fileName);
    const { error: dbError } = await supabase.from('platform_config').update({ value: data.publicUrl }).eq('key', 'platform_qr_url');

    if (dbError) Alert.alert('Error', 'No se pudo guardar la configuración.');
    else {
      setQrUrl(data.publicUrl);
      Alert.alert('Éxito', 'QR de AURA actualizado correctamente.');
    }
    setUploading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Configuración AURA</Text>
      <View style={styles.card}>
        <Text style={styles.label}>QR Oficial de la Plataforma (Comisiones)</Text>
        {qrUrl ? <Image source={{ uri: qrUrl }} style={styles.qrPreview} /> : <View style={styles.qrPlaceholder}><Text>Sin QR cargado</Text></View>}
        <Button title="Actualizar QR Oficial" onPress={uploadQR} loading={uploading} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: AuraColors.background },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 24 },
  card: { padding: 20, backgroundColor: AuraColors.card, borderRadius: 16 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  qrPreview: { width: 200, height: 200, alignSelf: 'center', marginBottom: 16 },
  qrPlaceholder: { height: 200, backgroundColor: '#EEE', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
});