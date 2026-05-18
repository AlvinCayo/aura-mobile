import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SettingsItem from '../../src/components/ui/SettingsItem';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { AuraColors } from '../../src/theme/colors';

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      // 1. Buscamos el perfil REAL en la base de datos, inmune a Google/Facebook
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.log('Error cargando perfil:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  // 2. Priorizamos los datos de la base de datos sobre los metadatos temporales
  const isOwner = profile?.role === 'center_owner' || user?.user_metadata?.role === 'center_owner';
  const isSuperAdmin = profile?.role === 'superadmin' || user?.user_metadata?.role === 'superadmin'; 
  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Usuario';
  const displayAvatar = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const displayEmail = profile?.email || user?.email || 'Cargando correo...';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AuraColors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AuraColors.primary]} />}
      >
        {/* Cabecera del perfil */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            {displayAvatar ? (
              <Image source={{ uri: displayAvatar }} style={styles.avatarImage} />
            ) : (
              <Text style={{ fontSize: 28, fontWeight: '700', color: AuraColors.primary }}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userEmail}>{displayEmail}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/edit-profile' as any)}>
            <Text style={styles.editText}>Editar</Text>
          </TouchableOpacity>
        </View>

        {/* Sección de Negocio (Solo aparece si no eres dueño aún y no eres superadmin) */}
        {!isOwner && !isSuperAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Negocio</Text>
            <View style={styles.settingsGroup}>
              <SettingsItem
                icon="briefcase"
                label="Convertirme en Centro"
                onPress={() => router.push('/become-center' as any)}
              />
            </View>
          </View>
        )}

        {/* PANEL SECRETO DE SUPER ADMINISTRADOR AURA */}
        {isSuperAdmin && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: AuraColors.destructive }]}>
              AURA Control Center (Admin)
            </Text>
            <View style={styles.settingsGroup}>
              <SettingsItem
                icon="shield"
                label="Panel de SuperAdmin"
                onPress={() => router.push('/admin-platform/dashboard' as any)}
              />
            </View>
          </View>
        )}

        {/* Si ya es dueño, botón para ir al Panel de Administración del centro */}
        {isOwner && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mi Centro</Text>
            <View style={styles.settingsGroup}>
              <SettingsItem
                icon="grid"
                label="Ir al Panel de Control"
                onPress={() => router.push('/admin/dashboard' as any)}
              />
            </View>
          </View>
        )}

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
            <SettingsItem icon="help-circle" label="Centro de ayuda" onPress={() => {}} />
            <SettingsItem icon="message-square" label="Contáctanos" onPress={() => {}} />
            <SettingsItem icon="file-text" label="Términos y condiciones" onPress={() => {}} />
          </View>
        </View>

        {/* Cerrar sesión */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Feather name="log-out" size={18} color={AuraColors.destructive} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', padding: 24, backgroundColor: AuraColors.card, borderBottomWidth: 1, borderBottomColor: AuraColors.border, gap: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: AuraColors.primaryLight, justifyContent: 'center', alignItems: 'center',overflow: 'hidden', },
  avatarImage: { width: '100%', height: '100%', borderRadius: 36,},
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 4 },
  userEmail: { fontSize: 14, color: AuraColors.textSecondary },
  editText: { fontSize: 14, color: AuraColors.primary, fontWeight: '600' },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: AuraColors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, paddingHorizontal: 24 },
  settingsGroup: { backgroundColor: AuraColors.card, borderTopWidth: 1, borderBottomWidth: 1, borderColor: AuraColors.border },
  switchPlaceholder: { marginRight: 4 },
  switchValue: { fontSize: 14, color: AuraColors.textMuted },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 32, marginHorizontal: 24, paddingVertical: 14, borderRadius: 12, backgroundColor: AuraColors.card, borderWidth: 1, borderColor: AuraColors.destructive, gap: 8 },
  logoutText: { fontSize: 16, fontWeight: '600', color: AuraColors.destructive },
});