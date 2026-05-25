import { Feather } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../src/components/ui/Button';
import { AuraColors } from '../src/theme/colors';

interface GeneratedImage {
  id: string;
  prompt: string;
  imageUrl: string;
}

const STORAGE_KEY = "@mis_estilos_aura";

export default function ARSimulationScreen() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [savedImages, setSavedImages] = useState<GeneratedImage[]>([]);

  useEffect(() => {
    loadSavedImages();
  }, []);

  const loadSavedImages = async () => {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData) {
        setSavedImages(JSON.parse(storedData));
      }
    } catch (e) {
      console.error("Error al cargar datos locales", e);
    }
  };

  const generateImage = async () => {
    if (!prompt.trim()) {
      Alert.alert("Requerido", "Por favor ingresa una descripción del estilo deseado.");
      return;
    }
    setLoading(true);

    try {
      const HF_TOKEN = "";
      
      const response = await fetch(
        "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev",
        {
          headers: {
            Authorization: `Bearer ${HF_TOKEN}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            inputs: `professional salon or barbershop haircut, ${prompt}, highly detailed, realistic 4k photo`,
          }),
        },
      );

      if (!response.ok) throw new Error("Error en la respuesta de la API");

      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentImage(reader.result as string);
        setLoading(false);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      Alert.alert("Error", "No se pudo generar la imagen. Intenta de nuevo.");
      setLoading(false);
    }
  };

  const saveImage = async () => {
    if (!currentImage) return;

    const newImage: GeneratedImage = {
      id: Date.now().toString(),
      prompt: prompt,
      imageUrl: currentImage,
    };

    const updatedList = [newImage, ...savedImages];
    setSavedImages(updatedList);
    setCurrentImage(null);
    setPrompt("");

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    Alert.alert("Guardado", "El estilo se ha añadido a tu galería de AURA.");
  };

  const deleteImage = async (id: string) => {
    const filteredList = savedImages.filter((img) => img.id !== id);
    setSavedImages(filteredList);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredList));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Simulador de Estilo IA</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.inputContainer}>
          <Feather name="edit-3" size={20} color={AuraColors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Ej: Fade alto con degradado y barba delineada..."
            placeholderTextColor={AuraColors.textSecondary}
            value={prompt}
            onChangeText={setPrompt}
            multiline
          />
        </View>

        <Button 
          title={loading ? "Procesando..." : "Generar Estilo Visual"} 
          onPress={generateImage}
          disabled={loading}
          icon={loading ? <ActivityIndicator color="#fff" size="small" /> : <Feather name="cpu" size={18} color="white" />}
          style={{ width: '100%', marginBottom: 20 }}
        />

        {currentImage && !loading && (
          <View style={styles.resultContainer}>
            <Image source={{ uri: currentImage }} style={styles.generatedImage} />
            <Button 
              title="Guardar en Mi Galería" 
              onPress={saveImage} 
              icon={<Feather name="bookmark" size={18} color="white" />}
              style={{ width: '100%', marginTop: 16 }}
            />
          </View>
        )}

        <View style={styles.divider} />
        
        <Text style={styles.subtitle}>Tus Estilos Guardados</Text>
        <View style={styles.gallery}>
          {savedImages.map((item) => (
            <View key={item.id} style={styles.card}>
              <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <Text style={styles.cardPrompt} numberOfLines={2}>{item.prompt}</Text>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteImage(item.id)}>
                  <Feather name="trash-2" size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {savedImages.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="image" size={40} color={AuraColors.border} />
              <Text style={styles.emptyStateText}>Aún no has guardado ningún estilo.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AuraColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: AuraColors.border },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary },
  container: { flexGrow: 1, padding: 24 },
  
  inputContainer: { flexDirection: 'row', backgroundColor: AuraColors.card, borderWidth: 1, borderColor: AuraColors.border, borderRadius: 16, padding: 16, marginBottom: 20, alignItems: 'flex-start' },
  inputIcon: { marginRight: 12, marginTop: 4 },
  input: { flex: 1, fontSize: 15, color: AuraColors.textPrimary, minHeight: 60, textAlignVertical: 'top' },
  
  resultContainer: { width: "100%", alignItems: "center", backgroundColor: AuraColors.card, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: AuraColors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  generatedImage: { width: "100%", height: 320, borderRadius: 12, resizeMode: "cover" },
  
  divider: { height: 1, backgroundColor: AuraColors.border, marginVertical: 32, width: '100%' },
  subtitle: { fontSize: 18, fontWeight: "800", color: AuraColors.textPrimary, marginBottom: 20 },
  
  gallery: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: { width: "48%", backgroundColor: AuraColors.card, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: AuraColors.border, overflow: 'hidden' },
  cardImage: { width: "100%", height: 160, resizeMode: "cover" },
  cardContent: { padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardPrompt: { flex: 1, fontSize: 12, color: AuraColors.textSecondary, marginRight: 8 },
  deleteBtn: { padding: 8, backgroundColor: '#FEE2E2', borderRadius: 8 },
  
  emptyState: { width: '100%', alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyStateText: { marginTop: 12, fontSize: 14, color: AuraColors.textSecondary, textAlign: 'center' }
});