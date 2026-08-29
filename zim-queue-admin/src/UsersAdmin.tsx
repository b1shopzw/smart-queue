import { useState, useEffect } from 'react';
import { Shield, User, Search, Trash2, CheckCircle2, UserCheck, Building } from 'lucide-react';
import { supabase } from './utils/supabase';

export default function UsersAdmin() {
  const [viewTab, setViewTab] = useState<'admin' | 'citizens'>('admin');
  const [adminAccounts, setAdminAccounts] = useState<any[]>([]);
  const [citizenUsers, setCitizenUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAllAccounts();

    const channel = supabase
      .channel('realtime_users_directory')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, () => {
        fetchAllAccounts();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_users' }, () => {
        fetchAllAccounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAllAccounts = async () => {
    setLoading(true);
    try {
      // 1. Fetch created Admin & Staff Accounts
      const { data: empData } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (empData) {
        setAdminAccounts(empData);
      }

      // 2. Fetch App Citizens
      const { data: userData } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (userData) {
        setCitizenUsers(userData);
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteAdminAccount = async (id: string, empId: string) => {
    if (!confirm(`Are you sure you want to remove admin account ${empId}?`)) return;
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (!error) {
      setAdminAccounts(prev => prev.filter(a => a.id !== id));
    } else {
      alert('Failed to delete account: ' + error.message);
    }
  };

  const toggleFlag = async (userId: string, currentFlag: boolean) => {
    const { error } = await supabase.from('app_users').update({ is_flagged: !currentFlag }).eq('id', userId);
    if (!error) {
      setCitizenUsers(prev => prev.map(u => u.id === userId ? { ...u, is_flagged: !currentFlag } : u));
    }
  };

  const filteredAdmins = adminAccounts.filter(a =>
    (a.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.employee_id || a.emp_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.branch_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.service_type || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCitizens = citizenUsers.filter(u =>
    (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.national_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.phone_number || '').includes(searchTerm)
  );

  return (
    <div className="panel" style={{ gridColumn: 'span 3' }}>
      {/* Top Bar Header */}
      <div className="panel-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '15px', fontWeight: 600 }}>Accounts & Users Directory</span>
          
          {/* Sub-tabs */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--color-background)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
            <button
              onClick={() => setViewTab('admin')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '5px 12px', border: 'none', borderRadius: 'var(--radius-sm)',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                background: viewTab === 'admin' ? 'var(--color-panel)' : 'transparent',
                color: viewTab === 'admin' ? 'var(--color-primary)' : 'var(--color-foreground-muted)',
                transition: '150ms ease'
              }}
            >
              <Shield size={14} /> Admin & Staff Accounts ({adminAccounts.length})
            </button>
            <button
              onClick={() => setViewTab('citizens')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '5px 12px', border: 'none', borderRadius: 'var(--radius-sm)',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                background: viewTab === 'citizens' ? 'var(--color-panel)' : 'transparent',
                color: viewTab === 'citizens' ? 'var(--color-primary)' : 'var(--color-foreground-muted)',
                transition: '150ms ease'
              }}
            >
              <User size={14} /> App Citizens ({citizenUsers.length})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-foreground-muted)' }} />
          <input
            type="text"
            placeholder={viewTab === 'admin' ? "Search Name, Employee ID, Email, Branch..." : "Search Name, National ID, Phone..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px 12px 8px 32px', fontSize: '13px' }}
          />
        </div>
      </div>

      <div className="panel-body" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-foreground-muted)', fontSize: '13px' }}>
            Fetching account telemetry from Supabase...
          </div>
        ) : viewTab === 'admin' ? (
          /* Admin Accounts Table */
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-panel-hover)', color: 'var(--color-foreground-muted)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Employee ID</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Admin Name</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Email Address</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Service Entity</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Allocated Branch</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Provisioned Date</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.map(acc => (
                <tr key={acc.id || acc.employee_id} style={{ borderBottom: '1px solid var(--color-border)' }} className="list-item">
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-primary)' }}>
                    {acc.employee_id || acc.emp_id || 'BNK000'}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-foreground)' }}>
                    {acc.full_name || 'Admin User'}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-foreground-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                    {acc.email || '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="badge bb" style={{ textTransform: 'capitalize' }}>
                      <Building size={12} /> {acc.service_type || 'General'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-foreground-muted)' }}>
                    {acc.branch_name || 'All Branches'}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-foreground-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                    {acc.created_at ? new Date(acc.created_at).toLocaleDateString() : 'Active'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => deleteAdminAccount(acc.id, acc.employee_id || acc.emp_id)}
                      className="action-btn-ghost"
                      style={{ padding: '4px 8px', fontSize: '11px', color: '#E5484D', borderColor: 'rgba(229,72,77,0.2)' }}
                      title="Revoke Admin Access"
                    >
                      <Trash2 size={13} /> Revoke
                    </button>
                  </td>
                </tr>
              ))}
              {filteredAdmins.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--color-foreground-muted)' }}>
                    No admin or staff accounts found matching query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          /* App Citizens Table */
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-panel-hover)', color: 'var(--color-foreground-muted)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Citizen Name</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>National ID</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Phone Number</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Joined Platform</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Status / Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCitizens.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--color-border)' }} className="list-item">
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--color-foreground)' }}>{user.full_name}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: 'var(--color-foreground-muted)' }}>{user.national_id}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', color: 'var(--color-foreground-muted)' }}>{user.phone_number}</td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-foreground-muted)' }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    {user.is_flagged ? (
                      <button
                        onClick={() => toggleFlag(user.id, true)}
                        className="badge br"
                        style={{ cursor: 'pointer' }}
                      >
                        ● Flagged (Click to restore)
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleFlag(user.id, false)}
                        className="badge bg"
                        style={{ cursor: 'pointer' }}
                      >
                        <UserCheck size={12} /> Active
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredCitizens.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--color-foreground-muted)' }}>
                    No public queue app users found matching query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

