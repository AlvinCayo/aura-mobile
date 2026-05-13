import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/Button';
import { updateAppointmentStatus } from '../../src/lib/data';
import { AuraColors } from '../../src/theme/colors';

export default function PaymentScreen() {
  const { appointmentId, amount } = useLocalSearchParams<{ appointmentId: string, amount: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleConfirmPayment = async () => {
    setLoading(true);
    // Cambiamos el estado a "completed" o creamos un nuevo estado "paid"
    const { error } = await updateAppointmentStatus(appointmentId as string, 'completed');
    setLoading(false);

    if (error) {
      Alert.alert('Error', 'No se pudo registrar el pago.');
    } else {
      Alert.alert(
        'Pago Confirmado',
        'Tu reserva ha sido pagada exitosamente. ¡Disfruta tu servicio!',
        [{ text: 'Volver a Mis Citas', onPress: () => router.replace('/(tabs)/appointments') }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Pago de Reserva</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Total a Pagar</Text>
          <Text style={styles.amountText}>{amount} Bs</Text>
          <Text style={styles.helperText}>Incluye tarifa de servicio AURA</Text>
        </View>

        <View style={styles.qrSection}>
          <Text style={styles.instructionText}>
            Escanea este código QR desde tu aplicación bancaria para realizar la transferencia.
          </Text>
          
          <View style={styles.qrContainer}>
            {/* Aquí en el futuro puedes usar react-native-qrcode-svg para generar QRs dinámicos.
                Por ahora usamos un icono o imagen de placeholder. */}
            <Feather name="maximize" size={150} color={AuraColors.primary} />
            <Text style={styles.qrMockText}>QR Simple</Text>
          </View>
        </View>

        <View style={styles.securityBox}>
          <Feather name="shield" size={20} color={AuraColors.success} />
          <Text style={styles.securityText}>Pago 100% seguro y verificado.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Ya realicé el pago"
          onPress={handleConfirmPayment}
          loading={loading}
          icon={<Feather name="check-circle" size={18} color="white" />}
        />
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 10 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  title: { fontSize: 20, fontWeight: '700', color: AuraColors.textPrimary },
  content: { padding: 24, paddingBottom: 40 },
  summaryCard: { backgroundColor: AuraColors.primaryLight, padding: 24, borderRadius: 20, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#D1E8FA' },
  summaryTitle: { fontSize: 16, color: AuraColors.primary, fontWeight: '600', marginBottom: 8 },
  amountText: { fontSize: 36, fontWeight: '800', color: AuraColors.primary },
  helperText: { fontSize: 13, color: AuraColors.textSecondary, marginTop: 8 },
  qrSection: { backgroundColor: AuraColors.card, padding: 24, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  instructionText: { fontSize: 15, color: AuraColors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  qrContainer: { width: 200, height: 200, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', borderRadius: 16, borderWidth: 2, borderColor: AuraColors.border },
  qrMockText: { position: 'absolute', fontWeight: '800', color: AuraColors.textPrimary, fontSize: 20 },
  securityBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, padding: 16, backgroundColor: '#EDF7ED', borderRadius: 12 },
  securityText: { color: AuraColors.success, fontWeight: '600', fontSize: 14 },
  footer: { padding: 24, backgroundColor: AuraColors.background, borderTopWidth: 1, borderTopColor: AuraColors.border },
  cancelButton: { marginTop: 16, alignItems: 'center' },
  cancelText: { color: AuraColors.textSecondary, fontSize: 15, fontWeight: '600' }
});