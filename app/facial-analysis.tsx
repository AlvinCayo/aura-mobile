import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../src/components/ui/Button';
import { supabase } from '../src/lib/supabase';
import { AuraColors } from '../src/theme/colors';

export default function FacialAnalysisScreen() {
  const router = useRouter();
  
  // Hooks en el nivel superior (evita errores de React)
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  // Estados
  const [showCamera, setShowCamera] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [stage, setStage] = useState<'init' | 'analyzing' | 'results' | 'simulating' | 'done'>('init');
  
  const [imageData, setImageData] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{ shape: string, recommendations: string[] } | null>(null);
  const [selectedCut, setSelectedCut] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);

  // --- CAPTURA DE IMAGEN ---
  const handleOpenCamera = async () => {
    const { granted } = await requestPermission();
    if (granted) setShowCamera(true);
    else Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara.');
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      base64: true, 
      quality: 0.3 // Optimizado para no exceder límites de API
    });
    if (!result.canceled && result.assets[0].base64) {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setImageData(base64);
      analyzeFace(base64);
    }
  };

  const takePhoto = async () => {
    const photo = await cameraRef.current?.takePictureAsync({ base64: true, quality: 0.3 });
    if (photo?.base64) {
      const base64 = `data:image/jpeg;base64,${photo.base64}`;
      setImageData(base64);
      setShowCamera(false);
      analyzeFace(base64);
    }
  };

  const analyzeFace = async (base64: string) => {
    setStage('analyzing');
    try {
      const { data, error } = await supabase.functions.invoke('analyze-face', { body: { imageBase64: base64 }});
      if (error) throw error;
      setAnalysis(data);
      setStage('results');
    } catch (e: any) { 
      // Atrapamos la saturación del servidor de forma elegante
      if (e.message && (e.message.includes('503') || e.message.includes('demand'))) {
        Alert.alert('Servidores Ocupados', 'La IA está experimentando alta demanda. Por favor, intenta de nuevo en unos segundos.');
      } else {
        Alert.alert('Error', 'No se pudo analizar el rostro. Intenta con otra foto.');
      }
      setStage('init'); 
    }
  };

  const generateSim = async (cut: string) => {
    setSelectedCut(cut);
    setStage('simulating');
    try {
      const { data, error } = await supabase.functions.invoke('generate-haircut', { 
        body: { imageBase64: imageData, cutName: cut } 
      });
      if (error) throw error;
      setResultImage(data.resultUrl);
      setStage('done');
    } catch (e) { 
      Alert.alert('Error', 'No se pudo generar la simulación'); 
      setStage('results'); 
    }
  };

  // --- VISTA CÁMARA FULLSCREEN ---
  if (showCamera) return (
    <CameraView style={StyleSheet.absoluteFill} ref={cameraRef} facing={facing}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCamera(false)}>
        <Feather name="x" size={30} color="white" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.flipBtn} onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}>
        <Feather name="refresh-ccw" size={30} color="white" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.captureBtn} onPress={takePhoto} />
    </CameraView>
  );

  // --- VISTA PRINCIPAL ---
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Análisis Visagista IA</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* PANTALLA INICIAL */}
        {stage === 'init' && (
          <View style={styles.centerBox}>
            <View style={styles.iconBox}><Feather name="aperture" size={48} color={AuraColors.primary} /></View>
            <Text style={styles.title}>Diagnóstico Facial</Text>
            <Text style={styles.desc}>Toma o sube una foto para analizar tu morfología.</Text>
            <View style={{ width: '100%', gap: 12 }}>
              <Button title="Abrir Cámara" onPress={handleOpenCamera} icon={<Feather name="camera" size={18} color="white" />} />
              <Button title="Subir Foto" variant="outline" onPress={pickImage} icon={<Feather name="image" size={18} color={AuraColors.primary} />} />
            </View>
          </View>
        )}

        {/* CARGANDO DIAGNÓSTICO */}
        {stage === 'analyzing' && (
          <View style={styles.centerBox}>
            <ActivityIndicator size={60} color={AuraColors.primary} />
            <Text style={styles.loadingText}>Escaneando estructura ósea...</Text>
          </View>
        )}

        {/* RESULTADOS DEL DIAGNÓSTICO */}
        {stage === 'results' && analysis && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultShape}>Rostro {analysis.shape}</Text>
            <Text style={styles.sectionTitle}>Cortes ideales para ti:</Text>
            
            {analysis.recommendations.map((cut: string, index: number) => (
              <TouchableOpacity key={index} style={styles.cutCard} onPress={() => generateSim(cut)}>
                <Text style={styles.cutName}>{cut}</Text>
                <View style={styles.actionRow}>
                  <Text style={styles.actionText}>Probar IA</Text>
                  <Feather name="zap" size={16} color={AuraColors.primary} />
                </View>
              </TouchableOpacity>
            ))}
            
            <Button title="Reiniciar Análisis" variant="outline" onPress={() => setStage('init')} style={{marginTop: 20}} />
          </View>
        )}

        {/* CARGANDO SIMULACIÓN */}
        {stage === 'simulating' && (
          <View style={styles.centerBox}>
            <ActivityIndicator size={60} color={AuraColors.primary} />
            <Text style={styles.loadingText}>Esculpiendo {selectedCut}...</Text>
          </View>
        )}

        {/* RESULTADO FINAL */}
        {stage === 'done' && resultImage && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultShape}>Simulación: {selectedCut}</Text>
            <Image source={{ uri: resultImage }} style={styles.aiResult} />
            
            <View style={{ gap: 12 }}>
              {/* Salta al buscador filtrando por este corte específico */}
              <Button 
                title={`Buscar centros que hagan ${selectedCut}`} 
                onPress={() => router.push(`/(tabs)/search?query=${encodeURIComponent(selectedCut || '')}`)} 
                icon={<Feather name="search" size={18} color="white" />} 
              />
              <Button title="Probar otro corte" variant="outline" onPress={() => setStage('results')} />
            </View>
          </View>
        )}
        
      </ScrollView>
    </SafeAreaView>
  );
}

// ESTILOS COMPLETOS (Cero errores de TS)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: AuraColors.border },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary },
  content: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  
  centerBox: { alignItems: 'center', justifyContent: 'center' },
  iconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: AuraColors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', marginVertical: 10, color: AuraColors.textPrimary },
  desc: { textAlign: 'center', marginBottom: 30, color: AuraColors.textSecondary, fontSize: 16 },
  loadingText: { marginTop: 20, color: AuraColors.textSecondary, fontSize: 16, fontWeight: '600' },
  
  resultsContainer: { width: '100%' },
  resultShape: { fontSize: 24, fontWeight: '800', color: AuraColors.primary, marginBottom: 20, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 15, color: AuraColors.textSecondary },
  
  cutCard: { backgroundColor: AuraColors.card, padding: 20, borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: AuraColors.border, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  cutName: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: AuraColors.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  actionText: { fontSize: 12, fontWeight: '700', color: AuraColors.primary },
  
  aiResult: { width: '100%', height: 350, borderRadius: 20, marginBottom: 24, backgroundColor: '#eee' },
  
  captureBtn: { position: 'absolute', bottom: 50, alignSelf: 'center', width: 80, height: 80, borderRadius: 40, backgroundColor: 'white', borderWidth: 5, borderColor: '#ddd' },
  closeBtn: { position: 'absolute', top: 50, left: 30, padding: 12, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 30 },
  flipBtn: { position: 'absolute', top: 50, right: 30, padding: 12, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 30 },
});