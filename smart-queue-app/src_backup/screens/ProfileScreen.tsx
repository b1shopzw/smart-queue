import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GlassCard from '../components/GlassCard';
import { supabase } from '../utils/supabase';

export default function ProfileScreen({ navigation }: any) {
  const isDark = false; // Use light coffee theme

  const theme = useMemo(() => ({
    background: '#F9F6F0',
    text: '#3E2723',
    textMuted: '#8D6E63',
    iconColor: '#D4A373',
    iconBg: 'rgba(212, 163, 115, 0.15)',
  }), [isDark]);

  const [user, setUser] = useState({
    name: 'Loading...',
    phone: 'fetching...',
    id: 'fetching...'
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          const { data, error } = await supabase
            .from('app_users')
            .select('*')
            .eq('id', authUser.id)
            .single();

          if (data && !error) {
            setUser({ 
              name: data.full_name, 
              phone: data.phone_number, 
              id: data.national_id 
            });
            return;
          }
        }
        
        // Fallback to AsyncStorage if live data is empty or fail
        const name = await AsyncStorage.getItem('userFullName') || 'Guest User';
        const phone = await AsyncStorage.getItem('userPhone') || 'No phone linked';
        const id = await AsyncStorage.getItem('userNationalId') || 'No ID linked';
        setUser({ name, phone, id });

      } catch (e) {
        console.warn('Error fetching profile data', e);
      }
    };
    fetchUser();
  }, []);

  const menuItems = useMemo(() => [
    { title: 'Personal Information', icon: 'person-outline', route: 'ProfileMain' },
    { title: 'Queue History', icon: 'time-outline', route: 'QueueHistory' },
    { title: 'App Settings', icon: 'settings-outline', route: 'NotificationSettings' },
    { title: 'Send Feedback / Report', icon: 'chatbubble-outline', route: 'Feedback' },
    { title: 'Help & Support', icon: 'help-circle-outline', route: 'ProfileMain' },
  ], []);

  const ListHeaderComponent = useCallback(() => (
    <>
      <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
      <GlassCard style={styles.profileCard}>
        <View style={[styles.avatarContainer, { backgroundColor: theme.iconBg }]}>
          <Ionicons name="person" size={40} color={theme.iconColor} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.name, { color: theme.text }]}>{user.name}</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="call" size={14} color={theme.textMuted} />
            <Text style={[styles.infoText, { color: theme.textMuted }]}>{user.phone}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="card" size={14} color={theme.textMuted} />
            <Text style={[styles.infoText, { color: theme.textMuted }]}>{user.id}</Text>
          </View>
        </View>
      </GlassCard>
    </>
  ), [user, theme]);

  const renderItem = useCallback(({ item }: any) => (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => {
        if(item.route !== 'ProfileMain') {
          navigation.navigate(item.route);
        }
      }}
    >
      <GlassCard style={styles.menuItem}>
        <View style={styles.menuItemInner}>
          <View style={[styles.menuIconBox, { backgroundColor: '#EFEBE9' }]}>
            <Ionicons name={item.icon as any} size={20} color={theme.textMuted} />
          </View>
          <Text style={[styles.menuTitle, { color: theme.text }]}>{item.title}</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
        </View>
      </GlassCard>
    </TouchableOpacity>
  ), [navigation, theme, isDark]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={menuItems}
        keyExtractor={(item) => item.title}
        renderItem={renderItem}
        ListHeaderComponent={ListHeaderComponent}
        contentContainerStyle={styles.scroll}
        initialNumToRender={6}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 24,
    paddingTop: 60, // Avoid status bar overlap
    paddingBottom: 100,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 6
  },
  infoText: {
    fontSize: 14,
  },
  menuContainer: {
    gap: 12,
  },
  menuItem: {
    paddingVertical: 8,
  },
  menuItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
  },
});
