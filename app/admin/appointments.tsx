import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
          .select(`id, status, service:service_id(name, price), center:center_id(name)`)
          .eq('id', appointmentId)
          .single();
        if (error) throw error;
        setAppointment(data);
      } catch (error: any) {
        Alert.alert('Error', 'No se pudo cargar la información de la reserva.');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchAppointmentDetails();
  }, [appointmentId]);

  // REGLA MATEMÁTICA ANTI-FRAUDE
  const servicePrice = parseFloat(appointment?.service?.price || '0');
  const MINIMUM_COMMISSION = 3.00; 
  const reservationFee = Math.max(servicePrice * 0.10, MINIMUM_COMMISSION);
  const localBalance = servicePrice; 

  const pickReceiptImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permiso necesario', 'Necesitamos acceso a la galería para subir tu comprobante.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.7 });
    if (!result.canceled && result.assets.length > 0) setReceiptImage(result.assets[0]);
  };

  const handleSubmitPayment = async () => {
    if (!receiptImage) return Alert.alert('Comprobante requerido', 'Sube la captura de pantalla de la transferencia.');
    if (!user) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      const fileExt = receiptImage.uri.split('.').pop() || 'jpg';
      const fileName = `reserva_${appointmentId}_${Date.now()}.${fileExt}`;
      formData.append('file', { uri: receiptImage.uri, name: fileName, type: `image/${fileExt}` } as any);

      const { error: uploadError } = await supabase.storage.from('receipts').upload(fileName, formData);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(fileName);

      const { error: updateError } = await supabase.from('appointments').update({
        status: 'paid', 
        receipt_url: publicUrl,
        reservation_fee: reservationFee,
        local_balance_due: localBalance
      }).eq('id', appointmentId);

      if (updateError) throw updateError;
      
      // LOG DE AUDITORÍA
      await supabase.from('audit_logs').insert({
        appointment_id: appointmentId, actor_id: user?.id, action: 'RESERVATION_FEE_PAID', details: { fee: reservationFee }
      });

      Alert.alert('¡Reserva Confirmada!', 'El monto ha sido enviado. Tu turno está asegurado.', [{ text: 'Aceptar', onPress: () => router.replace('/(tabs)/appointments') }]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Ocurrió un problema.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={AuraColors.primary} /></View>;

  // BLOQUEO DE SEGURIDAD
  if (appointment?.status !== 'approved') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.blockedContainer}>
          <Feather name="lock" size={54} color="#F59E0B" />
          <Text style={styles.blockedTitle}>Pago no habilitado</Text>
          <Text style={styles.blockedSubtitle}>Debes esperar a que el centro acepte tu solicitud para validar sus horarios antes de poder pagar la reserva.</Text>
          <Button title="Volver a mis Citas" onPress={() => router.replace('/(tabs)/appointments')} style={{ width: '100%', marginTop: 20 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Feather name="arrow-left" size={20} color={AuraColors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Garantizar Reserva</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.breakdownCard}>
          <Text style={styles.sectionTitle}>Desglose de Pago</Text>
          <Text style={styles.centerName}>{appointment?.center?.name}</Text>
          <Text style={styles.serviceName}>{appointment?.service?.name}</Text>
          <View style={styles.divider} />
          <View style={styles.row}><Text style={styles.labelText}>Costo de Reserva (AURA)</Text><Text style={[styles.valueText, { color: AuraColors.primary, fontWeight: '700' }]}>{reservationFee.toFixed(2)} Bs</Text></View>
          <View style={styles.row}><Text style={styles.labelText}>Saldo en el Local (Efectivo/QR)</Text><Text style={styles.valueText}>{localBalance.toFixed(2)} Bs</Text></View>
          <View style={[styles.row, styles.totalRow]}><Text style={styles.totalLabel}>Precio Total del Servicio</Text><Text style={styles.totalValue}>{servicePrice.toFixed(2)} Bs</Text></View>
        </View>

        <View style={styles.qrSection}>
          <Text style={styles.qrTitle}>QR Oficial de AURA</Text>
          <Text style={styles.qrSubtitle}>Transfiere únicamente los <Text style={{ fontWeight: '700' }}>{reservationFee.toFixed(2)} Bs</Text> de la reserva para congelar tu cupo.</Text>
          <View style={styles.qrContainer}>
            <Image source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=AURA_RESERVA_CUENTA' }} style={styles.qrImage} resizeMode="contain" />
          </View>
        </View>

        <View style={styles.receiptSection}>
          <Text style={styles.sectionTitle}>Comprobante de Pago</Text>
          <Text style={styles.receiptSubtitle}>Sube la captura de pantalla de la transferencia bancaria.</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={pickReceiptImage}>
            {receiptImage ? <Image source={{ uri: receiptImage.uri }} style={styles.receiptPreview} /> : <View style={styles.uploadPlaceholder}><Feather name="upload-cloud" size={32} color={AuraColors.primary} /><Text style={styles.uploadText}>Subir comprobante</Text></View>}
            {receiptImage && <View style={styles.changeImageBadge}><Feather name="refresh-cw" size={16} color="white" /></View>}
          </TouchableOpacity>
        </View>

        <Button title="Confirmar Cita" onPress={handleSubmitPayment} loading={isSubmitting} style={{ marginTop: 12, marginBottom: 40 }} />
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
  totalValue: { fontSize: 20, fontWeight: '800', color: AuraColors.textPrimary },
  qrSection: { alignItems: 'center', marginBottom: 32 },
  qrTitle: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 4 },
  qrSubtitle: { fontSize: 13, color: AuraColors.textSecondary, textAlign: 'center', paddingHorizontal: 20, marginBottom: 16, lineHeight: 18 },
  qrContainer: { width: 200, height: 200, backgroundColor: 'white', borderRadius: 16, padding: 8, borderWidth: 1, borderColor: AuraColors.border },
  qrImage: { width: '100%', height: '100%', borderRadius: 8 },
  receiptSection: { marginBottom: 24 },
  receiptSubtitle: { fontSize: 13, color: AuraColors.textSecondary, marginBottom: 16, lineHeight: 20 },
  uploadButton: { width: '100%', height: 160, backgroundColor: AuraColors.primaryLight, borderRadius: 16, borderWidth: 2, borderColor: AuraColors.primary, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' },
  uploadPlaceholder: { alignItems: 'center' },
  uploadText: { fontSize: 14, fontWeight: '600', color: AuraColors.primary, marginTop: 12 },
  receiptPreview: { width: '100%', height: '100%' },
  changeImageBadge: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20 },
  blockedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, textAlign: 'center' },
  blockedTitle: { fontSize: 22, fontWeight: '700', color: AuraColors.textPrimary, marginTop: 16, marginBottom: 8 },
  blockedSubtitle: { fontSize: 14, color: AuraColors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
});