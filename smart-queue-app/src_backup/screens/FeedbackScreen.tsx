import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FeedbackScreen({ navigation, route }: any) {
  const isDark = false;
  const theme = useMemo(() => ({
    background: '#F9F6F0',
    card: '#FFFFFF',
    text: '#3E2723',
    textMuted: '#8D6E63',
    border: '#EFEBE9',
    primary: '#D4A373'
  }), [isDark]);

  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(route.params?.branchId || null);
  const predefinedBranchName = route.params?.branchName || null;
  const isPredefined = !!route.params?.branchId;
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState('Staff Behavior');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  const CATEGORIES = ['Staff Behavior', 'Wait Time', 'Facility/Cleanliness', 'System Issue', 'Other'];

  const submitFeedback = async () => {
    if (!selectedBranch) return Alert.alert('Error', 'Please select a branch.');
    if (rating === 0) return Alert.alert('Error', 'Please select a star rating.');
    
    setSubmitting(true);
    let userId = null;
    
    // Get user id
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
    } else {
      // It might be a local tester
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
      comments
    });

    setSubmitting(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Thank You', 'Your feedback has been successfully submitted to the branch management.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems:'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Send Report</Text>
        <View style={{width: 44}} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.label, {color: theme.text}]}>Which branch did you visit?</Text>
        
        {isPredefined ? (
          <View style={{marginBottom: 24, padding: 16, backgroundColor: 'rgba(212, 163, 115, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: theme.primary}}>
            <Text style={{color: theme.primary, fontWeight: '600', fontSize: 16}}>
              {predefinedBranchName}
            </Text>
            <Text style={{color: theme.primary, fontSize: 13, marginTop: 4}}>Feedback linked to specific ticket.</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 24}}>
            {branches.map(b => (
              <TouchableOpacity 
                key={b.branch_id}
                onPress={() => setSelectedBranch(b.branch_id)}
                style={[styles.chip, { 
                  borderColor: selectedBranch === b.branch_id ? theme.primary : theme.border,
                  backgroundColor: selectedBranch === b.branch_id ? 'rgba(212, 163, 115, 0.1)' : theme.card
                }]}
              >
                <Text style={{color: selectedBranch === b.branch_id ? theme.primary : theme.textMuted, fontWeight: '600'}}>
                  {b.bank_name} - {b.suburb}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <Text style={[styles.label, {color: theme.text}]}>Rate your experience</Text>
        <View style={{flexDirection: 'row', gap: 12, marginBottom: 32, justifyContent: 'center'}}>
          {[1,2,3,4,5].map(star => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Ionicons 
                name={rating >= star ? 'star' : 'star-outline'} 
                size={40} 
                color={rating >= star ? '#fbbf24' : theme.textMuted} 
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, {color: theme.text}]}>What is your feedback regarding?</Text>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24}}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity 
              key={cat}
              onPress={() => setCategory(cat)}
              style={[styles.smallChip, { 
                borderColor: category === cat ? theme.primary : theme.border,
                backgroundColor: category === cat ? theme.primary : 'transparent'
              }]}
            >
              <Text style={{color: category === cat ? '#fff' : theme.textMuted, fontSize: 13, fontWeight: '600'}}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, {color: theme.text}]}>Additional Comments (Optional)</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
          placeholder="Please describe your experience... (minimum 10 characters)"
          placeholderTextColor={theme.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={comments}
          onChangeText={setComments}
        />

        <TouchableOpacity 
          style={[styles.submitBtn, { opacity: submitting ? 0.7 : 1 }]} 
          onPress={submitFeedback}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Report</Text>}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  scroll: { padding: 24 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  chip: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginRight: 12 },
  smallChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  input: { height: 120, borderRadius: 12, borderWidth: 1, padding: 16, fontSize: 15, marginBottom: 32 },
  submitBtn: { backgroundColor: '#D4A373', padding: 16, borderRadius: 12, alignItems: 'center' },
  submitText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
