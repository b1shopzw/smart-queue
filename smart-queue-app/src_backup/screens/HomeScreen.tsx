import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, TextInput, Modal, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import { supabase } from '../utils/supabase';
import { useIsFocused } from '@react-navigation/native';
import * as Location from 'expo-location';

export default function HomeScreen({ navigation }: any) {
  const isDark = false; // Forced to Light Coffee theme

  const theme = {
    background: '#F9F6F0',
    card: '#FFFFFF',
    text: '#3E2723',
    textMuted: '#8D6E63',
    border: '#EFEBE9',
    pillBg: 'rgba(212, 163, 115, 0.1)', // Light Caramel
    iconBgBanks: 'rgba(212, 163, 115, 0.15)', // Caramel tint
    iconBgPassport: 'rgba(129, 178, 154, 0.15)', // Earthy green
    iconBgID: 'rgba(224, 122, 95, 0.15)', // Earthy rust
    activityBadgeBg: 'rgba(212, 163, 115, 0.2)',
    activityBadgeText: '#C18350',
  };

  const [address, setAddress] = useState('Finding your location...');
  const [userGeoLocation, setUserGeoLocation] = useState<Location.LocationObject | null>(null);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [pickedLocation, setPickedLocation] = useState({ latitude: -17.8248, longitude: 31.0530 });

  const [userName, setUserName] = useState('Tinashe');
  const [recentTicket, setRecentTicket] = useState<any>(null);
  const isFocused = useIsFocused();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    (async () => {
      // 1. Fetch User Name & Recent Ticket
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('app_users').select('full_name').eq('id', user.id).single();
          if (data) setUserName(data.full_name.split(' ')[0]);

          const { data: ticketData } = await supabase
            .from('queue_tickets')
            .select('*, branch:branches(*)')
            .eq('user_id', user.id)
            .order('joined_at', { ascending: false })
            .limit(1)
            .single();
          
          if (ticketData) setRecentTicket(ticketData);
        } else {
          const storedName = await AsyncStorage.getItem('userFullName');
          if (storedName) {
            const firstName = storedName.split(' ')[0];
            setUserName(firstName);
          }
        }
      } catch(e) {
        // ignore
      }

      // 2. Fetch Location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Refused', 'Nearby branches cannot be shown without location access.');
        setAddress('Location Permission Denied');
        return;
      }
      
      try {
        let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserGeoLocation(loc);
        setPickedLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        
        let reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        });
        
        if (reverseGeocode.length > 0) {
          const pl = reverseGeocode[0];
          setAddress(`${pl.city || pl.subregion || pl.district}, ${pl.country || 'Zimbabwe'}`);
        } else {
          setAddress('Location Found');
        }
      } catch (e) {
        setAddress('Location Unavailable');
      }
    })();
  }, [isFocused]);

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
        updateLocationState(newCoords);
      } else {
        setAddress('Location Not Found');
      }
    } catch(e) {
      setAddress('Error finding location');
    }
  };

  const updateLocationState = async (coords: {latitude: number, longitude: number}) => {
    setUserGeoLocation({
      coords: { ...coords, altitude: null, accuracy: null, altitudeAccuracy: null, heading: null, speed: null },
      timestamp: Date.now(),
    });
    setPickedLocation(coords);

    try {
      let reverseGeocode = await Location.reverseGeocodeAsync(coords);
      if (reverseGeocode.length > 0) {
        const pl = reverseGeocode[0];
        setAddress(`${pl.city || pl.subregion || pl.district}, ${pl.country || 'Zimbabwe'}`);
      } else {
        setAddress('Custom Map Location');
      }
    } catch(e) {
      setAddress('Custom Map Location');
    }
  };

  const confirmMapSelection = () => {
    setIsMapVisible(false);
    setAddress('Updating...');
    updateLocationState(pickedLocation);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.greeting, { color: theme.textMuted }]}>{getGreeting()},</Text>
          <Text style={[styles.username, { color: theme.text }]}>{userName} 👋</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity 
            style={[styles.notificationBtn, { backgroundColor: '#FFFFFF', borderColor: '#EFEBE9', borderWidth: 1 }]}
            onPress={async () => {
              await AsyncStorage.removeItem('userFullName');
              navigation.replace('Login'); // Returns the user to the login screen
            }}
          >
            <Ionicons name="log-out-outline" size={22} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.notificationBtn, { backgroundColor: '#FFFFFF', borderColor: '#EFEBE9', borderWidth: 1 }]}>
            <Ionicons name="notifications-outline" size={24} color={theme.text} />
            <View style={[styles.notificationBadge, { borderColor: theme.card }]} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.card, shadowColor: 'rgba(62, 39, 35, 0.05)' }]}>
          <Ionicons name="search" size={20} color={theme.textMuted} />
          <TextInput 
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search bank, passport office..."
            placeholderTextColor={theme.textMuted}
            onFocus={() => setIsEditingLocation(true)}
          />
        </View>

        {isEditingLocation && (
          <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: '#3b82f6', borderWidth: 1 }]}>
            <Ionicons name="location" size={20} color="#3b82f6" />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="e.g. Mutare, Zimbabwe"
              placeholderTextColor={theme.textMuted}
              autoFocus
              onSubmitEditing={handleSearchLocation}
              onBlur={() => setIsEditingLocation(false)}
            />
          </View>
        )}

        {!isEditingLocation && (
          <View style={[styles.locationPill, { backgroundColor: theme.pillBg }]}>
            <Ionicons name="location" size={18} color="#D4A373" />
            <Text style={[styles.locationText, { color: '#C18350' }]} numberOfLines={1}>{address}</Text>
            <Ionicons name="chevron-down" size={16} color={theme.textMuted} style={{ marginLeft: 'auto' }} />
          </View>
        )}

        {/* Categories Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Services</Text>
        </View>
        <View style={styles.categoriesGrid}>
          <TouchableOpacity 
            style={[styles.categoryCard, { backgroundColor: theme.card, shadowColor: 'rgba(62, 39, 35, 0.05)' }]}
            onPress={() => navigation.navigate('BanksList', { userLocation: userGeoLocation?.coords, serviceType: 'Banks' })}
          >
            <View style={[styles.iconBox, { backgroundColor: theme.iconBgBanks }]}>
              <Ionicons name="business" size={28} color="#D4A373" />
            </View>
            <Text style={[styles.categoryText, { color: theme.text }]}>Banks</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.categoryCard, { backgroundColor: theme.card, shadowColor: 'rgba(62, 39, 35, 0.05)' }]}
            onPress={() => navigation.navigate('BanksList', { userLocation: userGeoLocation?.coords, serviceType: 'Passport Offices' })}
          >
            <View style={[styles.iconBox, { backgroundColor: theme.iconBgPassport }]}>
              <Ionicons name="document-text" size={28} color="#81B29A" />
            </View>
            <Text style={[styles.categoryText, { color: theme.text }]}>Passport</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.categoryCard, { backgroundColor: theme.card, shadowColor: 'rgba(62, 39, 35, 0.05)' }]}
            onPress={() => navigation.navigate('BanksList', { userLocation: userGeoLocation?.coords, serviceType: 'National ID Centers' })}
          >
            <View style={[styles.iconBox, { backgroundColor: theme.iconBgID }]}>
              <Ionicons name="id-card" size={28} color="#E07A5F" />
            </View>
            <Text style={[styles.categoryText, { color: theme.text }]}>Nat ID</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity style={[styles.quickAction, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="calendar-outline" size={22} color={theme.textMuted} />
            <Text style={[styles.quickActionText, { color: theme.textMuted }]}>Book</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickAction, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="star-outline" size={22} color={theme.textMuted} />
            <Text style={[styles.quickActionText, { color: theme.textMuted }]}>Saved</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickAction, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="time-outline" size={22} color={theme.textMuted} />
            <Text style={[styles.quickActionText, { color: theme.textMuted }]}>History</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
        {recentTicket ? (
          <TouchableOpacity onPress={() => navigation.navigate('Queue', { bankName: recentTicket.branch.bank_name, ticketInfo: recentTicket })}>
            <GlassCard style={styles.activityCard}>
              <View style={styles.activityRow}>
                <View style={[styles.iconBoxSmall, { backgroundColor: 'rgba(212, 163, 115, 0.15)' }]}>
                  <Ionicons name="ticket" size={18} color="#D4A373" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.activityTitle, { color: theme.text }]}>{recentTicket.branch.bank_name}</Text>
                  <Text style={[styles.activitySub, { color: theme.textMuted }]}>{recentTicket.branch.city} - Ticket {recentTicket.ticket_number}</Text>
                </View>
                <View style={[styles.badgePending, { backgroundColor: recentTicket.status === 'WAITING' ? theme.activityBadgeBg : 'rgba(129, 178, 154, 0.15)' }]}>
                  <Text style={[styles.badgeTextPending, { color: recentTicket.status === 'WAITING' ? theme.activityBadgeText : '#81B29A' }]}>{recentTicket.status}</Text>
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>
        ) : (
          <GlassCard style={styles.activityCard}>
            <View style={styles.activityRow}>
              <Text style={{color: theme.textMuted, fontStyle: 'italic', padding: 8}}>No recent activity found.</Text>
            </View>
          </GlassCard>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20,
    borderBottomWidth: 1,
  },
  greeting: { fontSize: 14, fontWeight: '500' },
  username: { fontSize: 24, fontWeight: 'bold', marginTop: 2 },
  notificationBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative'
  },
  notificationBadge: {
    position: 'absolute', top: 12, right: 12, width: 8, height: 8,
    borderRadius: 4, backgroundColor: '#ef4444', borderWidth: 1,
  },
  scroll: { padding: 24, paddingTop: 20 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    marginBottom: 16,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, fontWeight: '500' },
  locationPill: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    alignSelf: 'flex-start', marginBottom: 32, maxWidth: '100%'
  },
  locationText: { marginLeft: 8, fontWeight: '600', fontSize: 14, flexShrink: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  categoriesGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  categoryCard: {
    flex: 1, borderRadius: 20, paddingVertical: 20,
    alignItems: 'center', marginHorizontal: 4,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  iconBox: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  categoryText: { fontSize: 14, fontWeight: '600' },
  quickActionsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  quickAction: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 12, marginHorizontal: 4,
    borderWidth: 1,
  },
  quickActionText: { marginLeft: 8, fontSize: 13, fontWeight: '600' },
  activityCard: { marginBottom: 16, padding: 16 },
  activityRow: { flexDirection: 'row', alignItems: 'center' },
  iconBoxSmall: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  activityTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  activitySub: { fontSize: 13, fontWeight: '500' },
  badgePending: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeTextPending: { fontSize: 12, fontWeight: '700' },

  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50 },
  closeBtn: { padding: 4 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  map: { flex: 1 },
  mapFooter: { padding: 24, borderTopWidth: 1 },
  mapInstruction: { textAlign: 'center', fontSize: 14 },
});
