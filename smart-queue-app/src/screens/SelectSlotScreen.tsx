import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import { supabase } from '../utils/supabase';
import { apiRequest } from '../utils/api';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const TIME_SLOTS_WEEKDAY = [
  '08:00', '09:00', '10:00', '11:00', 
  '12:00', '13:00', '14:00', '15:00'
];

const TIME_SLOTS_SATURDAY = [
  '08:00', '09:00', '10:00', '11:00', '12:00'
];

const getInitialDate = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (d.getDay() === 0) { // If Sunday, skip to Monday
    d.setDate(d.getDate() + 1);
  }
  return d;
};

const CustomCalendar = ({ selectedDate, onSelectDate }: { selectedDate: Date, onSelectDate: (d: Date) => void }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    const today = new Date();
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    if (newMonth.getFullYear() < today.getFullYear() || 
        (newMonth.getFullYear() === today.getFullYear() && newMonth.getMonth() < today.getMonth())) {
      return; // prevent going to past months
    }
    setCurrentMonth(newMonth);
  };

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay(); // 0 = Sunday

  const daysArray = [];
  for (let i = 0; i < firstDayOfWeek; i++) daysArray.push(null);
  for (let i = 1; i <= daysInMonth; i++) daysArray.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));

  const today = new Date();
  today.setHours(0,0,0,0);

  return (
    <View style={styles.calendarContainer}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={prevMonth} style={styles.monthArrow}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.calendarMonthText}>
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={styles.monthArrow}>
          <Ionicons name="chevron-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <View style={styles.weekDaysHeader}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
          <Text key={idx} style={styles.weekDayText}>{day}</Text>
        ))}
      </View>
      <View style={styles.daysGridCal}>
        {daysArray.map((date, idx) => {
          if (!date) return <View key={idx} style={styles.dayCell} />;
          
          const isPast = date.getTime() < today.getTime();
          const isSunday = date.getDay() === 0;
          const disabled = isPast || isSunday;
          const isSelected = date.getTime() === selectedDate.getTime();
          
          return (
            <TouchableOpacity 
              key={idx} 
              style={[
                styles.dayCell, 
                isSelected && styles.dayCellSelected,
                disabled && styles.dayCellDisabled
              ]}
              disabled={disabled}
              onPress={() => onSelectDate(date)}
            >
              <Text style={[
                styles.dayText, 
                isSelected && styles.dayTextSelected,
                disabled && styles.dayTextDisabled
              ]}>
                {date.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default function SelectSlotScreen({ route, navigation }: any) {
  const bankName = route.params?.bankName || 'Branch Details';
  const branchId = route.params?.branchId;
  
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(getInitialDate());
  const [isJoining, setIsJoining] = useState(false);
  const [slotCapacities, setSlotCapacities] = useState<Record<string, number>>({});
  
  let availableTimeSlots: string[] = [];
  if (selectedDate.getDay() === 6) { // Saturday
    availableTimeSlots = TIME_SLOTS_SATURDAY;
  } else if (selectedDate.getDay() !== 0) { // Weekdays
    availableTimeSlots = TIME_SLOTS_WEEKDAY;
  }

  useEffect(() => {
    const fetchCapacities = async () => {
      if (!branchId) return;
      
      const targetDate = new Date(selectedDate);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const { data } = await supabase
        .from('queue_tickets')
        .select('service_type')
        .eq('branch_id', branchId)
        .gte('joined_at', targetDate.toISOString())
        .lt('joined_at', nextDay.toISOString())
        .in('status', ['WAITING', 'PROCESSING', 'PAUSED']); // Active tickets
        
      if (data) {
        const counts: Record<string, number> = {};
        data.forEach(t => {
          if (t.service_type) {
            // Extract slot time if it matches "Slot: XX:XX" or "Date: ... Slot: XX:XX"
            const match = t.service_type.match(/Slot:\s*(\d{2}:\d{2})/);
            if (match && match[1]) {
              const slot = match[1];
              counts[slot] = (counts[slot] || 0) + 1;
            }
          }
        });
        setSlotCapacities(counts);
      }
    };
    
    fetchCapacities();
  }, [branchId, selectedDate]);

  const handleJoinQueue = async () => {
    console.log('SelectSlotScreen: Confirm Join button pressed', { selectedSlot, branchId });
    if (!selectedSlot) {
      Alert.alert('Selection Required', 'Please select a time slot first.');
      return;
    }

    if (!branchId) {
      Alert.alert('Error', 'Unable to join queue for this branch.');
      return;
    }
    
    setIsJoining(true);
    try {
      console.log('Fetching user...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Auth Error', 'You must be logged in to join a queue.');
        navigation.navigate('Login');
        return;
      }
      
      const targetDate = new Date(selectedDate);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const { data: recentTickets } = await supabase
        .from('queue_tickets')
        .select('ticket_number')
        .eq('branch_id', branchId)
        .like('service_type', `%Slot: ${selectedSlot}%`)
        .gte('joined_at', targetDate.toISOString())
        .lt('joined_at', nextDay.toISOString())
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

      const ticketNum = nextNum.toString();
      
      const insertDate = new Date(selectedDate);
      const [slotHour, slotMinute] = selectedSlot.split(':').map(Number);
      insertDate.setHours(slotHour, slotMinute, 0, 0);
      
      const dateStr = insertDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const serviceType = `Date: ${dateStr} Slot: ${selectedSlot}`;
      
      try {
        const ticketData = await apiRequest('/queue/ticket', {
          method: 'POST',
          body: JSON.stringify({
            branch_id: branchId,
            user_id: user.id,
            user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            user_email: user.email,
            service_type: serviceType,
            priority_level: 'Standard'
          }),
        });

        console.log('Backend Insert success! Attempting to navigate...');
        navigation.navigate('Queue', { bankName: bankName, ticketInfo: ticketData });
      } catch (backendError: any) {
        console.error('Backend Join Queue Error:', backendError);
        Alert.alert('Error', 'Failed to join the queue. Please check your connection and try again.');
      }
      
    } catch(err: any) {
      console.error('Join Queue Error:', err);
      // Fallback for testing UI on catch
      navigation.navigate('Queue', { 
        bankName: bankName, 
        ticketInfo: {
          id: 'mock-ticket-id-catch',
          branch_id: branchId,
          user_id: 'mock-user',
          ticket_number: '99',
          service_type: `Slot: ${selectedSlot}`,
          joined_at: new Date().toISOString(),
          status: 'WAITING'
        } 
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Time Slot</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.bankName}>{bankName}</Text>
        
        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Which day?</Text>
          <CustomCalendar 
            selectedDate={selectedDate} 
            onSelectDate={(d) => {
              setSelectedDate(d);
              setSelectedSlot(null); // Reset slot on day change
            }} 
          />
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>When would you like to arrive?</Text>
          <Text style={styles.subtitle}>Select an estimated arrival time so the admin can prepare for you.</Text>
          
          <View style={styles.gridContainer}>
            {availableTimeSlots.length === 0 ? (
              <Text style={styles.closedText}>The branch is closed on Sundays.</Text>
            ) : (
              availableTimeSlots.map((slot) => {
                const now = new Date();
                const isToday = selectedDate.getDate() === now.getDate() && 
                                selectedDate.getMonth() === now.getMonth() && 
                                selectedDate.getFullYear() === now.getFullYear();
                
                const [slotHour, slotMinute] = slot.split(':').map(Number);
                const isPast = isToday && (now.getHours() > slotHour || (now.getHours() === slotHour && now.getMinutes() >= slotMinute));
                
                // If the time has passed for today, do not render it
                if (isPast) return null;

                const count = slotCapacities[slot] || 0;
                const isFull = count >= 50;
                const isSelected = selectedSlot === slot;
                
                return (
                  <TouchableOpacity 
                    key={slot} 
                    style={[
                      styles.slotButton, 
                      isSelected && styles.slotButtonActive,
                      isFull && styles.slotButtonDisabled
                    ]}
                    onPress={() => !isFull && setSelectedSlot(slot)}
                    activeOpacity={isFull ? 1 : 0.7}
                  >
                    <Ionicons 
                      name={isSelected ? "time" : "time-outline"} 
                      size={16} 
                      color={isSelected ? '#FFFFFF' : isFull ? colors.textSecondary : colors.textPrimary} 
                    />
                    <View>
                      <Text style={[
                        styles.slotText, 
                        isSelected && styles.slotTextActive,
                        isFull && styles.slotTextDisabled
                      ]}>
                        {slot}
                      </Text>
                      <Text style={[styles.capacityText, isSelected && {color: 'rgba(255,255,255,0.8)'}]}>
                        {isFull ? 'Full' : `${50 - count} left`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </GlassCard>

        <PrimaryButton 
          title={isJoining ? 'Processing...' : `Confirm & Join Queue`} 
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
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, 
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, 
    borderColor: colors.surfaceBorder, marginRight: 16
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
    ...typography.h3,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  card: {
    marginBottom: 24,
    padding: 20,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  dateListContainer: {
    gap: 12,
    paddingVertical: 8,
  },
  dateButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.10)',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginRight: 10,
  },
  dateButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dateTextActive: {
    color: '#FFFFFF',
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
    borderColor: 'rgba(255,255,255,0.05)',
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
  joinButton: {
    marginTop: 16,
  },
  closedText: {
    ...typography.body,
    color: colors.error,
    padding: 16,
    textAlign: 'center',
    width: '100%',
  },
  calendarContainer: {
    width: '100%',
    marginTop: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthArrow: {
    padding: 8,
  },
  calendarMonthText: {
    ...typography.h3,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekDayText: {
    ...typography.body,
    color: colors.textSecondary,
    width: 40,
    textAlign: 'center',
  },
  daysGridCal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  dayTextSelected: {
    color: '#0F1C33',
    fontWeight: 'bold',
  },
  dayTextDisabled: {
    color: colors.textSecondary,
  },
});
