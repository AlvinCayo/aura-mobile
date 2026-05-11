import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, SafeAreaView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Cabecera AURA con Icono corregido */}
        <View className="mt-12 mb-8 flex-row items-center gap-3">
          <View className="w-12 h-12 rounded-xl bg-aura-blue-400 items-center justify-center shadow-sm">
            <Feather name={"sparkles" as any} size={24} color="white" />
          </View>
          <View>
            <Text className="text-2xl font-bold text-gray-900 tracking-tight italic">AURA</Text>
            <Text className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Bienestar</Text>
          </View>
        </View>

        <Text className="text-2xl font-bold text-gray-900 mb-1">Bienvenido de vuelta</Text>
        <Text className="text-gray-500 mb-8">Inicia sesión para continuar</Text>

        <View className="space-y-4">
          {/* Input Correo */}
          <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 flex-row items-center">
            <Feather name={"mail" as any} size={20} color="#9CA3AF" />
            <TextInput 
              placeholder="Correo Electrónico" 
              className="ml-3 flex-1 text-base"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Input Contraseña */}
          <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 flex-row items-center mt-4">
            <Feather name={"lock" as any} size={20} color="#9CA3AF" />
            <TextInput 
              placeholder="Contraseña" 
              secureTextEntry 
              className="ml-3 flex-1 text-base" 
            />
            <TouchableOpacity>
              <Feather name={"eye-off" as any} size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push('/recovery' as any)}>
            <Text className="text-right text-aura-blue-400 font-medium mt-2">¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          {/* Botón Principal */}
          <TouchableOpacity className="bg-aura-blue-400 py-4 rounded-2xl items-center mt-6 flex-row justify-center shadow-md shadow-aura-blue-400/50">
            <Text className="text-white font-bold text-lg mr-2">Iniciar Sesión</Text>
            <Feather name={"arrow-right" as any} size={20} color="white" />
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-12">
          <Text className="text-gray-500">¿No tienes cuenta? </Text>
          <TouchableOpacity onPress={() => router.push('/register' as any)}>
            <Text className="text-aura-blue-400 font-bold">Regístrate</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}