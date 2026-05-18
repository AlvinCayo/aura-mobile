import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/Button';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

export default function PaymentScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [receiptImage, setReceiptImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      if (!appointmentId) return;

      try {
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            id,
            status,
            service:service_id(name, price),
            center:center_id(name, payment_qr_url)
          `)
          .eq('id', appointmentId)
          .single();

        if (error) throw error;
        setAppointment(data);
      } catch (error: any) {
        Alert.alert('Error', 'No se pudo cargar la información del pago.');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchAppointmentDetails();
  }, [appointmentId]);

  // Cálculos de la plataforma
  const servicePrice = parseFloat(appointment?.service?.price || '0');
  const commission = servicePrice * 0.10; // 10% para AURA
  const total = servicePrice + commission;

  const pickReceiptImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería para subir el comprobante.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setReceiptImage(result.assets[0]);
    }
  };

  const handleSubmitPayment = async () => {
    if (!receiptImage) {
      Alert.alert('Comprobante requerido', 'Por favor, sube la captura de pantalla de tu transferencia.');
      return;
    }
    if (!user) return;

    setIsSubmitting(true);

    try {
      // 1. Subir la imagen del comprobante al Bucket
      const fileExt = receiptImage.uri.split('.').pop() || 'jpg';
      const fileName = `receipt_${appointmentId}_${Date.now()}.${fileExt}`;
      
      const formData = new FormData();
      formData.append('file', {
        uri: receiptImage.uri,
        name: fileName,
        type: `image/${fileExt}`,
      } as any);

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, formData);

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(fileName);

      // 2. Actualizar el estado de la cita a 'paid' y registrar la comisión y el comprobante
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          status: 'paid',
          receipt_url: publicUrl,
          commission_amount: commission
        })
        .eq('id', appointmentId);

      if (updateError) throw updateError;

      // 3. Registrar en la tabla de transacciones 'payments'
      await supabase.from('payments').insert({
        appointment_id: appointmentId,
        amount: total,
        commission: commission, 
        status: 'completed',
        payment_method: 'QR',
        paid_at: new Date().toISOString()
      });

      Alert.alert('¡Pago Confirmado!', 'Tu comprobante ha sido enviado exitosamente.', [
        { text: 'Aceptar', onPress: () => router.replace('/(tabs)/appointments') }
      ]);

    } catch (error: any) {
      Alert.alert('Error al enviar pago', error.message || 'Inténtalo nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={AuraColors.primary} /></View>;
  }

  // Verificamos si el centro tiene QR para habilitar o no los botones
  const hasQrUrl = appointment?.center?.payment_qr_url && appointment.center.payment_qr_url.trim() !== '';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Realizar Pago</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Paso 1: Desglose de Costos */}
        <View style={styles.breakdownCard}>
          <Text style={styles.sectionTitle}>Detalle del Servicio</Text>
          <Text style={styles.centerName}>{appointment?.center?.name}</Text>
          <Text style={styles.serviceName}>{appointment?.service?.name}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.row}>
            <Text style={styles.labelText}>Costo del Servicio</Text>
            <Text style={styles.valueText}>{servicePrice.toFixed(2)} Bs</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelText}>Costo de Reserva (Plataforma)</Text>
            <Text style={styles.valueText}>{commission.toFixed(2)} Bs</Text>
          </View>
          
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total a Transferir</Text>
            <Text style={styles.totalValue}>{total.toFixed(2)} Bs</Text>
          </View>
        </View>

        {/* Paso 2: Escaneo de QR */}
        <View style={styles.qrSection}>
          <Text style={styles.qrTitle}>QR del Centro Estético</Text>
          <Text style={styles.qrSubtitle}>Escanea o guarda esta imagen para pagar desde tu app bancaria.</Text>
          
          <View style={styles.qrContainer}>
            {hasQrUrl ? (
              <Image source={{ uri: appointment.center.payment_qr_url }} style={styles.qrImage} resizeMode="contain" />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Feather name="image" size={40} color={AuraColors.textMuted} />
                <Text style={styles.noQrText}>Este centro aún no subió su QR</Text>
              </View>
            )}
          </View>
        </View>

        {/* Paso 3: Subir Comprobante */}
        <View style={styles.receiptSection}>
          <Text style={styles.sectionTitle}>Comprobante de Pago</Text>
          <Text style={styles.receiptSubtitle}>Una vez realizada la transferencia, sube la captura de pantalla aquí.</Text>

          <TouchableOpacity style={[styles.uploadButton, !hasQrUrl && { opacity: 0.5 }]} onPress={pickReceiptImage} disabled={!hasQrUrl}>
            {receiptImage ? (
              <Image source={{ uri: receiptImage.uri }} style={styles.receiptPreview} />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Feather name="upload-cloud" size={32} color={hasQrUrl ? AuraColors.primary : AuraColors.textMuted} />
                <Text style={[styles.uploadText, !hasQrUrl && { color: AuraColors.textMuted }]}>
                  {hasQrUrl ? 'Toca para subir captura' : 'No disponible sin QR'}
                </Text>
              </View>
            )}
            {receiptImage && (
              <View style={styles.changeImageBadge}>
                <Feather name="refresh-cw" size={16} color="white" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Button
          title={hasQrUrl ? "Enviar Comprobante" : "Centro sin QR"}
          onPress={handleSubmitPayment}
          loading={isSubmitting}
          style={{ marginTop: 12, marginBottom: 40 }}
          disabled={!hasQrUrl || !receiptImage}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary },
  content: { padding: 24 },
  breakdownCard: { backgroundColor: AuraColors.card, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: AuraColors.border, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 8 },
  centerName: { fontSize: 13, color: AuraColors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  serviceName: { fontSize: 18, fontWeight: '700', color: AuraColors.primary, marginBottom: 16 },
  divider: { height: 1, backgroundColor: AuraColors.border, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  labelText: { fontSize: 14, color: AuraColors.textSecondary },
  valueText: { fontSize: 14, fontWeight: '600', color: AuraColors.textPrimary },
  totalRow: { marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: AuraColors.border, alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary },
  totalValue: { fontSize: 22, fontWeight: '800', color: AuraColors.success },
  qrSection: { alignItems: 'center', marginBottom: 32 },
  qrTitle: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 4 },
  qrSubtitle: { fontSize: 13, color: AuraColors.textSecondary, textAlign: 'center', paddingHorizontal: 20, marginBottom: 16 },
  qrContainer: { width: 200, height: 200, backgroundColor: 'white', borderRadius: 16, padding: 8, borderWidth: 1, borderColor: AuraColors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 5 },
  qrImage: { width: '100%', height: '100%', borderRadius: 8 },
  qrPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 8 },
  noQrText: { fontSize: 12, color: AuraColors.textMuted, textAlign: 'center', marginTop: 8, paddingHorizontal: 10 },
  receiptSection: { marginBottom: 24 },
  receiptSubtitle: { fontSize: 13, color: AuraColors.textSecondary, marginBottom: 16, lineHeight: 20 },
  uploadButton: { width: '100%', height: 160, backgroundColor: AuraColors.primaryLight, borderRadius: 16, borderWidth: 2, borderColor: AuraColors.primary, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' },
  uploadPlaceholder: { alignItems: 'center' },
  uploadText: { fontSize: 14, fontWeight: '600', color: AuraColors.primary, marginTop: 12 },
  receiptPreview: { width: '100%', height: '100%' },
  changeImageBadge: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20 },
});