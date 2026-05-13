import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AuraColors } from '../../theme/colors';

// Aquí definimos exactamente las propiedades que TypeScript nos estaba pidiendo
interface KpiCardProps {
  title: string;
  value: string;
  icon: keyof typeof Feather.glyphMap; // Esto asegura que solo aceptemos iconos válidos de Feather
  color?: string;
}

export default function KpiCard({ title, value, icon, color = AuraColors.primary }: KpiCardProps) {
  return (
    <View style={styles.card}>
      {/* El fondo del icono tendrá el mismo color pero con 15% de opacidad */}
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1, // Para que las 3 tarjetas ocupen el mismo ancho en la pantalla
    backgroundColor: AuraColors.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AuraColors.border,
    alignItems: 'flex-start',
  },
  iconContainer: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: AuraColors.textPrimary,
    marginBottom: 4,
  },
  title: {
    fontSize: 12,
    color: AuraColors.textSecondary,
    fontWeight: '500',
  },
});