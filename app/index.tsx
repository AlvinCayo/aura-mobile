import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useAuthStore } from '../src/store/authStore';

export default function SplashScreen() {
  const hasSeenOnboarding = useAuthStore((state) => state.hasSeenOnboarding);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasSeenOnboarding) {
        router.replace('/onboarding' as any);
      } else {
        router.replace('/login');
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [hasSeenOnboarding]);

  return (
    <View className="flex-1 items-center justify-center bg-aura-cream-100">
      <View className="w-20 h-20 bg-aura-blue-400 rounded-3xl items-center justify-center shadow-2xl">
        <Feather name={"sparkles" as any} size={40} color="white" />
      </View>
      <Text className="mt-4 text-3xl font-bold tracking-tighter italic text-aura-blue-400">AURA</Text>
    </View>
  );
}