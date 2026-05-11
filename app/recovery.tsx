import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RecoveryScreen() {
  return (
    <SafeAreaView className="flex-1 bg-aura-cream-100">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 px-8">
        
        <TouchableOpacity onPress={() => router.back()} className="mt-8 mb-8 w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm border border-gray-100">
          <Feather name={"arrow-left" as any} size={20} color="#4B5563" />
        </TouchableOpacity>

        <Text className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Recuperar acceso</Text>
        <Text className="text-lg text-gray-500 mb-10 leading-6">
          Ingresa tu correo electrónico asociado y te enviaremos instrucciones para restablecer tu contraseña.
        </Text>

        <View className="bg-white border border-gray-100 rounded-aura px-5 py-4 flex-row items-center shadow-sm">
          <Feather name={"mail" as any} size={20} color="#9CA3AF" />
          <TextInput placeholder="tu@email.com" className="ml-4 flex-1 text-base font-medium" keyboardType="email-address" autoCapitalize="none" />
        </View>

        <TouchableOpacity className="bg-aura-blue-400 py-5 rounded-aura items-center mt-8 shadow-lg shadow-aura-blue-400/40">
          <Text className="text-white font-bold text-lg">Enviar enlace</Text>
        </TouchableOpacity>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}