import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Switch, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export default function NotificationSettingsScreen({ navigation }: any) {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [turnAlerts, setTurnAlerts] = useState(true);
  const [lowWaitAlerts, setLowWaitAlerts] = useState(false);
  const [quietHours, setQuietHours] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
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
              trackColor={{ false: '#d1d5db', true: colors.primary }}
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
              <Switch value={turnAlerts} onValueChange={setTurnAlerts} trackColor={{ false: '#d1d5db', true: colors.primary }} thumbColor="#ffffff" />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Low Wait Window Alerts</Text>
                <Text style={styles.settingDesc}>Notify when favorite branches are empty</Text>
              </View>
              <Switch value={lowWaitAlerts} onValueChange={setLowWaitAlerts} trackColor={{ false: '#d1d5db', true: colors.primary }} thumbColor="#ffffff" />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Quiet Hours</Text>
                <Text style={styles.settingDesc}>Mute alerts from 6PM to 8AM</Text>
              </View>
              <Switch value={quietHours} onValueChange={setQuietHours} trackColor={{ false: '#d1d5db', true: colors.primary }} thumbColor="#ffffff" />
            </View>
          </GlassCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, paddingTop: 60 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.surfaceBorder, marginRight: 16 },
  headerTitle: { ...typography.h2 },
  content: { padding: 24 },
  card: { marginBottom: 20, padding: 20 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  settingInfo: { flex: 1, paddingRight: 16 },
  settingTitle: { ...typography.body, fontWeight: '600', marginBottom: 4 },
  settingDesc: { ...typography.caption },
  divider: { height: 1, backgroundColor: colors.surfaceBorder, marginVertical: 12 },
});
