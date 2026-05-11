import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/ui/Button';
import Input from '../../src/components/ui/Input';
import { AuraColors } from '../../src/theme/colors';

export default function AddServiceScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId?: string }>();
  const router = useRouter();
  const isEditing = !!serviceId;

  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');

  const handleSave = () => {
    console.log({ name, duration, price });
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={AuraColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{isEditing ? 'Editar servicio' : 'Nuevo servicio'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <Input label="Nombre del servicio" icon="award" value={name} onChangeText={setName} />
        <Input label="Duración (min)" icon="clock" value={duration} onChangeText={setDuration} keyboardType="numeric" />
        <Input label="Precio" icon="dollar-sign" value={price} onChangeText={setPrice} />

        <Button title="Guardar" onPress={handleSave} icon={<Feather name="check" size={18} color="white" />} style={styles.saveButton} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AuraColors.border },
  title: { fontSize: 20, fontWeight: '700', color: AuraColors.textPrimary },
  form: { padding: 24, paddingTop: 10 },
  saveButton: { marginTop: 30 },
});