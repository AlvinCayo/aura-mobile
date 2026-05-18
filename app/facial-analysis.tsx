import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../src/components/ui/Button';
import { AuraColors } from '../src/theme/colors';

export default function FacialAnalysisScreen() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(false);

  const handleScan = () => {
    setScanning(true);
    // Simulamos un análisis de IA de 3 segundos
    setTimeout(() => {
      setScanning(false);
      setResult(true);
    }, 3000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Análisis Visagista IA</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {!scanning && !result && (
          <View style={styles.introContainer}>
            <View style={styles.placeholderBox}>
              <Feather name="camera" size={48} color={AuraColors.primary} />
              <View style={styles.scanFrame} />
            </View>
            <Text style={styles.title}>Descubre tu estilo ideal</Text>
            <Text style={styles.desc}>
              Nuestra Inteligencia Artificial analizará la morfología de tu rostro para recomendarte el servicio estético que más resalte tus facciones naturales.
            </Text>
            <Button 
              title="Iniciar Escaneo Facial" 
              onPress={handleScan} 
              icon={<Feather name="aperture" size={18} color="white" />} 
              style={styles.actionButton}
            />
          </View>
        )}

        {scanning && (
          <View style={styles.centerBox}>
            <View style={styles.scanningAnimBox}>
              <ActivityIndicator size={60} color={AuraColors.primary} />
            </View>
            <Text style={styles.scanningText}>Mapeando puntos faciales...</Text>
            <Text style={styles.scanningSub}>Calculando simetría geométrica y proporciones</Text>
          </View>
        )}

        {result && (
          <View style={styles.resultBox}>
            <View style={styles.successIcon}>
              <Feather name="check" size={32} color="white" />
            </View>
            <Text style={styles.resultTitle}>Rostro Ovalado Detectado</Text>
            <Text style={styles.resultDesc}>
              Tienes proporciones altamente equilibradas, lo que te permite experimentar con gran versatilidad.
            </Text>
            
            <View style={styles.recommendationCard}>
              <View style={styles.recHeaderRow}>
                <Feather name="zap" size={18} color="#D97706" />
                <Text style={styles.recTitle}>Sugerencias del Motor de IA:</Text>
              </View>
              <View style={styles.recBullet}>
                <Feather name="check-circle" size={14} color={AuraColors.primary} />
                <Text style={styles.recText}>Cortes con volumen superior para elongar.</Text>
              </View>
              <View style={styles.recBullet}>
                <Feather name="check-circle" size={14} color={AuraColors.primary} />
                <Text style={styles.recText}>Evita flequillos pesados que oculten tus ojos.</Text>
              </View>
              <View style={styles.recBullet}>
                <Feather name="check-circle" size={14} color={AuraColors.primary} />
                <Text style={styles.recText}>Perfilado de barba estilo 'Candado' o 'Stubble'.</Text>
              </View>
            </View>

            <View style={styles.actionRowContainer}>
              <Button 
                title="Buscar Especialistas" 
                onPress={() => router.push('/search')} 
                style={styles.flexButton}
                icon={<Feather name="search" size={18} color="white" />}
              />
              <Button 
                title="Reintentar" 
                variant="outline" 
                onPress={() => setResult(false)} 
                style={styles.flexButtonOutline}
              />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: AuraColors.border },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary },
  content: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  
  introContainer: { alignItems: 'center', width: '100%' },
  placeholderBox: { width: 200, height: 250, backgroundColor: AuraColors.primaryLight, borderRadius: 100, justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: 40 },
  scanFrame: { position: 'absolute', width: '100%', height: '100%', borderRadius: 100, borderWidth: 2, borderColor: AuraColors.primary, borderStyle: 'dashed' },
  title: { fontSize: 24, fontWeight: '800', color: AuraColors.textPrimary, marginBottom: 12, textAlign: 'center' },
  desc: { fontSize: 15, color: AuraColors.textSecondary, textAlign: 'center', marginBottom: 40, lineHeight: 24, paddingHorizontal: 10 },
  actionButton: { width: '100%' },

  centerBox: { alignItems: 'center' },
  scanningAnimBox: { width: 120, height: 120, borderRadius: 60, backgroundColor: AuraColors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  scanningText: { fontSize: 20, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 8 },
  scanningSub: { fontSize: 14, color: AuraColors.textSecondary, textAlign: 'center' },

  resultBox: { width: '100%', alignItems: 'center' },
  successIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#16A34A', justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  resultTitle: { fontSize: 22, fontWeight: '800', color: AuraColors.textPrimary, marginBottom: 8, textAlign: 'center' },
  resultDesc: { fontSize: 14, color: AuraColors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  
  recommendationCard: { width: '100%', backgroundColor: '#FEF3C7', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#FDE68A', marginBottom: 32 },
  recHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  recTitle: { fontSize: 16, fontWeight: '800', color: '#B45309' },
  recBullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  recText: { flex: 1, fontSize: 14, color: '#92400E', lineHeight: 20, fontWeight: '500' },
  
  actionRowContainer: { flexDirection: 'row', gap: 12, width: '100%' },
  flexButton: { flex: 2 },
  flexButtonOutline: { flex: 1 },
});