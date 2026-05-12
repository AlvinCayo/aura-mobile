import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuraColors } from '../../src/theme/colors';

export default function AdminSettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Configuración Global</Text>

        <Text style={styles.sectionTitle}>PLATAFORMA</Text>
        {[
          { icon: 'settings', label: 'Configuración General' },
          { icon: 'shield', label: 'Políticas de Seguridad' },
          { icon: 'file-text', label: 'Términos y Condiciones' },
          { icon: 'alert-triangle', label: 'Reglas de Moderación' },
        ].map((item, i) => (
          <TouchableOpacity key={i} style={styles.item}>
            <Feather name={item.icon as any} size={18} color={AuraColors.textPrimary} />
            <Text style={styles.itemLabel}>{item.label}</Text>
            <Feather name="chevron-right" size={16} color={AuraColors.textMuted} />
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>PAGOS</Text>
        {[
          { label: 'Comisiones de Plataforma' },
          { label: 'Proveedores de Pago' },
          { label: 'Configuración de QR' },
        ].map((item, i) => (
          <View key={i} style={styles.item}>
            <Feather name="credit-card" size={18} color={AuraColors.textPrimary} />
            <Text style={styles.itemLabel}>{item.label}</Text>
            <Feather name="chevron-right" size={16} color={AuraColors.textMuted} />
          </View>
        ))}

        <Text style={styles.sectionTitle}>NOTIFICACIONES</Text>
        {[
          { label: 'Alertas de Registro' },
          { label: 'Reportes de Usuarios' },
          { label: 'Actualizaciones del Sistema' },
        ].map((item, i) => (
          <View key={i} style={styles.item}>
            <Feather name="bell" size={18} color={AuraColors.textPrimary} />
            <Text style={styles.itemLabel}>{item.label}</Text>
            <Feather name="chevron-right" size={16} color={AuraColors.textMuted} />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  scroll: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: AuraColors.textMuted, marginBottom: 8, marginTop: 20 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: AuraColors.card,
    borderBottomWidth: 1,
    borderBottomColor: AuraColors.border,
    gap: 12,
  },
  itemLabel: { flex: 1, fontSize: 15 },
});