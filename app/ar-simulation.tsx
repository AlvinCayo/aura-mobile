import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../src/lib/supabase';

export default function ARSimulationScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  // --- Lógica de Galería ---
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true, quality: 0.5,
    });
    if (!result.canceled) {
      setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  // --- Lógica de Cámara ---
  const takePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ base64: true });
      setImage(`data:image/jpeg;base64,${photo.base64}`);
      setShowCamera(false);
    }
  };

  // --- Lógica IA ---
  const generateLook = async () => {
    if (!image) return Alert.alert("Error", "Primero selecciona o toma una foto");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-haircut', {
        body: { imageBase64: image, prompt: 'modern pompadour fade' },
      });
      if (error) throw error;
      if (data.success) setResultImage(data.resultUrl);
    } catch (e) { Alert.alert('Error', 'Fallo al procesar con IA'); }
    finally { setLoading(false); }
  };

  // --- Pantalla de Cámara activa ---
  if (showCamera) {
    return (
      <CameraView style={StyleSheet.absoluteFill} ref={cameraRef}>
        <View style={styles.cameraOverlay}>
          <TouchableOpacity style={styles.captureBtn} onPress={takePhoto} />
          <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCamera(false)}>
            <Feather name="x" size={30} color="white" />
          </TouchableOpacity>
        </View>
      </CameraView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Simulador de Estilo IA</Text>
      
      {/* Botones de acción */}
      <View style={styles.row}>
        <TouchableOpacity style={styles.btn} onPress={pickImage}>
          <Feather name="image" size={24} />
          <Text>Galería</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={async () => {
          const { granted } = await requestPermission();
          if (granted) setShowCamera(true);
          else Alert.alert("Permiso necesario", "Aura necesita acceso a la cámara.");
        }}>
          <Feather name="camera" size={24} />
          <Text>Cámara</Text>
        </TouchableOpacity>
      </View>

      {image && <Image source={{ uri: image }} style={styles.preview} />}

      <TouchableOpacity style={styles.btnPrimary} onPress={generateLook} disabled={loading || !image}>
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Generar Nuevo Estilo</Text>}
      </TouchableOpacity>

      {resultImage && <Image source={{ uri: resultImage }} style={styles.preview} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  btn: { flex: 1, padding: 20, backgroundColor: '#f0f0f0', borderRadius: 12, alignItems: 'center', gap: 8 },
  btnPrimary: { padding: 20, backgroundColor: '#000', borderRadius: 12, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' },
  preview: { width: '100%', height: 250, marginVertical: 20, borderRadius: 12 },
  cameraOverlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 50 },
  captureBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'white', borderWidth: 5, borderColor: '#ddd' },
  closeBtn: { position: 'absolute', top: 50, left: 30 }
});