import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuraColors } from '../src/theme/colors';

export default function QRScannerScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Escanear QR</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.scannerPlaceholder}>
        <Feather name="camera" size={80} color={AuraColors.textMuted} />
        <Text style={styles.hint}>Apunte la cámara al código QR del centro</Text>
      </View>
      <TouchableOpacity style={styles.manualButton}>
        <Text style={styles.manualText}>Ingresar código manualmente</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  title: { fontSize: 20, fontWeight: '700' },
  scannerPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  hint: { fontSize: 16, color: AuraColors.textMuted, textAlign: 'center', marginTop: 20 },
  manualButton: { paddingVertical: 14, marginHorizontal: 24, marginBottom: 32, alignItems: 'center' },
  manualText: { fontSize: 14, color: AuraColors.primary, fontWeight: '500' },
});