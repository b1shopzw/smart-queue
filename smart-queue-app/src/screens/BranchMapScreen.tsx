import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Image, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/PrimaryButton';
import { supabase } from '../utils/supabase';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export type MapMarker = {
  branchId: string;
  branchName: string;
  latitude: number;
  longitude: number;
  orgId: string;
  orgName: string;
  orgType: 'bank' | 'id_office' | 'passport_office' | 'other';
  logoUrl?: string;
  services?: string[];
};

interface BranchMapScreenProps {
  markers?: MapMarker[];
  route?: any;
}

export default function BranchMapScreen({ markers: initialMarkers, route }: BranchMapScreenProps) {
  const navigation = useNavigation<any>();
  const [markers, setMarkers] = useState<MapMarker[]>(initialMarkers || []);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [selectedOrgType, setSelectedOrgType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(!initialMarkers || initialMarkers.length === 0);

  // 1. Query branches joined with verified organizations
  const fetchVerifiedMarkers = useCallback(async () => {
    try {
      setLoading(true);
      const { data: dbBranches, error } = await supabase
        .from('branches')
        .select(`
          id:branch_id,
          name:bank_name,
          latitude:lat,
          longitude:lng,
          services,
          active,
          organizations!inner (
            id,
            name,
            type,
            status,
            logo_url
          )
        `)
        .eq('active', true)
        .eq('organizations.status', 'verified'); // Only verified companies render on public map

      if (error) throw error;

      if (dbBranches) {
        const formattedMarkers: MapMarker[] = dbBranches.map((b: any) => {
          const org = Array.isArray(b.organizations) ? b.organizations[0] : b.organizations;
          return {
            branchId: b.id,
            branchName: b.name,
            latitude: Number(b.latitude) || -17.8292,
            longitude: Number(b.longitude) || 31.0522,
            orgId: org?.id,
            orgName: org?.name || 'Verified Partner',
            orgType: (org?.type as any) || 'bank',
            logoUrl: org?.logo_url,
            services: b.services,
          };
        });
        setMarkers(formattedMarkers);
      }
    } catch (err) {
      console.error('Error fetching verified map markers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialMarkers || initialMarkers.length === 0) {
      fetchVerifiedMarkers();
    }

    // 5. Realtime subscription: keep map in sync if an org gets suspended or verified
    const channel = supabase
      .channel('org-status-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'organizations' },
        () => {
          fetchVerifiedMarkers();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'branches' },
        () => {
          fetchVerifiedMarkers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialMarkers, fetchVerifiedMarkers]);

  // 4. Client-side filtering by organization type or search query
  const filteredMarkers = useMemo(() => {
    return markers.filter((m) => {
      const matchesType =
        selectedOrgType === 'All' ? true :
        selectedOrgType === 'Banks' ? m.orgType === 'bank' :
        selectedOrgType === 'Passport Offices' ? m.orgType === 'passport_office' :
        selectedOrgType === 'ID Centers' ? m.orgType === 'id_office' : true;

      const matchesSearch = searchQuery === '' ? true :
        m.orgName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.branchName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesType && matchesSearch;
    });
  }, [markers, selectedOrgType, searchQuery]);

  const getMarkerIconName = (type: string) => {
    switch (type) {
      case 'passport_office': return 'document-text';
      case 'id_office': return 'card';
      default: return 'business';
    }
  };

  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'passport_office': return '#E67E22';
      case 'id_office': return '#2980B9';
      default: return colors.primary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Floating Header & Search */}
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verified Organizations Map</Text>
        </View>

        {/* Company Search Input */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search company (e.g. CBZ, Makombe)..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {['All', 'Banks', 'Passport Offices', 'ID Centers'].map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setSelectedOrgType(f)}
              style={[styles.filterChip, selectedOrgType === f && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, selectedOrgType === f && styles.filterChipTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Map View */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: -17.8292,
          longitude: 31.0522,
          latitudeDelta: 0.12,
          longitudeDelta: 0.12,
        }}
      >
        {/* 3. Rendering branded custom markers */}
        {filteredMarkers.map((m) => (
          <Marker
            key={m.branchId}
            coordinate={{ latitude: m.latitude, longitude: m.longitude }}
            title={`${m.orgName} — ${m.branchName}`}
            description={m.orgType.replace('_', ' ').toUpperCase()}
            onPress={() => setSelectedMarker(m)}
          >
            <View style={[styles.markerBadge, { borderColor: getMarkerColor(m.orgType) }]}>
              {m.logoUrl ? (
                <Image source={{ uri: m.logoUrl }} style={styles.markerLogo} />
              ) : (
                <Ionicons name={getMarkerIconName(m.orgType) as any} size={20} color={getMarkerColor(m.orgType)} />
              )}
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Selected Marker Detail Card */}
      {selectedMarker && (
        <View style={styles.floatingCardContainer}>
          <GlassCard style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orgName}>{selectedMarker.orgName}</Text>
                <Text style={styles.branchName}>{selectedMarker.branchName}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedMarker(null)}>
                <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.badgeRow}>
              <View style={[styles.verifiedBadge]}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.verifiedText}>VERIFIED COMPANY</Text>
              </View>

              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{selectedMarker.orgType.replace('_', ' ').toUpperCase()}</Text>
              </View>
            </View>

            <PrimaryButton
              title="View Queue & Select Slot"
              onPress={() =>
                navigation.navigate('BranchDetail', {
                  branchId: selectedMarker.branchId,
                  bankName: `${selectedMarker.orgName} — ${selectedMarker.branchName}`,
                  orgId: selectedMarker.orgId,
                })
              }
              style={{ marginTop: 12 }}
            />
          </GlassCard>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 14,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: { ...typography.h3, fontSize: 16 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14 },
  filterRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  filterChipTextActive: { color: '#FFFFFF', fontWeight: '700' },

  map: { width: Dimensions.get('window').width, height: Dimensions.get('window').height },
  markerBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  markerLogo: { width: 28, height: 28, borderRadius: 14 },

  floatingCardContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    zIndex: 20,
  },
  card: { padding: 18, borderRadius: 24 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  orgName: { ...typography.h3, fontSize: 18, color: colors.textPrimary },
  branchName: { ...typography.body, color: colors.textSecondary, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 8, marginVertical: 10 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedText: { ...typography.caption, color: '#047857', fontWeight: '800', marginLeft: 4, fontSize: 10 },
  typeBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: { ...typography.caption, color: colors.primary, fontWeight: '700', fontSize: 10 },
});
