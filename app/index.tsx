import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native'; // 1. Importa Image
import { AuraColors } from '../src/theme/colors';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/onboarding');
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        {/* 2. Reemplaza Feather por Image */}
        <Image 
          source={require('../assets/images/icon.png')} // Cambia esta ruta por la de tu imagen
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.title}>AURA</Text>
      <Text style={styles.subtitle}>Bienestar & Estética</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AuraColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: AuraColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    // Dependiendo de tu logo, puedes conservar o quitar la sombra
    shadowColor: AuraColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  logoImage: {   // 3. Agrega estilos para tu imagen
    width: 120,    // Ajusta el tamaño de tu imagen
    height: 120,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: AuraColors.textPrimary,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: AuraColors.textSecondary,
    marginTop: 6,
  },
});
