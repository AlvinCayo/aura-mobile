import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../src/components/ui/Button';
import Input from '../src/components/ui/Input';
import ProgressSteps from '../src/components/ui/ProgressSteps';
import { useAuth } from '../src/contexts/AuthContext';
import { supabase } from '../src/lib/supabase';
import { AuraColors } from '../src/theme/colors';

const STEPS = [
  { id: 1, label: 'Info' },
  { id: 2, label: 'Docs' },
  { id: 3, label: 'Servicios' },
];

interface ServiceInput {
  name: string;
  duration: string;
  price: string;
  image: ImagePicker.ImagePickerAsset | null;
}

export default function BecomeCenterScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [centerName, setCenterName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [licenseFile, setLicenseFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [services, setServices] = useState<ServiceInput[]>([{ name: '', duration: '', price: '', image: null }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addServiceRow = () => setServices([...services, { name: '', duration: '', price: '', image: null }]);
  const removeServiceRow = (index: number) => setServices(services.filter((_, i) => i !== index));

  const updateService = (index: number, field: keyof ServiceInput, value: any) => {
    const updated = [...services];
    updated[index][field] = value as never;
    setServices(updated);
  };

  const pickLicense = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLicenseFile(result.assets[0]);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const pickServiceImage = async (index: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a la galería.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      updateService(index, 'image', result.assets[0]);
    }
  };

  const handleContinue = async () => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    if (!user) return Alert.alert('Error', 'Debes iniciar sesión primero.');

    setIsSubmitting(true);

    try {
      // 1. BLINDAJE CORREGIDO: Buscamos si el perfil existe pacíficamente
      const { data: existingProfile, error: searchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      // Si no existe, lo insertamos. (Evitamos usar upsert)
      if (!existingProfile) {
        const { error: insertError } = await supabase.from('profiles').insert([{
          id: user.id,
          email: user.email,
          role: 'client',
          full_name: user.user_metadata?.full_name || 'Usuario'
        }]);

        if (insertError) {
          console.error("Error al insertar perfil:", insertError);
          throw new Error("No se pudo registrar tu perfil base de usuario.");
        }
      }

      // 2. Subir Licencia
      let licenseUrl = '';
      if (licenseFile) {
        const formData = new FormData();
        formData.append('file', { uri: licenseFile.uri, name: licenseFile.name, type: licenseFile.mimeType || 'application/pdf' } as any);
        const fileName = `${user.id}_${Date.now()}.pdf`;
        const { error: uploadError } = await supabase.storage.from('licenses').upload(fileName, formData);
        if (uploadError) throw uploadError;
        licenseUrl = supabase.storage.from('licenses').getPublicUrl(fileName).data.publicUrl;
      }

      // 3. Crear Centro
      const { data: centerData, error: centerError } = await supabase.from('centers').insert({
        owner_id: user.id, 
        name: centerName, 
        address, 
        description, 
        license_url: licenseUrl, 
        status: 'pending',
        payment_qr_url: '' 
      }).select('id').single();

      if (centerError) throw centerError;

      // 4. Subir Servicios con Imágenes
      const validServices = services.filter(s => s.name && s.duration && s.price);
      if (validServices.length > 0) {
        const servicesToInsert = [];
        for (const service of validServices) {
          let imageUrl = '';
          if (service.image) {
            const formData = new FormData();
            const fileExt = service.image.uri.split('.').pop() || 'jpg';
            const fileName = `${user.id}_${centerData.id}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            formData.append('file', { uri: service.image.uri, name: fileName, type: `image/${fileExt}` } as any);
            
            const { error: imgError } = await supabase.storage.from('service-images').upload(fileName, formData);
            if (!imgError) imageUrl = supabase.storage.from('service-images').getPublicUrl(fileName).data.publicUrl;
          }

          servicesToInsert.push({
            center_id: centerData.id,
            name: service.name,
            duration_min: parseInt(service.duration, 10),
            price: parseFloat(service.price),
            image_url: imageUrl,
          });
        }
        const { error: servicesError } = await supabase.from('services').insert(servicesToInsert);
        if (servicesError) throw servicesError;
      }

      Alert.alert('¡Solicitud enviada!', 'Tu centro ha sido registrado y está en revisión. Se te notificará cuando seas aprobado.', [
        { text: 'Finalizar', onPress: () => router.replace('/(tabs)') }
      ]);

    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Ocurrió un error inesperado al guardar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Input label="Nombre del Centro" icon="award" placeholder="Nombre de tu centro" value={centerName} onChangeText={setCenterName} />
            <Input label="Dirección" icon="map-pin" placeholder="Dirección completa" value={address} onChangeText={setAddress} />
            <Input label="Descripción" icon="align-left" placeholder="Describe tu centro y servicios" value={description} onChangeText={setDescription} multiline numberOfLines={4} style={styles.textArea} />
          </>
        );
      case 2:
        return (
          <View style={styles.licenseSection}>
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>Sube tu documento de respaldo</Text>
            <TouchableOpacity style={styles.licenseButton} onPress={pickLicense}>
              <Feather name="upload" size={18} color={AuraColors.primary} />
              <Text style={styles.licenseButtonText}>{licenseFile ? 'Cambiar archivo PDF' : 'Subir licencia de funcionamiento (PDF)'}</Text>
            </TouchableOpacity>
            {licenseFile && <Text style={styles.licenseName}>Archivo: {licenseFile.name}</Text>}
          </View>
        );
      case 3:
        return (
          <View>
            {services.map((s, index) => (
              <View key={index} style={styles.serviceRow}>
                <Input label="Servicio" placeholder="Ej. Masaje" value={s.name} onChangeText={(val) => updateService(index, 'name', val)} />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}><Input label="Duración (min)" value={s.duration} onChangeText={(val) => updateService(index, 'duration', val)} keyboardType="numeric" /></View>
                  <View style={{ flex: 1 }}><Input label="Precio (Bs)" value={s.price} onChangeText={(val) => updateService(index, 'price', val)} keyboardType="decimal-pad" /></View>
                </View>
                
                <TouchableOpacity style={styles.imagePickerButton} onPress={() => pickServiceImage(index)}>
                  <Feather name="image" size={18} color={AuraColors.primary} />
                  <Text style={styles.imagePickerText}>{s.image ? 'Cambiar imagen' : 'Añadir imagen (opcional)'}</Text>
                </TouchableOpacity>

                {s.image && (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: s.image.uri }} style={styles.imagePreview} />
                    <TouchableOpacity style={styles.removeImageButton} onPress={() => updateService(index, 'image', null)}>
                      <Feather name="x" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                )}

                {services.length > 1 && (
                  <TouchableOpacity onPress={() => removeServiceRow(index)} style={styles.removeServiceButton}>
                    <Feather name="trash-2" size={20} color={AuraColors.destructive} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity onPress={addServiceRow} style={styles.addServiceButton}>
              <Feather name="plus" size={16} color={AuraColors.primary} />
              <Text style={styles.addServiceText}>Añadir servicio</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 20 }}>
            <Feather name="arrow-left" size={24} color={AuraColors.textPrimary} />
          </TouchableOpacity>
          <ProgressSteps steps={STEPS} currentStep={step} />
          <Text style={styles.title}>Convierte tu cuenta en Centro</Text>
          <Text style={styles.subtitle}>Configura tu espacio y empieza a recibir citas.</Text>
          <View style={{ marginBottom: 24 }}>{renderStep()}</View>
          <Button title={step < 3 ? 'Continuar' : 'Enviar Solicitud'} onPress={handleContinue} loading={isSubmitting} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  keyboardView: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 8, marginTop: 10 },
  subtitle: { fontSize: 14, color: AuraColors.textSecondary, marginBottom: 24 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  licenseSection: { marginTop: 16 },
  licenseButton: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: AuraColors.card, borderRadius: 12, borderWidth: 1, borderColor: AuraColors.border },
  licenseButtonText: { color: AuraColors.primary, fontSize: 14 },
  licenseName: { marginTop: 8, fontSize: 12, color: AuraColors.textSecondary },
  serviceRow: { marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: AuraColors.border },
  imagePickerButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, marginTop: 4 },
  imagePickerText: { color: AuraColors.primary, fontSize: 14 },
  imagePreviewContainer: { marginTop: 8, borderRadius: 8, overflow: 'hidden', width: 120, height: 90, position: 'relative' },
  imagePreview: { width: '100%', height: '100%' },
  removeImageButton: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: 2 },
  removeServiceButton: { alignSelf: 'flex-end', marginTop: 8 },
  addServiceButton: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12, backgroundColor: AuraColors.primaryLight, borderRadius: 12, justifyContent: 'center' },
  addServiceText: { color: AuraColors.primary, fontWeight: '600' },
});