import { Feather, FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  return (
    <SafeAreaView className="flex-1 bg-aura-cream-100">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1 px-8" showsVerticalScrollIndicator={false}>
          
          {/* Header Identidad AURA */}
          <View className="mt-16 mb-12 items-center flex-row justify-center gap-3">
            <View className="w-14 h-14 rounded-aura bg-aura-blue-400 items-center justify-center shadow-md">
              <Feather name={"sparkles" as any} size={28} color="white" />
            </View>
            <Text className="text-4xl font-bold italic text-aura-blue-400 tracking-tighter">AURA</Text>
          </View>

          <Text className="text-3xl font-bold text-gray-900 mb-2">Bienvenido</Text>
          <Text className="text-lg text-gray-500 mb-10">Inicia sesión en tu cuenta</Text>

          {/* Formulario Estilo v0 */}
          <View className="space-y-4">
            <View className="bg-white border border-gray-100 rounded-aura px-5 py-4 flex-row items-center shadow-sm">
              <Feather name={"mail" as any} size={20} color="#9CA3AF" />
              <TextInput placeholder="Correo electrónico" className="ml-4 flex-1 text-base font-medium" keyboardType="email-address" />
            </View>

            <View className="bg-white border border-gray-100 rounded-aura px-5 py-4 flex-row items-center shadow-sm mt-4">
              <Feather name={"lock" as any} size={20} color="#9CA3AF" />
              <TextInput placeholder="Contraseña" secureTextEntry className="ml-4 flex-1 text-base font-medium" />
            </View>

            <TouchableOpacity onPress={() => router.push('/recovery' as any)} className="py-2">
              <Text className="text-right text-aura-blue-400 font-semibold text-sm">¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity className="bg-aura-blue-400 py-5 rounded-aura items-center mt-6 shadow-lg shadow-aura-blue-400/40">
              <Text className="text-white font-bold text-lg">Iniciar Sesión</Text>
            </TouchableOpacity>
          </View>

          {/* Separador */}
          <View className="flex-row items-center my-10">
            <View className="flex-1 h-[1px] bg-gray-200" />
            <Text className="mx-4 text-gray-400 font-medium">o continuar con</Text>
            <View className="flex-1 h-[1px] bg-gray-200" />
          </View>

          {/* Botones Sociales Faltantes */}
          <View className="flex-row gap-4 justify-between">
            <TouchableOpacity className="flex-1 bg-white border border-gray-100 py-4 rounded-aura flex-row justify-center items-center shadow-sm">
              <FontAwesome name="google" size={20} color="#DB4437" />
              <Text className="ml-3 font-bold text-gray-700">Google</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-1 bg-white border border-gray-100 py-4 rounded-aura flex-row justify-center items-center shadow-sm">
              <FontAwesome name="facebook" size={20} color="#4267B2" />
              <Text className="ml-3 font-bold text-gray-700">Facebook</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center mt-12 mb-10">
            <Text className="text-gray-500 text-base">¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/register' as any)}>
              <Text className="text-aura-blue-400 font-bold text-base">Regístrate</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}