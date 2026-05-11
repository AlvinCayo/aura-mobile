import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    // Stack es el navegador de tipo "pila", ideal para celulares
    <Stack screenOptions={{ headerShown: false }}>
      {/* Declaramos nuestras pantallas principales */}
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
    </Stack>
  );
}