import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

export default function SignupScreen({ navigation }: any) {
  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [idError, setIdError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleIdChange = (text: string) => {
    setNationalId(text);
    if (text.length > 5) {
      const validation = validateZimID(text);
      setIdError(validation.valid ? '' : validation.error as string);
    } else {
      setIdError('');
    }
  };

  const handleSignup = async () => {
    if (!fullName || !phoneNumber || !password || !emailAddress) {
      Alert.alert('Error', 'Please fill out all fields');
      return;
    }
    const validation = validateZimID(nationalId);
    if (!validation.valid) {
      setIdError(validation.error as string);
      Alert.alert('Error', 'Please provide a valid Zimbabwe National ID');
      return;
    }

    try {
      // Authenticate directly using the provided email instead of a generated dummy
      const { data, error } = await supabase.auth.signUp({
        email: emailAddress.trim(),
        password,
        options: {
          data: { phone: phoneNumber }
        }
      });

      if (error) {
        Alert.alert('Signup Error', error.message);
        return;
      }

      // Add to app_users table
      if (data.user) {
        const { error: dbError } = await supabase.from('app_users').insert([{
          id: data.user.id,
          national_id: validation.parsed,
          full_name: fullName,
          phone_number: phoneNumber,
        }]);
        
        if (dbError) {
          console.warn('Error saving user profile:', dbError);
        }
      }

      // Save to local storage for quick access
      await AsyncStorage.setItem('userFullName', fullName);
      await AsyncStorage.setItem('userNationalId', validation.parsed!);
      await AsyncStorage.setItem('userPhone', phoneNumber);
      
      navigation.replace('MainTabs');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to sign up');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#3E2723" />
          </TouchableOpacity>
          
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Zim Queue today</Text>

          <GlassCard style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#64748b"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

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
              <Text style={styles.label}>National ID</Text>
              <View style={[styles.inputWrapper, idError ? styles.inputError : null]}>
                <Ionicons name="card-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 63-123456A70"
                  placeholderTextColor="#64748b"
                  autoCapitalize="characters"
                  value={nationalId}
                  onChangeText={handleIdChange}
                />
              </View>
              {idError ? <Text style={styles.errorText}>{idError}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="077# ### ###"
                  placeholderTextColor="#64748b"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
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

            <PrimaryButton 
              title="Sign Up" 
              onPress={handleSignup} 
              style={styles.signupButton}
            />
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F0' },
  flex: { flex: 1 },
  content: { padding: 24, paddingTop: 80 }, // Avoid status bar overlap
  backButton: { marginBottom: 24, alignSelf: 'flex-start' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#3E2723', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#8D6E63', marginBottom: 32 },
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
  signupButton: { marginTop: 12, width: '100%' },
});
