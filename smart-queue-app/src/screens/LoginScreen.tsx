import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import Input from '../components/Input';
import { supabase } from '../utils/supabase';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting login to:', process.env.EXPO_PUBLIC_SUPABASE_URL);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error('Login error details:', error);
        throw error;
      }
      
      console.log('Login successful:', data.user?.email);
    } catch (err: any) {
      console.error('Caught error:', err);
      setErrorMsg(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.content}>
          <Image 
            source={require('../../assets/home-banner.png')} 
            style={styles.bannerImage} 
            resizeMode="contain" 
          />
          
          <Text style={styles.title}>Secure Sign In</Text>
          <Text style={styles.subtitle}>Please authenticate to access your service portal</Text>

          <GlassCard style={styles.card}>
            {errorMsg ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            <Input
              label="Email Address"
              icon="mail-outline"
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Input
              label="Password"
              icon="lock-closed-outline"
              placeholder="Enter your password"
              isPassword
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <PrimaryButton 
              title="Log In" 
              onPress={handleLogin} 
              loading={loading}
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
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  bannerImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  title: { ...typography.h1, marginBottom: 8 },
  subtitle: { ...typography.subtitle, marginBottom: 40, textAlign: 'center' },
  card: { width: '100%' },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  loginButton: { width: '100%' },
  footer: { flexDirection: 'row', marginTop: 32 },
  footerText: { color: colors.textSecondary, fontSize: 16 },
  signupText: { color: colors.primary, fontSize: 16, fontWeight: 'bold' },
  errorContainer: { backgroundColor: 'rgba(255, 107, 107, 0.1)', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255, 107, 107, 0.35)' },
  errorText: { ...typography.caption, color: colors.error, textAlign: 'center', fontWeight: 'bold' }
});
