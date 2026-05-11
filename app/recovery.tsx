import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RecoveryScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      <TouchableOpacity onPress={() => router.back()} className="mt-6 mb-8">
        <Feather name={"chevron-left" as any} size={32} color="black" />
      </TouchableOpacity>

      <Text className="text-3xl font-bold text-gray-900 mb-2">Recuperar</Text>
      <Text className="text-gray-500 mb-10">Te enviaremos un código para restablecer tu acceso.</Text>

      <View className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 flex-row items-center">
        <Feather name={"mail" as any} size={20} color="#9CA3AF" />
        <TextInput placeholder="Correo electrónico" className="ml-3 flex-1 text-base" keyboardType="email-address" />
      </View>

      <TouchableOpacity className="bg-aura-blue-400 py-4 rounded-2xl items-center mt-8">
        <Text className="text-white font-bold text-lg">Enviar enlace</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}