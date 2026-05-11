import { Feather } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform, SafeAreaView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Login() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 px-6 py-8"
      >
        {/* Cabecera AURA */}
        <View className="flex-row items-center gap-3 mb-10 mt-6">
          <View className="w-14 h-14 rounded-2xl bg-[#6BA3D6] items-center justify-center shadow-sm">
            <Text className="text-white text-2xl">✨</Text>
          </View>
          <View>
            <Text className="text-3xl font-bold text-gray-900 tracking-tight">AURA</Text>
            <Text className="text-sm text-gray-500">Bienestar & Estética</Text>
          </View>
        </View>

        {/* Título */}
        <View className="mb-8">
          <Text className="text-2xl font-bold text-gray-900 mb-2">Bienvenido de vuelta</Text>
          <Text className="text-base text-gray-500">Inicia sesión para continuar</Text>
        </View>

        {/* Formulario */}
        <View className="space-y-5">
          {/* Input Correo */}
          <View>
            <Text className="text-sm font-medium text-gray-900 mb-2">Correo Electrónico</Text>
            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 h-14">
              <Feather name="mail" size={20} color="#9CA3AF" />
              <TextInput 
                placeholder="tu@email.com"
                className="flex-1 ml-3 text-base text-gray-900"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Input Contraseña */}
          <View>
            <Text className="text-sm font-medium text-gray-900 mb-2 mt-4">Contraseña</Text>
            <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 h-14">
              <Feather name="lock" size={20} color="#9CA3AF" />
              <TextInput 
                placeholder="••••••••"
                secureTextEntry
                className="flex-1 ml-3 text-base text-gray-900"
              />
              <TouchableOpacity>
                <Feather name="eye-off" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Botón ¿Olvidaste tu contraseña? */}
          <TouchableOpacity className="items-end mt-2">
            <Text className="text-sm font-medium text-[#6BA3D6]">¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          {/* Botón Iniciar Sesión */}
          <TouchableOpacity className="w-full bg-[#6BA3D6] rounded-xl h-14 items-center justify-center flex-row shadow-md mt-6">
            <Text className="text-white font-bold text-lg mr-2">Iniciar Sesión</Text>
            <Feather name="arrow-right" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Registro */}
        <View className="flex-row justify-center mt-10">
          <Text className="text-gray-500 text-base">¿No tienes cuenta? </Text>
          <TouchableOpacity>
            <Text className="text-[#6BA3D6] font-bold text-base">Regístrate</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}