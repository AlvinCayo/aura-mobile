import { Stack } from 'expo-router';
import React from 'react';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="appointments" />
      <Stack.Screen name="appointments/[id]" />
      <Stack.Screen name="services" />
      <Stack.Screen name="add-service" />
      <Stack.Screen name="staff" />
      <Stack.Screen name="locations" />
      <Stack.Screen name="calendar" />
      <Stack.Screen name="center-profile" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="client-analysis" />
      <Stack.Screen name="qr-generator" />
      <Stack.Screen name="clients" />
      <Stack.Screen name="clients/[id]" />
      <Stack.Screen name="promotions" />
      <Stack.Screen name="inventory" />
      <Stack.Screen name="reports" />
    </Stack>
  );
}