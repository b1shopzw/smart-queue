import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import { supabase } from '../utils/supabase';

export default function QueueScreen({ route, navigation }: any) {
  const bankName = route.params?.bankName || 'Unknown Bank';
  const ticketInfo = route.params?.ticketInfo;
  
  const [timeLeft, setTimeLeft] = useState(0);
  const [peopleAhead, setPeopleAhead] = useState(0);
  const [arrived, setArrived] = useState(false);
  const [servingNum, setServingNum] = useState('-');

  useEffect(() => {
    const fetchQueueStatus = async () => {
      if (!ticketInfo) return;
      
      const { count } = await supabase
        .from('queue_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'WAITING')
        .eq('branch_id', ticketInfo.branch_id)
        .lt('joined_at', ticketInfo.joined_at);
        
      if (count !== null) {
        setPeopleAhead(count);
        setTimeLeft(count * 5 + 2); // roughly 5 mins per person
      }
    };
    
    fetchQueueStatus();
    const interval = setInterval(fetchQueueStatus, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [ticketInfo]);
  
  const handleCancel = async () => {
    if (ticketInfo) {
      await supabase.from('queue_tickets').update({ status: 'CANCELLED' }).eq('id', ticketInfo.id);
    }
    navigation.popToTop();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#3E2723" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Ticket</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.bankName}>{bankName}</Text>
        
        <GlassCard style={styles.ticketCard}>
          <Text style={styles.ticketLabel}>TICKET NUMBER</Text>
          <Text style={styles.ticketNumber}>{ticketInfo?.ticket_number || 'A---'}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.ticketStats}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{servingNum}</Text>
              <Text style={styles.statLabel}>Currently Serving</Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{peopleAhead}</Text>
              <Text style={styles.statLabel}>People Ahead</Text>
            </View>
          </View>
        </GlassCard>

        <View style={styles.timeContainer}>
          <Ionicons name="timer-outline" size={32} color="#D4A373" />
          <Text style={styles.timeValue}>~{timeLeft} mins</Text>
          <Text style={styles.timeLabel}>Estimated Wait Time</Text>
        </View>

        {!arrived ? (
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.hereButton} onPress={() => setArrived(true)}>
              <Ionicons name="location" size={20} color="#10b981" />
              <Text style={styles.hereText}>I'm Here</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.timeButton} onPress={() => setTimeLeft(prev => prev + 15)}>
              <Ionicons name="time" size={20} color="#f59e0b" />
              <Text style={styles.timeText}>More Time</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.arrivedBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.arrivedText}>Arrival Confirmed</Text>
          </View>
        )}

        <PrimaryButton 
          title="Finish Service (Testing Feedback)" 
          onPress={() => navigation.navigate('Feedback')} 
          style={styles.testFeedbackButton}
        />

        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
          <Text style={styles.cancelText}>Cancel Queue</Text>
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
    alignItems: 'center',
  },
  bankName: {
    fontSize: 18,
    color: '#8D6E63',
    marginBottom: 32,
    textAlign: 'center',
  },
  ticketCard: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderColor: '#EFEBE9',
    shadowColor: 'rgba(62, 39, 35, 0.15)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    marginBottom: 40,
  },
  ticketLabel: {
    fontSize: 14,
    color: '#D4A373',
    letterSpacing: 2,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  ticketNumber: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#3E2723',
    letterSpacing: 4,
  },
  divider: {
    height: 1,
    width: '80%',
    backgroundColor: '#EFEBE9',
    marginVertical: 32,
  },
  ticketStats: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-evenly',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3E2723',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8D6E63',
  },
  dividerVertical: {
    width: 1,
    height: '100%',
    backgroundColor: '#EFEBE9',
  },
  timeContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  timeValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3E2723',
    marginTop: 12,
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 14,
    color: '#8D6E63',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  hereButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  hereText: {
    color: '#10b981',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  timeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  timeText: {
    color: '#f59e0b',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  arrivedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginBottom: 32,
  },
  arrivedText: {
    color: '#10b981',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  testFeedbackButton: {
    width: '100%',
    marginBottom: 20,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginTop: 20,
    marginBottom: 60,
  },
  cancelText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
