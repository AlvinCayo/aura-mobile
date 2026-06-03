import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuraColors } from '../src/theme/colors';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'sparkles',
    title: 'Bienvenido a AURA',
    description: 'Descubre el espacio definitivo para el bienestar y la estética profesional.',
  },
  {
    icon: 'map-pin',
    title: 'Encuentra tu Centro',
    description: 'Geolocalización inteligente para encontrar los mejores servicios cerca de ti.',
  },
  {
    icon: 'cpu',
    title: 'Análisis Facial IA',
    description: 'Tecnología avanzada para recomendarte los mejores tratamientos personalizados.',
  },
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const isLastSlide = currentStep === SLIDES.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      router.replace('/login');
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {!isLastSlide && (
        <TouchableOpacity
          onPress={() => router.replace('/login')}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Omitir</Text>
        </TouchableOpacity>
      )}

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Image 
            source={require('../assets/images/icon.png')} // Pon aquí la ruta real de tu archivo
            style={{ width: 130, height: 130 }} 
            resizeMode="contain" 
          />
        </View>

        <View style={styles.dotsContainer}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentStep && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <Text style={styles.title}>{SLIDES[currentStep].title}</Text>
        <Text style={styles.description}>{SLIDES[currentStep].description}</Text>
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.9}>
        <Text style={styles.nextButtonText}>
          {isLastSlide ? 'Comenzar' : 'Siguiente'}
        </Text>
        <Feather name="arrow-right" size={20} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AuraColors.background,
    paddingHorizontal: 24,
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingVertical: 16,
  },
  skipText: {
    fontSize: 16,
    color: AuraColors.textMuted,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 65,
    backgroundColor: AuraColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
    shadowColor: AuraColors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AuraColors.border,
  },
  dotActive: {
    backgroundColor: AuraColors.primary,
    width: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: AuraColors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: AuraColors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AuraColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 32,
    gap: 8,
    shadowColor: AuraColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});