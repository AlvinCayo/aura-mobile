import { Feather } from '@expo/vector-icons';
import React from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RegisterCenterScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 py-6">
        <Text className="text-2xl font-bold text-gray-900 mb-1 mt-4">Registra tu Centro</Text>
        <Text className="text-gray-500 mb-8">Información del establecimiento</Text>

        <View className="space-y-4">
          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">Nombre del Centro</Text>
            <TextInput placeholder="Ej: Centro de Estética AURA" className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-base" />
          </View>

          <View className="mt-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Dirección</Text>
            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4">
              <TextInput placeholder="Calle Principal #123" className="flex-1 py-4 text-base" />
              <Feather name={"map-pin" as any} size={20} color="#6BA3D6" />
            </View>
          </View>

          <View className="mt-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Licencia de Operación</Text>
            <TouchableOpacity className="w-full py-10 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 items-center justify-center">
              <View className="w-12 h-12 rounded-full bg-aura-blue-200/30 items-center justify-center mb-2">
                <Feather name={"camera" as any} size={24} color="#6BA3D6" />
              </View>
              <Text className="text-gray-500 font-medium">Subir documento o foto</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity className="bg-aura-blue-400 py-4 rounded-2xl items-center flex-row justify-center mt-8 shadow-md shadow-aura-blue-400/30">
            <Text className="text-white font-bold text-lg mr-2">Enviar para Aprobación</Text>
            <Feather name={"check" as any} size={20} color="white" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}