import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
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

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');

  const [schedule, setSchedule] = useState<any>({
    lunes: { open: '09:00', close: '18:00', active: true },
    martes: { open: '09:00', close: '18:00', active: true },
    miercoles: { open: '09:00', close: '18:00', active: true },
    jueves: { open: '09:00', close: '18:00', active: true },
    viernes: { open: '09:00', close: '18:00', active: true },
    sabado: { open: '09:00', close: '14:00', active: true },
    domingo: { open: '00:00', close: '00:00', active: false },
  });
  
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: -16.4958,
    longitude: -68.1335,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [newImage, setNewImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  
  // ESTADOS DE LA GALERÍA
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
        
        if (data.latitude && data.longitude) {
          const lat = parseFloat(data.latitude);
          const lon = parseFloat(data.longitude);
          setLatitude(lat);
          setLongitude(lon);
          setMapRegion({ ...mapRegion, latitude: lat, longitude: lon });
        }
      }
    } catch (error) {
      console.error('Error cargando perfil del centro', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Error', 'Se requiere permiso de GPS.');
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = loc.coords.latitude;
      const lon = loc.coords.longitude;
      setLatitude(lat);
      setLongitude(lon);
      setMapRegion({ ...mapRegion, latitude: lat, longitude: lon });
    } catch (e) {
      Alert.alert('Error', 'No se pudo obtener el GPS.');
    }
  };

  const handleMapPress = (e: any) => {
    const { latitude: newLat, longitude: newLon } = e.nativeEvent.coordinate;
    setLatitude(newLat);
    setLongitude(newLon);
  };

  const pickMainImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [16, 9], quality: 0.8 });
    if (!result.canceled) setNewImage(result.assets[0]);
  };

  // FUNCIONES DE LA GALERÍA
  const pickGalleryImage = async () => {
    if ((gallery.length + newGalleryImages.length) >= 3) return Alert.alert('Límite', 'Solo 3 fotos de galería.');
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.8 });
    if (!result.canceled) setNewGalleryImages([...newGalleryImages, result.assets[0]]);
  };

  const removeGalleryImage = (index: number, isNew: boolean) => {
    if (isNew) setNewGalleryImages(prev => prev.filter((_, i) => i !== index));
    else setGallery(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!centerId || !name) return Alert.alert('Aviso', 'El nombre es obligatorio.');
    
    setSaving(true);
    try {
      let finalMainImageUrl = imageUri;
      const finalGalleryUrls = [...gallery];

      // 1. Subir Imagen Principal
      if (newImage) {
        const fileExt = newImage.uri.split('.').pop() || 'jpg';
        const fileName = `cover_${centerId}_${Date.now()}.${fileExt}`;
        const formData = new FormData();
        formData.append('file', { uri: newImage.uri, name: fileName, type: `image/${fileExt}` } as any);
        const { error: uploadError } = await supabase.storage.from('service-images').upload(fileName, formData);
        if (uploadError) throw uploadError;
        finalMainImageUrl = supabase.storage.from('service-images').getPublicUrl(fileName).data.publicUrl;
      }

      // 2. Subir Imágenes de Galería
      for (const img of newGalleryImages) {
        const fileExt = img.uri.split('.').pop() || 'jpg';
        const fileName = `gallery_${centerId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const formData = new FormData();
        formData.append('file', { uri: img.uri, name: fileName, type: `image/${fileExt}` } as any);
        const { error: galError } = await supabase.storage.from('service-images').upload(fileName, formData);
        if (galError) throw galError;
        finalGalleryUrls.push(supabase.storage.from('service-images').getPublicUrl(fileName).data.publicUrl);
      }

      const updateData: any = {
        name, category, address, description, phone, schedule,
        image_url: finalMainImageUrl,
        gallery_urls: finalGalleryUrls,
      };

      if (latitude !== null && longitude !== null) {
        updateData.latitude = latitude;
        updateData.longitude = longitude;
      }

      const { error } = await supabase.from('centers').update(updateData).eq('id', centerId);
      if (error) throw new Error(error.message);

      Alert.alert('¡Actualizado!', 'Perfil guardado exitosamente.');
      setNewImage(null); 
      setNewGalleryImages([]); 
      fetchCenterData();
    } catch (error: any) {
      Alert.alert('Error al guardar', error.message || 'Verifica tu conexión.');
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

          <View style={styles.imageSection}>
             <View style={styles.imageContainer}>
               {newImage || imageUri ? <Image source={{ uri: newImage ? newImage.uri : imageUri! }} style={styles.image} /> : <View style={styles.imagePlaceholder}><Feather name="image" size={40} color={AuraColors.textMuted} /></View>}
             </View>
             <TouchableOpacity style={styles.changeImageButton} onPress={pickMainImage}><Feather name="camera" size={16} color={AuraColors.primary} /><Text style={styles.changeImageText}>Cambiar Portada</Text></TouchableOpacity>
          </View>

          {/* GALERÍA DE IMÁGENES RESTAURADA */}
          <View style={styles.gallerySection}>
            <Text style={styles.sectionLabel}>Fotos de Instalaciones (Máx 3)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 10 }}>
              {gallery.map((url, index) => (
                <View key={`old-${index}`}>
                  <Image source={{ uri: url }} style={styles.galleryImageItem} />
                  <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeGalleryImage(index, false)}><Feather name="x" size={16} color="white" /></TouchableOpacity>
                </View>
              ))}
              {newGalleryImages.map((img, index) => (
                <View key={`new-${index}`}>
                  <Image source={{ uri: img.uri }} style={styles.galleryImageItem} />
                  <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeGalleryImage(index, true)}><Feather name="x" size={16} color="white" /></TouchableOpacity>
                </View>
              ))}
              {(gallery.length + newGalleryImages.length) < 3 && (
                <TouchableOpacity style={styles.addGalleryBtn} onPress={pickGalleryImage}>
                  <Feather name="plus" size={24} color={AuraColors.primary} />
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          <View style={styles.form}>
            <Input label="Nombre del centro" icon="award" value={name} onChangeText={setName} />
            <Input label="Número WhatsApp" icon="message-circle" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Input label="Categoría" icon="tag" value={category} onChangeText={setCategory} />
            <Input label="Dirección textual" icon="map-pin" value={address} onChangeText={setAddress} />
            <Input label="Descripción" icon="align-left" value={description} onChangeText={setDescription} multiline numberOfLines={4} style={{ minHeight: 80, textAlignVertical: 'top' }} />
          </View>

          <View style={styles.scheduleSection}>
             <Text style={styles.sectionLabel}>Horario de Atención Semanal</Text>
             {DAYS_ORDER.map(day => (
               <View key={day} style={styles.dayRow}>
                 <TouchableOpacity style={[styles.dayToggle, schedule[day]?.active && styles.dayToggleActive]} onPress={() => setSchedule({...schedule, [day]: {...schedule[day], active: !schedule[day].active}})}>
                   <Feather name={schedule[day]?.active ? 'check' : 'x'} size={14} color={schedule[day]?.active ? 'white' : AuraColors.textMuted} />
                 </TouchableOpacity>
                 <Text style={styles.dayName}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                 {schedule[day]?.active ? (
                   <View style={styles.timeInputs}>
                     <TextInput style={styles.timeInput} value={schedule[day].open} onChangeText={(v) => setSchedule({...schedule, [day]: {...schedule[day], open: v}})} />
                     <Text style={{color: AuraColors.textMuted}}>-</Text>
                     <TextInput style={styles.timeInput} value={schedule[day].close} onChangeText={(v) => setSchedule({...schedule, [day]: {...schedule[day], close: v}})} />
                   </View>
                 ) : <Text style={styles.closedText}>Cerrado</Text>}
               </View>
             ))}
          </View>

          <View style={styles.gpsSection}>
            <Text style={styles.sectionLabel}>Ubicación Exacta en el Mapa</Text>
            <Text style={styles.gpsWarningText}>Toca el mapa para colocar el pin de tu local o usa el botón para capturar tu GPS actual.</Text>
            <View style={styles.mapWrapper}>
              <MapView style={styles.miniMap} region={mapRegion} onPress={handleMapPress} scrollEnabled={false}>
                {latitude !== null && longitude !== null && (
                  <Marker coordinate={{ latitude: latitude as number, longitude: longitude as number }}>
                    <View style={styles.mapPin}><Feather name="map-pin" size={16} color="white" /></View>
                  </Marker>
                )}
              </MapView>
            </View>
            <TouchableOpacity style={styles.gpsButton} onPress={handleGetLocation}>
              <Feather name="navigation" size={18} color={AuraColors.primary} />
              <Text style={styles.gpsButtonText}>Fijar GPS actual</Text>
            </TouchableOpacity>
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
  imageSection: { alignItems: 'center', marginBottom: 24 },
  imageContainer: { width: '100%', height: 180, borderRadius: 16, overflow: 'hidden', backgroundColor: AuraColors.border, marginBottom: 12 },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  changeImageButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: AuraColors.primaryLight, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  changeImageText: { fontSize: 14, color: AuraColors.primary, fontWeight: '600' },
  form: { marginBottom: 24 },
  
  /* ESTILOS DE GALERÍA RESTAURADOS */
  gallerySection: { marginBottom: 24 },
  galleryImageItem: { width: 120, height: 90, borderRadius: 12, borderWidth: 1, borderColor: AuraColors.border },
  addGalleryBtn: { width: 120, height: 90, borderRadius: 12, borderWidth: 2, borderColor: AuraColors.primaryLight, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  removeImageBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: '#EF4444', borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  
  scheduleSection: { marginBottom: 24, backgroundColor: AuraColors.card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: AuraColors.border },
  dayRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dayToggle: { width: 24, height: 24, borderRadius: 6, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  dayToggleActive: { backgroundColor: AuraColors.primary },
  dayName: { flex: 1, fontSize: 14, fontWeight: '600', color: AuraColors.textPrimary },
  timeInputs: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: AuraColors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, fontSize: 14, color: AuraColors.textPrimary, width: 70, textAlign: 'center' },
  closedText: { fontSize: 14, color: '#EF4444', fontStyle: 'italic', paddingRight: 20 },

  gpsSection: { marginBottom: 32, backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: AuraColors.border },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 4 },
  gpsWarningText: { fontSize: 13, color: AuraColors.textSecondary, marginBottom: 16, lineHeight: 18 },
  mapWrapper: { width: '100%', height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: AuraColors.border },
  miniMap: { width: '100%', height: '100%' },
  mapPin: { backgroundColor: AuraColors.primary, padding: 8, borderRadius: 20, borderWidth: 2, borderColor: 'white' },
  gpsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: AuraColors.primaryLight, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: AuraColors.primary, borderStyle: 'dashed' },
  gpsButtonText: { color: AuraColors.primary, fontWeight: '700', fontSize: 14 }
});