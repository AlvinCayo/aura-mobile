import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchPlatformConfig, submitPayment, uploadReceipt } from '../../src/lib/data';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

export default function PaymentScreen() {
  const { appointmentId } = useLocalSearchParams();
  const router = useRouter();
  
  const [appointment, setAppointment] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [paymentCode, setPaymentCode] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    // 1. Cargar cita y servicio
    const { data: aptData } = await supabase
      .from('appointments')
      .select('*, service:service_id(name, price), center:center_id(name)')
      .eq('id', appointmentId)
      .single();
    
    // 2. Cargar config del SuperAdmin (QR y Comisión)
    const { data: configData } = await fetchPlatformConfig();
    
    setAppointment(aptData);
    setConfig(configData);
    setLoading(false);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) setReceiptImage(result.assets[0].uri);
  };

  const handleValidation = async () => {
    if (!receiptImage || paymentCode.length < 5) {
      Alert.alert('Faltan datos', 'Por favor sube la captura del pago e ingresa un número de transacción válido (min. 5 dígitos).');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Subir captura al Bucket de Supabase
      const { url, error: uploadErr } = await uploadReceipt(receiptImage, appointmentId as string);
      if (uploadErr || !url) throw new Error('Error al subir comprobante');

      // 2. Calcular 10%
      const commission = (appointment.service.price * parseInt(config?.commission_percentage || '10')) / 100;

      // 3. Guardar en BD. ¡El Trigger hará la validación automática aquí!
      const { data, error } = await submitPayment(appointmentId as string, paymentCode, url, commission);
      if (error) throw error;

      // Como el trigger actúa instantáneamente, la cita ya debería estar 'paid'
      Alert.alert(
        '¡Pago Verificado!',
        'El sistema ha comprobado tu pago automáticamente. Tu cita está confirmada.',
        [{ text: 'Entendido', onPress: () => router.push('/(tabs)/appointments') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Ocurrió un error al procesar tu pago.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !appointment) return <View style={styles.center}><ActivityIndicator size="large" color={AuraColors.primary} /></View>;

  const commissionAmount = (appointment.service.price * parseInt(config?.commission_percentage || '10')) / 100;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={24} color={AuraColors.textPrimary} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Confirmar Reserva</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.card}>
          <Text style={styles.serviceName}>{appointment.service.name}</Text>
          <Text style={styles.centerName}>en {appointment.center.name}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.row}>
            <Text style={styles.detailText}>Costo del Servicio (a pagar en centro)</Text>
            <Text style={styles.detailValue}>Bs. {appointment.service.price}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.detailTextBold}>Comisión de Reserva (10%)</Text>
            <Text style={styles.priceHighlight}>Bs. {commissionAmount.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>1. Escanea para pagar la comisión</Text>
        <View style={styles.qrContainer}>
          {config?.platform_qr_url ? (
            <Image source={{ uri: config.platform_qr_url }} style={styles.qrImage} />
          ) : (
            <Text style={{ color: AuraColors.textSecondary }}>El administrador aún no configura el QR</Text>
          )}
          <Text style={styles.qrHelper}>Guarda este QR o escanéalo con tu app bancaria para transferir Bs. {commissionAmount.toFixed(2)}</Text>
        </View>

        <Text style={styles.sectionTitle}>2. Verifica tu pago automáticamente</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nro. de Transacción (Voucher)</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Ej. 98765432" 
            value={paymentCode}
            onChangeText={setPaymentCode}
            keyboardType="number-pad"
          />
        </View>

        <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
          <Feather name={receiptImage ? "check-circle" : "camera"} size={20} color={receiptImage ? "green" : AuraColors.primary} />
          <Text style={[styles.uploadText, receiptImage && { color: 'green' }]}>
            {receiptImage ? 'Comprobante subido con éxito' : 'Adjuntar captura del comprobante'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleValidation} disabled={submitting}>
          {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>Verificar Automáticamente</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 24, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: AuraColors.textPrimary },
  card: { backgroundColor: AuraColors.card, padding: 20, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: AuraColors.border },
  serviceName: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary },
  centerName: { fontSize: 14, color: AuraColors.textSecondary, marginTop: 4 },
  divider: { height: 1, backgroundColor: AuraColors.border, marginVertical: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailText: { fontSize: 14, color: AuraColors.textSecondary },
  detailValue: { fontSize: 14, color: AuraColors.textPrimary, fontWeight: '600' },
  detailTextBold: { fontSize: 15, color: AuraColors.textPrimary, fontWeight: '700' },
  priceHighlight: { fontSize: 18, color: AuraColors.primary, fontWeight: '800' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 12 },
  qrContainer: { alignItems: 'center', backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: AuraColors.border },
  qrImage: { width: 200, height: 200, borderRadius: 12, marginBottom: 12 },
  qrHelper: { fontSize: 13, color: AuraColors.textSecondary, textAlign: 'center', lineHeight: 18 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: AuraColors.textSecondary, marginBottom: 8 },
  input: { backgroundColor: AuraColors.card, height: 50, borderRadius: 12, borderWidth: 1, borderColor: AuraColors.inputBorder, paddingHorizontal: 16, fontSize: 16, color: AuraColors.textPrimary },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: AuraColors.primaryLight, padding: 16, borderRadius: 12, marginBottom: 32, borderStyle: 'dashed', borderWidth: 1, borderColor: AuraColors.primary },
  uploadText: { color: AuraColors.primary, fontWeight: '600', fontSize: 14 },
  submitBtn: { backgroundColor: AuraColors.primary, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: 'white', fontSize: 16, fontWeight: '700' }
});