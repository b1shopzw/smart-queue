import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import { supabase } from '../utils/supabase';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export type Branch = {
  id: string;
  name: string;
  type: 'bank' | 'id' | 'passport';
  latitude: number;
  longitude: number;
};

interface BranchMapScreenProps {
  branches?: Branch[];
  route?: any;
}

export default function BranchMapScreen({ branches: initialBranches, route }: BranchMapScreenProps) {
  const navigation = useNavigation<any>();
  const [mapBranches, setMapBranches] = useState<Branch[]>(initialBranches || []);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(!initialBranches || initialBranches.length === 0);

  const serviceTypeFilter = route?.params?.serviceType;

  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      const { data: dbBranches, error } = await supabase
        .from('branches')
        .select(`
          id:branch_id,
          name:bank_name,
          type:institution_type,
          latitude:lat,
          longitude:lng
        `)
        .eq('active', true);

      if (error) throw error;

      if (dbBranches && dbBranches.length > 0) {
        const formatted: Branch[] = dbBranches.map((b: any) => ({
          id: b.id,
          name: b.name,
          type: b.type === 'national_id' ? 'id' : (b.type as 'bank' | 'passport' | 'id'),
          latitude: Number(b.latitude) || -17.8292,
          longitude: Number(b.longitude) || 31.0522,
        }));
        setMapBranches(formatted);
      }
    } catch (err) {
      console.error('Error loading branches for map:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialBranches || initialBranches.length === 0) {
      fetchBranches();
    }
  }, [initialBranches, fetchBranches]);

  const handleSelectBranch = (branch: Branch) => {
    setSelectedBranch(branch);
  };

  const navigateToBranchDetails = (branch: Branch) => {
    navigation.navigate('BranchDetail', {
      branchId: branch.id,
      bankName: branch.name,
      serviceType: branch.type === 'passport' ? 'Passport Offices' : branch.type === 'id' ? 'National ID' : 'Banks'
    });
  };

  const filteredBranches = serviceTypeFilter
    ? mapBranches.filter(b => b.type === serviceTypeFilter)
    : mapBranches;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Interactive Branch Map</Text>
      </View>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: -17.8292, // Harare central
          longitude: 31.0522,
          latitudeDelta: 0.15,
          longitudeDelta: 0.15,
        }}
      >
        {filteredBranches.map((b) => (
          <Marker
            key={b.id}
            coordinate={{ latitude: b.latitude, longitude: b.longitude }}
            title={b.name}
            description={`Type: ${b.type.toUpperCase()}`}
            pinColor={b.type === 'passport' ? '#E67E22' : b.type === 'id' ? '#2980B9' : colors.primary}
            onPress={() => handleSelectBranch(b)}
          />
        ))}
      </MapView>

      {selectedBranch && (
        <View style={styles.floatingCardContainer}>
          <GlassCard style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.branchName} numberOfLines={1}>{selectedBranch.name}</Text>
              <TouchableOpacity onPress={() => setSelectedBranch(null)}>
                <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.typeBadge}>
              <Ionicons 
                name={selectedBranch.type === 'passport' ? 'document-text' : selectedBranch.type === 'id' ? 'card' : 'business'} 
                size={16} 
                color={colors.primary} 
              />
              <Text style={styles.typeBadgeText}>{selectedBranch.type.toUpperCase()}</Text>
            </View>

            <PrimaryButton
              title="View Queue & Join"
              onPress={() => navigateToBranchDetails(selectedBranch)}
              style={styles.actionButton}
            />
          </GlassCard>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: { ...typography.h3, fontSize: 16 },
  map: { width: Dimensions.get('window').width, height: Dimensions.get('window').height },
  floatingCardContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    zIndex: 20,
  },
  card: { padding: 18, borderRadius: 24 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  branchName: { ...typography.h3, flex: 1, marginRight: 8 },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  typeBadgeText: { ...typography.caption, color: colors.primary, marginLeft: 6, fontWeight: '700' },
  actionButton: { marginTop: 4 },
});
