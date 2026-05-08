import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import { supabase } from '../utils/supabase';

function validateZimID(id: string) {
  if (!id || typeof id !== 'string') {
    return { valid: false, error: 'ID is required' };
  }
  const normalized = id.trim().toUpperCase();
  const match = normalized.match(/^(\d{2})-(\d{6,7})\s*([A-Z])\s*(\d{2})$/);
  if (!match) {
    return { valid: false, error: 'Expected format: XX-XXXXXXX A YY' };
  }
  const [, districtCode, , , year] = match;
  const district = parseInt(districtCode);
  if (district < 1 || district > 99) {
    return { valid: false, error: 'Invalid district code' };
  }
  const yearNum = parseInt(year);
  const currentYear = new Date().getFullYear() % 100;
  if (yearNum > currentYear && yearNum < 60) {
    return { valid: false, error: 'Invalid registration year' };
  }
  return { valid: true, parsed: normalized };
}

export default function LoginScreen({ navigation }: any) {
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!emailAddress) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailAddress.trim(),
        password,
      });

      if (error) {
        Alert.alert('Login Failed', error.message);
        return;
      }

      // Proceed to app
      navigation.replace('MainTabs');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to log in');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Image source={require('../../assets/login.png')} style={styles.logoImage} resizeMode="contain" />
          </View>
          <Text style={styles.title}>Zim Queue</Text>
          <Text style={styles.subtitle}>Log in to manage your queue</Text>

          <GlassCard style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor="#64748b"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={emailAddress}
                  onChangeText={setEmailAddress}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="password"
                  placeholderTextColor="#64748b"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <PrimaryButton 
              title="Log In" 
              onPress={handleLogin} 
              style={styles.loginButton}
            />
          </GlassCard>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signupText}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F0' },
  flex: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  iconContainer: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(212, 163, 115, 0.15)', alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, borderWidth: 1, borderColor: 'rgba(212, 163, 115, 0.4)'
  },
  logoImage: { width: 65, height: 65, tintColor: '#D4A373' }, // Apply tint if it's a solid icon
  title: { fontSize: 32, fontWeight: 'bold', color: '#3E2723', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#8D6E63', marginBottom: 40, textAlign: 'center' },
  card: { width: '100%', padding: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, color: '#4A3B32', marginBottom: 8, fontWeight: '500' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12, borderWidth: 2, borderColor: 'rgba(255, 255, 255, 1)',
  },
  inputError: { borderColor: '#ef4444' },
  inputIcon: { paddingLeft: 16 },
  eyeIcon: { paddingRight: 16 },
  input: { flex: 1, padding: 16, color: '#3E2723', fontSize: 16 },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 4, marginLeft: 4 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { color: '#D4A373', fontSize: 14, fontWeight: '600' },
  loginButton: { width: '100%' },
  footer: { flexDirection: 'row', marginTop: 32 },
  footerText: { color: '#8D6E63', fontSize: 16 },
  signupText: { color: '#D4A373', fontSize: 16, fontWeight: 'bold' }
});
