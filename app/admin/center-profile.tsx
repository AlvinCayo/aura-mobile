import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/Button';
import Input from '../../src/components/ui/Input';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

const DAYS_ORDER = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

export default function CenterProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [centerId, setCenterId] = useState<string | null>(null);

  // Campos Básicos
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');

  // Horarios Semanales
  const [schedule, setSchedule] = useState<any>({
    lunes: { open: '09:00', close: '18:00', active: true },
    martes: { open: '09:00', close: '18:00', active: true },
    miercoles: { open: '09:00', close: '18:00', active: true },
    jueves: { open: '09:00', close: '18:00', active: true },
    viernes: { open: '09:00', close: '18:00', active: true },
    sabado: { open: '09:00', close: '14:00', active: true },
    domingo: { open: '00:00', close: '00:00', active: false },
  });
  
  // Coordenadas y Galería
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [newImage, setNewImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [newGalleryImages, setNewGalleryImages] = useState<ImagePicker.ImagePickerAsset[]>([]);

  useEffect(() => {
    fetchCenterData();
  }, [user]);

  const fetchCenterData = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('centers').select('*').eq('owner_id', user.id).single();
      if (error) throw error;
      if (data) {
        setCenterId(data.id);
        setName(data.name || '');
        setCategory(data.category || '');
        setAddress(data.address || '');
        setDescription(data.description || '');
        setPhone(data.phone || '');
        if (data.schedule) setSchedule(data.schedule);
        setImageUri(data.image_url || null);
        setGallery(data.gallery_urls || []);
        setLatitude(data.latitude ? parseFloat(data.latitude) : null);
        setLongitude(data.longitude ? parseFloat(data.longitude) : null);
      }
    } catch (error) {
      console.error('Error cargando perfil del centro', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = async () => {
    Alert.alert('Capturar GPS', '¿Estás físicamente en tu local ahora mismo?', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí', onPress: async () => {
          try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return Alert.alert('Error', 'Se requiere permiso.');
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
            setLatitude(loc.coords.latitude);
            setLongitude(loc.coords.longitude);
            Alert.alert('Éxito', 'Coordenadas capturadas temporalmente. No olvides presionar "Guardar Cambios".');
          } catch (e) {
            Alert.alert('Error', 'No se pudo obtener el GPS. Verifica la señal de tu teléfono.');
          }
        }
      }
    ]);
  };

  const pickMainImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permiso necesario');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [16, 9], quality: 0.8 });
    if (!result.canceled) setNewImage(result.assets[0]);
  };

  const pickGalleryImage = async () => {
    if ((gallery.length + newGalleryImages.length) >= 3) return Alert.alert('Límite', 'Solo 3 fotos de galería.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.8 });
    if (!result.canceled) setNewGalleryImages([...newGalleryImages, result.assets[0]]);
  };

  const removeGalleryImage = (index: number, isNew: boolean) => {
    if (isNew) setNewGalleryImages(prev => prev.filter((_, i) => i !== index));
    else setGallery(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!centerId) return Alert.alert('Error', 'No se encontró el ID del centro. Intenta reiniciar la app.');
    if (!name) return Alert.alert('Aviso', 'El nombre del centro es obligatorio.');
    
    setSaving(true);
    try {
      let finalMainImageUrl = imageUri;
      const finalGalleryUrls = [...gallery];

      // 1. Subir nueva portada
      if (newImage) {
        const fileExt = newImage.uri.split('.').pop() || 'jpg';
        const fileName = `cover_${centerId}_${Date.now()}.${fileExt}`;
        const formData = new FormData();
        formData.append('file', { uri: newImage.uri, name: fileName, type: `image/${fileExt}` } as any);
        const { error: uploadError } = await supabase.storage.from('service-images').upload(fileName, formData);
        if (uploadError) throw uploadError;
        finalMainImageUrl = supabase.storage.from('service-images').getPublicUrl(fileName).data.publicUrl;
      }

      // 2. Subir nuevas fotos de galería
      for (const img of newGalleryImages) {
        const fileExt = img.uri.split('.').pop() || 'jpg';
        const fileName = `gallery_${centerId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const formData = new FormData();
        formData.append('file', { uri: img.uri, name: fileName, type: `image/${fileExt}` } as any);
        const { error: galError } = await supabase.storage.from('service-images').upload(fileName, formData);
        if (galError) throw galError;
        finalGalleryUrls.push(supabase.storage.from('service-images').getPublicUrl(fileName).data.publicUrl);
      }

      // 3. Preparar el objeto de actualización (protección contra nulos)
      const updateData: any = {
        name: name,
        category: category,
        address: address,
        description: description,
        phone: phone,
        schedule: schedule,
        image_url: finalMainImageUrl,
        gallery_urls: finalGalleryUrls,
      };

      // Solo enviar lat/long si realmente existen como números válidos
      if (latitude !== null && longitude !== null) {
        updateData.latitude = latitude;
        updateData.longitude = longitude;
      }

      // 4. Actualizar base de datos
      const { error } = await supabase.from('centers').update(updateData).eq('id', centerId);

      if (error) {
        console.error("DB Update Error:", error);
        throw new Error(error.message || 'Error de base de datos.');
      }

      Alert.alert('¡Actualizado!', 'Perfil guardado exitosamente.');
      setNewImage(null); 
      setNewGalleryImages([]); 
      fetchCenterData();

    } catch (error: any) {
      Alert.alert('Error al guardar', error.message || 'Verifica tu conexión y los datos ingresados.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={AuraColors.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Feather name="arrow-left" size={24} color={AuraColors.textPrimary} /></TouchableOpacity>
            <View><Text style={styles.title}>Perfil y Horarios</Text></View>
          </View>

          {/* FOTOS */}
          <View style={styles.imageSection}>
            <View style={styles.imageContainer}>
              {newImage || imageUri ? <Image source={{ uri: newImage ? newImage.uri : imageUri! }} style={styles.image} /> : <View style={styles.imagePlaceholder}><Feather name="image" size={40} color={AuraColors.textMuted} /></View>}
            </View>
            <TouchableOpacity style={styles.changeImageButton} onPress={pickMainImage}><Feather name="camera" size={16} color={AuraColors.primary} /><Text style={styles.changeImageText}>Cambiar Portada</Text></TouchableOpacity>
          </View>

          <View style={styles.gallerySection}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.sectionLabel}>Instalaciones (Max 3)</Text>
              {(gallery.length + newGalleryImages.length) < 3 && <TouchableOpacity onPress={pickGalleryImage}><Feather name="plus-circle" size={24} color={AuraColors.primary} /></TouchableOpacity>}
            </View>
            <View style={styles.galleryRow}>
              {gallery.map((url, idx) => (<View key={`db-${idx}`} style={styles.galleryItem}><Image source={{ uri: url }} style={styles.galleryImage} /><TouchableOpacity style={styles.removeBtn} onPress={() => removeGalleryImage(idx, false)}><Feather name="x" size={14} color="white" /></TouchableOpacity></View>))}
              {newGalleryImages.map((img, idx) => (<View key={`new-${idx}`} style={styles.galleryItem}><Image source={{ uri: img.uri }} style={styles.galleryImage} /><TouchableOpacity style={styles.removeBtn} onPress={() => removeGalleryImage(idx, true)}><Feather name="x" size={14} color="white" /></TouchableOpacity></View>))}
            </View>
          </View>

          {/* DATOS BÁSICOS */}
          <View style={styles.form}>
            <Input label="Nombre del centro" icon="award" value={name} onChangeText={setName} />
            <Input label="Número WhatsApp (Para consultas)" icon="message-circle" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Ej: 71234567" />
            <Input label="Categoría (Barbería, Spa...)" icon="tag" value={category} onChangeText={setCategory} />
            <Input label="Dirección textual" icon="map-pin" value={address} onChangeText={setAddress} />
            <Input label="Descripción" icon="align-left" value={description} onChangeText={setDescription} multiline numberOfLines={4} style={{ minHeight: 80, textAlignVertical: 'top' }} />
          </View>

          {/* HORARIOS SEMANALES */}
          <View style={styles.scheduleSection}>
            <Text style={styles.sectionLabel}>Horario de Atención Semanal</Text>
            {DAYS_ORDER.map(day => (
              <View key={day} style={styles.dayRow}>
                <TouchableOpacity 
                  style={[styles.dayToggle, schedule[day]?.active && styles.dayToggleActive]} 
                  onPress={() => setSchedule({...schedule, [day]: {...schedule[day], active: !schedule[day].active}})}
                >
                  <Feather name={schedule[day]?.active ? 'check' : 'x'} size={14} color={schedule[day]?.active ? 'white' : AuraColors.textMuted} />
                </TouchableOpacity>
                <Text style={styles.dayName}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                
                {schedule[day]?.active ? (
                  <View style={styles.timeInputs}>
                    <TextInput style={styles.timeInput} value={schedule[day].open} onChangeText={(v) => setSchedule({...schedule, [day]: {...schedule[day], open: v}})} placeholder="09:00" />
                    <Text style={{color: AuraColors.textMuted}}>-</Text>
                    <TextInput style={styles.timeInput} value={schedule[day].close} onChangeText={(v) => setSchedule({...schedule, [day]: {...schedule[day], close: v}})} placeholder="18:00" />
                  </View>
                ) : (
                  <Text style={styles.closedText}>Cerrado</Text>
                )}
              </View>
            ))}
          </View>

          {/* GPS */}
          <View style={styles.gpsSection}>
            <Text style={styles.sectionLabel}>Ubicación en el Mapa</Text>
            {latitude ? (
              <View style={styles.gpsActiveBox}><Feather name="check-circle" size={16} color="#16A34A" /><Text style={styles.gpsActiveText}>Coordenadas guardadas.</Text></View>
            ) : <Text style={styles.gpsWarningText}>Configura tu GPS para aparecer en las búsquedas cercanas.</Text>}
            <TouchableOpacity style={styles.gpsButton} onPress={handleGetLocation}><Feather name="navigation" size={18} color="white" /><Text style={styles.gpsButtonText}>Fijar GPS actual</Text></TouchableOpacity>
          </View>

          <Button title="Guardar Cambios" onPress={handleSave} loading={saving} icon={<Feather name="save" size={18} color="white" />} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 24, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 16 },
  backButton: { padding: 8, marginLeft: -8 },
  title: { fontSize: 24, fontWeight: '800', color: AuraColors.textPrimary },
  subtitle: { fontSize: 14, color: AuraColors.textSecondary },
  imageSection: { alignItems: 'center', marginBottom: 24 },
  imageContainer: { width: '100%', height: 180, borderRadius: 16, overflow: 'hidden', backgroundColor: AuraColors.border, marginBottom: 12 },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  changeImageButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: AuraColors.primaryLight, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  changeImageText: { fontSize: 14, color: AuraColors.primary, fontWeight: '600' },
  gallerySection: { marginBottom: 24, backgroundColor: AuraColors.card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: AuraColors.border },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 12 },
  galleryRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  galleryItem: { width: 90, height: 90, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  galleryImage: { width: '100%', height: '100%' },
  removeBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  form: { marginBottom: 24 },
  
  scheduleSection: { marginBottom: 24, backgroundColor: AuraColors.card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: AuraColors.border },
  dayRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dayToggle: { width: 24, height: 24, borderRadius: 6, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  dayToggleActive: { backgroundColor: AuraColors.primary },
  dayName: { flex: 1, fontSize: 14, fontWeight: '600', color: AuraColors.textPrimary },
  timeInputs: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: AuraColors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, fontSize: 14, color: AuraColors.textPrimary, width: 70, textAlign: 'center' },
  closedText: { fontSize: 14, color: '#EF4444', fontStyle: 'italic', paddingRight: 20 },

  gpsSection: { marginBottom: 32, backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: AuraColors.border },
  gpsActiveBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, backgroundColor: '#DCFCE7', padding: 10, borderRadius: 8 },
  gpsActiveText: { color: '#16A34A', fontSize: 13, fontWeight: '600' },
  gpsWarningText: { fontSize: 13, color: '#D97706', marginBottom: 16, lineHeight: 18 },
  gpsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: AuraColors.primary, paddingVertical: 12, borderRadius: 12 },
  gpsButtonText: { color: 'white', fontWeight: '700', fontSize: 14 },
});