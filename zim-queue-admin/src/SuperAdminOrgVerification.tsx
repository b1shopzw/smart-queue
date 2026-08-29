import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Building2, CheckCircle2, XCircle, Clock, ShieldCheck, Search } from 'lucide-react';
import { supabase } from './utils/supabase';

export default function SuperAdminOrgVerification() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [rejectingOrg, setRejectingOrg] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrganizations(data || []);
    } catch (err) {
      console.error('Error fetching organizations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();

    const channel = supabase
      .channel('realtime_superadmin_orgs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'organizations' }, () => {
        fetchOrganizations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrganizations]);

  const handleApprove = async (org: any) => {
    try {
      setProcessingId(org.id);
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('organizations')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: user?.id || null,
        })
        .eq('id', org.id);

      if (error) throw error;

      await fetchOrganizations();
    } catch (err: any) {
      alert('Verification Error: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectingOrg) return;
    try {
      setProcessingId(rejectingOrg.id);

      const { error } = await supabase
        .from('organizations')
        .update({
          status: 'rejected',
          rejection_reason: rejectReason || 'Documentation or registration number could not be verified.',
        })
        .eq('id', rejectingOrg.id);

      if (error) throw error;

      setRejectingOrg(null);
      setRejectReason('');
      await fetchOrganizations();
    } catch (err: any) {
      alert('Rejection Error: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredOrgs = organizations.filter(o => {
    const matchesTab = o.status === activeTab;
    const matchesSearch = o.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.registration_number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const pendingCount = organizations.filter(o => o.status === 'pending').length;

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto', color: '#0F172A' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 12 }}>
            <ShieldCheck size={32} color="#D4AF37" />
            Organization Verification Center
          </h1>
          <p style={{ color: '#64748B', marginTop: 6, fontSize: 15 }}>
            Review, verify, and audit platform organization onboarding applications across Zimbabwe.
          </p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, background: '#F1F5F9', padding: 4, borderRadius: 12 }}>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'pending' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'pending' ? '#0F172A' : '#64748B',
              boxShadow: activeTab === 'pending' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Clock size={16} color={activeTab === 'pending' ? '#E67E22' : '#64748B'} />
            Pending Review
            {pendingCount > 0 && (
              <span style={{ background: '#E67E22', color: '#FFF', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('verified')}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'verified' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'verified' ? '#0F172A' : '#64748B',
              boxShadow: activeTab === 'verified' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <CheckCircle2 size={16} color={activeTab === 'verified' ? '#10B981' : '#64748B'} />
            Verified Organizations
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'rejected' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'rejected' ? '#0F172A' : '#64748B',
              boxShadow: activeTab === 'rejected' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <XCircle size={16} color={activeTab === 'rejected' ? '#EF4444' : '#64748B'} />
            Rejected
          </button>
        </div>

        <div style={{ position: 'relative', width: 320 }}>
          <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: 14, top: 12 }} />
          <input
            type="text"
            placeholder="Search org name or reg number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 40px',
              borderRadius: 10,
              border: '1px solid #E2E8F0',
              outline: 'none',
              fontSize: 14
            }}
          />
        </div>
      </div>

      {/* List / Cards */}
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#64748B' }}>Loading applications...</div>
      ) : filteredOrgs.length === 0 ? (
        <div style={{ padding: 64, textAlign: 'center', background: '#F8FAFC', borderRadius: 16, border: '1px dashed #CBD5E1' }}>
          <Building2 size={48} color="#94A3B8" style={{ marginBottom: 12 }} />
          <h3 style={{ margin: 0, color: '#334155' }}>No organizations found</h3>
          <p style={{ color: '#64748B', fontSize: 14 }}>There are no {activeTab} organization applications matching your search.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {filteredOrgs.map(org => (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 16,
                padding: 24,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0F172A' }}>{org.name}</h3>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    background: org.type === 'bank' ? '#E0F2FE' : org.type === 'passport_office' ? '#FFEDD5' : '#FEF3C7',
                    color: org.type === 'bank' ? '#0369A1' : org.type === 'passport_office' ? '#C2410C' : '#B45309'
                  }}>
                    {org.type.replace('_', ' ')}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 24, color: '#475569', fontSize: 14, flexWrap: 'wrap' }}>
                  <div><strong>Reg #:</strong> {org.registration_number}</div>
                  <div><strong>Email:</strong> {org.contact_email}</div>
                  <div><strong>Phone:</strong> {org.contact_phone}</div>
                  <div><strong>Applied:</strong> {new Date(org.created_at).toLocaleDateString()}</div>
                </div>

                {org.rejection_reason && (
                  <div style={{ marginTop: 12, color: '#DC2626', fontSize: 13, background: '#FEF2F2', padding: '8px 12px', borderRadius: 8 }}>
                    <strong>Rejection Reason:</strong> {org.rejection_reason}
                  </div>
                )}
              </div>

              {activeTab === 'pending' && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => setRejectingOrg(org)}
                    disabled={processingId === org.id}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 10,
                      border: '1px solid #FCA5A5',
                      background: '#FFF',
                      color: '#DC2626',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <XCircle size={16} /> Reject
                  </button>

                  <button
                    onClick={() => handleApprove(org)}
                    disabled={processingId === org.id}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 10,
                      border: 'none',
                      background: '#10B981',
                      color: '#FFF',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 4px rgba(16,185,129,0.2)'
                    }}
                  >
                    <CheckCircle2 size={16} /> Approve & Verify
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingOrg && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15,23,42,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ background: '#FFF', padding: 32, borderRadius: 20, maxWidth: 480, width: '100%' }}>
            <h3 style={{ margin: 0, marginBottom: 8, color: '#0F172A' }}>Reject Application</h3>
            <p style={{ color: '#64748B', fontSize: 14, marginBottom: 16 }}>
              Provide a reason for rejecting <strong>{rejectingOrg.name}</strong>.
            </p>

            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Registration number does not match government database records."
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                marginBottom: 20,
                outline: 'none',
                fontSize: 14
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => setRejectingOrg(null)}
                style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFF', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#EF4444', color: '#FFF', fontWeight: 600, cursor: 'pointer' }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
