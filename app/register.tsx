import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RegisterUserScreen() {
  const [step, setStep] = useState(1);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-6 py-6">
        {/* Barra de Progreso Visual */}
        <View className="flex-row gap-2 mb-8 mt-4">
          {[1, 2, 3].map((s) => (
            <View key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-aura-blue-400' : 'bg-gray-100'}`} />
          ))}
        </View>

        <Text className="text-2xl font-bold text-gray-900 mb-1">Crear cuenta</Text>
        <Text className="text-gray-500 mb-8 font-medium">Paso {step} de 3 - Información personal</Text>

        <View className="space-y-5">
          {/* Campo Nombre */}
          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-2">Nombre completo</Text>
            <TextInput 
              placeholder="Tu nombre"
              className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-base"
            />
          </View>

          {/* Campo Email */}
          <View className="mt-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Correo Electrónico</Text>
            <TextInput 
              placeholder="tu@email.com"
              keyboardType="email-address"
              className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-base"
            />
          </View>

          {/* Campo Contraseña */}
          <View className="mt-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Contraseña</Text>
            <TextInput 
              placeholder="Mínimo 8 caracteres"
              secureTextEntry
              className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-base"
            />
          </View>

          {/* Términos y Condiciones */}
          <View className="flex-row items-start gap-3 mt-4">
            <View className="w-5 h-5 rounded border border-aura-blue-400 bg-aura-blue-200/20 items-center justify-center">
              <Feather name="check" size={14} color="#6BA3D6" />
            </View>
            <Text className="text-xs text-gray-500 leading-4 flex-1">
              Acepto los <Text className="text-aura-blue-400 font-bold">Términos de Servicio</Text> y la <Text className="text-aura-blue-400 font-bold">Política de Privacidad</Text>
            </Text>
          </View>

          {/* Botón Continuar */}
          <TouchableOpacity className="bg-aura-blue-400 py-4 rounded-2xl items-center flex-row justify-center mt-6 shadow-md shadow-aura-blue-400/30">
            <Text className="text-white font-bold text-lg mr-2">Continuar</Text>
            <Feather name={"chevron-right" as any} size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Volver al Login */}
        <TouchableOpacity onPress={() => router.back()} className="mt-8 mb-10 items-center">
          <Text className="text-gray-500">¿Ya tienes cuenta? <Text className="text-aura-blue-400 font-bold">Inicia sesión</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}