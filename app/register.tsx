import { Feather, FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  return (
    <SafeAreaView className="flex-1 bg-aura-cream-100">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1 px-8" showsVerticalScrollIndicator={false}>
          
          <TouchableOpacity onPress={() => router.back()} className="mt-8 mb-6 w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm border border-gray-100">
            <Feather name={"arrow-left" as any} size={20} color="#4B5563" />
          </TouchableOpacity>

          <Text className="text-3xl font-bold text-gray-900 mb-2">Crear cuenta</Text>
          <Text className="text-lg text-gray-500 mb-8">Únete a la comunidad AURA</Text>

          <View className="space-y-4">
            <View className="bg-white border border-gray-100 rounded-aura px-5 py-4 flex-row items-center shadow-sm">
              <Feather name={"user" as any} size={20} color="#9CA3AF" />
              <TextInput placeholder="Nombre completo" className="ml-4 flex-1 text-base font-medium" />
            </View>

            <View className="bg-white border border-gray-100 rounded-aura px-5 py-4 flex-row items-center shadow-sm mt-4">
              <Feather name={"mail" as any} size={20} color="#9CA3AF" />
              <TextInput placeholder="Correo electrónico" className="ml-4 flex-1 text-base font-medium" keyboardType="email-address" />
            </View>

            <View className="bg-white border border-gray-100 rounded-aura px-5 py-4 flex-row items-center shadow-sm mt-4">
              <Feather name={"lock" as any} size={20} color="#9CA3AF" />
              <TextInput placeholder="Contraseña" secureTextEntry className="ml-4 flex-1 text-base font-medium" />
            </View>

            <TouchableOpacity className="bg-aura-blue-400 py-5 rounded-aura items-center mt-6 shadow-lg shadow-aura-blue-400/40">
              <Text className="text-white font-bold text-lg">Registrarse</Text>
            </TouchableOpacity>
          </View>

          {/* Separador */}
          <View className="flex-row items-center my-8">
            <View className="flex-1 h-[1px] bg-gray-200" />
            <Text className="mx-4 text-gray-400 font-medium">o regístrate con</Text>
            <View className="flex-1 h-[1px] bg-gray-200" />
          </View>

          {/* Botones Sociales */}
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

          <TouchableOpacity onPress={() => router.push('/register-center' as any)} className="mt-10 mb-10 p-5 border border-aura-blue-400/30 rounded-aura bg-aura-blue-50/50 shadow-sm">
            <Text className="text-center text-aura-blue-600 font-bold">¿Eres dueño de un negocio? Registra tu centro aquí</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}