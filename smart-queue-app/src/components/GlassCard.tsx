import React from 'react';
import { View, StyleSheet, ViewProps, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../theme/colors';

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  intensity?: number;
}

export default function GlassCard({ children, style, intensity = 18, ...props }: GlassCardProps) {
  // expo-blur can sometimes aggressively block touches on Android.
  // Using a translucent fallback on Android guarantees touch reliability while keeping the glass look.
  const isAndroid = Platform.OS === 'android';

  return (
    <View style={[styles.container, isAndroid && styles.androidFallback, style]} {...props}>
      {!isAndroid && (
        <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none" />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    padding: 24,
  },
  androidFallback: {
    backgroundColor: 'rgba(30, 52, 98, 0.75)',
  },
});
