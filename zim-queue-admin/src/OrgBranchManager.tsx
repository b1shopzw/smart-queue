import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, MapPin } from 'lucide-react';
import { supabase } from './utils/supabase';

interface OrgBranchManagerProps {
  orgId: string;
}

export default function OrgBranchManager({ orgId }: OrgBranchManagerProps) {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [branchName, setBranchName] = useState('');
  const [city, setCity] = useState('Harare');
  const [suburb, setSuburb] = useState('');
  const [lat, setLat] = useState('-17.8292');
  const [lng, setLng] = useState('31.0522');
  const [services, setServices] = useState('General Enquiries, Document Processing');
  const [saving, setSaving] = useState(false);

  const fetchOrgBranches = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('org_id', orgId)
        .order('branch_num', { ascending: true });

      if (error) throw error;
      setBranches(data || []);
    } catch (err) {
      console.error('Error fetching org branches:', err);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchOrgBranches();

    const channel = supabase
      .channel(`realtime_org_branches_${orgId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'branches', filter: `org_id=eq.${orgId}` }, () => {
        fetchOrgBranches();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrgBranches, orgId]);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName || !city || !suburb) return;

    try {
      setSaving(true);
      const serviceArray = services.split(',').map(s => s.trim()).filter(Boolean);

      const newBranchId = `org-${orgId.slice(0, 4)}-${Date.now().toString().slice(-4)}`;

      const { error } = await supabase
        .from('branches')
        .insert({
          branch_id: newBranchId,
          org_id: orgId,
          bank_name: branchName,
          city,
          suburb,
          lat: parseFloat(lat) || -17.8292,
          lng: parseFloat(lng) || 31.0522,
          institution_type: 'bank',
          branch_num: branches.length + 1,
          services: serviceArray.length > 0 ? serviceArray : ['General Queue'],
          active: true,
        });

      if (error) throw error;

      // Reset form
      setBranchName('');
      setSuburb('');
      setIsCreating(false);
      await fetchOrgBranches();
    } catch (err: any) {
      alert('Failed to add branch: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: '#FFFFFF', padding: 28, borderRadius: 20, border: '1px solid #E2E8F0', marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building2 size={24} color="#D4AF37" />
            Organization Branches & Centers
          </h2>
          <p style={{ color: '#64748B', fontSize: 14, margin: '4px 0 0 0' }}>
            Manage active service points and coordinates tied to your verified organization.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          style={{
            padding: '10px 18px',
            borderRadius: 10,
            border: 'none',
            background: '#D4AF37',
            color: '#FFF',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 2px 4px rgba(212,175,55,0.25)'
          }}
        >
          <Plus size={18} /> Add New Branch
        </button>
      </div>

      {/* New Branch Form */}
      {isCreating && (
        <form onSubmit={handleCreateBranch} style={{ background: '#F8FAFC', padding: 24, borderRadius: 16, border: '1px solid #E2E8F0', marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: '#0F172A' }}>Add Organization Branch</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Branch Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. First Capital Bank - Avondale"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #CBD5E1', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>City *</label>
              <input
                type="text"
                required
                placeholder="e.g. Harare"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #CBD5E1', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Suburb / District *</label>
              <input
                type="text"
                required
                placeholder="e.g. Avondale"
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #CBD5E1', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Latitude</label>
              <input
                type="text"
                placeholder="-17.8292"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #CBD5E1', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Longitude</label>
              <input
                type="text"
                placeholder="31.0522"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #CBD5E1', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Services Offered (Comma Separated)</label>
            <input
              type="text"
              placeholder="e.g. Cash Deposits, Foreign Currency, Customer Support"
              value={services}
              onChange={(e) => setServices(e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #CBD5E1', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFF', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#D4AF37', color: '#FFF', fontWeight: 700, cursor: 'pointer' }}
            >
              {saving ? 'Saving...' : 'Save Branch'}
            </button>
          </div>
        </form>
      )}

      {/* Branch List */}
      {loading ? (
        <p style={{ color: '#64748B' }}>Loading branch locations...</p>
      ) : branches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, background: '#F8FAFC', borderRadius: 12, border: '1px dashed #CBD5E1' }}>
          <MapPin size={36} color="#94A3B8" style={{ marginBottom: 8 }} />
          <p style={{ margin: 0, color: '#64748B' }}>No branches added yet. Click "Add New Branch" above.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {branches.map((b) => (
            <div key={b.branch_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={18} color="#D4AF37" />
                  {b.bank_name}
                </div>
                <div style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>
                  {b.city} ({b.suburb}) • Coordinates: {b.lat}, {b.lng}
                </div>
              </div>

              <span style={{ padding: '4px 12px', borderRadius: 12, background: '#DCFCE7', color: '#166534', fontWeight: 700, fontSize: 12 }}>
                ACTIVE
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
