import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import Input from '../components/Input';
import { supabase } from '../utils/supabase';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export default function SignupScreen({ navigation }: any) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignup = async () => {
    setErrorMsg('');
    if (!fullName || !email || !password) {
      setErrorMsg('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) throw error;
      
      // Attempt to immediately log the user in to force the session
      // (This will only work if 'Confirm Email' is disabled in Supabase)
      if (!data?.session) {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });
        
        if (loginError || !loginData?.session) {
          Alert.alert('Verification Required', 'Your account was created, but Supabase requires email verification. Please turn off "Confirm Email" in your Supabase dashboard or check your email to continue.', [
            { text: 'OK', onPress: () => navigation.navigate('Login') }
          ]);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <Text style={styles.title}>Account Registration</Text>
            <Text style={styles.subtitle}>Register to access ZIM Smart Queue services</Text>
          </View>

          <GlassCard style={styles.card}>
            {errorMsg ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            <Input
              label="Full Name"
              icon="person-outline"
              placeholder="John Doe"
              value={fullName}
              onChangeText={setFullName}
            />

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
              placeholder="Create a password"
              isPassword
              value={password}
              onChangeText={setPassword}
            />

            <PrimaryButton 
              title="Sign Up" 
              onPress={handleSignup} 
              loading={loading}
              style={styles.actionButton}
            />
          </GlassCard>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginText}>Log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { marginBottom: 32, alignItems: 'center' },
  title: { ...typography.h1, marginBottom: 8, textAlign: 'center' },
  subtitle: { ...typography.subtitle, textAlign: 'center' },
  card: { width: '100%', paddingVertical: 32 },
  actionButton: { width: '100%', marginTop: 8 },
  footer: { flexDirection: 'row', marginTop: 32, justifyContent: 'center' },
  footerText: { color: colors.textSecondary, fontSize: 16 },
  loginText: { color: colors.primary, fontSize: 16, fontWeight: 'bold' },
  errorContainer: { backgroundColor: 'rgba(255, 107, 107, 0.10)', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255, 107, 107, 0.35)' },
  errorText: { ...typography.caption, color: colors.error, textAlign: 'center', fontWeight: 'bold' }
});
