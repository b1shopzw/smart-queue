import React, { useState, useEffect } from 'react';
import { supabase } from './utils/supabase';

export default function UserFeedbackAdmin({ branchId }: { branchId: string }) {
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  useEffect(() => {
    fetchFeedback();
    
    // Subscribe to new feedback
    const subscription = supabase
      .channel('feedback-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_feedback', filter: `branch_id=eq.${branchId}` }, () => {
        fetchFeedback();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    }
  }, [branchId]);

  const fetchFeedback = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('user_feedback')
      .select('*, user:app_users(full_name, phone_number)')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false });

    if (data) {
      setFeedbacks(data);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('user_feedback').update({ status: newStatus }).eq('id', id);
    if (!error) {
      setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
    }
  };

  if (loading) return <div style={{padding: '24px'}}>Loading feedback records...</div>;

  return (
    <div className="panel" style={{gridColumn: 'span 3'}}>
      <div className="panel-head" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <span>Customer Feedback & Incident Reports</span>
      </div>
      <div className="panel-body" style={{padding: 0}}>
        <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px'}}>
          <thead>
            <tr style={{borderBottom: '1px solid var(--color-border)', background: '#f8fafc', color: 'var(--color-foreground-muted)'}}>
              <th style={{padding: '16px', fontWeight: 600}}>Date</th>
              <th style={{padding: '16px', fontWeight: 600}}>Customer</th>
              <th style={{padding: '16px', fontWeight: 600}}>Category</th>
              <th style={{padding: '16px', fontWeight: 600}}>Rating</th>
              <th style={{padding: '16px', fontWeight: 600}}>Comments</th>
              <th style={{padding: '16px', fontWeight: 600}}>Status</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.map(fb => (
              <tr key={fb.id} style={{borderBottom: '1px solid var(--color-border)', background: fb.status === 'UNREAD' ? '#fffbeb' : 'white'}}>
                <td style={{padding: '14px', color: 'var(--color-foreground-muted)'}}>{new Date(fb.created_at).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</td>
                <td style={{padding: '14px'}}>
                  <div style={{fontWeight: 600}}>{fb.user?.full_name || 'Guest User'}</div>
                  <div style={{fontSize: '12px', color: 'var(--color-foreground-muted)'}}>{fb.user?.phone_number || ''}</div>
                </td>
                <td style={{padding: '14px'}}>
                  <span style={{background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)'}}>{fb.category}</span>
                </td>
                <td style={{padding: '14px', fontSize: '15px'}}>{'★'.repeat(fb.rating)}{'☆'.repeat(5-fb.rating)}</td>
                <td style={{padding: '14px', maxWidth: '250px', color: 'var(--color-foreground)'}}>{fb.comments || <i style={{color:'#cbd5e1'}}>No comment provided</i>}</td>
                <td style={{padding: '14px'}}>
                  <select 
                    value={fb.status} 
                    onChange={e => updateStatus(fb.id, e.target.value)}
                    style={{
                      padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                      background: fb.status === 'UNREAD' ? '#fef2f2' : fb.status === 'REVIEWED' ? '#eff6ff' : '#f0fdf4',
                      color: fb.status === 'UNREAD' ? '#991b1b' : fb.status === 'REVIEWED' ? '#1d4ed8' : '#166534',
                      border: 'none', cursor: 'pointer'
                    }}
                  >
                    <option value="UNREAD">Unread</option>
                    <option value="REVIEWED">Reviewed</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </td>
              </tr>
            ))}
            {feedbacks.length === 0 && (
              <tr><td colSpan={6} style={{padding: '32px', textAlign: 'center', color: 'var(--color-foreground-muted)'}}>No feedback reports have been submitted yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
