import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Switch, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';

export default function NotificationSettingsScreen({ navigation }: any) {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [turnAlerts, setTurnAlerts] = useState(true);
  const [lowWaitAlerts, setLowWaitAlerts] = useState(false);
  const [quietHours, setQuietHours] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <GlassCard style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Allow Push Notifications</Text>
              <Text style={styles.settingDesc}>Master switch for all alerts</Text>
            </View>
            <Switch 
              value={pushEnabled} 
              onValueChange={setPushEnabled}
              trackColor={{ false: '#334155', true: '#38bdf8' }}
              thumbColor="#ffffff"
            />
          </View>
        </GlassCard>

        {pushEnabled && (
          <GlassCard style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>"Almost Your Turn" Alerts</Text>
                <Text style={styles.settingDesc}>Notify when 3 people are ahead</Text>
              </View>
              <Switch value={turnAlerts} onValueChange={setTurnAlerts} trackColor={{ false: '#334155', true: '#38bdf8' }} thumbColor="#ffffff" />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Low Wait Window Alerts</Text>
                <Text style={styles.settingDesc}>Notify when favorite branches are empty</Text>
              </View>
              <Switch value={lowWaitAlerts} onValueChange={setLowWaitAlerts} trackColor={{ false: '#334155', true: '#38bdf8' }} thumbColor="#ffffff" />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Quiet Hours</Text>
                <Text style={styles.settingDesc}>Mute alerts from 6PM to 8AM</Text>
              </View>
              <Switch value={quietHours} onValueChange={setQuietHours} trackColor={{ false: '#334155', true: '#38bdf8' }} thumbColor="#ffffff" />
            </View>
          </GlassCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
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
    color: '#ffffff',
  },
  content: {
    padding: 24,
  },
  card: {
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    paddingRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    color: '#f1f5f9',
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 14,
    color: '#64748b',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 12,
  },
});
