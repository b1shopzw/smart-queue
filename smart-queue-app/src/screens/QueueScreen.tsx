import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import { supabase } from '../utils/supabase';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', 
  '12:00', '13:00', '14:00', '15:00'
];

export default function QueueScreen({ route, navigation }: any) {
  const bankName = route.params?.bankName || 'Unknown Bank';
  const [ticketInfo, setTicketInfo] = useState(route.params?.ticketInfo);
  
  const [timeLeft, setTimeLeft] = useState(0);
  const [peopleAhead, setPeopleAhead] = useState(0);
  const [arrived, setArrived] = useState(false);
  const [servingNum, setServingNum] = useState('-');

  // Change Slot States
  const [modalVisible, setModalVisible] = useState(false);
  const [slotCapacities, setSlotCapacities] = useState<Record<string, number>>({});
  const [isChangingSlot, setIsChangingSlot] = useState(false);

  useEffect(() => {
    const fetchQueueStatus = async () => {
      if (!ticketInfo) return;
      
      try {
        // 1. Get people ahead of this ticket in the same branch
        const { count, error: countError } = await supabase
          .from('queue_tickets')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'WAITING')
          .eq('branch_id', ticketInfo.branch_id)
          .lt('joined_at', ticketInfo.joined_at);
          
        if (!countError && count !== null) {
          setPeopleAhead(count);
          setTimeLeft(count * 5 + 2); // roughly 5 mins per person
        }

        // 2. Get the currently serving ticket for this branch
        const { data: servingData, error: servingError } = await supabase
          .from('queue_tickets')
          .select('ticket_number')
          .eq('status', 'PROCESSING')
          .eq('branch_id', ticketInfo.branch_id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();
        
        if (!servingError && servingData) {
          setServingNum(servingData.ticket_number);
        } else {
          // No one is currently being processed
          setServingNum('-');
        }
      } catch (err) {
        console.error('Error fetching queue status:', err);
      }
    };
    
    // Initial fetch
    fetchQueueStatus();
    
    // Subscribe to realtime changes on the queue_tickets table for this branch
    const channel = supabase
      .channel(`queue_updates_${ticketInfo?.branch_id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, and DELETE
          schema: 'public',
          table: 'queue_tickets',
          filter: `branch_id=eq.${ticketInfo?.branch_id}`,
        },
        () => {
          // Instantly refetch whenever the admin modifies the queue
          fetchQueueStatus();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketInfo]);
  
  // Fetch capacities when modal opens
  useEffect(() => {
    if (!modalVisible || !ticketInfo) return;
    
    const fetchCapacities = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data } = await supabase
        .from('queue_tickets')
        .select('service_type')
        .eq('branch_id', ticketInfo.branch_id)
        .gte('joined_at', today.toISOString())
        .in('status', ['WAITING', 'PROCESSING', 'PAUSED']);
        
      if (data) {
        const counts: Record<string, number> = {};
        data.forEach(t => {
          if (t.service_type && t.service_type.startsWith('Slot: ')) {
            const slot = t.service_type.replace('Slot: ', '');
            counts[slot] = (counts[slot] || 0) + 1;
          }
        });
        setSlotCapacities(counts);
      }
    };
    fetchCapacities();
  }, [modalVisible, ticketInfo]);

  const handleChangeSlot = async (newSlot: string) => {
    if (!ticketInfo) return;
    setIsChangingSlot(true);
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 1. Calculate next ticket number for the newly selected slot
      const { data: recentTickets } = await supabase
        .from('queue_tickets')
        .select('ticket_number')
        .eq('branch_id', ticketInfo.branch_id)
        .eq('service_type', `Slot: ${newSlot}`)
        .gte('joined_at', today.toISOString())
        .order('joined_at', { ascending: false })
        .limit(1);

      let nextNum = 1;
      if (recentTickets && recentTickets.length > 0) {
        const lastTicketStr = recentTickets[0].ticket_number;
        const numMatch = lastTicketStr.match(/\d+/);
        if (numMatch) {
          nextNum = parseInt(numMatch[0], 10) + 1;
        }
      }

      const newTicketNum = nextNum.toString();

      // 2. Update the existing ticket in DB
      const { data, error } = await supabase
        .from('queue_tickets')
        .update({
          service_type: `Slot: ${newSlot}`,
          ticket_number: newTicketNum,
        })
        .eq('id', ticketInfo.id)
        .select()
        .single();

      if (error) throw error;

      // 3. Update local state
      setTicketInfo(data);
      setModalVisible(false);
      Alert.alert('Slot Changed', `You successfully moved to the ${newSlot} slot. Your new queue number is ${newTicketNum}.`);
      
    } catch(err: any) {
      Alert.alert('Error', err.message || 'Failed to change time slot.');
    } finally {
      setIsChangingSlot(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Queue',
      'Are you sure you want to cancel your ticket? This will immediately free up the spot for the next person.',
      [
        { text: 'No, Keep Ticket', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            if (ticketInfo) {
              await supabase.from('queue_tickets').update({ status: 'CANCELLED' }).eq('id', ticketInfo.id);
            }
            navigation.popToTop();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Ticket</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.bankName}>{bankName}</Text>
        
        <GlassCard style={styles.ticketCard} intensity={80}>
          <Text style={styles.ticketLabel}>TICKET NUMBER</Text>
          <Text style={styles.ticketNumber}>{ticketInfo?.ticket_number || 'A---'}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.ticketStats}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{servingNum}</Text>
              <Text style={styles.statLabel}>Serving</Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{peopleAhead}</Text>
              <Text style={styles.statLabel}>Ahead</Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{peopleAhead + 1}</Text>
              <Text style={styles.statLabel}>Position</Text>
            </View>
          </View>
        </GlassCard>

        <View style={styles.timeContainer}>
          <View style={styles.timerIconBox}>
            <Ionicons name="timer-outline" size={32} color={colors.primary} />
          </View>
          <Text style={styles.timeValue}>~{timeLeft} mins</Text>
          <Text style={styles.timeLabel}>Estimated Wait Time</Text>
        </View>

        {!arrived ? (
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.hereButton} onPress={() => setArrived(true)}>
              <Ionicons name="location" size={20} color={colors.success} />
              <Text style={styles.hereText}>I'm Here</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.changeSlotButton} onPress={() => setModalVisible(true)}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
              <Text style={styles.changeSlotText}>Change Slot</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.arrivedBadge}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.arrivedText}>Arrival Confirmed</Text>
          </View>
        )}

        <PrimaryButton 
          title="Finish Service & Leave Feedback" 
          onPress={() => navigation.navigate('Feedback', { branchId: ticketInfo?.branch_id, branchName: bankName })} 
          style={styles.testFeedbackButton}
        />

        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Ionicons name="close-circle-outline" size={20} color={colors.error} />
          <Text style={styles.cancelText}>Cancel Queue</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Change Time Slot Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Time Slot</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Pick an alternative time slot if there is space.</Text>
            
            <View style={styles.gridContainer}>
              {TIME_SLOTS.map((slot) => {
                const count = slotCapacities[slot] || 0;
                const isFull = count >= 50;
                const isCurrent = ticketInfo?.service_type === `Slot: ${slot}`;
                
                return (
                  <TouchableOpacity 
                    key={slot} 
                    style={[
                      styles.slotButton, 
                      isCurrent && styles.slotButtonActive,
                      isFull && !isCurrent && styles.slotButtonDisabled
                    ]}
                    onPress={() => {
                      if (!isFull && !isCurrent) {
                        handleChangeSlot(slot);
                      }
                    }}
                    activeOpacity={(isFull || isCurrent) ? 1 : 0.7}
                  >
                    <Ionicons 
                      name={isCurrent ? "checkmark-circle" : "time-outline"} 
                      size={16} 
                      color={isCurrent ? '#FFFFFF' : (isFull ? colors.textSecondary : colors.textPrimary)} 
                    />
                    <View>
                      <Text style={[
                        styles.slotText, 
                        isCurrent && styles.slotTextActive,
                        isFull && !isCurrent && styles.slotTextDisabled
                      ]}>
                        {slot}
                      </Text>
                      <Text style={[styles.capacityText, isCurrent && {color: 'rgba(255,255,255,0.8)'}]}>
                        {isCurrent ? 'Current' : (isFull ? 'Full' : `${50 - count} left`)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            {isChangingSlot && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{marginTop: 8}}>Changing slot...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
  },
  bankName: {
    ...typography.h3,
    color: colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  ticketCard: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 40,
    marginBottom: 40,
  },
  ticketLabel: {
    ...typography.caption,
    color: colors.primary,
    letterSpacing: 2,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  ticketNumber: {
    fontSize: 72,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 4,
  },
  divider: {
    height: 1,
    width: '80%',
    backgroundColor: colors.surfaceBorder,
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
    ...typography.h2,
    marginBottom: 4,
  },
  statLabel: {
    ...typography.caption,
  },
  dividerVertical: {
    width: 1,
    height: '100%',
    backgroundColor: colors.surfaceBorder,
  },
  timeContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  timerIconBox: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(212, 175, 55, 0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  timeValue: {
    ...typography.h1,
    marginTop: 12,
    marginBottom: 4,
  },
  timeLabel: {
    ...typography.body,
    color: colors.textSecondary,
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
    borderRadius: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  hereText: {
    ...typography.body,
    color: colors.success,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  timeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  timeText: {
    ...typography.body,
    color: '#f59e0b',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  arrivedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginBottom: 32,
  },
  arrivedText: {
    ...typography.body,
    color: colors.success,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  testFeedbackButton: {
    width: '100%',
    marginBottom: 20,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginTop: 20,
    marginBottom: 60,
  },
  cancelText: {
    ...typography.body,
    color: colors.error,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Modal & Change Slot Styles
  changeSlotButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  changeSlotText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    ...typography.h3,
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  slotButton: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  slotButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  slotText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  slotTextActive: {
    color: '#FFFFFF',
  },
  slotTextDisabled: {
    color: colors.textSecondary,
  },
  capacityText: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 28, 51, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
});
