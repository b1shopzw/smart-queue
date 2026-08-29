import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import { supabase } from '../utils/supabase';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export default function AcceptInviteScreen({ route, navigation }: any) {
  const token = route?.params?.token;
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<any>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const checkToken = async () => {
      try {
        const { data, error } = await supabase
          .from('org_invites')
          .select('*, org:organizations(name)')
          .eq('token', token)
          .single();

        if (error || !data) {
          Alert.alert('Invalid Invite', 'This invitation token is invalid or has expired.');
        } else {
          setInviteStatus(data);
        }
      } catch (err) {
        console.error('Error fetching invite:', err);
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, [token]);

  const handleAcceptInvite = async () => {
    try {
      setProcessing(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        Alert.alert('Login Required', 'Please log in to accept this staff invitation.');
        navigation.navigate('Login');
        return;
      }

      const { data, error } = await supabase.rpc('accept_org_invite', { p_token: token });

      if (error) throw error;

      Alert.alert('Success!', 'You have joined the organization successfully.');
      navigation.navigate('HomeMain');
    } catch (err: any) {
      console.error('Accept invite error:', err);
      Alert.alert('Failed to Join', err?.message || 'Failed to accept invitation.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Accept Staff Invitation</Text>
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : inviteStatus ? (
          <GlassCard style={styles.card}>
            <Ionicons name="mail-open" size={56} color={colors.primary} style={styles.icon} />
            <Text style={styles.title}>Invitation to Join</Text>
            <Text style={styles.orgName}>{inviteStatus.org?.name}</Text>
            <Text style={styles.desc}>
              You have been invited as <Text style={{ fontWeight: 'bold' }}>{inviteStatus.role.toUpperCase()}</Text>.
            </Text>

            <PrimaryButton
              title={processing ? 'Joining Organization...' : 'Accept & Join Organization'}
              onPress={handleAcceptInvite}
              disabled={processing}
              style={{ marginTop: 24 }}
            />
          </GlassCard>
        ) : (
          <GlassCard style={styles.card}>
            <Ionicons name="alert-circle" size={56} color="#E74C3C" style={styles.icon} />
            <Text style={styles.title}>Invalid Invitation</Text>
            <Text style={styles.desc}>
              This invitation token is invalid, expired, or has already been consumed.
            </Text>
            <PrimaryButton
              title="Return Home"
              onPress={() => navigation.navigate('HomeMain')}
              style={{ marginTop: 24 }}
            />
          </GlassCard>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingTop: 50 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.surfaceBorder, marginRight: 16 },
  headerTitle: { ...typography.h2 },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  card: { padding: 28, alignItems: 'center', borderRadius: 28 },
  icon: { marginBottom: 16 },
  title: { ...typography.h2, marginBottom: 8, textAlign: 'center' },
  orgName: { ...typography.h3, color: colors.primary, marginBottom: 12, textAlign: 'center' },
  desc: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
