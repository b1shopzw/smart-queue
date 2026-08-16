import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://aifpnenivkozlisgedvg.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZnBuZW5pdmtvemxpc2dlZHZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDA4MjEsImV4cCI6MjA5MTQ3NjgyMX0.K2lHRLxz9dA5Xr-A1q6F_oSNXAIq3be-xIKUc6Jr9k4';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
