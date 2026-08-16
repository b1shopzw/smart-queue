import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useIsFocused } from '@react-navigation/native';
import { MotiView, MotiText } from 'moti';
import GlassCard from '../components/GlassCard';
import { supabase } from '../utils/supabase';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export default function HomeScreen({ navigation }: any) {
  const [address, setAddress] = useState('Finding your location...');
  const [userGeoLocation, setUserGeoLocation] = useState<Location.LocationObject | null>(null);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [userName, setUserName] = useState('User');
  const [recentTicket, setRecentTicket] = useState<any>(null);
  const [hasNotification, setHasNotification] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState('');
  const isFocused = useIsFocused();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    // 1. Fetch User Name & Recent Ticket
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const metaName = user.user_metadata?.full_name || user.user_metadata?.name;
        if (metaName) {
          setUserName(metaName.split(' ')[0]);
        } else {
          try {
            const { data } = await supabase.from('app_users').select('full_name').eq('id', user.id).single();
            if (data && data.full_name) setUserName(data.full_name.split(' ')[0]);
          } catch(e) {}
        }

        const fetchRecentTicket = async () => {
          const { data: ticketData } = await supabase
            .from('queue_tickets')
            .select('*, branch:branches(*)')
            .eq('user_id', user.id)
            .order('joined_at', { ascending: false })
            .limit(1)
            .single();
          
          if (ticketData) {
            setRecentTicket(ticketData);
            
            if (ticketData.status === 'WAITING') {
              const { count } = await supabase
                .from('queue_tickets')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'WAITING')
                .eq('branch_id', ticketData.branch_id)
                .lt('joined_at', ticketData.joined_at);
                
              if (count !== null && count <= 1) { // 0 or 1 person ahead
                setHasNotification(true);
                setNotificationMsg(`It's almost your turn at ${ticketData.branch.bank_name}! You are less than 5 minutes away.`);
              } else {
                setHasNotification(false);
              }
            } else {
              setHasNotification(false);
            }
          }
        };

        await fetchRecentTicket();
      } else {
        const storedName = await AsyncStorage.getItem('userFullName');
        if (storedName) {
          setUserName(storedName.split(' ')[0]);
        }
      }
    } catch(e) {
      // ignore
    }

    // 2. Fetch Location
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserGeoLocation(loc);
        
        let reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        });
        
        if (reverseGeocode.length > 0) {
          const pl = reverseGeocode[0];
          setAddress(`${pl.city || pl.subregion || pl.district}, ${pl.country || 'Zimbabwe'}`);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    let channel: any;

    const init = async () => {
      await loadData();

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        channel = supabase
          .channel('home_recent_ticket')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'queue_tickets', filter: `user_id=eq.${user.id}` },
            () => {
              loadData();
            }
          )
          .subscribe();
      }
    };

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [isFocused, loadData]);

  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) {
      setIsEditingLocation(false);
      return;
    }
    
    setAddress(`Searching for ${searchQuery}...`);
    setIsEditingLocation(false);
    
    try {
      const result = await Location.geocodeAsync(searchQuery);
      if (result.length > 0) {
        const newCoords = { latitude: result[0].latitude, longitude: result[0].longitude };
        
        setUserGeoLocation({
          coords: { ...newCoords, altitude: null, accuracy: null, altitudeAccuracy: null, heading: null, speed: null },
          timestamp: Date.now(),
        });
        
        let reverseGeocode = await Location.reverseGeocodeAsync(newCoords);
        if (reverseGeocode.length > 0) {
          const pl = reverseGeocode[0];
          setAddress(`${pl.city || pl.subregion || pl.district}, ${pl.country || 'Zimbabwe'}`);
        } else {
          setAddress('Custom Map Location');
        }
      } else {
        setAddress('Location Not Found');
      }
    } catch(e) {
      setAddress('Error finding location');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <MotiText 
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', delay: 100, damping: 20 }}
            style={styles.greeting}
          >
            {getGreeting()},
          </MotiText>
          <MotiText 
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', delay: 200, damping: 20 }}
            style={styles.username}
          >
            {userName} 👋
          </MotiText>
        </View>
        <MotiView 
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 300, damping: 15 }}
          style={styles.headerActions}
        >
          <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => {
            if (hasNotification) {
              Alert.alert('Notification', notificationMsg, [
                { text: 'View Ticket', onPress: () => navigation.navigate('Queue', { bankName: recentTicket?.branch?.bank_name, ticketInfo: recentTicket }) },
                { text: 'Dismiss', style: 'cancel' }
              ]);
            } else {
              Alert.alert('Notifications', 'You have no new notifications.');
            }
          }}>
            <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
            {hasNotification && <View style={styles.notificationBadge} />}
          </TouchableOpacity>
        </MotiView>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[colors.primary]} 
            tintColor={colors.primary} 
          />
        }
      >
        
        {/* Banner Image */}
        <MotiView 
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 500 }}
        >
          <Image 
            source={require('../../assets/home-banner.png')} 
            style={styles.bannerImage} 
            resizeMode="cover" 
          />
        </MotiView>

        {/* Search Bar */}
        <GlassCard style={styles.searchCard} intensity={80}>
          {!isEditingLocation ? (
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput 
                style={styles.searchInput}
                placeholder="Search bank, passport office..."
                placeholderTextColor={colors.textSecondary}
                onFocus={() => setIsEditingLocation(true)}
              />
            </View>
          ) : (
            <View style={styles.searchContainerFocus}>
              <Ionicons name="location" size={20} color={colors.primary} />
              <TextInput
                style={styles.searchInputFocus}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="e.g. Harare, Zimbabwe"
                placeholderTextColor={colors.textSecondary}
                autoFocus
                onSubmitEditing={handleSearchLocation}
                onBlur={() => setIsEditingLocation(false)}
              />
            </View>
          )}
        </GlassCard>

        {!isEditingLocation && (
          <View style={styles.locationPill}>
            <Ionicons name="location" size={18} color={colors.primary} />
            <Text style={styles.locationText} numberOfLines={1}>{address}</Text>
          </View>
        )}

        {/* Categories Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Services</Text>
        </View>
        
        <MotiView 
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 300, damping: 20 }}
          style={styles.categoriesGrid}
        >
          <TouchableOpacity 
            style={styles.categoryWrapper}
            onPress={() => navigation.navigate('BanksList', { userLocation: userGeoLocation?.coords, serviceType: 'Banks' })}
          >
            <GlassCard style={styles.categoryCard}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
                <Ionicons name="business-outline" size={32} color={colors.primary} />
              </View>
              <Text style={styles.categoryText}>Banks</Text>
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.categoryWrapper}
            onPress={() => navigation.navigate('BanksList', { userLocation: userGeoLocation?.coords, serviceType: 'Passport Offices' })}
          >
            <GlassCard style={styles.categoryCard}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(76, 175, 130, 0.15)' }]}>
                <Ionicons name="airplane-outline" size={32} color="#4CAF82" />
              </View>
              <Text style={styles.categoryText}>Passport</Text>
            </GlassCard>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.categoryWrapper}
            onPress={() => navigation.navigate('BanksList', { userLocation: userGeoLocation?.coords, serviceType: 'National ID Centers' })}
          >
            <GlassCard style={styles.categoryCard}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 107, 107, 0.15)' }]}>
                <Ionicons name="finger-print-outline" size={32} color="#FF6B6B" />
              </View>
              <Text style={styles.categoryText}>Nat ID</Text>
            </GlassCard>
          </TouchableOpacity>
        </MotiView>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <MotiView 
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 400, damping: 20 }}
          style={styles.quickActionsContainer}
        >
          <TouchableOpacity style={styles.quickAction}>
            <Ionicons name="calendar-outline" size={22} color={colors.textSecondary} />
            <Text style={styles.quickActionText}>Book</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <Ionicons name="star-outline" size={22} color={colors.textSecondary} />
            <Text style={styles.quickActionText}>Saved</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <Ionicons name="time-outline" size={22} color={colors.textSecondary} />
            <Text style={styles.quickActionText}>History</Text>
          </TouchableOpacity>
        </MotiView>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentTicket ? (
          <TouchableOpacity onPress={() => navigation.navigate('Queue', { bankName: recentTicket.branch.bank_name, ticketInfo: recentTicket })}>
            <GlassCard style={styles.activityCard}>
              <View style={styles.activityRow}>
                <View style={[styles.iconBoxSmall, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
                  <Ionicons name="ticket" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityTitle}>{recentTicket.branch.bank_name}</Text>
                  <Text style={styles.activitySub}>{recentTicket.branch.city} - Ticket {recentTicket.ticket_number}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: recentTicket.status === 'WAITING' ? 'rgba(212, 175, 55, 0.18)' : 'rgba(76, 175, 130, 0.18)' }]}>
                  <Text style={[styles.badgeText, { color: recentTicket.status === 'WAITING' ? colors.primary : colors.success }]}>
                    {recentTicket.status}
                  </Text>
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>
        ) : (
          <GlassCard style={styles.activityCard}>
            <Text style={styles.noActivityText}>No recent activity found.</Text>
          </GlassCard>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20,
  },
  greeting: { ...typography.subtitle, fontWeight: '600' },
  username: { ...typography.h2, marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 12 },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8,
  },
  notificationBadge: {
    position: 'absolute', top: 12, right: 12, width: 8, height: 8,
    borderRadius: 4, backgroundColor: colors.error, borderWidth: 1, borderColor: '#FFF',
  },
  scroll: { padding: 24, paddingTop: 10, paddingBottom: 40 },
  searchCard: { padding: 0, marginBottom: 16, borderRadius: 16 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  searchInput: { flex: 1, marginLeft: 10, ...typography.body, fontWeight: '500' },
  searchContainerFocus: { flexDirection: 'row', alignItems: 'center', padding: 16, borderColor: colors.primary, borderWidth: 1, borderRadius: 16 },
  searchInputFocus: { flex: 1, marginLeft: 10, ...typography.body, color: colors.textPrimary },
  locationPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.12)', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, alignSelf: 'flex-start', marginBottom: 32,
    borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  locationText: { marginLeft: 8, ...typography.body, color: colors.primary, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { ...typography.h3, marginBottom: 16 },
  categoriesGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 32 },
  categoryWrapper: { flex: 1 },
  categoryCard: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 10, borderRadius: 20 },
  iconBox: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  categoryText: { ...typography.body, fontWeight: '600' },
  quickActionsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 32 },
  quickAction: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 16,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder,
  },
  quickActionText: { marginLeft: 8, ...typography.caption, fontWeight: '600' },
  activityCard: { marginBottom: 16 },
  activityRow: { flexDirection: 'row', alignItems: 'center' },
  iconBoxSmall: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  activityTitle: { ...typography.body, fontWeight: '700', marginBottom: 4 },
  activitySub: { ...typography.caption },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  noActivityText: { ...typography.body, color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center' },
  bannerImage: { width: '100%', height: 160, borderRadius: 20, marginBottom: 20 },
});
