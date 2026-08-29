import React, { useState } from 'react';
import { Mail, UserPlus, Copy, Check } from 'lucide-react';
import { supabase } from './utils/supabase';

interface OrgStaffInviteModalProps {
  orgId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrgStaffInviteModal({ orgId, isOpen, onClose }: OrgStaffInviteModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [loading, setLoading] = useState(false);
  const [createdInviteToken, setCreatedInviteToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      // Generate 64-char secure random token
      const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiration

      const { error } = await supabase
        .from('org_invites')
        .insert({
          org_id: orgId,
          email,
          role,
          token,
          expires_at: expiresAt.toISOString(),
          created_by: user?.id || '00000000-0000-0000-0000-000000000000'
        });

      if (error) throw error;

      setCreatedInviteToken(token);
    } catch (err: any) {
      alert('Failed to generate invite: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    if (!createdInviteToken) return;
    const link = `https://smartqueue.co.zw/accept-invite?token=${createdInviteToken}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15,23,42,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{ background: '#FFF', padding: 32, borderRadius: 20, maxWidth: 500, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserPlus size={24} color="#D4AF37" />
            Invite Organization Staff
          </h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: '#94A3B8' }}>×</button>
        </div>

        {createdInviteToken ? (
          <div>
            <div style={{ background: '#ECFDF5', padding: 16, borderRadius: 12, border: '1px solid #A7F3D0', marginBottom: 20 }}>
              <p style={{ margin: 0, color: '#065F46', fontWeight: 600, fontSize: 14 }}>
                ✅ Secure Invitation Generated!
              </p>
              <p style={{ margin: '6px 0 0 0', color: '#047857', fontSize: 13 }}>
                Share this single-use link with <strong>{email}</strong>. Token expires in 7 days.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              <input
                type="text"
                readOnly
                value={`https://smartqueue.co.zw/accept-invite?token=${createdInviteToken}`}
                style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, background: '#F8FAFC' }}
              />
              <button
                onClick={copyInviteLink}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#D4AF37',
                  color: '#FFF',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>

            <button
              onClick={() => { setCreatedInviteToken(null); setEmail(''); }}
              style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #CBD5E1', background: '#FFF', fontWeight: 600, cursor: 'pointer' }}
            >
              Invite Another Member
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreateInvite}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                Staff Member Email Address *
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 12 }} />
                <input
                  type="email"
                  required
                  placeholder="employee@organisation.co.zw"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: 10, border: '1px solid #CBD5E1', outline: 'none', fontSize: 14 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                Assigned Role *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #CBD5E1', outline: 'none', fontSize: 14, background: '#FFF' }}
              >
                <option value="staff">Staff (Branch Queue Operator)</option>
                <option value="admin">Org Admin (Branch & Staff Management)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid #CBD5E1', background: '#FFF', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#D4AF37', color: '#FFF', fontWeight: 700, cursor: 'pointer' }}
              >
                {loading ? 'Generating Link...' : 'Generate Invite Link'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
