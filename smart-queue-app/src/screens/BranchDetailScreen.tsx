import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import { supabase } from '../utils/supabase';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export default function BranchDetailScreen({ route, navigation }: any) {
  const bankName = route.params?.bankName || 'Branch Details';
  const branchId = route.params?.branchId;
  const [isJoining, setIsJoining] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Dynamic Trend Data State
  const [trendData, setTrendData] = useState([
    { label: '08:00', height: 10, isCurrent: false },
    { label: '10:00', height: 10, isCurrent: false },
    { label: '12:00', height: 10, isCurrent: false },
    { label: '14:00', height: 10, isCurrent: false },
    { label: '15:00', height: 10, isCurrent: false },
  ]);

  const loadData = useCallback(async () => {
    const now = new Date();
    const currentHour = now.getHours();
    const timeInMinutes = currentHour * 60 + now.getMinutes();
    setIsOpen(timeInMinutes >= 8 * 60 && timeInMinutes < 15 * 60);

    if (!branchId) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    try {
      const { data } = await supabase
        .from('queue_tickets')
        .select('joined_at')
        .eq('branch_id', branchId)
        .gte('joined_at', today.toISOString());
      const buckets = [0, 0, 0, 0, 0];
      if (data && data.length > 0) {
        data.forEach(ticket => {
          const date = new Date(ticket.joined_at);
          const h = date.getHours();
          if (h >= 8 && h < 10) buckets[0]++;
          else if (h >= 10 && h < 12) buckets[1]++;
          else if (h >= 12 && h < 14) buckets[2]++;
          else if (h >= 14 && h < 15) buckets[3]++;
          else if (h >= 15) buckets[4]++;
        });
      }
      const maxVal = Math.max(...buckets, 5);
      const ch = new Date().getHours();
      setTrendData([
        { label: '08:00', height: Math.max((buckets[0] / maxVal) * 100, 10), isCurrent: ch >= 8 && ch < 10 },
        { label: '10:00', height: Math.max((buckets[1] / maxVal) * 100, 10), isCurrent: ch >= 10 && ch < 12 },
        { label: '12:00', height: Math.max((buckets[2] / maxVal) * 100, 10), isCurrent: ch >= 12 && ch < 14 },
        { label: '14:00', height: Math.max((buckets[3] / maxVal) * 100, 10), isCurrent: ch >= 14 && ch < 15 },
        { label: '15:00', height: Math.max((buckets[4] / maxVal) * 100, 10), isCurrent: ch >= 15 },
      ]);
    } catch (err) {
      console.error('Trend fetch error:', err);
    }
  }, [branchId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      const now = new Date();
      const t = now.getHours() * 60 + now.getMinutes();
      setIsOpen(t >= 8 * 60 && t < 15 * 60);
    }, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Extract a clean domain prefix from the institution name
  const domainPrefix = bankName.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'institution';

  const handleJoinQueue = async () => {
    console.log('BranchDetailScreen: Join Queue button pressed', { bankName, branchId });
    if (!branchId) {
      Alert.alert('Error', 'Unable to join queue for this branch.');
      return;
    }
    
    // Navigate to the new time slot selection screen instead of joining immediately
    console.log('Navigating to SelectSlot...');
    navigation.navigate('SelectSlot', { bankName, branchId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Branch Details</Text>
      </View>
      
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={styles.bankName}>{bankName}</Text>
        
        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="call-outline" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Phone number</Text>
              <Text style={styles.infoValue}>+263 8677 000 000</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="mail-outline" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Email address</Text>
              <Text style={styles.infoValue}>hello@{domainPrefix}.co.zw</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="headset-outline" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Support contact</Text>
              <Text style={styles.infoValue}>support.{domainPrefix}.co.zw</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Operating hours</Text>
              <Text style={styles.infoValue}>08:00 - 15:00</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <View style={styles.iconCircle}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: isOpen ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                <View style={[styles.statusDot, { backgroundColor: isOpen ? colors.success : colors.error }]} />
                <Text style={[styles.statusText, { color: isOpen ? colors.success : colors.error }]}>
                  {isOpen ? 'Active (Open)' : 'Closed'}
                </Text>
              </View>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Queue Trend (Today)</Text>
          <View style={styles.chartContainer}>
            {trendData.map((item) => (
              <View key={item.label} style={styles.chartColumn}>
                <View style={[
                  styles.chartBar, 
                  { 
                    height: `${item.height}%`, 
                    backgroundColor: item.isCurrent ? colors.error : colors.primary,
                    opacity: item.isCurrent ? 1 : 0.5
                  }
                ]} />
                <Text style={[styles.chartLabel, item.isCurrent && { color: colors.error, fontWeight: 'bold' }]}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </GlassCard>

        <PrimaryButton 
          title={isJoining ? 'Processing...' : `Join Queue`} 
          onPress={handleJoinQueue} 
          loading={isJoining}
          style={styles.joinButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.surfaceBorder, marginRight: 16
  },
  headerTitle: {
    ...typography.h2,
  },
  content: {
    padding: 24,
    paddingTop: 8,
    paddingBottom: 40,
  },
  bankName: {
    ...typography.h2,
    marginBottom: 24,
  },
  card: {
    marginBottom: 24,
    padding: 20,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: 16,
  },
  servicesContainer: {
    gap: 12,
  },
  serviceOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  serviceOptionActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(212, 163, 115, 0.1)',
  },
  serviceText: {
    ...typography.body,
    fontWeight: '500',
  },
  serviceTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginTop: 16,
    paddingBottom: 8,
  },
  chartColumn: {
    alignItems: 'center',
    width: '15%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '100%',
    borderRadius: 6,
    marginBottom: 8,
  },
  chartLabel: {
    ...typography.caption,
  },
  joinButton: {
    marginTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    ...typography.body,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
});
