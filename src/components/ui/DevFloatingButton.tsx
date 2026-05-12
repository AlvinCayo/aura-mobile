import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuraColors } from '../../theme/colors';

export default function DevFloatingButton() {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  const navigateTo = (route: string) => {
    setExpanded(false);
    router.push(route as any);
  };

  const navigateReplace = (route: string) => {
    setExpanded(false);
    router.replace(route as any);
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {expanded && (
        <View style={styles.menu}>
          {/* === Roles principales === */}
          <Text style={styles.menuLabel}>ROLES</Text>

          <TouchableOpacity
            style={[styles.menuButton, styles.clientButton]}
            onPress={() => navigateReplace('/(tabs)')}
          >
            <Feather name="user" size={18} color="white" />
            <Text style={styles.menuText}>Cliente (Tabs)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.centerButton]}
            onPress={() => navigateReplace('/admin/dashboard')}
          >
            <Feather name="briefcase" size={18} color="white" />
            <Text style={styles.menuText}>Centro (Gestión)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.adminButton]}
            onPress={() => navigateReplace('/admin-platform/dashboard')}
          >
            <Feather name="shield" size={18} color="white" />
            <Text style={styles.menuText}>Admin (Plataforma)</Text>
          </TouchableOpacity>

          {/* === Funciones rápidas === */}
          <Text style={[styles.menuLabel, { marginTop: 8 }]}>FUNCIONES</Text>

          <TouchableOpacity
            style={[styles.menuButton, styles.qrButton]}
            onPress={() => navigateTo('/qr-scanner')}
          >
            <Feather name="maximize" size={18} color="white" />
            <Text style={styles.menuText}>Escanear QR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.facialButton]}
            onPress={() => navigateTo('/facial-analysis')}
          >
            <Feather name="camera" size={18} color="white" />
            <Text style={styles.menuText}>Análisis Facial</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.reviewButton]}
            onPress={() => navigateTo('/review/1')}
          >
            <Feather name="edit-3" size={18} color="white" />
            <Text style={styles.menuText}>Dejar Reseña (ej.)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.favButton]}
            onPress={() => navigateTo('/favorites')}
          >
            <Feather name="heart" size={18} color="white" />
            <Text style={styles.menuText}>Favoritos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.notifButton]}
            onPress={() => navigateTo('/notifications')}
          >
            <Feather name="bell" size={18} color="white" />
            <Text style={styles.menuText}>Notificaciones</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.resultsButtonDev]}
            onPress={() => navigateTo('/analysis-results')}
          >
            <Feather name="bar-chart-2" size={18} color="white" />
            <Text style={styles.menuText}>Resultados Análisis</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.arButtonDev]}
            onPress={() => navigateTo('/ar-simulation')}
          >
            <Feather name="rotate-cw" size={18} color="white" />
            <Text style={styles.menuText}>Simulación AR</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
      >
        <Feather
          name={expanded ? 'x' : 'tool'}
          size={24}
          color="white"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    alignItems: 'flex-end',
    zIndex: 9999,
  },
  menu: {
    marginBottom: 12,
    gap: 8,
    alignItems: 'flex-end',
  },
  menuLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: AuraColors.textMuted,
    letterSpacing: 1,
    marginRight: 8,
    marginBottom: 2,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  // Roles
  clientButton: { backgroundColor: AuraColors.success },
  centerButton: { backgroundColor: '#3B82F6' },
  adminButton: { backgroundColor: '#EF4444' },
  // Funciones
  qrButton: { backgroundColor: '#10B981' },
  facialButton: { backgroundColor: '#8B5CF6' },
  reviewButton: { backgroundColor: '#F59E0B' },
  favButton: { backgroundColor: '#EC4899' },
  notifButton: { backgroundColor: '#6366F1' },
  resultsButtonDev: { backgroundColor: '#0EA5E9' },
  arButtonDev: { backgroundColor: '#D946EF' },
  // FAB
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: AuraColors.warning,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});