import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

export default function Index() {
  
  // Este hook ejecuta código apenas la pantalla aparece
  useEffect(() => {
    // Simulamos una carga de 3 segundos y redirigimos al Login
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-[#FDF8F3]">
      <View className="w-24 h-24 rounded-3xl bg-[#6BA3D6] items-center justify-center shadow-lg mb-4">
        <Text className="text-white text-4xl font-bold">✨</Text>
      </View>
      
      <Text className="text-4xl font-bold text-gray-900 tracking-tight">AURA</Text>
      <Text className="text-gray-500 mt-1 text-lg">Bienestar & Estética</Text>
      
      <StatusBar style="auto" />
    </View>
  );
}