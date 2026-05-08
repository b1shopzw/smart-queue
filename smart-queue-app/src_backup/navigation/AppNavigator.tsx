import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import BanksListScreen from '../screens/BanksListScreen';
import BranchDetailScreen from '../screens/BranchDetailScreen';
import QueueScreen from '../screens/QueueScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import QueueHistoryScreen from '../screens/QueueHistoryScreen';

const RootStack = createNativeStackNavigator();
const Stack = createNativeStackNavigator();
const ProfileStackNav = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F9F6F0' } }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="BanksList" component={BanksListScreen} />
      <Stack.Screen name="BranchDetail" component={BranchDetailScreen} />
      <Stack.Screen name="Queue" component={QueueScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <ProfileStackNav.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F9F6F0' } }}>
      <ProfileStackNav.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStackNav.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <ProfileStackNav.Screen name="QueueHistory" component={QueueHistoryScreen} />
      <ProfileStackNav.Screen name="Feedback" component={FeedbackScreen} options={{ presentation: 'modal' }} />
    </ProfileStackNav.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderTopColor: '#EFEBE9',
          position: 'absolute',
          elevation: 0,
          height: 60,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'HomeTab') iconName = 'home';
          else if (route.name === 'Profile') iconName = 'person';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#D4A373',
        tabBarInactiveTintColor: '#8D6E63',
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer theme={DefaultTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F9F6F0' } }}>
        <RootStack.Screen name="Login" component={LoginScreen} />
        <RootStack.Screen name="Signup" component={SignupScreen} />
        <RootStack.Screen name="MainTabs" component={MainTabs} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
