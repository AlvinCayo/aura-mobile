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
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/Button';
import Input from '../../src/components/ui/Input';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

export default function CenterProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [centerId, setCenterId] = useState<string | null>(null);

  // Campos del Formulario
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  
  // Coordenadas GPS
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Imágenes
  const [imageUri, setImageUri] = useState<string | null>(null); // Portada actual en DB
  const [newImage, setNewImage] = useState<ImagePicker.ImagePickerAsset | null>(null); // Nueva portada
  
  const [gallery, setGallery] = useState<string[]>([]); // URLs de la DB
  const [newGalleryImages, setNewGalleryImages] = useState<ImagePicker.ImagePickerAsset[]>([]); // Nuevas fotos locales

  useEffect(() => {
    fetchCenterData();
  }, [user]);

  const fetchCenterData = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('centers')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setCenterId(data.id);
        setName(data.name || '');
        setCategory(data.category || '');
        setAddress(data.address || '');
        setDescription(data.description || '');
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

  // --- MANEJO DE GPS ---
  const handleGetLocation = async () => {
    Alert.alert('Capturar GPS', '¿Estás físicamente en tu local ahora mismo?', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, capturar', onPress: async () => {
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') return Alert.alert('Error', 'Se requiere permiso de ubicación.');
          
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
          setLatitude(loc.coords.latitude);
          setLongitude(loc.coords.longitude);
          Alert.alert('Éxito', 'Coordenadas capturadas. No olvides presionar "Guardar cambios".');
        }
      }
    ]);
  };

  // --- MANEJO DE IMÁGENES ---
  const pickMainImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permiso necesario', 'Necesitamos acceso a la galería.');
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [16, 9], quality: 0.8,
    });
    if (!result.canceled) setNewImage(result.assets[0]);
  };

  const pickGalleryImage = async () => {
    const totalPhotos = gallery.length + newGalleryImages.length;
    if (totalPhotos >= 3) return Alert.alert('Límite alcanzado', 'Solo puedes subir 3 fotos de galería.');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.8,
    });
    if (!result.canceled) setNewGalleryImages([...newGalleryImages, result.assets[0]]);
  };

  const removeGalleryImage = (index: number, isNew: boolean) => {
    if (isNew) {
      setNewGalleryImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setGallery(prev => prev.filter((_, i) => i !== index));
    }
  };

  // --- FUNCIÓN DE GUARDADO MAESTRO ---
  const handleSave = async () => {
    if (!centerId) return;
    setSaving(true);

    try {
      let finalMainImageUrl = imageUri;
      const finalGalleryUrls = [...gallery];

      // 1. Subir nueva portada si existe
      if (newImage) {
        const fileExt = newImage.uri.split('.').pop() || 'jpg';
        const fileName = `cover_${centerId}_${Date.now()}.${fileExt}`;
        const formData = new FormData();
        formData.append('file', { uri: newImage.uri, name: fileName, type: `image/${fileExt}` } as any);
        
        await supabase.storage.from('service-images').upload(fileName, formData);
        finalMainImageUrl = supabase.storage.from('service-images').getPublicUrl(fileName).data.publicUrl;
      }

      // 2. Subir nuevas fotos de galería
      for (const img of newGalleryImages) {
        const fileExt = img.uri.split('.').pop() || 'jpg';
        const fileName = `gallery_${centerId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const formData = new FormData();
        formData.append('file', { uri: img.uri, name: fileName, type: `image/${fileExt}` } as any);
        
        await supabase.storage.from('service-images').upload(fileName, formData);
        const url = supabase.storage.from('service-images').getPublicUrl(fileName).data.publicUrl;
        finalGalleryUrls.push(url);
      }

      // 3. Actualizar la base de datos
      const { error } = await supabase.from('centers').update({
        name,
        category,
        address,
        description,
        image_url: finalMainImageUrl,
        gallery_urls: finalGalleryUrls,
        latitude,
        longitude
      }).eq('id', centerId);

      if (error) throw error;

      Alert.alert('¡Actualizado!', 'El perfil de tu centro ha sido guardado exitosamente.');
      
      // Limpiar estados locales de edición
      setNewImage(null);
      setNewGalleryImages([]);
      fetchCenterData();

    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo guardar la información.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={AuraColors.primary} /></View>;

  const displayMainImage = newImage ? newImage.uri : imageUri;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color={AuraColors.textPrimary} />
            </TouchableOpacity>
            <View>
              <Text style={styles.title}>Perfil del Centro</Text>
              <Text style={styles.subtitle}>Lo que tus clientes ven en la app</Text>
            </View>
          </View>

          {/* FOTO DE PORTADA */}
          <View style={styles.imageSection}>
            <View style={styles.imageContainer}>
              {displayMainImage ? (
                <Image source={{ uri: displayMainImage }} style={styles.image} />
              ) : (
                <View style={styles.imagePlaceholder}><Feather name="image" size={40} color={AuraColors.textMuted} /></View>
              )}
            </View>
            <TouchableOpacity style={styles.changeImageButton} onPress={pickMainImage}>
              <Feather name="camera" size={16} color={AuraColors.primary} />
              <Text style={styles.changeImageText}>Cambiar foto de portada</Text>
            </TouchableOpacity>
          </View>

          {/* GALERÍA DE FOTOS (Max 3) */}
          <View style={styles.gallerySection}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.sectionLabel}>Fotos de Instalaciones (Max 3)</Text>
              {(gallery.length + newGalleryImages.length) < 3 && (
                <TouchableOpacity onPress={pickGalleryImage}><Feather name="plus-circle" size={24} color={AuraColors.primary} /></TouchableOpacity>
              )}
            </View>
            <View style={styles.galleryRow}>
              {gallery.map((url, idx) => (
                <View key={`db-${idx}`} style={styles.galleryItem}>
                  <Image source={{ uri: url }} style={styles.galleryImage} />
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeGalleryImage(idx, false)}><Feather name="x" size={14} color="white" /></TouchableOpacity>
                </View>
              ))}
              {newGalleryImages.map((img, idx) => (
                <View key={`new-${idx}`} style={styles.galleryItem}>
                  <Image source={{ uri: img.uri }} style={styles.galleryImage} />
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeGalleryImage(idx, true)}><Feather name="x" size={14} color="white" /></TouchableOpacity>
                </View>
              ))}
              {(gallery.length + newGalleryImages.length) === 0 && (
                <Text style={styles.emptyGalleryText}>No has subido fotos de referencia.</Text>
              )}
            </View>
          </View>

          {/* DATOS DEL FORMULARIO */}
          <View style={styles.form}>
            <Input label="Nombre del centro" icon="award" value={name} onChangeText={setName} />
            <Input label="Categoría (Ej. Barbería, Uñas, Spa)" icon="tag" value={category} onChangeText={setCategory} />
            <Input label="Dirección textual" icon="map-pin" value={address} onChangeText={setAddress} />
            <Input label="Descripción y especialidades" icon="align-left" value={description} onChangeText={setDescription} multiline numberOfLines={4} style={{ minHeight: 80, textAlignVertical: 'top' }} />
          </View>

          {/* CONFIGURACIÓN DE GPS REAL */}
          <View style={styles.gpsSection}>
            <Text style={styles.sectionLabel}>Ubicación en el Mapa</Text>
            {latitude && longitude ? (
              <View style={styles.gpsActiveBox}>
                <Feather name="check-circle" size={16} color="#16A34A" />
                <Text style={styles.gpsActiveText}>Coordenadas guardadas correctamente.</Text>
              </View>
            ) : (
              <Text style={styles.gpsWarningText}>Tus clientes no podrán ver tu distancia exacta hasta que configures tu GPS.</Text>
            )}
            <TouchableOpacity style={styles.gpsButton} onPress={handleGetLocation}>
              <Feather name="navigation" size={18} color="white" />
              <Text style={styles.gpsButtonText}>Fijar mi ubicación GPS actual</Text>
            </TouchableOpacity>
          </View>

          <Button title="Guardar Cambios Públicos" onPress={handleSave} loading={saving} icon={<Feather name="save" size={18} color="white" />} style={styles.saveButton} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  flex: { flex: 1 },
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
  sectionLabel: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary },
  galleryRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  galleryItem: { width: 90, height: 90, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  galleryImage: { width: '100%', height: '100%' },
  removeBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  emptyGalleryText: { fontSize: 13, color: AuraColors.textMuted, fontStyle: 'italic', marginTop: 8 },
  
  form: { marginBottom: 24 },
  
  gpsSection: { marginBottom: 32, backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: AuraColors.border },
  gpsActiveBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 16, backgroundColor: '#DCFCE7', padding: 10, borderRadius: 8 },
  gpsActiveText: { color: '#16A34A', fontSize: 13, fontWeight: '600' },
  gpsWarningText: { fontSize: 13, color: '#D97706', marginTop: 8, marginBottom: 16, lineHeight: 18 },
  gpsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: AuraColors.primary, paddingVertical: 12, borderRadius: 12 },
  gpsButtonText: { color: 'white', fontWeight: '700', fontSize: 14 },
  
  saveButton: { marginTop: 8, height: 54 },
});