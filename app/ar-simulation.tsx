import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../src/components/ui/Button';
import { AuraColors } from '../src/theme/colors';

export default function ARSimulationScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Feather name="arrow-left" size={20} color={AuraColors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Realidad Aumentada</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Feather name="layers" size={48} color={AuraColors.primary} />
        </View>
        <Text style={styles.title}>Función en Desarrollo</Text>
        <Text style={styles.desc}>Próximamente podrás probarte cortes de cabello y colores de uñas en tiempo real usando la cámara de tu dispositivo y Realidad Aumentada.</Text>
        <Button title="Volver al Inicio" onPress={() => router.back()} style={{ width: '100%', marginTop: 20 }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary },
  content: { flex: 1, padding: 32, justifyContent: 'center', alignItems: 'center' },
  iconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: AuraColors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', color: AuraColors.textPrimary, marginBottom: 12, textAlign: 'center' },
  desc: { fontSize: 15, color: AuraColors.textSecondary, textAlign: 'center', lineHeight: 24 },
});