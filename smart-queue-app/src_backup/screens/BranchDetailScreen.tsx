import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import { supabase } from '../utils/supabase';

export default function BranchDetailScreen({ route, navigation }: any) {
  const bankName = route.params?.bankName || 'Branch Details';
  const branchId = route.params?.branchId;
  const [activeService, setActiveService] = useState('Teller');
  const [isJoining, setIsJoining] = useState(false);

  const services = ['Teller', 'Customer Care', 'Loans'];
  // Placeholder mock for chart
  const trendHours = ['8a', '10a', '12p', '2p', '4p'];
  const trendHeights = [20, 60, 40, 80, 30]; // percentage heights

  const handleJoinQueue = async () => {
    if (!branchId) {
      Alert.alert('Error', 'Unable to join queue for this branch.');
      return;
    }
    setIsJoining(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Auth Error', 'You must be logged in to join a queue.');
        navigation.navigate('Login');
        return;
      }
      
      const ticketNum = `${activeService.charAt(0)}${Math.floor(Math.random() * 900) + 100}`;
      
      const { data, error } = await supabase.from('queue_tickets').insert([{
        branch_id: branchId,
        user_id: user.id,
        ticket_number: ticketNum,
        status: 'WAITING'
      }]).select().single();
      
      if (error) throw error;
      
      navigation.navigate('Queue', { bankName: `${bankName} - ${activeService}`, ticketInfo: data });
    } catch(err: any) {
      Alert.alert('Error', err.message || 'Failed to join queue');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#3E2723" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Branch Details</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.bankName}>{bankName}</Text>
        
        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Select Service Type</Text>
          <View style={styles.servicesContainer}>
            {services.map(srv => (
              <TouchableOpacity 
                key={srv}
                onPress={() => setActiveService(srv)}
                style={[styles.serviceOption, activeService === srv && styles.serviceOptionActive]}
              >
                <Text style={[styles.serviceText, activeService === srv && styles.serviceTextActive]}>{srv}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Queue Trend (Today)</Text>
          <View style={styles.chartContainer}>
            {trendHours.map((hour, idx) => (
              <View key={hour} style={styles.chartColumn}>
                <View style={[styles.chartBar, { height: `${trendHeights[idx]}%`, backgroundColor: trendHeights[idx] > 50 ? '#E07A5F' : '#D4A373' }]} />
                <Text style={styles.chartLabel}>{hour}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        <TouchableOpacity 
          style={{opacity: isJoining ? 0.7 : 1}}
          onPress={handleJoinQueue}
          disabled={isJoining}
        >
          <PrimaryButton 
            title={isJoining ? 'Processing...' : `Join Queue - ${activeService}`} 
            onPress={isJoining ? () => {} : handleJoinQueue} 
            style={styles.joinButton}
          />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F6F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingTop: 48, // Avoid status bar overlap
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  content: {
    padding: 24,
  },
  bankName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3E2723',
    marginBottom: 24,
  },
  card: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A3B32',
    marginBottom: 16,
  },
  servicesContainer: {
    gap: 12,
  },
  serviceOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEBE9',
    backgroundColor: '#FFFFFF',
  },
  serviceOptionActive: {
    borderColor: '#D4A373',
    backgroundColor: 'rgba(212, 163, 115, 0.1)',
  },
  serviceText: {
    color: '#8D6E63',
    fontSize: 16,
  },
  serviceTextActive: {
    color: '#D4A373',
    fontWeight: 'bold',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginTop: 16,
    paddingBottom: 24,
  },
  chartColumn: {
    alignItems: 'center',
    width: '15%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '100%',
    borderRadius: 4,
    marginBottom: 8,
  },
  chartLabel: {
    color: '#64748b',
    fontSize: 12,
  },
  joinButton: {
    marginTop: 16,
  },
});
