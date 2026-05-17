import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/Button';
import { AuraColors } from '../../src/theme/colors';

export default function BookingConfirmationScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Feather name="check" size={48} color="white" />
        </View>

        <Text style={styles.title}>¡Reserva Solicitada!</Text>
        
        <Text style={styles.subtitle}>
          Tu cita ha sido enviada con éxito. En este momento se encuentra en estado <Text style={{fontWeight: '700', color: '#F59E0B'}}>Pendiente</Text>.
        </Text>

        <View style={styles.infoBox}>
          <Feather name="clock" size={20} color={AuraColors.primary} style={{ marginBottom: 12 }} />
          <Text style={styles.infoText}>
            El centro de estética revisará su disponibilidad. Te notificaremos en cuanto aprueben tu solicitud para que puedas realizar el pago.
          </Text>
        </View>

        <View style={styles.actions}>
          <Button 
            title="Ver mis Citas" 
            onPress={() => router.replace('/(tabs)/appointments')}
            icon={<Feather name="calendar" size={18} color="white" />}
          />
          
          <Button 
            title="Volver al Inicio" 
            variant="outline"
            onPress={() => router.replace('/(tabs)')}
            style={{ marginTop: 16 }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AuraColors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: AuraColors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: AuraColors.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: AuraColors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: AuraColors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  infoBox: {
    backgroundColor: AuraColors.primaryLight,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 48,
    width: '100%',
    borderWidth: 1,
    borderColor: AuraColors.primary + '30',
  },
  infoText: {
    fontSize: 14,
    color: AuraColors.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    width: '100%',
  },
});