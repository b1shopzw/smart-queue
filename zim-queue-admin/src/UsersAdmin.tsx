import React, { useState, useEffect } from 'react';
import { supabase } from './utils/supabase';

export default function UsersAdmin() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('app_users').select('*').order('created_at', { ascending: false }).limit(100);
    if (data) {
      setUsers(data);
    }
    setLoading(false);
  };

  const toggleFlag = async (userId: string, currentFlag: boolean) => {
    const { error } = await supabase.from('app_users').update({ is_flagged: !currentFlag }).eq('id', userId);
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_flagged: !currentFlag } : u));
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.national_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone_number?.includes(searchTerm)
  );

  if (loading) return <div style={{padding: '24px'}}>Loading users...</div>;

  return (
    <div className="panel" style={{gridColumn: 'span 3'}}>
      <div className="panel-head" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <span>User Management (Recent 100)</span>
        <input 
          type="text" 
          placeholder="Search Name, ID, or Phone..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', width: '250px', fontSize: '13px'}}
        />
      </div>
      <div className="panel-body" style={{padding: 0}}>
        <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px'}}>
          <thead>
            <tr style={{borderBottom: '1px solid var(--color-border)', background: '#f8fafc', color: 'var(--color-foreground-muted)'}}>
              <th style={{padding: '16px', fontWeight: 600}}>Full Name</th>
              <th style={{padding: '16px', fontWeight: 600}}>National ID</th>
              <th style={{padding: '16px', fontWeight: 600}}>Phone Number</th>
              <th style={{padding: '16px', fontWeight: 600}}>Joined Platform</th>
              <th style={{padding: '16px', fontWeight: 600}}>Status / Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} style={{borderBottom: '1px solid var(--color-border)', background: user.is_flagged ? '#fef2f2' : 'white'}}>
                <td style={{padding: '16px', fontWeight: 500, color: 'var(--color-foreground)'}}>{user.full_name}</td>
                <td style={{padding: '16px', color: 'var(--color-foreground-muted)'}}>{user.national_id}</td>
                <td style={{padding: '16px', color: 'var(--color-foreground-muted)'}}>{user.phone_number}</td>
                <td style={{padding: '16px', color: 'var(--color-foreground-muted)'}}>{new Date(user.created_at).toLocaleDateString()}</td>
                <td style={{padding: '16px'}}>
                  {user.is_flagged ? (
                    <button 
                      onClick={() => toggleFlag(user.id, true)}
                      style={{background: 'white', color: '#b91c1c', border: '1px solid #fca5a5', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer'}}
                    >
                      Unflag User
                    </button>
                  ) : (
                    <button 
                      onClick={() => toggleFlag(user.id, false)}
                      style={{background: '#fef2f2', color: '#b91c1c', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer'}}
                    >
                      Flag (Abuse)
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr><td colSpan={5} style={{padding: '32px', textAlign: 'center', color: 'var(--color-foreground-muted)'}}>No users found matching search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
