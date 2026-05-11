import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="register-center" />
        <Stack.Screen name="recovery" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="center/[id]" />
        <Stack.Screen name="booking/[centerId]" />
      </Stack>
    </>
  );
}