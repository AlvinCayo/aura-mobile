import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddServiceModal from '../../src/components/ui/AddServiceModal';
import AdminServiceItem from '../../src/components/ui/AdminServiceItem';
import { AuraColors } from '../../src/theme/colors';

const INITIAL_SERVICES = [
  { id: '1', name: 'Limpieza facial profunda', duration: '60 min', price: '45 €' },
  { id: '2', name: 'Peeling químico', duration: '45 min', price: '65 €' },
  { id: '3', name: 'Masaje relajante', duration: '90 min', price: '80 €' },
];

export default function ServicesManagerScreen() {
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<{ id: string; name: string; duration: string; price: string } | null>(null);

  const handleSave = (data: { name: string; duration: string; price: string }) => {
    if (editingService) {
      setServices((prev) =>
        prev.map((s) => (s.id === editingService.id ? { ...s, ...data } : s))
      );
    } else {
      const newService = {
        id: Date.now().toString(),
        ...data,
      };
      setServices((prev) => [...prev, newService]);
    }
    setEditingService(null);
    setModalVisible(false);
  };

  const handleEdit = (service: typeof services[0]) => {
    setEditingService(service);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar servicio', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => setServices((prev) => prev.filter((s) => s.id !== id)),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Servicios</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingService(null);
            setModalVisible(true);
          }}
        >
          <Feather name="plus" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <AdminServiceItem
            name={item.name}
            duration={item.duration}
            price={item.price}
            onEdit={() => handleEdit(item)}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="package" size={48} color={AuraColors.textMuted} />
            <Text style={styles.emptyText}>No hay servicios registrados</Text>
          </View>
        }
      />

      <AddServiceModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingService(null);
        }}
        onSave={handleSave}
        initialValues={editingService ? editingService : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AuraColors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: AuraColors.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AuraColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: AuraColors.textMuted,
    marginTop: 12,
  },
});