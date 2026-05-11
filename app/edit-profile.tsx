import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../src/components/ui/Button';
import Input from '../src/components/ui/Input';
import { AuraColors } from '../src/theme/colors';

export default function EditProfileScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('Alvin Cayo');
  const [email, setEmail] = useState('alvin@email.com');
  const [phone, setPhone] = useState('+1 234 567 890');

  const handleSave = () => {
    console.log('Guardar perfil');
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Editar perfil</Text>
          </View>

          {/* Avatar (no editable en esta versión) */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Feather name="user" size={40} color={AuraColors.textMuted} />
            </View>
            <TouchableOpacity style={styles.changePhotoButton}>
              <Feather name="camera" size={16} color={AuraColors.primary} />
              <Text style={styles.changePhotoText}>Cambiar foto</Text>
            </TouchableOpacity>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            <Input
              label="Nombre completo"
              icon="user"
              value={fullName}
              onChangeText={setFullName}
            />
            <Input
              label="Correo electrónico"
              icon="mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <Input
              label="Teléfono"
              icon="phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <Button
            title="Guardar cambios"
            onPress={handleSave}
            icon={<Feather name="check" size={18} color="white" />}
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AuraColors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AuraColors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AuraColors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: AuraColors.textPrimary,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: AuraColors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changePhotoText: {
    fontSize: 14,
    color: AuraColors.primary,
    fontWeight: '500',
  },
  form: {
    marginBottom: 24,
  },
  saveButton: {
    marginTop: 8,
  },
});