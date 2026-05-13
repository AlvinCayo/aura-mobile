import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
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
import Button from '../src/components/ui/Button';
import Input from '../src/components/ui/Input';
import ProgressSteps from '../src/components/ui/ProgressSteps';
import { supabase } from '../src/lib/supabase';
import { AuraColors } from '../src/theme/colors';

const STEPS = [
  { id: 1, label: 'Info' },
  { id: 2, label: 'Docs' },
  { id: 3, label: 'Servicios' },
  { id: 4, label: 'Verif.' },
];

interface ServiceInput {
  name: string;
  duration: string;
  price: string;
  image: ImagePicker.ImagePickerAsset | null;
}

export default function RegisterCenterScreen() {
  const [step, setStep] = useState(1);
  const [centerName, setCenterName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [ownerFullName, setOwnerFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [licenseFile, setLicenseFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [services, setServices] = useState<ServiceInput[]>([{ name: '', duration: '', price: '', image: null }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  const addServiceRow = () => {
    setServices([...services, { name: '', duration: '', price: '', image: null }]);
  };

  const removeServiceRow = (index: number) => {
    const updated = services.filter((_, i) => i !== index);
    setServices(updated);
  };

  const updateService = (index: number, field: keyof ServiceInput, value: string | ImagePicker.ImagePickerAsset | null) => {
    const updated = [...services];
    updated[index][field] = value as never;
    setServices(updated);
  };

  const pickServiceImage = async (index: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a la galería para seleccionar una imagen.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      updateService(index, 'image', result.assets[0]);
    }
  };

  const pickLicense = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLicenseFile(result.assets[0]);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const handleContinue = async () => {
    if (step < 4) {
      setStep(step + 1);
      return;
    }

    setIsSubmitting(true);

    // 1. Crear usuario
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: ownerFullName, role: 'center_owner' } },
    });
    
    if (signUpError) {
      Alert.alert('Error al registrar', signUpError.message);
      setIsSubmitting(false);
      return;
    }

    const user = signUpData.user;
    if (!user) {
      Alert.alert('Error', 'No se pudo crear el usuario.');
      setIsSubmitting(false);
      return;
    }

    // 2. Subir licencia usando FormData
    let licenseUrl = '';
    if (licenseFile) {
      try {
        const formData = new FormData();
        formData.append('file', {
          uri: licenseFile.uri,
          name: licenseFile.name,
          type: licenseFile.mimeType || 'application/pdf',
        } as any);

        const fileName = `${user.id}_${Date.now()}.pdf`;
        
        const { error: uploadError } = await supabase.storage
          .from('licenses')
          .upload(fileName, formData);

        if (uploadError) {
          console.error("Error subiendo licencia:", uploadError);
          Alert.alert('Error al subir licencia', uploadError.message);
          setIsSubmitting(false);
          return;
        }
        licenseUrl = supabase.storage.from('licenses').getPublicUrl(fileName).data.publicUrl;
      } catch (err: any) {
        console.error("Error capturado subiendo licencia:", err);
        Alert.alert('Error', err.message || 'Falló la subida del PDF.');
        setIsSubmitting(false);
        return;
      }
    }

    // 3. Crear centro pendiente y obtener el ID
    const { data: centerData, error: centerError } = await supabase.from('centers').insert({
      owner_id: user.id,
      name: centerName,
      address,
      description,
      license_url: licenseUrl,
      status: 'pending',
    }).select('id').single();

    if (centerError || !centerData) {
      Alert.alert('Error al crear centro', centerError?.message || 'Error desconocido.');
      setIsSubmitting(false);
      return;
    }

    const centerId = centerData.id;

    // 4. Procesar servicios usando FormData
    const validServices = services.filter(s => s.name.trim() !== '' && s.duration.trim() !== '' && s.price.trim() !== '');

    if (validServices.length > 0) {
      const servicesToInsert = [];

      for (const service of validServices) {
        let imageUrl = '';

        if (service.image) {
          try {
            const formData = new FormData();
            const fileExt = service.image.uri.split('.').pop() || 'jpg';
            const fileName = `${user.id}_${centerId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            
            // Determinar MIME type básico basado en la extensión
            let mimeType = 'image/jpeg';
            if (fileExt.toLowerCase() === 'png') mimeType = 'image/png';
            if (fileExt.toLowerCase() === 'webp') mimeType = 'image/webp';

            formData.append('file', {
              uri: service.image.uri,
              name: fileName,
              type: mimeType,
            } as any);

            const { error: uploadError } = await supabase.storage
              .from('service-images')
              .upload(fileName, formData);

            if (!uploadError) {
              imageUrl = supabase.storage.from('service-images').getPublicUrl(fileName).data.publicUrl;
            } else {
               console.error("Error subiendo imagen de servicio:", uploadError);
            }
          } catch (e) {
            console.error("Error capturado de imagen:", e);
          }
        }

        servicesToInsert.push({
          center_id: centerId,
          name: service.name,
          duration_min: parseInt(service.duration, 10),
          price: parseFloat(service.price),
          image_url: imageUrl,
        });
      }

      const { error: servicesError } = await supabase.from('services').insert(servicesToInsert);
      if (servicesError) {
        Alert.alert('Error al guardar servicios', servicesError.message);
        setIsSubmitting(false);
        return;
      }
    }

    setIsSubmitting(false);
    Alert.alert('Solicitud enviada', 'Tu centro está pendiente de aprobación. Recibirás un correo cuando sea revisado.');
    router.replace('/login');
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
          <>
            <Input label="Nombre completo" icon="user" placeholder="Tu nombre" value={ownerFullName} onChangeText={setOwnerFullName} />
            <Input label="Correo electrónico" icon="mail" placeholder="correo@centro.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Input label="Contraseña" icon="lock" placeholder="Mínimo 8 caracteres" value={password} onChangeText={setPassword} isPassword />
            <View style={styles.licenseSection}>
              <TouchableOpacity style={styles.licenseButton} onPress={pickLicense}>
                <Feather name="upload" size={18} color={AuraColors.primary} />
                <Text style={styles.licenseButtonText}>
                  {licenseFile ? 'Cambiar archivo PDF' : 'Subir licencia de funcionamiento (PDF)'}
                </Text>
              </TouchableOpacity>
              {licenseFile && <Text style={styles.licenseName}>Archivo: {licenseFile.name}</Text>}
            </View>
          </>
        );
      case 3:
        return (
          <View>
            {services.map((s, index) => (
              <View key={index} style={styles.serviceRow}>
                <Input
                  label="Servicio"
                  placeholder="Ej. Masaje"
                  value={s.name}
                  onChangeText={(val) => updateService(index, 'name', val)}
                />
                <Input
                  label="Duración (min)"
                  placeholder="60"
                  value={s.duration}
                  onChangeText={(val) => updateService(index, 'duration', val)}
                  keyboardType="numeric"
                />
                <Input
                  label="Precio (Bs)"
                  placeholder="50.00"
                  value={s.price}
                  onChangeText={(val) => updateService(index, 'price', val)}
                  keyboardType="decimal-pad"
                />

                <TouchableOpacity style={styles.imagePickerButton} onPress={() => pickServiceImage(index)}>
                  <Feather name="image" size={18} color={AuraColors.primary} />
                  <Text style={styles.imagePickerText}>
                    {s.image ? 'Cambiar imagen' : 'Añadir imagen (opcional)'}
                  </Text>
                </TouchableOpacity>

                {s.image && (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: s.image.uri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => updateService(index, 'image', null)}
                    >
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
      case 4:
        return (
          <View style={styles.placeholder}>
            <Feather name="check-circle" size={40} color={AuraColors.success} />
            <Text style={styles.placeholderText}>Verifica que los datos sean correctos y presiona "Enviar para Aprobación".</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ProgressSteps steps={STEPS} currentStep={step} />
          <Text style={styles.title}>Registra tu Centro</Text>
          <Text style={styles.subtitle}>Completa la información</Text>
          {renderStep()}
          <Button
            title={step < 4 ? 'Continuar' : 'Enviar para Aprobación'}
            onPress={handleContinue}
            loading={isSubmitting}
            icon={<Feather name="arrow-right" size={18} color="white" />}
            style={styles.continueButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  keyboardView: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: AuraColors.textSecondary, marginBottom: 32 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  licenseSection: { marginTop: 16 },
  licenseButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12,
    backgroundColor: AuraColors.card, borderRadius: 12, borderWidth: 1, borderColor: AuraColors.border,
  },
  licenseButtonText: { color: AuraColors.primary, fontSize: 14 },
  licenseName: { marginTop: 8, fontSize: 12, color: AuraColors.textSecondary },
  serviceRow: { marginBottom: 12 },
  imagePickerButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10,
    marginTop: 4,
  },
  imagePickerText: { color: AuraColors.primary, fontSize: 14 },
  imagePreviewContainer: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
    width: 120,
    height: 90,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 2,
  },
  removeServiceButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  addServiceButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12,
    backgroundColor: AuraColors.primaryLight, borderRadius: 12, justifyContent: 'center',
  },
  addServiceText: { color: AuraColors.primary, fontWeight: '600' },
  placeholder: { alignItems: 'center', paddingVertical: 40 },
  placeholderText: { fontSize: 16, color: AuraColors.textMuted, marginTop: 12, textAlign: 'center' },
  continueButton: { marginTop: 20 },
});