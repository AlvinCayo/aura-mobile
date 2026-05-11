import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../src/store/authStore';

const slides = [
  { title: "Bienvenido a AURA", desc: "Tu espacio personal para el bienestar y la estética profesional.", icon: "sparkles" },
  { title: "Encuentra tu Centro", desc: "Geolocalización inteligente para encontrar los mejores servicios cerca de ti.", icon: "map-pin" },
  { title: "Análisis Facial IA", desc: "Tecnología avanzada para recomendarte los mejores tratamientos.", icon: "cpu" }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);

  const next = () => {
    if (currentStep < slides.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
      router.replace('/login' as any);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-aura-cream-100 px-8 justify-between py-12">
      <View className="items-center mt-20">
        <View className="w-24 h-24 rounded-full bg-aura-blue-400 items-center justify-center shadow-xl shadow-aura-blue-400/40">
          <Feather name={slides[currentStep].icon as any} size={40} color="white" />
        </View>
        <Text className="text-3xl font-bold text-gray-900 mt-10 text-center tracking-tight">
          {slides[currentStep].title}
        </Text>
        <Text className="text-lg text-gray-500 mt-4 text-center leading-6">
          {slides[currentStep].desc}
        </Text>
      </View>

      <View className="mb-10">
        <TouchableOpacity 
          onPress={next}
          className="bg-aura-blue-400 py-5 rounded-2xl items-center shadow-lg"
        >
          <Text className="text-white font-bold text-lg">
            {currentStep === slides.length - 1 ? "Comenzar" : "Siguiente"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}