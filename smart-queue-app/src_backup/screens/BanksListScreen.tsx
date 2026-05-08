import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import { supabase } from '../utils/supabase';

// Geospatial distance calculation removed
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
    { id: '101', name: 'Makombe Building - Passport Office (Harare)', lat: -17.8290, lon: 31.0500 },
    { id: '102', name: 'Bulawayo Passport Office HQ', lat: -20.1550, lon: 28.5850 },
    { id: '103', name: 'Mutare Passport Office', lat: -18.9720, lon: 32.6630 },
    { id: '104', name: 'Gweru Provincial Passport HQ', lat: -19.4500, lon: 29.8167 },
  ] : [
    // National ID Centers
    { id: '201', name: 'Market Square - National ID Center (Harare)', lat: -17.8320, lon: 31.0450 },
    { id: '202', name: 'Bulawayo Civil Registry (ID)', lat: -20.1520, lon: 28.5800 },
    { id: '203', name: 'Mutare Civil Registry (ID)', lat: -18.9700, lon: 32.6600 },
    { id: '204', name: 'Gweru Provincial ID Center', lat: -19.4520, lon: 29.8180 },
  ];

  useEffect(() => {
    async function fetchLiveServices() {
      setIsLoading(true);
      try {
        const mappedServiceType = serviceType === 'Banks' ? 'Bank' : 
                                  serviceType === 'Passport Offices' ? 'Passport' : 
                                  'National ID';

        const { data: dbBranches, error } = await supabase
          .from('branches')
          .select('*')
          .eq('institution_type', mappedServiceType)
          .eq('active', true);

        if (error) throw error;

        let fetchedItems: any[] = [];
        if (dbBranches && dbBranches.length > 0) {
          fetchedItems = dbBranches.map((b: any) => {
            return {
              id: b.branch_id,
              name: `${b.bank_name} — ${b.city} (${b.suburb}, Branch ${b.branch_num})`,
              lat: b.latitude,
              lon: b.longitude,
              queueLength: Math.floor(Math.random() * 50) + 2, // Mocked for now
              waitTime: Math.floor(Math.random() * 70) + 5
            };
          });
        }

        // If no branches found from Supabase (maybe offline or DB issues), use fallback safely
        if (fetchedItems.length === 0) {
          fetchedItems = fallbackBanks.map((b:any) => ({
            ...b, 
            queueLength: Math.floor(Math.random() * 40) + 5,
            waitTime: Math.floor(Math.random() * 60) + 15
          }));
        }

        // Sort alphabetically instead of distance
        fetchedItems.sort((a, b) => a.name.localeCompare(b.name));
        setLiveBanks(fetchedItems);

      } catch(e) {
        // Fallback securely on failure
        console.warn('Supabase fetch failed, using fallback.', e);
        const handledFallback = fallbackBanks.map((b:any) => ({
          ...b, 
          queueLength: Math.floor(Math.random() * 40) + 1,
          waitTime: Math.floor(Math.random() * 60) + 5
        }));
        setLiveBanks(handledFallback);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchLiveServices();
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
          <Ionicons name="people" size={20} color="#94a3b8" />
          <Text style={styles.statText}>{item.queueLength} in queue</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="time" size={20} color="#94a3b8" />
          <Text style={styles.statText}>~{item.waitTime} mins</Text>
        </View>
      </View>
      
      <PrimaryButton 
        title="View Details" 
        onPress={() => navigation.navigate('BranchDetail', { bankName: item.name, branchId: item.id })} 
        style={styles.joinButton}
      />
    </GlassCard>
  ), [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#3E2723" />
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4A373" />
          <Text style={styles.loadingText}>Loading centers...</Text>
        </View>
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
  container: { flex: 1, backgroundColor: '#F9F6F0' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingTop: 48, paddingBottom: 12 },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#3E2723' },
  filterContainer: { marginBottom: 16 },
  filterScroll: { paddingHorizontal: 24, gap: 12 },
  filterChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EFEBE9' },
  filterChipActive: { backgroundColor: 'rgba(212, 163, 115, 0.1)', borderColor: '#D4A373' },
  filterText: { color: '#8D6E63', fontWeight: '500' },
  filterTextActive: { color: '#D4A373', fontWeight: 'bold' },
  scroll: { padding: 24, paddingTop: 0 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#8D6E63', marginTop: 16, fontSize: 14 },
  card: { marginBottom: 20 },
  bankName: { fontSize: 20, fontWeight: 'bold', color: '#3E2723', marginBottom: 16 },
  statsContainer: { flexDirection: 'row', marginBottom: 20 },
  stat: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  statText: { color: '#8D6E63', marginLeft: 6, fontSize: 14 },
  joinButton: { marginTop: 8 },
  noResultsText: { color: '#8D6E63', textAlign: 'center', marginTop: 40, fontSize: 16 },
});
