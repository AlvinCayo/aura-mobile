import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SimpleBarChart from '../../src/components/ui/SimpleBarChart';
import { AuraColors } from '../../src/theme/colors';

const CLIENT_RETENTION = [
  { label: 'Ene', value: 80 },
  { label: 'Feb', value: 75 },
  { label: 'Mar', value: 82 },
];

const TOP_SERVICES = [
  { label: 'Masaje', value: 55 },
  { label: 'Facial', value: 40 },
  { label: 'Peeling', value: 30 },
];

export default function ClientAnalysisViewerScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Análisis de clientes</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Retención de clientes (%)</Text>
          <SimpleBarChart data={CLIENT_RETENTION} height={120} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Servicios más demandados</Text>
          <SimpleBarChart data={TOP_SERVICES} height={120} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  content: { padding: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 24 },
  section: { backgroundColor: AuraColors.card, borderRadius: 14, padding: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
});