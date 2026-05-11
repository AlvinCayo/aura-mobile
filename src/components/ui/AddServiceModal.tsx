import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuraColors } from '../../theme/colors';
import Button from './Button';
import Input from './Input';

interface AddServiceModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (service: { name: string; duration: string; price: string }) => void;
  initialValues?: { name: string; duration: string; price: string };
}

export default function AddServiceModal({ visible, onClose, onSave, initialValues }: AddServiceModalProps) {
  const [name, setName] = useState(initialValues?.name || '');
  const [duration, setDuration] = useState(initialValues?.duration || '');
  const [price, setPrice] = useState(initialValues?.price || '');

  const handleSave = () => {
    onSave({ name, duration, price });
    setName('');
    setDuration('');
    setPrice('');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={24} color={AuraColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>{initialValues ? 'Editar servicio' : 'Nuevo servicio'}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.form}>
          <Input
            label="Nombre del servicio"
            icon="award"
            value={name}
            onChangeText={setName}
            placeholder="Ej. Masaje relajante"
          />
          <Input
            label="Duración (min)"
            icon="clock"
            value={duration}
            onChangeText={setDuration}
            placeholder="60"
            keyboardType="numeric"
          />
          <Input
            label="Precio"
            icon="dollar-sign"
            value={price}
            onChangeText={setPrice}
            placeholder="45 €"
          />
          <Button
            title="Guardar"
            onPress={handleSave}
            icon={<Feather name="check" size={18} color="white" />}
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: AuraColors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: AuraColors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: AuraColors.textPrimary,
  },
  form: {
    padding: 24,
  },
  saveButton: {
    marginTop: 24,
  },
});