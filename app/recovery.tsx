import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { SafeAreaView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RecoveryScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mt-6 mb-8">
        <Feather name={"chevron-left" as any} size={24} color="black" />
      </TouchableOpacity>

      <Text className="text-2xl font-bold text-gray-900 mb-2">Recuperar contraseña</Text>
      <Text className="text-gray-500 mb-8 leading-5">
        Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
      </Text>

      <View className="space-y-6">
        <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 flex-row items-center">
          <Feather name={"mail" as any} size={20} color="#9CA3AF" />
          <TextInput placeholder="tu@email.com" className="ml-3 flex-1 text-base" keyboardType="email-address" />
        </View>

        <TouchableOpacity className="bg-aura-blue-400 py-4 rounded-2xl items-center flex-row justify-center mt-4 shadow-md shadow-aura-blue-400/30">
          <Text className="text-white font-bold text-lg mr-2">Enviar Instrucciones</Text>
          <Feather name={"mail" as any} size={20} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}