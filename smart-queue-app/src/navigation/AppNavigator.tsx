import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';
import { colors } from '../theme/colors';

import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import BanksListScreen from '../screens/BanksListScreen';
import BranchDetailScreen from '../screens/BranchDetailScreen';
import SelectSlotScreen from '../screens/SelectSlotScreen';
import QueueScreen from '../screens/QueueScreen';
import ProfileScreen from '../screens/ProfileScreen';
import QueueHistoryScreen from '../screens/QueueHistoryScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import BranchMapScreen from '../screens/BranchMapScreen';
import OrgSignupScreen from '../screens/OrgSignupScreen';
import AcceptInviteScreen from '../screens/AcceptInviteScreen';

const RootStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Light NavigationContainer theme
const ZimNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.backgroundAlt,
    text: colors.textPrimary,
    border: colors.surfaceBorder,
    notification: colors.primary,
  },
};

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="BanksList" component={BanksListScreen} />
      <HomeStack.Screen name="BranchDetail" component={BranchDetailScreen} />
      <HomeStack.Screen name="BranchMap" component={BranchMapScreen} />
      <HomeStack.Screen name="OrgSignup" component={OrgSignupScreen} />
      <HomeStack.Screen name="AcceptInvite" component={AcceptInviteScreen} />
      <HomeStack.Screen name="SelectSlot" component={SelectSlotScreen} />
      <HomeStack.Screen name="Queue" component={QueueScreen} />
      <HomeStack.Screen name="Feedback" component={FeedbackScreen} />
    </HomeStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="QueueHistory" component={QueueHistoryScreen} />
      <ProfileStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <ProfileStack.Screen name="Feedback" component={FeedbackScreen} />
    </ProfileStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.backgroundAlt,
          borderTopColor: colors.surfaceBorder,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer
      theme={ZimNavTheme}
      documentTitle={{
        formatter: (options, route) => {
          const routeName = options?.title ?? route?.name ?? 'App';
          const displayNames: Record<string, string> = {
            'HomeMain': 'Home',
            'ProfileMain': 'Profile',
            'BanksList': 'Branches',
            'BranchDetail': 'Branch Info',
            'Queue': 'Your Ticket',
            'QueueHistory': 'History',
            'NotificationSettings': 'Settings'
          };
          const cleanName = displayNames[routeName] || routeName;
          return `ZIM Smart Queue / ${cleanName}`;
        }
      }}
    >
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background }
        }}
      >
        {session ? (
          <RootStack.Screen name="MainTabs" component={MainTabs} />
        ) : (
          <>
            <RootStack.Screen name="Login" component={LoginScreen} />
            <RootStack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
