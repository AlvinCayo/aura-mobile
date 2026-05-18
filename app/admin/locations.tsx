import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
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

export default function LocationManagementScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [centerId, setCenterId] = useState<string | null>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Estados del Modal (Agregar/Editar)
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any | null>(null);
  
  // Formulario
  const [formAddress, setFormAddress] = useState('');
  const [formIsMain, setFormIsMain] = useState(false);
  const [formLat, setFormLat] = useState<number | null>(null);
  const [formLng, setFormLng] = useState<number | null>(null);

  useEffect(() => {
    fetchLocations();
  }, [user]);

  // Buscador en tiempo real
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredLocations(locations);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      setFilteredLocations(locations.filter(loc => 
        loc.address?.toLowerCase().includes(lowerQuery)
      ));
    }
  }, [searchQuery, locations]);

  const fetchLocations = async () => {
    if (!user) return;
    try {
      // 1. Obtener el ID del centro del usuario
      const { data: centerData, error: centerError } = await supabase
        .from('centers')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (centerError || !centerData) throw new Error('No se encontró el centro.');
      setCenterId(centerData.id);

      // 2. Obtener las sucursales ordenadas (Principal primero)
      const { data: locData, error: locError } = await supabase
        .from('locations')
        .select('*')
        .eq('center_id', centerData.id)
        .order('is_main', { ascending: false });

      if (locError) throw locError;
      setLocations(locData || []);
    } catch (error) {
      console.error('Error cargando sucursales:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (location: any = null) => {
    if (location) {
      setEditingLocation(location);
      setFormAddress(location.address || '');
      setFormIsMain(location.is_main || false);
      setFormLat(location.latitude ? parseFloat(location.latitude) : null);
      setFormLng(location.longitude ? parseFloat(location.longitude) : null);
    } else {
      setEditingLocation(null);
      setFormAddress('');
      setFormIsMain(locations.length === 0); // Si es la primera, es principal por defecto
      setFormLat(null);
      setFormLng(null);
    }
    setIsModalVisible(true);
  };

  // Función segura para capturar GPS sin que la app se cierre
  const handleGetLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return Alert.alert('Permiso Denegado', 'Necesitamos acceso a tu ubicación para fijar la sucursal.');
      }
      
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setFormLat(loc.coords.latitude);
      setFormLng(loc.coords.longitude);
      Alert.alert('¡Ubicación fijada!', 'Las coordenadas se han guardado temporalmente.');
    } catch (error) {
      Alert.alert('Error GPS', 'No se pudo obtener la ubicación. Verifica que tu GPS esté encendido.');
    }
  };

  const handleSave = async () => {
    if (!formAddress.trim()) return Alert.alert('Aviso', 'La dirección es obligatoria.');
    if (!centerId) return;

    setIsSubmitting(true);
    try {
      // Si esta sucursal se marca como principal, quitamos el estado 'main' a las demás
      if (formIsMain) {
        await supabase.from('locations').update({ is_main: false }).eq('center_id', centerId);
      }

      const locationData = {
        center_id: centerId,
        address: formAddress,
        is_main: formIsMain,
        latitude: formLat,
        longitude: formLng,
      };

      if (editingLocation) {
        // ACTUALIZAR
        const { error } = await supabase.from('locations').update(locationData).eq('id', editingLocation.id);
        if (error) throw error;
        Alert.alert('Éxito', 'Sucursal actualizada correctamente.');
      } else {
        // CREAR NUEVA
        const { error } = await supabase.from('locations').insert(locationData);
        if (error) throw error;
        Alert.alert('Éxito', 'Nueva sucursal agregada.');
      }

      setIsModalVisible(false);
      fetchLocations();
    } catch (error: any) {
      Alert.alert('Error al guardar', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string, isMain: boolean) => {
    if (isMain) {
      return Alert.alert('Acción no permitida', 'No puedes eliminar la sucursal principal. Asigna otra sucursal como principal primero.');
    }

    Alert.alert('Eliminar Sucursal', '¿Estás seguro de eliminar esta ubicación?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
          await supabase.from('locations').delete().eq('id', id);
          setLocations(prev => prev.filter(loc => loc.id !== id));
      }}
    ]);
  };

  const renderLocationItem = ({ item }: { item: any }) => (
    <View style={styles.locationCard}>
      <View style={styles.locationInfo}>
        <View style={styles.titleRow}>
          <Feather name="map-pin" size={18} color={item.is_main ? AuraColors.primary : AuraColors.textSecondary} />
          <Text style={[styles.addressText, item.is_main && { color: AuraColors.primary, fontWeight: '700' }]}>
            {item.address}
          </Text>
        </View>
        
        <View style={styles.metaRow}>
          {item.is_main && <View style={styles.mainBadge}><Text style={styles.mainBadgeText}>Sede Principal</Text></View>}
          {item.latitude && item.longitude && (
            <Text style={styles.gpsText}><Feather name="navigation" size={12}/> GPS Configurado</Text>
          )}
        </View>
      </View>

      <View style={styles.actionsColumn}>
        <TouchableOpacity style={styles.actionBtnEdit} onPress={() => openModal(item)}>
          <Feather name="edit-2" size={18} color={AuraColors.primary} />
        </TouchableOpacity>
        {!item.is_main && (
          <TouchableOpacity style={styles.actionBtnDelete} onPress={() => handleDelete(item.id, item.is_main)}>
            <Feather name="trash-2" size={18} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={AuraColors.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      {/* CABECERA */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sucursales</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Feather name="plus" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* BUSCADOR */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Feather name="search" size={20} color={AuraColors.textMuted} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Buscar sucursal..." 
            value={searchQuery} 
            onChangeText={setSearchQuery} 
            placeholderTextColor={AuraColors.textMuted} 
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x-circle" size={18} color={AuraColors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* LISTA DE SUCURSALES */}
      <FlatList
        data={filteredLocations}
        keyExtractor={item => item.id}
        renderItem={renderLocationItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Feather name="map" size={48} color={AuraColors.border} />
            <Text style={styles.emptyTitle}>Sin sucursales</Text>
            <Text style={styles.emptySub}>Aún no has registrado ninguna ubicación o no coincide con tu búsqueda.</Text>
          </View>
        }
      />

      {/* MODAL PARA AGREGAR/EDITAR SUCURSAL */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%' }}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingLocation ? 'Editar Sucursal' : 'Nueva Sucursal'}</Text>
              
              <ScrollView showsVerticalScrollIndicator={false}>
                <Input label="Dirección exacta *" placeholder="Ej: Calle 15 de Obrajes, Edificio X" value={formAddress} onChangeText={setFormAddress} />
                
                {/* Switch Sede Principal */}
                <TouchableOpacity style={styles.switchRow} onPress={() => setFormIsMain(!formIsMain)}>
                  <View style={[styles.checkbox, formIsMain && styles.checkboxActive]}>
                    {formIsMain && <Feather name="check" size={14} color="white" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switchLabel}>Marcar como Sede Principal</Text>
                    <Text style={styles.switchDesc}>Los clientes verán esta dirección por defecto.</Text>
                  </View>
                </TouchableOpacity>

                {/* GPS Section */}
                <View style={styles.gpsSection}>
                  <Text style={styles.gpsSectionTitle}>Ubicación Geográfica</Text>
                  {formLat && formLng ? (
                    <View style={styles.gpsActiveBox}>
                      <Feather name="check-circle" size={16} color="#16A34A" />
                      <Text style={styles.gpsActiveText}>Coordenadas listas para guardar.</Text>
                    </View>
                  ) : (
                    <Text style={styles.gpsWarning}>Captura el GPS estando físicamente en el lugar para que los clientes puedan encontrarte en el mapa.</Text>
                  )}
                  <TouchableOpacity style={styles.gpsButton} onPress={handleGetLocation}>
                    <Feather name="navigation" size={18} color="white" />
                    <Text style={styles.gpsButtonText}>{formLat ? 'Actualizar GPS' : 'Fijar GPS actual'}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <Button title="Cancelar" variant="outline" onPress={() => setIsModalVisible(false)} style={{ flex: 1 }} />
                <Button title="Guardar" loading={isSubmitting} onPress={handleSave} style={{ flex: 1 }} />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  headerTitle: { fontSize: 20, fontWeight: '700', color: AuraColors.textPrimary },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: AuraColors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  searchSection: { paddingHorizontal: 24, marginBottom: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: AuraColors.card, paddingHorizontal: 16, height: 50, borderRadius: 12, borderWidth: 1, borderColor: AuraColors.border },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 15, color: AuraColors.textPrimary, height: '100%' },
  listContent: { paddingHorizontal: 24, paddingBottom: 40 },
  locationCard: { flexDirection: 'row', backgroundColor: AuraColors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: AuraColors.border },
  locationInfo: { flex: 1, paddingRight: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  addressText: { flex: 1, fontSize: 15, color: AuraColors.textPrimary, lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  mainBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  mainBadgeText: { fontSize: 11, fontWeight: '700', color: '#D97706' },
  gpsText: { fontSize: 12, color: '#16A34A', fontWeight: '600' },
  actionsColumn: { justifyContent: 'space-around', borderLeftWidth: 1, borderLeftColor: AuraColors.border, paddingLeft: 16 },
  actionBtnEdit: { padding: 8, backgroundColor: AuraColors.primaryLight, borderRadius: 8 },
  actionBtnDelete: { padding: 8, backgroundColor: '#FEE2E2', borderRadius: 8 },
  emptyBox: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary, marginTop: 16 },
  emptySub: { fontSize: 14, color: AuraColors.textSecondary, marginTop: 8, textAlign: 'center' },
  
  // Estilos del Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: AuraColors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 20, textAlign: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: AuraColors.border, marginBottom: 20 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: AuraColors.border, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: AuraColors.primary, borderColor: AuraColors.primary },
  switchLabel: { fontSize: 15, fontWeight: '600', color: AuraColors.textPrimary },
  switchDesc: { fontSize: 12, color: AuraColors.textSecondary, marginTop: 2 },
  gpsSection: { backgroundColor: '#F1F5F9', padding: 16, borderRadius: 12, marginBottom: 20 },
  gpsSectionTitle: { fontSize: 14, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 8 },
  gpsWarning: { fontSize: 13, color: '#D97706', marginBottom: 12, lineHeight: 18 },
  gpsActiveBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#DCFCE7', padding: 10, borderRadius: 8, marginBottom: 12 },
  gpsActiveText: { color: '#16A34A', fontSize: 13, fontWeight: '600' },
  gpsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#334155', paddingVertical: 12, borderRadius: 10 },
  gpsButtonText: { color: 'white', fontWeight: '600', fontSize: 14 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
});