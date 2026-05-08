import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function GlassCard({ children, style }: CardProps) {
  const isDark = false; // Switched to Light Coffee

  return (
    <BlurView 
      intensity={70} 
      tint="light" 
      experimentalBlurMethod="dimezisBlurView"
      style={[
        styles.container, 
        { 
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          borderColor: 'rgba(255, 255, 255, 0.4)',
          shadowColor: 'rgba(62, 39, 35, 0.15)'
        },
        style
      ]}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden', // Required for blur bounds restriction on iOS/Android
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
  },
});
