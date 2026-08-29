import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from './utils/supabase';

export default function BranchSettingsAdmin({ branchId }: { branchId: string }) {
  const [branch, setBranch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadBranch() {
      const { data, error } = await supabase.from('branches').select('*').eq('branch_id', branchId).single();
      if (data && !error) {
        setBranch(data);
      }
      setLoading(false);
    }
    loadBranch();

    const channel = supabase
      .channel(`realtime_settings_${branchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'branches', filter: `branch_id=eq.${branchId}` }, () => {
        loadBranch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [branchId]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setBranch((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? (name === 'services' ? [value] : checked) : value
    }));
  };

  const handleServicesChange = (e: any) => {
    const val = e.target.value;
    setBranch((prev: any) => {
      const services = prev.services || [];
      if (services.includes(val)) {
        return { ...prev, services: services.filter((s: string) => s !== val) };
      } else {
        return { ...prev, services: [...services, val] };
      }
    });
  }

  const saveSettings = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('branches')
      .update({
        branch_num: parseInt(branch.branch_num),
        active: branch.active,
        operating_hours_start: branch.operating_hours_start,
        operating_hours_end: branch.operating_hours_end,
        max_capacity: parseInt(branch.max_capacity),
        services: branch.services
      })
      .eq('branch_id', branchId);
    
    setSaving(false);
    if (!error) {
      setMessage('Settings updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('Error updating settings.');
    }
  };

  if (loading) return <div style={{padding: '24px'}}>Loading settings...</div>;
  if (!branch) return <div style={{padding: '24px', color:'red'}}>Error loading branch data.</div>;

  const SERVICE_OPTIONS = ['Banking', 'Passport', 'National ID', 'VIP Services', 'Western Union', 'Mukuru'];

  return (
    <div style={{background: 'white', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '32px'}}>
      <h2 style={{marginTop: 0, marginBottom: '24px'}}>Branch Configuration</h2>
      
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px'}}>
        <div>
          <label style={{display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-foreground-muted)'}}>Branch Name (Read-only)</label>
          <input type="text" value={branch.bank_name} disabled style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: '#f9fafb'}} />
        </div>
        <div>
          <label style={{display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-foreground-muted)'}}>Branch Number</label>
          <input type="number" name="branch_num" value={branch.branch_num} onChange={handleChange} style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)'}} />
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '32px'}}>
        <div>
          <label style={{display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-foreground-muted)'}}>Opening Time</label>
          <input type="time" name="operating_hours_start" value={branch.operating_hours_start || '08:00'} onChange={handleChange} style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)'}} />
        </div>
        <div>
          <label style={{display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-foreground-muted)'}}>Closing Time</label>
          <input type="time" name="operating_hours_end" value={branch.operating_hours_end || '16:00'} onChange={handleChange} style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)'}} />
        </div>
        <div>
          <label style={{display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-foreground-muted)'}}>Max Daily Capacity</label>
          <input type="number" name="max_capacity" value={branch.max_capacity || 100} onChange={handleChange} style={{width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)'}} />
        </div>
      </div>

      <div style={{marginBottom: '32px'}}>
        <label style={{display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '12px'}}>Services Offered</label>
        <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap'}}>
          {SERVICE_OPTIONS.map(service => (
            <label key={service} style={{display: 'flex', alignItems: 'center', gap: '8px', background: '#f3f4f6', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer'}}>
              <input type="checkbox" value={service} checked={(branch.services || []).includes(service)} onChange={handleServicesChange} />
              <span style={{fontSize: '14px'}}>{service}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
        <input type="checkbox" id="branch_active" name="active" checked={branch.active} onChange={handleChange} style={{width: '20px', height: '20px'}} />
        <div>
          <label htmlFor="branch_active" style={{display: 'block', fontSize: '15px', fontWeight: 700, cursor: 'pointer'}}>Branch is Active</label>
          <span style={{fontSize: '13px', color: 'var(--color-foreground-muted)'}}>If unchecked, branch will not appear for new bookings.</span>
        </div>
      </div>

      <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
        <motion.button 
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={saveSettings}
          disabled={saving}
          style={{background: 'var(--color-primary)', color: 'white', border: 'none', padding: '14px 32px', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: saving ? 'wait' : 'pointer'}}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </motion.button>
        {message && <span style={{color: message.includes('Error') ? 'red' : 'green', fontWeight: 600, fontSize: '14px'}}>{message}</span>}
      </div>

    </div>
  );
}
