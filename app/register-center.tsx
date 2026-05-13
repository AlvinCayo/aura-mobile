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
import { useAuth } from '../src/contexts/AuthContext';
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
  image: ImagePicker.ImagePickerAsset | null; // <-- Nuevo campo
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

  const router = useRouter();
  const { signUp } = useAuth();

  // --- Manejo de servicios ---
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

  // --- Seleccionar imagen para un servicio ---
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

  // --- Subida de licencia ---
  const pickLicense = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (result.assets && result.assets.length > 0) {
        setLicenseFile(result.assets[0]);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  // --- Registro completo ---
  const handleContinue = async () => {
    if (step < 4) {
      setStep(step + 1);
      return;
    }

    // 1. Crear usuario y centro en estado "pending"
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: ownerFullName, role: 'center_owner' } },
    });
    if (error) {
      Alert.alert('Error al registrar', error.message);
      return;
    }

const user = signUpData.user;
if (!user) {
  Alert.alert('Error', 'No se pudo crear el usuario.');
  return;
}
// A partir de aquí usa `user.id` directamente

    // 2. Subir licencia si existe
    let licenseUrl = '';
    if (licenseFile) {
      const response = await fetch(licenseFile.uri);
      const blob = await response.blob();

      const fileName = `${user.id}_${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('licenses')
        .upload(fileName, blob, { contentType: 'application/pdf', upsert: true });

      if (uploadError) {
        Alert.alert('Error al subir licencia', uploadError.message);
        return;
      }
      licenseUrl = supabase.storage.from('licenses').getPublicUrl(fileName).data.publicUrl;
    }

    // 3. Crear centro pendiente
    const { error: centerError } = await supabase.from('centers').insert({
      owner_id: user.id,
      name: centerName,
      address,
      description,
      license_url: licenseUrl,
      status: 'pending',
    });

    if (centerError) {
      Alert.alert('Error al crear centro', centerError.message);
      return;
    }

    // Obtener el ID del centro recién creado
    const { data: centerData, error: centerFetchError } = await supabase
      .from('centers')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (centerFetchError || !centerData) {
      Alert.alert('Error', 'No se pudo obtener el centro recién creado.');
      return;
    }

    const centerId = centerData.id;

    // 4. Procesar servicios (subir imágenes y luego insertar)
    const validServices = services.filter(s => s.name.trim() !== '' && s.duration.trim() !== '' && s.price.trim() !== '');

    if (validServices.length > 0) {
      const servicesToInsert = [];

      for (const service of validServices) {
        let imageUrl = '';

        // Subir imagen si existe
        if (service.image) {
          const response = await fetch(service.image.uri);
          const blob = await response.blob();
          const fileExt = service.image.uri.split('.').pop() || 'jpg';
          const fileName = `${user.id}_${centerId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('service-images')
            .upload(fileName, blob, { contentType: `image/${fileExt}`, upsert: true });

          if (!uploadError) {
            imageUrl = supabase.storage.from('service-images').getPublicUrl(fileName).data.publicUrl;
          } else {
            console.error('Error subiendo imagen de servicio:', uploadError.message);
            // Continuamos aunque falle la imagen
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
        return;
      }
    }

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
                  label="Precio (€)"
                  placeholder="50.00"
                  value={s.price}
                  onChangeText={(val) => updateService(index, 'price', val)}
                  keyboardType="decimal-pad"
                />

                {/* Sección de imagen del servicio */}
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
  placeholderText: { fontSize: 16, color: AuraColors.textMuted, marginTop: 12 },
  continueButton: { marginTop: 20 },
});