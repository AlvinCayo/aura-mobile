import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal, // <-- Importamos Modal para crear las sub-pantallas limpias
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput, // <-- Importamos TextInput para los formularios de ayuda
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // --- ESTADOS PARA PANTALLAS DE SOPORTE ---
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  
  // Estados del Centro de Ayuda
  const [helpTab, setHelpTab] = useState<'suggestion' | 'bug'>('suggestion');
  const [suggestionText, setSuggestionText] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [submittingHelp, setSubmittingHelp] = useState(false);

  const fetchProfile = async () => {
    if (!user) return;
    try {
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

  const toggleNotifications = () => {
    setNotificationsEnabled(previousState => !previousState);
  };

  // --- ACCIONES DEL CENTRO DE AYUDA ---
  const handleContact = async () => {
    const email = 'soporte@aura.com';
    const subject = 'Soporte App AURA';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Aviso', `Escríbenos directamente a:\n${email}`);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir la app de correo.');
    }
  };

  const handleSubmitHelp = async () => {
    const isSuggestion = helpTab === 'suggestion';
    const textToSend = isSuggestion ? suggestionText : bugDescription;

    if (!textToSend.trim()) {
      Alert.alert('Campo Vacío', 'Por favor escribe un mensaje antes de enviar.');
      return;
    }

    setSubmittingHelp(true);
    try {
      // AQUÍ GUARDAMOS EL MENSAJE EN SUPABASE
      const { error } = await supabase.from('support_tickets').insert({
        user_id: user?.id,
        type: helpTab,
        content: textToSend
      });
      
      if (error) throw error;
      
      Alert.alert(
        isSuggestion ? '¡Sugerencia Recibida!' : 'Reporte Técnico Creado',
        isSuggestion 
          ? 'Gracias por ayudarnos a mejorar. Nuestro equipo revisará tu sugerencia en el buzón.'
          : 'Lamentamos el inconveniente. El equipo técnico de Factoriz analizará este error de inmediato.'
      );
      
      // Limpiar formularios
      if (isSuggestion) setSuggestionText('');
      else setBugDescription('');
      setHelpModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', 'No se pudo enviar tu solicitud. Verifica tu conexión.');
    } finally {
      setSubmittingHelp(false);
    }
  };

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

        {/* Sección de Negocio */}
        {!isOwner && !isSuperAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Negocio</Text>
            <View style={styles.settingsGroup}>
              <SettingsItem icon="briefcase" label="Convertirme en Centro" onPress={() => router.push('/become-center' as any)} />
            </View>
          </View>
        )}

        {/* PANEL SECRETO DE SUPER ADMINISTRADOR AURA */}
        {isSuperAdmin && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: AuraColors.destructive }]}>CENTRO DE CONTROL DE AURA (Admin)</Text>
            <View style={styles.settingsGroup}>
              <SettingsItem icon="shield" label="Panel de Administración" onPress={() => router.push('/admin-platform/dashboard' as any)} />
            </View>
          </View>
        )}

        {/* Mi Centro */}
        {isOwner && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mi Centro</Text>
            <View style={styles.settingsGroup}>
              <SettingsItem icon="grid" label="Ir al Panel de Control" onPress={() => router.push('/admin/dashboard' as any)} />
            </View>
          </View>
        )}

        {/* SECCIÓN DE CUENTA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          <View style={styles.settingsGroup}>
            <SettingsItem icon="user" label="Información personal" onPress={() => router.push('/edit-profile' as any)} />
            <SettingsItem
              icon="bell"
              label="Notificaciones"
              onPress={toggleNotifications}
              rightElement={
                <Switch
                  trackColor={{ false: '#cbd5e1', true: AuraColors.primaryLight }}
                  thumbColor={notificationsEnabled ? AuraColors.primary : '#f8fafc'}
                  ios_backgroundColor="#cbd5e1"
                  onValueChange={toggleNotifications}
                  value={notificationsEnabled}
                />
              }
            />
          </View>
        </View>

        {/* SECCIÓN DE SOPORTE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Soporte</Text>
          <View style={styles.settingsGroup}>
            <SettingsItem icon="help-circle" label="Centro de ayuda" onPress={() => setHelpModalVisible(true)} />
            <SettingsItem icon="message-square" label="Contáctanos" onPress={handleContact} />
            <SettingsItem icon="file-text" label="Términos y condiciones" onPress={() => setTermsModalVisible(true)} />
          </View>
        </View>

        {/* Cerrar sesión */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Feather name="log-out" size={18} color={AuraColors.destructive} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* =========================================================
          SCREEN MODAL: TÉRMINOS, COOKIES Y AVISO LEGAL
          ========================================================= */}
      <Modal animationType="slide" transparent={false} visible={termsModalVisible} onRequestClose={() => setTermsModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setTermsModalVisible(false)} style={styles.closeModalBtn}>
              <Feather name="arrow-left" size={22} color={AuraColors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Información Legal</Text>
            <View style={{ width: 40 }} />
          </View>
          
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <Text style={styles.legalMainTitle}>INFORMACIÓN</Text>
            
            {/* TÉRMINOS Y CONDICIONES */}
            <Text style={styles.legalSectionTitle}>Términos y Condiciones</Text>
            
            <Text style={styles.legalSubtitle}>1. Objeto del servicio</Text>
            <Text style={styles.legalBody}>La aplicación móvil desarrollada por Factoriz - Belleza, Innovación Aplicaciones tiene como finalidad facilitar la gestión de citas en centros de estética mediante herramientas digitales como geolocalización, análisis biométrico facial referencial y generación de códigos QR para validación de reservas.</Text>
            
            <Text style={styles.legalSubtitle}>2. Aceptación de los términos</Text>
            <Text style={styles.legalBody}>Al descargar, registrarse o utilizar la aplicación, el usuario acepta los presentes Términos y Condiciones. En caso de no estar de acuerdo con alguno de los términos establecidos, se recomienda no utilizar la plataforma.</Text>
            
            <Text style={styles.legalSubtitle}>3. Registro de usuario</Text>
            <Text style={styles.legalBody}>Para acceder a determinadas funcionalidades, el usuario deberá registrarse proporcionando información veraz y actualizada. El usuario es responsable de mantener la confidencialidad de su cuenta y contraseña.</Text>
            
            <Text style={styles.legalSubtitle}>4. Uso adecuado de la plataforma</Text>
            <Text style={styles.legalBody}>El usuario se compromete a utilizar la aplicación únicamente para fines lícitos, evitando cualquier acción que pueda afectar el funcionamiento del sistema o perjudicar a otros usuarios.</Text>
            
            <Text style={styles.legalSubtitle}>5. Sistema de reservas</Text>
            <Text style={styles.legalBody}>La aplicación permite reservar citas en centros de estética registrados dentro de la plataforma. Cada reserva confirmada generará un código QR que deberá presentarse en el establecimiento para validar la cita.</Text>
            
            <Text style={styles.legalSubtitle}>6. Pagos y tarifas</Text>
            <Text style={styles.legalBody}>La descarga de la aplicación es gratuita. Sin embargo, algunas funcionalidades, como la confirmación de reservas o el acceso a módulos adicionales de análisis estético, pueden requerir el pago de una tarifa dentro de la plataforma.</Text>
            
            <Text style={styles.legalSubtitle}>7. Política de cancelación y reembolso</Text>
            <Text style={styles.legalBody}>En caso de incumplimiento de la cita por parte del establecimiento registrado, la plataforma podrá proceder con la devolución de la tarifa de reserva conforme a las políticas establecidas.</Text>
            
            <Text style={styles.legalSubtitle}>8. Limitación de responsabilidad</Text>
            <Text style={styles.legalBody}>Las recomendaciones generadas por el sistema de análisis facial tienen carácter referencial y no garantizan resultados exactos en el servicio estético realizado por el establecimiento.</Text>
            
            <Text style={styles.legalSubtitle}>9. Modificaciones del servicio</Text>
            <Text style={styles.legalBody}>Factoriz se reserva el derecho de modificar, actualizar o suspender temporalmente cualquier funcionalidad del sistema cuando sea necesario para mejorar el servicio.</Text>
            
            <Text style={styles.legalSubtitle}>10. Legislación aplicable</Text>
            <Text style={styles.legalBody}>Los presentes términos se rigen por la normativa vigente del Estado Plurinacional de Bolivia.</Text>

            <View style={styles.legalDivider} />

            {/* POLÍTICA DE COOKIES */}
            <Text style={styles.legalSectionTitle}>Política de Cookies</Text>
            
            <Text style={styles.legalSubtitle}>1. ¿Qué son las cookies?</Text>
            <Text style={styles.legalBody}>Las cookies son pequeños archivos de texto que se almacenan en el dispositivo del usuario cuando visita una página web. Estas permiten mejorar la experiencia de navegación y optimizar el funcionamiento del sitio.</Text>
            
            <Text style={styles.legalSubtitle}>2. Tipos de cookies utilizadas</Text>
            <Text style={styles.legalBody}>• Cookies técnicas: necesarias para el funcionamiento básico del sitio web.{"\n"}• Cookies de análisis: permiten recopilar información estadística sobre el uso del sitio para mejorar los servicios ofrecidos.{"\n"}• Cookies de personalización: permiten recordar preferencias del usuario como idioma o configuración.</Text>
            
            <Text style={styles.legalSubtitle}>3. Finalidad del uso de cookies</Text>
            <Text style={styles.legalBody}>Las cookies se utilizan para mejorar la navegación del usuario, analizar el comportamiento dentro del sitio y optimizar la experiencia de uso de la plataforma.</Text>
            
            <Text style={styles.legalSubtitle}>4. Gestión de cookies</Text>
            <Text style={styles.legalBody}>El usuario puede configurar su navegador para aceptar, bloquear o eliminar cookies en cualquier momento. Sin embargo, la desactivación de algunas cookies podría afectar el funcionamiento del sitio web.</Text>
            
            <Text style={styles.legalSubtitle}>5. Actualizaciones</Text>
            <Text style={styles.legalBody}>La presente política de cookies podrá ser modificada cuando sea necesario para adaptarse a cambios técnicos o legales.</Text>

            <View style={styles.legalDivider} />

            {/* AVISO LEGAL */}
            <Text style={styles.legalSectionTitle}>Aviso Legal</Text>
            
            <Text style={styles.legalSubtitle}>1. Información general</Text>
            <Text style={styles.legalBody}><Text style={{fontWeight: '700'}}>Empresa:</Text> Factoriz – Belleza · Innovación · Aplicaciones{"\n"}<Text style={{fontWeight: '700'}}>Actividad:</Text> Desarrollo de soluciones tecnológicas y aplicaciones móviles orientadas al sector de estética y cuidado personal.{"\n"}<Text style={{fontWeight: '700'}}>Ubicación:</Text> La Paz, Bolivia.</Text>
            
            <Text style={styles.legalSubtitle}>2. Propiedad intelectual</Text>
            <Text style={styles.legalBody}>Todos los contenidos presentes en la aplicación and en la página web, incluyendo textos, diseños, logotipos, software, images y funcionalidades, son propiedad de Factoriz o cuentan con autorización para su uso. Queda prohibida la reproducción, distribución o modificación del contenido sin autorización expresa del titular.</Text>
            
            <Text style={styles.legalSubtitle}>3. Responsabilidad del usuario</Text>
            <Text style={styles.legalBody}>El usuario se compromete a utilizar la plataforma de manera responsable y conforme a la normativa vigente. Cualquier uso indebido de la plataforma será responsabilidad exclusiva del usuario.</Text>
            
            <Text style={styles.legalSubtitle}>4. Protección de datos</Text>
            <Text style={styles.legalBody}>Factoriz se compromete a proteger la información personal de los usuarios y a aplicar medidas de seguridad para evitar accesos no autorizados o el uso indebido de datos.</Text>
            
            <Text style={styles.legalSubtitle}>5. Enlaces externos</Text>
            <Text style={styles.legalBody}>La plataforma puede contener enlaces a sitios web externos. Factoriz no se responsabiliza del contenido ni del funcionamiento de dichos sitios.</Text>
            
            <Text style={styles.legalSubtitle}>6. Actualización del aviso legal</Text>
            <Text style={styles.legalBody}>El presente aviso legal puede ser modificado en cualquier momento para adaptarse a cambios legales o técnicos del servicio.</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* =========================================================
          SCREEN MODAL: CENTRO DE AYUDA (BUZÓN Y SOPORTE)
          ========================================================= */}
      <Modal animationType="slide" transparent={false} visible={helpModalVisible} onRequestClose={() => setHelpModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setHelpModalVisible(false)} style={styles.closeModalBtn}>
              <Feather name="arrow-left" size={22} color={AuraColors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Centro de Ayuda</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Selector de Pestañas (Tabs) */}
          <View style={styles.tabContainer}>
            <TouchableOpacity style={[styles.tabButton, helpTab === 'suggestion' && styles.tabButtonActive]} onPress={() => setHelpTab('suggestion')}>
              <Feather name="mail" size={16} color={helpTab === 'suggestion' ? 'white' : AuraColors.textSecondary} />
              <Text style={[styles.tabButtonText, helpTab === 'suggestion' && styles.tabButtonTextActive]}>Buzón de Sugerencias</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.tabButton, helpTab === 'bug' && styles.tabButtonActive]} onPress={() => setHelpTab('bug')}>
              <Feather name="alert-triangle" size={16} color={helpTab === 'bug' ? 'white' : AuraColors.textSecondary} />
              <Text style={[styles.tabButtonText, helpTab === 'bug' && styles.tabButtonTextActive]}>Inconveniente / Error</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 24 }}>
            {helpTab === 'suggestion' ? (
              <View>
                <Text style={styles.helpFormTitle}>Buzón de Ideas y Sugerencias</Text>
                <Text style={styles.helpFormDescription}>¿Tienes alguna idea para mejorar AURA? Queremos escucharte. Tu opinión nos ayuda a transformar la experiencia estética digital.</Text>
                <TextInput
                  style={styles.helpTextInput}
                  multiline
                  numberOfLines={6}
                  placeholder="Escribe aquí tu sugerencia o recomendación para la plataforma..."
                  placeholderTextColor={AuraColors.textMuted}
                  value={suggestionText}
                  onChangeText={setSuggestionText}
                  textAlignVertical="top"
                />
              </View>
            ) : (
              <View>
                <Text style={styles.helpFormTitle}>Reportar Error Técnico</Text>
                <Text style={styles.helpFormDescription}>Si experimentaste fallas de carga, problemas de navegación o un mal funcionamiento de la app, detállalo aquí para solucionarlo de inmediato.</Text>
                <TextInput
                  style={styles.helpTextInput}
                  multiline
                  numberOfLines={6}
                  placeholder="Describe el inconveniente detalladamente (qué estabas haciendo, qué error salió)..."
                  placeholderTextColor={AuraColors.textMuted}
                  value={bugDescription}
                  onChangeText={setBugDescription}
                  textAlignVertical="top"
                />
              </View>
            )}

            <TouchableOpacity style={styles.submitHelpBtn} onPress={handleSubmitHelp} disabled={submittingHelp}>
              {submittingHelp ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Feather name="send" size={16} color="white" />
                  <Text style={styles.submitHelpBtnText}>Enviar al Equipo de Factoriz</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', padding: 24, backgroundColor: AuraColors.card, borderBottomWidth: 1, borderBottomColor: AuraColors.border, gap: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: AuraColors.primaryLight, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 36 },
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 4 },
  userEmail: { fontSize: 14, color: AuraColors.textSecondary },
  editText: { fontSize: 14, color: AuraColors.primary, fontWeight: '600' },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: AuraColors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, paddingHorizontal: 24 },
  settingsGroup: { backgroundColor: AuraColors.card, borderTopWidth: 1, borderBottomWidth: 1, borderColor: AuraColors.border },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 32, marginHorizontal: 24, paddingVertical: 14, borderRadius: 12, backgroundColor: AuraColors.card, borderWidth: 1, borderColor: AuraColors.destructive, gap: 8 },
  logoutText: { fontSize: 16, fontWeight: '600', color: AuraColors.destructive },
  
  // MODAL CORE LAYOUT
  modalContainer: { flex: 1, backgroundColor: AuraColors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: AuraColors.border, backgroundColor: AuraColors.card },
  closeModalBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  modalHeaderTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary },
  modalScrollContent: { padding: 24, paddingBottom: 60 },
  
  // LEGAL TERMS FORMATTING
  legalMainTitle: { fontSize: 13, fontWeight: '700', color: AuraColors.primary, letterSpacing: 1, marginBottom: 4 },
  legalSectionTitle: { fontSize: 22, fontWeight: '800', color: AuraColors.textPrimary, marginBottom: 20 },
  legalSubtitle: { fontSize: 15, fontWeight: '700', color: AuraColors.textPrimary, marginTop: 16, marginBottom: 8 },
  legalBody: { fontSize: 14, color: AuraColors.textSecondary, lineHeight: 22, marginBottom: 12, textAlign: 'justify' },
  legalDivider: { height: 1, backgroundColor: AuraColors.border, marginVertical: 24 },
  
  // HELP CENTER HELPERS
  tabContainer: { flexDirection: 'row', paddingHorizontal: 24, marginTop: 20, gap: 10 },
  tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: AuraColors.card, borderWidth: 1, borderColor: AuraColors.border },
  tabButtonActive: { backgroundColor: AuraColors.primary, borderColor: AuraColors.primary },
  tabButtonText: { fontSize: 12, fontWeight: '600', color: AuraColors.textSecondary },
  tabButtonTextActive: { color: 'white' },
  helpFormTitle: { fontSize: 18, fontWeight: '700', color: AuraColors.textPrimary, marginBottom: 8 },
  helpFormDescription: { fontSize: 13, color: AuraColors.textSecondary, lineHeight: 18, marginBottom: 20 },
  helpTextInput: { backgroundColor: AuraColors.card, borderWidth: 1, borderColor: AuraColors.border, borderRadius: 12, padding: 16, fontSize: 14, color: AuraColors.textPrimary, minHeight: 140, marginBottom: 20 },
  submitHelpBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: AuraColors.primary, paddingVertical: 14, borderRadius: 12 },
  submitHelpBtnText: { color: 'white', fontSize: 15, fontWeight: '700' }
});