import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
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
import { AuraColors } from '../../src/theme/colors';

export default function CenterProfileScreen() {
  const [name, setName] = useState('Aura Beauty Center');
  const [category, setCategory] = useState('Estética Facial');
  const [address, setAddress] = useState('Calle Mayor 23, Madrid');
  const [description, setDescription] = useState(
    'Centro especializado en tratamientos faciales avanzados con tecnología de última generación.'
  );
  const [imageUri, setImageUri] = useState<string | null>(null); // Simulación de foto

  const handleSave = () => {
    console.log('Guardar perfil del centro');
    // Aquí se implementaría la lógica de actualización
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Perfil del Centro</Text>
          <Text style={styles.subtitle}>Información pública de tu negocio</Text>

          {/* Foto del centro */}
          <View style={styles.imageSection}>
            <View style={styles.imageContainer}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.image} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Feather name="image" size={40} color={AuraColors.textMuted} />
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.changeImageButton} onPress={() => setImageUri('https://picsum.photos/400/300')}>
              <Feather name="camera" size={16} color={AuraColors.primary} />
              <Text style={styles.changeImageText}>Cambiar foto</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Input
              label="Nombre del centro"
              icon="award"
              value={name}
              onChangeText={setName}
            />
            <Input
              label="Categoría"
              icon="tag"
              value={category}
              onChangeText={setCategory}
            />
            <Input
              label="Dirección"
              icon="map-pin"
              value={address}
              onChangeText={setAddress}
            />
            <Input
              label="Descripción"
              icon="align-left"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              style={{ minHeight: 80, textAlignVertical: 'top' }}
            />
          </View>

          <Button
            title="Guardar cambios"
            onPress={handleSave}
            icon={<Feather name="check" size={18} color="white" />}
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  flex: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 14, color: AuraColors.textSecondary, marginBottom: 24 },
  imageSection: { alignItems: 'center', marginBottom: 24 },
  imageContainer: {
    width: 200,
    height: 130,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: AuraColors.border,
    marginBottom: 12,
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  changeImageButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  changeImageText: { fontSize: 14, color: AuraColors.primary, fontWeight: '500' },
  form: { marginBottom: 24 },
  saveButton: { marginTop: 8 },
});