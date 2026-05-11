import { Feather } from '@expo/vector-icons';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RegisterCenterScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 py-6">
        <Text className="text-2xl font-bold text-gray-900 mt-4 mb-2">Registra tu Negocio</Text>
        <Text className="text-gray-500 mb-8">Haz que tu centro sea parte de AURA</Text>

        <View className="space-y-4">
          <TextInput placeholder="Nombre del Establecimiento" className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-base" />
          
          <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 flex-row items-center mt-4">
            <Feather name={"map-pin" as any} size={20} color="#6BA3D6" />
            <TextInput placeholder="Dirección física" className="ml-3 flex-1 text-base" />
          </View>

          <TouchableOpacity className="mt-4 p-8 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 items-center">
            <Feather name={"upload" as any} size={32} color="#9CA3AF" />
            <Text className="text-gray-500 mt-2 text-center">Subir Licencia de Funcionamiento (Foto o PDF)</Text>
          </TouchableOpacity>

          <TouchableOpacity className="bg-aura-blue-400 py-4 rounded-2xl items-center mt-8">
            <Text className="text-white font-bold text-lg">Enviar para revisión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}