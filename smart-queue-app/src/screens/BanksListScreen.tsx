import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import { supabase } from '../utils/supabase';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const SkeletonBankCard = () => (
  <MotiView
    from={{ opacity: 0.4 }}
    animate={{ opacity: 0.8 }}
    transition={{ loop: true, type: 'timing', duration: 1000 }}
    style={[styles.card, { backgroundColor: colors.surface }]}
  >
    <View style={styles.skeletonTitle} />
    <View style={styles.statsContainer}>
      <View style={styles.skeletonStat} />
      <View style={styles.skeletonStat} />
    </View>
    <View style={styles.skeletonButton} />
  </MotiView>
);

export default function BanksListScreen({ route, navigation }: any) {
  const userLocation = route.params?.userLocation;
  const serviceType = route.params?.serviceType || 'Banks'; 

  const screenTitle = serviceType === 'Banks' ? 'Available Banks' : 
                      serviceType === 'Passport Offices' ? 'Passport Offices' : 
                      'National ID Centers';

  const [isLoading, setIsLoading] = useState(false);
  const [liveBanks, setLiveBanks] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const filters = ['All', 'Low Wait', 'Open Now', 'Nearby'];

  const fallbackBanks = serviceType === 'Banks' ? [
    { id: '1', name: 'CBZ Bank - Harare Main', lat: -17.8248, lon: 31.0530 },
    { id: '2', name: 'Stanbic Bank - Avondale', lat: -17.7950, lon: 31.0350 },
    { id: '3', name: 'Steward Bank - Bulawayo', lat: -20.1500, lon: 28.5833 },
    { id: '4', name: 'FBC Bank - Mutare', lat: -18.9700, lon: 32.6600 },
    { id: '5', name: 'Ecobank - Gweru', lat: -19.4500, lon: 29.8167 },
  ] : serviceType === 'Passport Offices' ? [
    { id: '101', name: 'Makombe Building - Passport (Harare)', lat: -17.8290, lon: 31.0500 },
    { id: '102', name: 'Bulawayo Passport HQ', lat: -20.1550, lon: 28.5850 },
    { id: '103', name: 'Mutare Passport Office', lat: -18.9720, lon: 32.6630 },
  ] : [
    { id: '201', name: 'Market Square - ID Center (Harare)', lat: -17.8320, lon: 31.0450 },
    { id: '202', name: 'Bulawayo Civil Registry (ID)', lat: -20.1520, lon: 28.5800 },
    { id: '203', name: 'Mutare Civil Registry (ID)', lat: -18.9700, lon: 32.6600 },
  ];

  useEffect(() => {
    async function fetchLiveServices() {
      // Only show loading indicator if list is empty (prevents flashing during realtime updates)
      setLiveBanks(prev => {
        if (prev.length === 0) setIsLoading(true);
        return prev;
      });
      
      try {
        const mappedServiceType = serviceType === 'Banks' ? 'bank' : 
                                  serviceType === 'Passport Offices' ? 'passport' : 
                                  'national_id';

        const { data: dbBranches, error } = await supabase
          .from('branches')
          .select('*')
          .eq('institution_type', mappedServiceType)
          .eq('active', true);

        if (error) throw error;

        let fetchedItems: any[] = [];
        if (dbBranches && dbBranches.length > 0) {
          
          // Fetch real ticket counts for these branches
          const branchIds = dbBranches.map((b: any) => b.branch_id);
          const { data: ticketsData } = await supabase
            .from('queue_tickets')
            .select('branch_id')
            .in('status', ['WAITING', 'PROCESSING', 'PAUSED'])
            .in('branch_id', branchIds);
            
          const queueCounts: Record<string, number> = {};
          if (ticketsData) {
            ticketsData.forEach(t => {
              queueCounts[t.branch_id] = (queueCounts[t.branch_id] || 0) + 1;
            });
          }

          fetchedItems = dbBranches.map((b: any) => {
            const qLen = queueCounts[b.branch_id] || 0;
            return {
              id: b.branch_id,
              name: `${b.bank_name} — ${b.city} (${b.suburb}, Branch ${b.branch_num})`,
              lat: b.lat,
              lon: b.lng,
              queueLength: qLen,
              waitTime: qLen * 5 // Rough estimate: 5 mins per active ticket
            };
          });
        }

        if (fetchedItems.length === 0) {
          fetchedItems = fallbackBanks.map((b:any) => ({
            ...b, queueLength: 0, waitTime: 0
          }));
        }

        fetchedItems.sort((a, b) => a.name.localeCompare(b.name));
        setLiveBanks(fetchedItems);

      } catch(e) {
        const handledFallback = fallbackBanks.map((b:any) => ({
          ...b, queueLength: 0, waitTime: 0
        }));
        setLiveBanks(handledFallback);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchLiveServices();

    // Subscribe to realtime changes so the counts update instantly
    const channel = supabase
      .channel('banks_list_queue_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queue_tickets' },
        () => {
          // Re-calculate when anyone joins or leaves a queue
          fetchLiveServices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userLocation, serviceType]);

  const filteredBanks = useMemo(() => {
    let result = [...liveBanks];
    if (activeFilter === 'Low Wait') {
      result = result.filter(b => b.waitTime < 30);
    }
    return result;
  }, [liveBanks, activeFilter]);

  const renderBankItem = useCallback(({ item }: any) => (
    <GlassCard style={styles.card}>
      <Text style={styles.bankName}>{item.name}</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Ionicons name="people" size={20} color={colors.primary} />
          <Text style={styles.statText}>{item.queueLength} in queue</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="time" size={20} color={colors.primary} />
          <Text style={styles.statText}>~{item.waitTime} mins</Text>
        </View>
      </View>
      
      <PrimaryButton 
        title="View Details" 
        onPress={() => navigation.navigate('BranchDetail', { bankName: item.name, branchId: item.id, serviceType: serviceType })} 
        style={styles.joinButton}
      />
    </GlassCard>
  ), [navigation, serviceType]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{screenTitle}</Text>
      </View>
      
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map(f => (
            <TouchableOpacity 
              key={f} 
              onPress={() => setActiveFilter(f)}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {isLoading ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          <SkeletonBankCard />
          <SkeletonBankCard />
          <SkeletonBankCard />
          <SkeletonBankCard />
        </ScrollView>
      ) : (
        <FlatList
          contentContainerStyle={styles.scroll}
          data={filteredBanks}
          keyExtractor={(item) => item.id}
          renderItem={renderBankItem}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          ListEmptyComponent={
            <Text style={styles.noResultsText}>No centers are currently open.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingTop: 60, paddingBottom: 16 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.surfaceBorder, marginRight: 16 },
  headerTitle: { ...typography.h2 },
  filterContainer: { marginBottom: 16 },
  filterScroll: { paddingHorizontal: 24, gap: 12 },
  filterChip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { ...typography.body, fontWeight: '600' },
  filterTextActive: { color: '#FFFFFF', fontWeight: 'bold' },
  scroll: { padding: 24, paddingTop: 8, paddingBottom: 40 },
  card: { padding: 20, marginBottom: 16, borderRadius: 24 },
  bankName: { ...typography.h3, marginBottom: 16 },
  statsContainer: { flexDirection: 'row', marginBottom: 20, gap: 16 },
  stat: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(212, 175, 55, 0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statText: { ...typography.body, color: colors.textPrimary, marginLeft: 6, fontWeight: '600' },
  joinButton: { marginTop: 8 },
  noResultsText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: 40 },
  
  // Skeleton Styles
  skeletonTitle: { width: '70%', height: 24, backgroundColor: colors.surfaceBorder, borderRadius: 12, marginBottom: 16 },
  skeletonStat: { width: 90, height: 32, backgroundColor: colors.surfaceBorder, borderRadius: 12 },
  skeletonButton: { width: '100%', height: 48, backgroundColor: colors.surfaceBorder, borderRadius: 24, marginTop: 8 },
});
