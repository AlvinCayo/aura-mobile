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
  const [paymentPreference, setPaymentPreference] = useState<'cash' | 'qr'>('cash');

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
        Alert.alert('Error', 'No se pudo cargar la información del pago.');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchAppointmentDetails();
  }, [appointmentId]);

  // Cálculos de Negocio (+10% Adicional)
  const servicePrice = parseFloat(appointment?.service?.price || '0');
  const platformFee = servicePrice * 0.10; // 10% Reserva AURA
  const totalCost = servicePrice + platformFee; 
  
  // Código corto auto-generado para la glosa (Ej: AURA-A1B2)
  const paymentCode = appointmentId ? `AURA-${appointmentId.substring(0, 4).toUpperCase()}` : '';

  const pickReceiptImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled && result.assets.length > 0) setReceiptImage(result.assets[0]);
  };

  const handleSubmitPayment = async () => {
    if (!receiptImage) return Alert.alert('Aviso', 'Sube la captura de pantalla de tu transferencia para continuar.');
    if (!user) return;

    setIsSubmitting(true);
    try {
      const fileExt = receiptImage.uri.split('.').pop() || 'jpg';
      const fileName = `receipt_${appointmentId}_${Date.now()}.${fileExt}`;
      const formData = new FormData();
      formData.append('file', { uri: receiptImage.uri, name: fileName, type: `image/${fileExt}` } as any);

      const { error: uploadError } = await supabase.storage.from('receipts').upload(fileName, formData);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('receipts').getPublicUrl(fileName);

      // Estado a verifying_payment
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          status: 'verifying_payment',
          receipt_url: publicUrl,
          commission_amount: platformFee,
          payment_code: paymentCode,
          payment_preference: paymentPreference
        })
        .eq('id', appointmentId);

      if (updateError) throw updateError;

      Alert.alert('¡Pago en Revisión!', 'Verificaremos tu transferencia en minutos para confirmar tu cita.', [
        { text: 'Ir a Mis Citas', onPress: () => router.replace('/(tabs)/appointments') }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Inténtalo nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={AuraColors.primary} /></View>;

  const auraPlatformQR = 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg'; 

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Feather name="arrow-left" size={20} color={AuraColors.textPrimary} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Reserva Segura AURA</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.breakdownCard}>
          <Text style={styles.sectionTitle}>Detalle Financiero</Text>
          <Text style={styles.centerName}>{appointment?.center?.name} - {appointment?.service?.name}</Text>
          <View style={styles.divider} />
          
          <View style={styles.row}>
            <Text style={styles.labelText}>Costo Total del Servicio</Text>
            <Text style={styles.valueText}>{totalCost.toFixed(2)} Bs</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelTextBalance}>A Pagar en el Centro ({appointment?.center?.name})</Text>
            <Text style={styles.valueTextBalance}>{servicePrice.toFixed(2)} Bs</Text>
          </View>
          
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>A Pagar AHORA (Reserva AURA)</Text>
            <Text style={styles.totalValue}>{platformFee.toFixed(2)} Bs</Text>
          </View>
        </View>

        <Text style={styles.instructionTitle}>1. Realiza el Pago</Text>
        <Text style={styles.instructionDesc}>Transfiere <Text style={{fontWeight: '700', color: AuraColors.primary}}>{platformFee.toFixed(2)} Bs</Text> a este QR oficial de AURA.</Text>
        <View style={styles.qrContainer}>
           <Image source={{ uri: auraPlatformQR }} style={styles.qrImage} resizeMode="contain" />
        </View>

        <View style={styles.securityBox}>
          <Feather name="shield" size={20} color="#D97706" />
          <View style={{flex: 1}}>
            <Text style={styles.securityTitle}>¡IMPORTANTE PARA VALIDAR!</Text>
            <Text style={styles.securityDesc}>Coloca este código en el "Motivo" o "Glosa" de tu transferencia bancaria:</Text>
            <Text style={styles.securityCode}>{paymentCode}</Text>
          </View>
        </View>

        <Text style={styles.instructionTitle}>2. Sube tu Captura</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={pickReceiptImage}>
          {receiptImage ? (
            <Image source={{ uri: receiptImage.uri }} style={styles.receiptPreview} />
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Feather name="upload-cloud" size={32} color={AuraColors.primary} />
              <Text style={styles.uploadText}>Subir Comprobante</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.instructionTitle}>3. El saldo de {servicePrice.toFixed(2)} Bs al llegar al local lo pagarás con:</Text>
        <View style={styles.preferenceRow}>
          <TouchableOpacity style={[styles.prefBtn, paymentPreference === 'cash' && styles.prefBtnActive]} onPress={() => setPaymentPreference('cash')}>
            <Feather name="dollar-sign" size={18} color={paymentPreference === 'cash' ? 'white' : AuraColors.textSecondary} />
            <Text style={[styles.prefText, paymentPreference === 'cash' && styles.prefTextActive]}>Efectivo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.prefBtn, paymentPreference === 'qr' && styles.prefBtnActive]} onPress={() => setPaymentPreference('qr')}>
            <Feather name="smartphone" size={18} color={paymentPreference === 'qr' ? 'white' : AuraColors.textSecondary} />
            <Text style={[styles.prefText, paymentPreference === 'qr' && styles.prefTextActive]}>QR del Local</Text>
          </TouchableOpacity>
        </View>

        <Button title="Confirmar Reserva" onPress={handleSubmitPayment} loading={isSubmitting} style={{ marginTop: 24, marginBottom: 40 }} />
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
  centerName: { fontSize: 14, fontWeight: '600', color: AuraColors.textSecondary, marginBottom: 12 },
  divider: { height: 1, backgroundColor: AuraColors.border, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  labelText: { fontSize: 14, color: AuraColors.textSecondary },
  valueText: { fontSize: 14, fontWeight: '600', color: AuraColors.textPrimary },
  labelTextBalance: { fontSize: 14, color: '#166534', fontWeight: '600' },
  valueTextBalance: { fontSize: 14, fontWeight: '700', color: '#166534' },
  totalRow: { marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: AuraColors.border, alignItems: 'center', backgroundColor: '#EFF6FF', borderRadius: 8 },
  totalLabel: { fontSize: 14, fontWeight: '700', color: '#1E40AF', paddingHorizontal: 12 },
  totalValue: { fontSize: 24, fontWeight: '800', color: '#1E40AF', paddingBottom: 12 },
  instructionTitle: { fontSize: 16, fontWeight: '700', color: AuraColors.textPrimary, marginTop: 16, marginBottom: 4 },
  instructionDesc: { fontSize: 13, color: AuraColors.textSecondary, marginBottom: 16, lineHeight: 20 },
  qrContainer: { alignSelf: 'center', width: 200, height: 200, backgroundColor: 'white', borderRadius: 16, padding: 8, borderWidth: 1, borderColor: AuraColors.border, marginBottom: 20 },
  qrImage: { width: '100%', height: '100%', borderRadius: 8 },
  securityBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FEF3C7', padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#FDE68A' },
  securityTitle: { fontSize: 14, fontWeight: '800', color: '#B45309', marginBottom: 4 },
  securityDesc: { fontSize: 12, color: '#92400E', marginBottom: 8, lineHeight: 16 },
  securityCode: { fontSize: 20, fontWeight: '900', color: '#B45309', letterSpacing: 2 },
  preferenceRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  prefBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: AuraColors.border, backgroundColor: AuraColors.card },
  prefBtnActive: { backgroundColor: AuraColors.primary, borderColor: AuraColors.primary },
  prefText: { fontSize: 14, fontWeight: '600', color: AuraColors.textSecondary },
  prefTextActive: { color: 'white' },
  uploadButton: { width: '100%', height: 160, backgroundColor: AuraColors.primaryLight, borderRadius: 16, borderWidth: 2, borderColor: AuraColors.primary, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 20 },
  uploadPlaceholder: { alignItems: 'center' },
  uploadText: { fontSize: 14, fontWeight: '600', color: AuraColors.primary, marginTop: 12 },
  receiptPreview: { width: '100%', height: '100%' },
});