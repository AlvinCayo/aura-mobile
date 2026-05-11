import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { AuraColors } from '../../theme/colors';

interface SearchBarProps extends TextInputProps {
  onFilterPress?: () => void;
  showFilter?: boolean;
}

export default function SearchBar({ onFilterPress, showFilter = true, ...rest }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <Feather name="search" size={18} color={AuraColors.textMuted} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Buscar centros o tratamientos..."
          placeholderTextColor={AuraColors.textMuted}
          {...rest}
        />
      </View>
      {showFilter && onFilterPress && (
        <TouchableOpacity style={styles.filterButton} onPress={onFilterPress} activeOpacity={0.7}>
          <Feather name="sliders" size={18} color={AuraColors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AuraColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AuraColors.inputBorder,
    paddingHorizontal: 14,
    height: 48,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: AuraColors.textPrimary,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: AuraColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
});