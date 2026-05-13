import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CenterCard from '../../src/components/ui/CenterCard';
import SearchBar from '../../src/components/ui/SearchBar';
import { searchCenters } from '../../src/lib/data';
import { AuraColors } from '../../src/theme/colors';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length > 1) {
      setIsSearching(true);
      const { data } = await searchCenters(text);
      setResults(data || []);
    } else {
      setIsSearching(false);
      setResults([]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBarWrapper}>
          <SearchBar
            value={query}
            onChangeText={handleSearch}
            placeholder="Buscar centros..."
            autoFocus
          />
        </View>
      </View>

      {/* Resultados */}
      {isSearching && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsList}
          renderItem={({ item }) => (
            <CenterCard
              name={item.name}
              category={item.category}
              rating={item.rating || 0}
              reviews={item.reviews_count || 0}
              distance={item.address}
              onPress={() => router.push(`/center/${item.id}` as any)}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="search" size={40} color={AuraColors.textMuted} />
              <Text style={styles.emptyText}>No se encontraron centros</Text>
            </View>
          }
        />
      )}
      {!isSearching && (
        <View style={styles.idleContainer}>
          <Feather name="search" size={48} color={AuraColors.textMuted} />
          <Text style={styles.idleText}>Busca centros por nombre o dirección</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background },
  header: { padding: 24, paddingBottom: 16 },
  searchBarWrapper: { flex: 1 },
  resultsList: { paddingHorizontal: 24, paddingBottom: 32 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: AuraColors.textMuted, marginTop: 12 },
  idleContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  idleText: { fontSize: 16, color: AuraColors.textMuted, marginTop: 12 },
});