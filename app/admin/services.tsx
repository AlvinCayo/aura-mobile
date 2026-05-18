import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/Button';
import Input from '../../src/components/ui/Input';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

export default function AdminServicesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [services, setServices] = useState<any[]>([]);
  const [centerId, setCenterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para el Modal de Edición/Creación
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDuration, setFormDuration] = useState('');
  
  // Estados de Imagen
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null); // URL de la base de datos
  const [newImage, setNewImage] = useState<ImagePicker.ImagePickerAsset | null>(null); // Imagen local nueva
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchServices();
  }, [user]);

  const fetchServices = async () => {
    try {
      const { data: centerData } = await supabase.from('centers').select('id').eq('owner_id', user?.id).single();
      if (centerData) {
        setCenterId(centerData.id);
        const { data: srvData } = await supabase.from('services').select('*').eq('center_id', centerData.id).order('name');
        setServices(srvData || []);
      }
    } catch (err) {
      console.error('Error cargando servicios', err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (service: any = null) => {
    if (service) {
      setEditingService(service);
      setFormName(service.name);
      setFormDesc(service.description || '');
      setFormPrice(service.price.toString());
      setFormDuration(service.duration_min.toString());
      setCurrentImageUrl(service.image_url || null);
    } else {
      setEditingService(null);
      setFormName(''); setFormDesc(''); setFormPrice(''); setFormDuration('');
      setCurrentImageUrl(null);
    }
    setNewImage(null); // Siempre limpiamos la imagen nueva al abrir
    setIsModalVisible(true);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permiso necesario', 'Necesitamos acceso a la galería.');
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setNewImage(result.assets[0]);
    }
  };

  const removeImage = () => {
    setNewImage(null);
    setCurrentImageUrl(null);
  };

  const handleSaveService = async () => {
    if (!formName || !formPrice || !formDuration) return Alert.alert('Aviso', 'Llena todos los campos obligatorios (Nombre, Precio, Duración).');
    if (!centerId) return;
    
    setIsSubmitting(true);
    try {
      let finalImageUrl = currentImageUrl; // Mantenemos la actual si no hay cambios

      // 1. Si seleccionó una nueva foto, la subimos a Supabase
      if (newImage && user) {
        const formData = new FormData();
        const fileExt = newImage.uri.split('.').pop() || 'jpg';
        const fileName = `service_${user.id}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        formData.append('file', {
          uri: newImage.uri,
          name: fileName,
          type: `image/${fileExt}`
        } as any);

        const { error: uploadError } = await supabase.storage
          .from('service-images') 
          .upload(fileName, formData);

        if (uploadError) throw uploadError;

        finalImageUrl = supabase.storage.from('service-images').getPublicUrl(fileName).data.publicUrl;
      }

      // 2. Preparamos los datos
      const serviceData = {
        center_id: centerId,
        name: formName,
        description: formDesc,
        price: parseFloat(formPrice),
        duration_min: parseInt(formDuration, 10),
        image_url: finalImageUrl, // Guardamos la URL final (nueva, existente o null)
      };

      if (editingService) {
        // ACTUALIZAR
        const { error } = await supabase.from('services').update(serviceData).eq('id', editingService.id);
        if (error) throw error;
        Alert.alert('Éxito', 'Servicio actualizado correctamente.');
      } else {
        // CREAR NUEVO
        const { error } = await supabase.from('services').insert(serviceData);
        if (error) throw error;
        Alert.alert('Éxito', 'Servicio creado correctamente.');
      }
      
      setIsModalVisible(false);
      fetchServices();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al guardar el servicio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Borrar Servicio', '¿Estás seguro de que deseas eliminar este servicio? Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: async () => {
          await supabase.from('services').delete().eq('id', id);
          setServices(prev => prev.filter(s => s.id !== id));
      }}
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.serviceImageSmall} />
      ) : (
        <View style={styles.serviceImagePlaceholder}><Feather name="scissors" size={20} color={AuraColors.primary} /></View>
      )}
      
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description || 'Sin descripción'}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardPrice}>{item.price} Bs</Text>
          <Text style={styles.cardDuration}><Feather name="clock" size={12}/> {item.duration_min} min</Text>
        </View>
      </View>

      <View style={styles.actionColumn}>
        <TouchableOpacity style={styles.actionBtnEdit} onPress={() => openModal(item)}>
          <Feather name="edit-2" size={18} color={AuraColors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtnDelete} onPress={() => handleDelete(item.id)}>
          <Feather name="trash-2" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return <View style={styles.loadingCenter}><ActivityIndicator size="large" color={AuraColors.primary} /></View>;

  // Determinar qué imagen mostrar en el modal (la nueva, la existente o ninguna)
  const displayImage = newImage ? newImage.uri : currentImageUrl;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Servicios</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={services}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No tienes servicios registrados.</Text>}
      />

      <View style={styles.fabContainer}>
        <Button title="Agregar Servicio" icon={<Feather name="plus" size={18} color="white"/>} onPress={() => openModal()} />
      </View>

      {/* MODAL DE CREACIÓN / EDICIÓN */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingService ? 'Editar Servicio' : 'Nuevo Servicio'}</Text>
            
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '80%' }}>
              <Input label="Nombre del Servicio *" placeholder="Ej: Corte de Cabello" value={formName} onChangeText={setFormName} />
              <Input label="Descripción (Opcional)" placeholder="Detalles de lo que incluye..." value={formDesc} onChangeText={setFormDesc} multiline numberOfLines={3} />
              
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}><Input label="Precio (Bs) *" keyboardType="numeric" value={formPrice} onChangeText={setFormPrice} /></View>
                <View style={{ flex: 1 }}><Input label="Duración (Min) *" keyboardType="numeric" value={formDuration} onChangeText={setFormDuration} /></View>
              </View>
              
              {/* SECCIÓN DE IMAGEN EN EL MODAL */}
              <View style={styles.imagePickerSection}>
                <Text style={styles.imagePickerLabel}>Imagen del Servicio (Opcional)</Text>
                
                {displayImage ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: displayImage }} style={styles.imagePreview} />
                    <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                      <Feather name="x" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                    <Feather name="image" size={24} color={AuraColors.primary} />
                    <Text style={styles.imagePickerText}>Seleccionar Foto</Text>
                  </TouchableOpacity>
                )}
              </View>

            </ScrollView>

            <View style={styles.modalActions}>
              <Button title="Cancelar" variant="outline" onPress={() => setIsModalVisible(false)} style={{ flex: 1 }} />
              <Button title="Guardar" loading={isSubmitting} onPress={handleSaveService} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary },
  listContent: { padding: 24, paddingBottom: 100 },
  card: { flexDirection: 'row', backgroundColor: AuraColors.card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: AuraColors.border, marginBottom: 16 },
  serviceImageSmall: { width: 60, height: 60, borderRadius: 12, marginRight: 16 },
  serviceImagePlaceholder: { width: 60, height: 60, borderRadius: 12, marginRight: 16, backgroundColor: AuraColors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary },
  cardDesc: { fontSize: 13, color: AuraColors.textSecondary, marginTop: 4, lineHeight: 18 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  cardPrice: { fontSize: 16, fontWeight: '800', color: AuraColors.primary },
  cardDuration: { fontSize: 13, color: AuraColors.textMuted },
  actionColumn: { justifyContent: 'space-around', paddingLeft: 16, borderLeftWidth: 1, borderLeftColor: AuraColors.border },
  actionBtnEdit: { padding: 8, backgroundColor: AuraColors.primaryLight, borderRadius: 8 },
  actionBtnDelete: { padding: 8, backgroundColor: '#FEE2E2', borderRadius: 8 },
  emptyText: { textAlign: 'center', color: AuraColors.textMuted, marginTop: 40 },
  fabContainer: { position: 'absolute', bottom: 24, left: 24, right: 24 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: AuraColors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 20, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  
  // Estilos Imagen Modal
  imagePickerSection: { marginTop: 12, marginBottom: 8 },
  imagePickerLabel: { fontSize: 14, fontWeight: '600', color: AuraColors.textPrimary, marginBottom: 8 },
  imagePickerButton: { width: '100%', height: 100, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: AuraColors.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', gap: 8 },
  imagePickerText: { fontSize: 14, color: AuraColors.primary, fontWeight: '600' },
  imagePreviewContainer: { width: '100%', height: 160, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  imagePreview: { width: '100%', height: '100%' },
  removeImageButton: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
});