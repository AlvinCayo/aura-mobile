import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

export default function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => { router.replace('/login'); }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-aura-cream-100">
      <View className="w-24 h-24 rounded-3xl bg-aura-blue-400 items-center justify-center shadow-lg mb-4">
        <Feather name={"sparkles" as any} size={48} color="white" />
      </View>
      <Text className="text-4xl font-bold text-gray-900 tracking-tight">AURA</Text>
      <Text className="text-gray-500 mt-1">Bienestar & Estética</Text>
      <StatusBar style="auto" />
    </View>
  );
}