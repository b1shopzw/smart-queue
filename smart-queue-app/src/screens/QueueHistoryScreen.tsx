import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import { supabase } from '../utils/supabase';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export default function QueueHistoryScreen({ navigation }: any) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let userId = user?.id;

      if (!userId) {
        const res = await supabase.from('app_users').select('id').limit(1).single();
        userId = res.data?.id;
      }

      if (userId) {
        const { data } = await supabase
          .from('queue_tickets')
          .select('*, branch:branches(bank_name, city, branch_id)')
          .eq('user_id', userId)
          .order('joined_at', { ascending: false });

        if (data) setHistory(data);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, [loadHistory]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const renderItem = useCallback(({ item }: any) => (
    <GlassCard style={styles.historyCard}>
      <View style={styles.row}>
        <Text style={styles.date}>{new Date(item.joined_at).toLocaleDateString()}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'SERVED' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
          <Text style={[styles.status, { color: item.status === 'SERVED' ? colors.success : colors.error }]}>
            {item.status}
          </Text>
        </View>
      </View>
      <Text style={styles.branch}>{item.branch?.bank_name || 'Unknown Branch'}</Text>
      <Text style={styles.service}>Ticket: {item.ticket_number}</Text>

      {(item.status === 'SERVED' || item.status === 'CANCELLED' || item.status === 'SKIPPED') && (
        <TouchableOpacity 
          style={styles.reportBtn}
          onPress={() => navigation.navigate('Feedback', { branchId: item.branch?.branch_id, branchName: item.branch?.bank_name })}
        >
          <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
          <Text style={styles.reportBtnText}>Report Issue / Send Feedback</Text>
        </TouchableOpacity>
      )}
    </GlassCard>
  ), []);

  const ListHeaderComponent = useMemo(() => (
    <TouchableOpacity style={styles.exportBtn}>
      <Ionicons name="download-outline" size={20} color={colors.primary} />
      <Text style={styles.exportText}>Export as PDF</Text>
    </TouchableOpacity>
  ), []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Queue History</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.content}
          ListHeaderComponent={ListHeaderComponent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={[colors.primary]} 
              tintColor={colors.primary} 
            />
          }
          ListEmptyComponent={<Text style={styles.emptyText}>No past queues found.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingTop: 60 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.surfaceBorder, marginRight: 16 },
  headerTitle: { ...typography.h2 },
  content: { padding: 24, paddingBottom: 100 },
  loader: { marginTop: 50 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginBottom: 20, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(212, 175, 55, 0.12)', borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.25)' },
  exportText: { color: colors.primary, marginLeft: 8, fontWeight: '600' },
  historyCard: { marginBottom: 16, padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  date: { ...typography.caption, fontWeight: '500' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  status: { fontWeight: 'bold', fontSize: 12 },
  branch: { ...typography.h3, marginBottom: 4 },
  service: { ...typography.body, color: colors.textSecondary, marginBottom: 16 },
  reportBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder, padding: 12, borderRadius: 12, justifyContent: 'center' },
  reportBtnText: { color: colors.primary, marginLeft: 8, fontWeight: '600', fontSize: 14 },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: 40, fontStyle: 'italic' },
});
