import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MotiView } from 'moti';
import GlassCard from '../components/GlassCard';
import { supabase } from '../utils/supabase';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export default function ProfileScreen({ navigation }: any) {
  const [user, setUser] = useState({
    name: 'Loading...',
    phone: 'fetching...',
    id: 'fetching...'
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const metaName = authUser.user_metadata?.full_name || authUser.user_metadata?.name;
        let fetchedName = metaName || 'Guest User';
        let fetchedPhone = 'No phone linked';
        let fetchedId = 'No ID linked';
        try {
          const { data, error } = await supabase
            .from('app_users')
            .select('*')
            .eq('id', authUser.id)
            .single();
          if (data && !error) {
            if (data.full_name) fetchedName = data.full_name;
            if (data.phone_number) fetchedPhone = data.phone_number;
            if (data.national_id) fetchedId = data.national_id;
          }
        } catch(e) {}
        setUser({ name: fetchedName, phone: fetchedPhone, id: fetchedId });
        return;
      }
      const name = await AsyncStorage.getItem('userFullName') || 'Guest User';
      const phone = await AsyncStorage.getItem('userPhone') || 'No phone linked';
      const id = await AsyncStorage.getItem('userNationalId') || 'No ID linked';
      setUser({ name, phone, id });
    } catch (e) {
      console.warn('Error fetching profile data', e);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUser();
    setRefreshing(false);
  }, [fetchUser]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const menuItems = useMemo(() => [
    { title: 'Personal Information', icon: 'person-outline', route: 'ProfileMain' },
    { title: 'Queue History', icon: 'time-outline', route: 'QueueHistory' },
    { title: 'App Settings', icon: 'settings-outline', route: 'NotificationSettings' },
    { title: 'Send Feedback / Report', icon: 'chatbubble-outline', route: 'Feedback' },
    { title: 'Help & Support', icon: 'help-circle-outline', route: 'ProfileMain' },
  ], []);

  const ListHeaderComponent = useCallback(() => (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 20 }}
    >
      <Text style={styles.headerTitle}>Profile</Text>
      <GlassCard style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={40} color={colors.primary} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{user.name}</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="call" size={14} color={colors.textSecondary} />
            <Text style={styles.infoText}>{user.phone}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="card" size={14} color={colors.textSecondary} />
            <Text style={styles.infoText}>{user.id}</Text>
          </View>
        </View>
      </GlassCard>
    </MotiView>
  ), [user]);

  const renderItem = useCallback(({ item, index }: any) => (
    <MotiView
      from={{ opacity: 0, scale: 0.9, translateY: 20 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ type: 'spring', delay: index * 100, damping: 20 }}
    >
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
            <View style={styles.menuIconBox}>
              <Ionicons name={item.icon as any} size={20} color={colors.primary} />
            </View>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
        </GlassCard>
      </TouchableOpacity>
    </MotiView>
  ), [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={menuItems}
        keyExtractor={(item) => item.title}
        renderItem={renderItem}
        ListHeaderComponent={ListHeaderComponent}
        contentContainerStyle={styles.scroll}
        initialNumToRender={6}
        windowSize={5}
        removeClippedSubviews={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 100,
  },
  headerTitle: {
    ...typography.h1,
    marginBottom: 24,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    padding: 20,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    ...typography.h3,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6
  },
  infoText: {
    ...typography.caption,
  },
  menuItem: {
    paddingVertical: 4,
    marginBottom: 12,
  },
  menuItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuTitle: {
    flex: 1,
    ...typography.body,
    fontWeight: '600',
  },
});
