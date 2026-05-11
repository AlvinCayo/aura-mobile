import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuraColors } from '../../src/theme/colors';

export default function QRGeneratorScreen() {
  const handleGenerate = () => {
    Alert.alert('QR Generator', 'Funcionalidad de QR en desarrollo.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Código QR del centro</Text>
      </View>
      <View style={styles.qrPlaceholder}>
        <Feather name="maximize" size={120} color={AuraColors.textMuted} />
        <Text style={styles.hint}>Aquí se mostrará el QR</Text>
      </View>
      <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
        <Text style={styles.generateText}>Generar QR</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { marginBottom: 40 },
  title: { fontSize: 22, fontWeight: '700' },
  qrPlaceholder: { width: 200, height: 200, backgroundColor: AuraColors.border, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  hint: { marginTop: 10, color: AuraColors.textMuted },
  generateButton: { backgroundColor: AuraColors.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  generateText: { color: 'white', fontWeight: '600', fontSize: 16 },
});