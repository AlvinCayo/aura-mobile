import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
} from 'react-native';
import { AuraColors } from '../../theme/colors';

interface InputProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof Feather.glyphMap;   // nombre del ícono de Feather
  error?: string;
  isPassword?: boolean;
}

export default function Input({
  label,
  icon,
  error,
  isPassword = false,
  ...rest
}: InputProps) {
  const [secure, setSecure] = useState(isPassword);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.wrapper, error && styles.wrapperError]}>
        {icon && (
          <Feather
            name={icon}
            size={18}
            color={error ? AuraColors.destructive : AuraColors.textMuted}
            style={styles.icon}
          />
        )}
        <TextInput
          style={styles.input}
          placeholderTextColor={AuraColors.textMuted}
          secureTextEntry={secure}
          {...rest}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setSecure(!secure)}
            style={styles.eye}
          >
            <Feather
              name={secure ? 'eye-off' : 'eye'}
              size={18}
              color={AuraColors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: AuraColors.textPrimary,
    marginBottom: 6,
    marginLeft: 4,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AuraColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AuraColors.inputBorder,
    paddingHorizontal: 14,
  },
  wrapperError: {
    borderColor: AuraColors.destructive,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: AuraColors.textPrimary,
  },
  eye: {
    padding: 4,
  },
  error: {
    fontSize: 12,
    color: AuraColors.destructive,
    marginTop: 4,
    marginLeft: 4,
  },
});