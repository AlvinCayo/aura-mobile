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
    router.push(route as any); // usamos push para mantener historial, o replace si prefieres
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {expanded && (
        <View style={styles.menu}>
          {/* Opción 1: Cliente (Tabs) */}
          <TouchableOpacity
            style={[styles.menuButton, styles.clientButton]}
            onPress={() => {
              setExpanded(false);
              router.replace('/(tabs)');
            }}
          >
            <Feather name="user" size={18} color="white" />
            <Text style={styles.menuText}>Cliente (Tabs)</Text>
          </TouchableOpacity>

          {/* Opción 2: Centro - Gestión (Admin Dashboard) */}
          <TouchableOpacity
            style={[styles.menuButton, styles.centerButton]}
            onPress={() => {
              setExpanded(false);
              router.replace('/admin/dashboard');
            }}
          >
            <Feather name="briefcase" size={18} color="white" />
            <Text style={styles.menuText}>Centro (Gestión)</Text>
          </TouchableOpacity>

          {/* Opción 3: Centro - Registro */}
          <TouchableOpacity
            style={[styles.menuButton, styles.registerCenterButton]}
            onPress={() => navigateTo('/register-center')}
          >
            <Feather name="plus-square" size={18} color="white" />
            <Text style={styles.menuText}>Centro (Registro)</Text>
          </TouchableOpacity>

          {/* Opción 4: Ver un centro público (ejemplo) */}
          <TouchableOpacity
            style={[styles.menuButton, styles.publicCenterButton]}
            onPress={() => navigateTo('/center/1')}
          >
            <Feather name="eye" size={18} color="white" />
            <Text style={styles.menuText}>Ver centro público</Text>
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
  clientButton: {
    backgroundColor: AuraColors.success,
  },
  centerButton: {
    backgroundColor: '#3B82F6', // azul
  },
  registerCenterButton: {
    backgroundColor: '#8B5CF6', // violeta
  },
  publicCenterButton: {
    backgroundColor: '#6366F1', // índigo
  },
  menuText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
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