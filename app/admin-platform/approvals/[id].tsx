import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuraColors } from '../../../src/theme/colors';

export default function AdminApprovalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Revisión de Centro</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.centerName}>Centro Wellness Plus</Text>
        <Text style={styles.date}>Solicitud: 20 Ene, 2025</Text>

        <Text style={styles.sectionTitle}>INFORMACIÓN DE CONTACTO</Text>
        <View style={styles.infoRow}>
          <Feather name="map-pin" size={16} color={AuraColors.textMuted} />
          <Text style={styles.infoText}>Calle Norte #456, Ciudad</Text>
        </View>
        <View style={styles.infoRow}>
          <Feather name="phone" size={16} color={AuraColors.textMuted} />
          <Text style={styles.infoText}>+1 234 567 8900</Text>
        </View>
        <View style={styles.infoRow}>
          <Feather name="mail" size={16} color={AuraColors.textMuted} />
          <Text style={styles.infoText}>info@wellnessplus.com</Text>
        </View>

        <Text style={styles.sectionTitle}>DOCUMENTOS ADJUNTOS</Text>
        {[
          { name: 'Licencia de Operación.pdf', status: 'verified' },
          { name: 'Certificado Sanitario.pdf', status: 'verified' },
          { name: 'Identificación del Propietario.jpg', status: 'pending' },
        ].map((doc, i) => (
          <View key={i} style={styles.docRow}>
            <Feather name="file-text" size={16} color={AuraColors.textMuted} />
            <Text style={{ flex: 1, marginLeft: 10, fontSize: 14 }}>{doc.name}</Text>
            {doc.status === 'verified' ? (
              <Feather name="check-circle" size={16} color={AuraColors.success} />
            ) : (
              <Feather name="clock" size={16} color={AuraColors.warning} />
            )}
          </View>
        ))}

        <Text style={styles.sectionTitle}>SERVICIOS PROPUESTOS</Text>
        <View style={styles.servicesRow}>
          {['Facial', 'Masajes', 'Botox', 'Corporales', 'Depilación'].map((s, i) => (
            <View key={i} style={styles.serviceChip}>
              <Text style={styles.serviceChipText}>{s}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>NOTAS DEL REVISOR</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.rejectButton}>
            <Feather name="x-circle" size={18} color={AuraColors.destructive} />
            <Text style={styles.rejectText}>Rechazar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.approveButton}>
            <Feather name="check-circle" size={18} color="white" />
            <Text style={styles.approveText}>Aprobar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  title: { fontSize: 20, fontWeight: '700' },
  content: { padding: 24 },
  centerName: { fontSize: 22, fontWeight: '700' },
  date: { fontSize: 14, color: AuraColors.textSecondary, marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: AuraColors.textMuted, marginTop: 20, marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 10 },
  infoText: { fontSize: 14 },
  docRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  servicesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  serviceChip: { backgroundColor: AuraColors.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  serviceChipText: { fontSize: 13, color: AuraColors.primary },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  rejectButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: AuraColors.destructive, paddingVertical: 14, borderRadius: 12, gap: 6 },
  rejectText: { color: AuraColors.destructive, fontWeight: '600' },
  approveButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: AuraColors.primary, paddingVertical: 14, borderRadius: 12, gap: 6 },
  approveText: { color: 'white', fontWeight: '600' },
});