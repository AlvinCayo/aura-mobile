import { Stack } from 'expo-router';
import React from 'react';

export default function AdminPlatformLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="logs" />
    </Stack>
  );
}