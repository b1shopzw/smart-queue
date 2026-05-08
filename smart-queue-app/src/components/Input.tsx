import React, { useState, useRef } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface InputProps extends TextInputProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  error?: string;
  isPassword?: boolean;
}

export default function Input({ label, icon, error, isPassword, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handlePress = () => {
    inputRef.current?.focus();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable 
        onPress={handlePress}
        style={[
          styles.inputWrapper,
          isFocused && styles.inputFocused,
          error ? styles.inputError : null
        ]}
      >
        <Ionicons name={icon} size={20} color={isFocused ? colors.primary : colors.textSecondary} style={styles.icon} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholderTextColor="rgba(245, 240, 232, 0.5)"
          selectionColor={colors.primary}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCorrect={false}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </Pressable>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)', // Deep inset feel
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)', // Very subtle resting border
    paddingHorizontal: 16,
    height: 56, // Explicit height guarantees touch bounds on Android
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  inputError: {
    borderColor: colors.error,
  },
  icon: {
    marginRight: 12,
  },
  eyeIcon: {
    paddingLeft: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 4,
    fontSize: 16,
    color: colors.textPrimary,
    textAlignVertical: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
});
