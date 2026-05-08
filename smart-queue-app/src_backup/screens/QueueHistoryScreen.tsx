import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import { supabase } from '../utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function QueueHistoryScreen({ navigation }: any) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
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
      setLoading(false);
    }
    loadHistory();
  }, []);

  const renderItem = useCallback(({ item }: any) => (
    <GlassCard style={styles.historyCard}>
      <View style={styles.row}>
        <Text style={styles.date}>{new Date(item.joined_at).toLocaleDateString()}</Text>
        <Text style={[styles.status, { color: item.status === 'SERVED' ? '#10b981' : '#ef4444' }]}>
          {item.status}
        </Text>
      </View>
      <Text style={styles.branch}>{item.branch?.bank_name || 'Unknown Branch'}</Text>
      <Text style={styles.service}>Ticket: {item.ticket_number}</Text>

      {(item.status === 'SERVED' || item.status === 'CANCELLED' || item.status === 'SKIPPED') && (
        <TouchableOpacity 
          style={styles.reportBtn}
          onPress={() => navigation.navigate('Feedback', { branchId: item.branch?.branch_id, branchName: item.branch?.bank_name })}
        >
          <Ionicons name="chatbubble-outline" size={16} color="#D4A373" />
          <Text style={styles.reportBtnText}>Report Issue / Send Feedback</Text>
        </TouchableOpacity>
      )}
    </GlassCard>
  ), []);

  const ListHeaderComponent = useMemo(() => (
    <TouchableOpacity style={styles.exportBtn}>
      <Ionicons name="download-outline" size={20} color="#D4A373" />
      <Text style={styles.exportText}>Export as PDF</Text>
    </TouchableOpacity>
  ), []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#3E2723" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Queue History</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#D4A373" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.content}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={<Text style={{color:'#94a3b8', textAlign:'center', marginTop: 40}}>No past queues found.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F0' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingTop: 48 },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#3E2723' },
  content: { padding: 24 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginBottom: 20, padding: 8, borderRadius: 8, backgroundColor: 'rgba(212, 163, 115, 0.15)' },
  exportText: { color: '#D4A373', marginLeft: 8, fontWeight: '600' },
  historyCard: { marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  date: { color: '#8D6E63', fontSize: 14 },
  status: { fontWeight: 'bold', fontSize: 14 },
  branch: { fontSize: 18, color: '#3E2723', fontWeight: 'bold', marginBottom: 4 },
  service: { color: '#8D6E63', fontSize: 14, marginBottom: 16 },
  reportBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EFEBE9', padding: 10, borderRadius: 8, justifyContent: 'center' },
  reportBtnText: { color: '#D4A373', marginLeft: 8, fontWeight: '600', fontSize: 14 }
});
