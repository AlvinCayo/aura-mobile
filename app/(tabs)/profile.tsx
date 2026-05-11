import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SettingsItem from '../../src/components/ui/SettingsItem';
import { AuraColors } from '../../src/theme/colors';

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cabecera del perfil */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Feather name="user" size={36} color={AuraColors.textMuted} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Alvin Cayo</Text>
            <Text style={styles.userEmail}>alvin@email.com</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/edit-profile' as any)}>
            <Text style={styles.editText}>Editar</Text>
          </TouchableOpacity>
        </View>

        {/* Sección de cuenta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          <View style={styles.settingsGroup}>
            <SettingsItem
              icon="user"
              label="Información personal"
              onPress={() => router.push('/edit-profile' as any)}
            />
            <SettingsItem
              icon="credit-card"
              label="Métodos de pago"
              onPress={() => {}}
            />
            <SettingsItem
              icon="bell"
              label="Notificaciones"
              rightElement={
                <View style={styles.switchPlaceholder}>
                  <Text style={styles.switchValue}>Activadas</Text>
                </View>
              }
              showChevron
            />
          </View>
        </View>

        {/* Sección de soporte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Soporte</Text>
          <View style={styles.settingsGroup}>
            <SettingsItem
              icon="help-circle"
              label="Centro de ayuda"
              onPress={() => {}}
            />
            <SettingsItem
              icon="message-square"
              label="Contáctanos"
              onPress={() => {}}
            />
            <SettingsItem
              icon="file-text"
              label="Términos y condiciones"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Cerrar sesión */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => router.replace('/login' as any)}
        >
          <Feather name="log-out" size={18} color={AuraColors.destructive} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AuraColors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    backgroundColor: AuraColors.card,
    borderBottomWidth: 1,
    borderBottomColor: AuraColors.border,
    gap: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: AuraColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: AuraColors.textPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: AuraColors.textSecondary,
  },
  editText: {
    fontSize: 14,
    color: AuraColors.primary,
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AuraColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  settingsGroup: {
    backgroundColor: AuraColors.card,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: AuraColors.border,
  },
  switchPlaceholder: {
    marginRight: 4,
  },
  switchValue: {
    fontSize: 14,
    color: AuraColors.textMuted,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: AuraColors.card,
    borderWidth: 1,
    borderColor: AuraColors.destructive,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: AuraColors.destructive,
  },
});