import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import { supabase } from '../utils/supabase';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export default function OrgSignupScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'bank' | 'id_office' | 'passport_office' | 'other'>('bank');
  const [regNum, setRegNum] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [signerRole, setSignerRole] = useState('Chief Executive / Representative');
  
  const [submitting, setSubmitting] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<any>(null);

  const orgTypes = [
    { label: 'Bank / Financial', value: 'bank', icon: 'business' },
    { label: 'National ID Office', value: 'id_office', icon: 'card' },
    { label: 'Passport Office', value: 'passport_office', icon: 'document-text' },
    { label: 'Other Public Org', value: 'other', icon: 'layers' },
  ];

  const handleOrgSignup = async () => {
    if (!name || !regNum || !email || !phone) {
      Alert.alert('Missing Fields', 'Please complete all required fields.');
      return;
    }

    try {
      setSubmitting(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        Alert.alert('Authentication Required', 'Please log in to submit an organization registration application.');
        navigation.navigate('Login');
        return;
      }

      // Execute transactional RPC
      const { data, error } = await supabase.rpc('create_organization_with_owner', {
        p_name: name,
        p_type: type,
        p_reg_num: regNum,
        p_contact_email: email,
        p_contact_phone: phone,
      });

      if (error) throw error;

      setSubmittedStatus(data);
      Alert.alert(
        'Application Submitted!',
        'Your organization application has been submitted and is currently under review by platform super admins.'
      );
    } catch (err: any) {
      console.error('Org signup error:', err);
      Alert.alert('Registration Failed', err?.message || 'An error occurred during organization signup.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register Organization</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {submittedStatus ? (
          <GlassCard style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={64} color={colors.primary} style={styles.successIcon} />
            <Text style={styles.successTitle}>Application Under Review</Text>
            <Text style={styles.successDesc}>
              Thank you for registering <Text style={{ fontWeight: 'bold' }}>{name}</Text>. Our platform super admins are verifying your registration number ({regNum}).
            </Text>
            <Text style={styles.statusBadge}>STATUS: PENDING</Text>
            <PrimaryButton 
              title="Return to Home" 
              onPress={() => navigation.navigate('HomeMain')} 
              style={{ marginTop: 24 }}
            />
          </GlassCard>
        ) : (
          <GlassCard style={styles.card}>
            <Text style={styles.sectionTitle}>Organization Details</Text>

            <Text style={styles.label}>Legal Organization Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. CBZ Bank Zimbabwe"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Organization Type *</Text>
            <View style={styles.typeSelector}>
              {orgTypes.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  onPress={() => setType(t.value as any)}
                  style={[styles.typeChip, type === t.value && styles.typeChipActive]}
                >
                  <Ionicons 
                    name={t.icon as any} 
                    size={18} 
                    color={type === t.value ? '#FFF' : colors.textPrimary} 
                  />
                  <Text style={[styles.typeChipText, type === t.value && styles.typeChipTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Official Registration Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. REG-2026-9988-ZW"
              placeholderTextColor={colors.textSecondary}
              value={regNum}
              onChangeText={setRegNum}
            />

            <Text style={styles.label}>Official Contact Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="contact@organisation.co.zw"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>Contact Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="+263 77 123 4567"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <Text style={styles.label}>Signer / Applicant Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Head of Operations"
              placeholderTextColor={colors.textSecondary}
              value={signerRole}
              onChangeText={setSignerRole}
            />

            <PrimaryButton
              title={submitting ? 'Submitting Application...' : 'Submit Application'}
              onPress={handleOrgSignup}
              disabled={submitting}
              style={{ marginTop: 20 }}
            />
          </GlassCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingTop: 50, paddingBottom: 16 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.surfaceBorder, marginRight: 16 },
  headerTitle: { ...typography.h2 },
  scroll: { padding: 24, paddingBottom: 40 },
  card: { padding: 24, borderRadius: 24 },
  sectionTitle: { ...typography.h3, marginBottom: 20 },
  label: { ...typography.body, color: colors.textSecondary, marginBottom: 8, marginTop: 12, fontWeight: '600' },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontSize: 15,
  },
  typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 6 },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeChipText: { ...typography.caption, marginLeft: 6, color: colors.textPrimary, fontWeight: '600' },
  typeChipTextActive: { color: '#FFFFFF', fontWeight: '700' },

  successCard: { padding: 32, alignItems: 'center', borderRadius: 28 },
  successIcon: { marginBottom: 16 },
  successTitle: { ...typography.h2, marginBottom: 12, textAlign: 'center' },
  successDesc: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  statusBadge: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(230, 126, 34, 0.15)',
    color: '#E67E22',
    fontWeight: '800',
    fontSize: 13,
  },
});
