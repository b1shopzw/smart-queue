import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import { supabase } from '../utils/supabase';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export default function FeedbackScreen({ navigation, route }: any) {
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(route.params?.branchId || null);
  const predefinedBranchName = route.params?.branchName || null;
  const isPredefined = !!route.params?.branchId;
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState('Staff Behavior');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!isPredefined) {
        const { data } = await supabase.from('branches').select('branch_id, bank_name, city, suburb').eq('active', true);
        if (data) setBranches(data);
      }
      setLoading(false);
    }
    loadData();
  }, [isPredefined]);

  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs', params: { screen: 'Home' } }],
        });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [submitted]);

  const CATEGORIES = ['Staff Behavior', 'Wait Time', 'Facility/Cleanliness', 'System Issue', 'Other'];

  const submitFeedback = async () => {
    if (!selectedBranch) return Alert.alert('Error', 'Please select a branch.');
    if (rating === 0) return Alert.alert('Error', 'Please select a star rating.');
    
    setSubmitting(true);
    let userId = null;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
    } else {
      const res = await supabase.from('app_users').select('id').limit(1).single();
      userId = res.data?.id;
    }

    if (!userId) {
      setSubmitting(false);
      return Alert.alert('Error', 'User profile not found. Please log in.');
    }

    const { error } = await supabase.from('user_feedback').insert({
      user_id: userId,
      branch_id: selectedBranch,
      rating,
      category,
      comments,
      status: 'UNREAD'
    });

    setSubmitting(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setSubmitted(true);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (submitted) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }]}>
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={80} color={colors.primary} />
          </View>
          <Text style={styles.successTitle}>Thank You!</Text>
          <Text style={styles.successMessage}>Your report has been successfully submitted.</Text>
          <Text style={styles.successSubtext}>Redirecting to dashboard...</Text>
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Feedback</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.label}>Which branch did you visit?</Text>
        
        {isPredefined ? (
          <GlassCard style={styles.predefinedCard}>
            <Text style={styles.predefinedBranchText}>{predefinedBranchName}</Text>
            <Text style={styles.predefinedSubText}>Feedback linked to specific ticket.</Text>
          </GlassCard>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.branchesScroll}>
            {branches.map(b => (
              <TouchableOpacity 
                key={b.branch_id}
                onPress={() => setSelectedBranch(b.branch_id)}
                style={[styles.chip, { 
                  borderColor: selectedBranch === b.branch_id ? colors.primary : colors.surfaceBorder,
                  backgroundColor: selectedBranch === b.branch_id ? 'rgba(212, 175, 55, 0.12)' : colors.surface
                }]}
              >
                <Text style={{ 
                  ...typography.body,
                  color: selectedBranch === b.branch_id ? colors.primary : colors.textSecondary, 
                  fontWeight: '600' 
                }}>
                  {b.bank_name} - {b.suburb}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <Text style={styles.label}>Rate your experience</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Ionicons 
                name={rating >= star ? 'star' : 'star-outline'} 
                size={40} 
                color={rating >= star ? '#fbbf24' : colors.textSecondary} 
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>What is your feedback regarding?</Text>
        <View style={styles.categoriesContainer}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity 
              key={cat}
              onPress={() => setCategory(cat)}
              style={[styles.smallChip, { 
                borderColor: category === cat ? colors.primary : colors.surfaceBorder,
                backgroundColor: category === cat ? colors.primary : colors.surface
              }]}
            >
              <Text style={{ 
                ...typography.caption,
                color: category === cat ? '#0F1C33' : colors.textSecondary, 
                fontWeight: '600' 
              }}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Additional Comments (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Please describe your experience..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={comments}
          onChangeText={setComments}
        />

        <PrimaryButton 
          title="Submit Report" 
          onPress={submitFeedback} 
          loading={submitting} 
          style={styles.submitBtn} 
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.surfaceBorder },
  headerTitle: { ...typography.h2 },
  scroll: { padding: 24, paddingBottom: 60 },
  label: { ...typography.h3, marginBottom: 16 },
  predefinedCard: { marginBottom: 32, padding: 20, borderColor: colors.primary, borderWidth: 1, backgroundColor: 'rgba(212, 175, 55, 0.06)' },
  predefinedBranchText: { ...typography.body, fontWeight: '700', color: colors.primary, marginBottom: 4 },
  predefinedSubText: { ...typography.caption, color: colors.primary },
  branchesScroll: { marginBottom: 32 },
  chip: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 1, marginRight: 12 },
  starsContainer: { flexDirection: 'row', gap: 12, marginBottom: 32, justifyContent: 'center' },
  categoriesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 },
  smallChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  input: { height: 120, borderRadius: 16, borderWidth: 1, padding: 16, ...typography.body, marginBottom: 32, backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.textPrimary },
  submitBtn: { width: '100%' },
  successContainer: { alignItems: 'center', justifyContent: 'center' },
  successIconContainer: { marginBottom: 24 },
  successTitle: { ...typography.h1, marginBottom: 12, textAlign: 'center' },
  successMessage: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: 8 },
  successSubtext: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
});
