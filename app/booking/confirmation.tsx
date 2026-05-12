import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuraColors } from '../../src/theme/colors';

export default function BookingConfirmationScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Feather name="check-circle" size={64} color={AuraColors.success} />
        </View>
        <Text style={styles.title}>¡Reserva confirmada!</Text>
        <Text style={styles.subtitle}>
          Tu cita en Aura Beauty Center ha sido agendada para el 15 de marzo de 2025 a las 10:00.
        </Text>
        <View style={styles.qrPlaceholder}>
          <Feather name="maximize" size={80} color={AuraColors.textMuted} />
          <Text style={styles.qrText}>Código QR de confirmación</Text>
        </View>
        <TouchableOpacity style={styles.homeButton} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.homeButtonText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 32, alignItems: 'center' },
  iconCircle: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 12 },
  subtitle: { fontSize: 16, color: AuraColors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  qrPlaceholder: { width: 160, height: 160, backgroundColor: AuraColors.border, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  qrText: { fontSize: 13, color: AuraColors.textMuted, marginTop: 8 },
  homeButton: { backgroundColor: AuraColors.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  homeButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});