import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuraColors } from '../../src/theme/colors';

export default function BookingConfirmationScreen() {
  const { total, commission, serviceName, centerName, date, time } = useLocalSearchParams<{
    total: string; commission: string; serviceName: string; centerName: string; date: string; time: string;
  }>();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Feather name="check-circle" size={64} color={AuraColors.success} />
        </View>
        <Text style={styles.title}>¡Solicitud enviada!</Text>
        <Text style={styles.subtitle}>{serviceName} en {centerName}</Text>
        <Text>{date} a las {time}</Text>
        <View style={styles.summary}>
          <Text>Comisión plataforma: {commission} €</Text>
          <Text style={styles.total}>Total a pagar tras aprobación: {total} €</Text>
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
  content: { padding: 24, alignItems: 'center' },
  iconCircle: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 16, color: AuraColors.textSecondary, marginBottom: 4 },
  summary: { marginVertical: 20, alignItems: 'center' },
  total: { fontWeight: '700', fontSize: 16, marginTop: 8 },
  homeButton: { backgroundColor: AuraColors.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  homeButtonText: { color: 'white', fontWeight: '600' },
});