import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RegisterScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 py-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-6 mt-2">
          <Feather name={"arrow-left" as any} size={24} color="black" />
        </TouchableOpacity>

        <Text className="text-3xl font-bold text-gray-900 mb-2">Crear cuenta</Text>
        <Text className="text-gray-500 mb-8">Únete a la comunidad de bienestar</Text>

        <View className="space-y-4">
          <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 flex-row items-center">
            <Feather name={"user" as any} size={20} color="#9CA3AF" />
            <TextInput placeholder="Nombre completo" className="ml-3 flex-1 text-base" />
          </View>

          <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 flex-row items-center mt-4">
            <Feather name={"mail" as any} size={20} color="#9CA3AF" />
            <TextInput placeholder="Correo electrónico" className="ml-3 flex-1 text-base" keyboardType="email-address" />
          </View>

          <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 flex-row items-center mt-4">
            <Feather name={"lock" as any} size={20} color="#9CA3AF" />
            <TextInput placeholder="Contraseña" secureTextEntry className="ml-3 flex-1 text-base" />
          </View>

          <TouchableOpacity className="bg-aura-blue-400 py-4 rounded-2xl items-center mt-8 shadow-md">
            <Text className="text-white font-bold text-lg">Registrarse</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push('/register-center')} className="mt-10 p-4 border border-aura-blue-400/30 rounded-2xl bg-aura-blue-200/10">
          <Text className="text-center text-aura-blue-400 font-semibold">¿Eres dueño de un negocio? Registra tu centro aquí</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}