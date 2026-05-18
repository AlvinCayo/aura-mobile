import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { useAuth } from '../src/contexts/AuthContext';
import { supabase } from '../src/lib/supabase';
import { AuraColors } from '../src/theme/colors';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newAvatar, setNewAvatar] = useState<ImagePicker.ImagePickerAsset | null>(null);

  useEffect(() => {
    const fetchCurrentProfile = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, phone, avatar_url')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        // Si hay datos en la DB, los usamos; si no, caemos al metadata (ej: primera vez)
        if (data) {
          setFullName(data.full_name || user.user_metadata?.full_name || '');
          setPhone(data.phone || '');
          setAvatarUrl(data.avatar_url || user.user_metadata?.avatar_url || null);
        }
      } catch (error) {
        console.error('Error al cargar perfil', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentProfile();
  }, [user]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Aviso', 'Se requieren permisos para acceder a la galería y cambiar tu foto.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setNewAvatar(result.assets[0]);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      let finalAvatarUrl = avatarUrl;

      // 1. Si seleccionó una nueva foto, la subimos a nuestro bucket privado en Supabase
      if (newAvatar) {
        const formData = new FormData();
        const fileExt = newAvatar.uri.split('.').pop() || 'jpg';
        const fileName = `${user.id}_avatar_${Date.now()}.${fileExt}`;
        
        formData.append('file', {
          uri: newAvatar.uri,
          name: fileName,
          type: `image/${fileExt}`
        } as any);

        const { error: uploadError } = await supabase.storage
          .from('avatars') 
          .upload(fileName, formData);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
        finalAvatarUrl = publicUrl;
      }

      // 2. Guardamos la información oficial en la tabla 'profiles'
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone,
          avatar_url: finalAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 3. También actualizamos el metadata por si las moscas para mantener sincronía interna
      await supabase.auth.updateUser({
        data: { full_name: fullName, avatar_url: finalAvatarUrl }
      });

      Alert.alert('¡Éxito!', 'Tu información ha sido guardada permanentemente.', [
        { text: 'Aceptar', onPress: () => router.back() }
      ]);

    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo guardar la información.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AuraColors.primary} />
      </View>
    );
  }

  // Decidimos qué imagen mostrar en pantalla (la nueva seleccionada o la que ya teníamos)
  const imageToDisplay = newAvatar ? newAvatar.uri : avatarUrl;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color={AuraColors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Editar Perfil</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {imageToDisplay ? (
                <Image source={{ uri: imageToDisplay }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarFallback}>
                  {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
                </Text>
              )}
              <TouchableOpacity style={styles.editAvatarBadge} onPress={handlePickImage}>
                <Feather name="camera" size={16} color="white" />
              </TouchableOpacity>
            </View>
            <Text style={styles.avatarHelperText}>Cambiar foto de perfil</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Nombre Completo"
              icon="user"
              placeholder="Ej. Juan Pérez"
              value={fullName}
              onChangeText={setFullName}
            />

            <Input
              label="Número de Teléfono"
              icon="phone"
              placeholder="Ej. 70000000"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <Button
            title="Guardar Cambios"
            onPress={handleSave}
            loading={saving}
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 24, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  backButton: { padding: 8, marginLeft: -8 },
  title: { fontSize: 20, fontWeight: '700', color: AuraColors.textPrimary },
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatarContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: AuraColors.primaryLight, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 50 },
  avatarFallback: { fontSize: 36, fontWeight: '700', color: AuraColors.primary },
  editAvatarBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: AuraColors.primary, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: AuraColors.background },
  avatarHelperText: { fontSize: 14, color: AuraColors.textSecondary, marginTop: 12 },
  form: { gap: 8 },
  saveButton: { marginTop: 32 },
});