import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './utils/supabase';
import { apiRequest } from './utils/api';

// Helper to format timestamps
function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function LiveQueueAdmin({ branchId }: { branchId: string }) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      const data = await apiRequest(`/queue/branch/${branchId}`);
      setTickets(data);
    } catch (err) {
      console.error('Failed to fetch queue from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();

    // Subscribe to realtime changes in this branch via Supabase
    // even though we fetch via backend, Supabase still provides real-time notifications
    const subscription = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queue_tickets', filter: `branch_id=eq.${branchId}` },
        () => {
          fetchTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [branchId]);

  const callNext = async () => {
    try {
      await apiRequest(`/queue/next/${branchId}`, { method: 'POST' });
      fetchTickets();
    } catch (err: any) {
      alert('Error calling next ticket: ' + err.message);
    }
  };

  const updateStatus = async (ticketId: string, newStatus: string) => {
    // For specific updates like PAUSE or CANCEL, we might still use Supabase or add backend endpoints
    // But for 'SERVED', we should use the 'callNext' logic if it applies.
    if (newStatus === 'SERVED') {
      await callNext();
      return;
    }

    const updates: any = { status: newStatus };
    await supabase.from('queue_tickets').update(updates).eq('id', ticketId);
    fetchTickets();
  };

  const resetQueue = async () => {
    if (!window.confirm("Are you sure you want to reset the queue? All waiting tickets will be cancelled.")) return;
    setTickets([]);
    await supabase.from('queue_tickets')
      .update({ status: 'CANCELLED' })
      .eq('branch_id', branchId)
      .in('status', ['WAITING', 'PAUSED']);
    fetchTickets();
  };

  if (loading) return <div style={{padding: '24px'}}>Loading live queue...</div>;

  const currentServing = tickets.length > 0 ? tickets[0] : null;
  const nextUp = tickets.slice(1, 6);

  return (
    <div style={{display:'flex', flexDirection:'column', gap:'24px'}}>
      
      {/* Current Serving Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, #1e40af 100%)',
          borderRadius: '16px', padding: '32px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}
      >
        <div>
          <div style={{fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, opacity: 0.8, marginBottom: '8px'}}>Now Serving</div>
          {currentServing ? (
            <div style={{display: 'flex', alignItems: 'center', gap: '24px'}}>
              <div style={{fontSize: '56px', fontWeight: 800, fontFamily: '"Fira Code", monospace'}}>{currentServing.ticket_number}</div>
              <div>
                <div style={{fontSize: '20px', fontWeight: 600}}>{currentServing.user?.full_name || 'Walk-in Customer'}</div>
                <div style={{fontSize: '14px', opacity: 0.8}}>Priority: {currentServing.priority_level} • Joined <span style={{fontWeight: 700}}>{formatTime(new Date(currentServing.joined_at))}</span></div>
              </div>
            </div>
          ) : (
            <div style={{fontSize: '32px', fontWeight: 700}}>Queue is empty</div>
          )}
        </div>

        {currentServing && (
          <div style={{display: 'flex', gap: '12px'}}>
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => updateStatus(currentServing.id, 'SERVED')}
              style={{background: '#10b981', border: 'none', color: 'white', padding: '16px 24px', borderRadius: '12px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)'}}
            >
              Complete (Call Next)
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => updateStatus(currentServing.id, 'SKIPPED')}
              style={{background: '#EF4444', border: 'none', color: 'white', padding: '16px 24px', borderRadius: '12px', fontSize: '16px', fontWeight: 600, cursor: 'pointer'}}
            >
              Skip (No Show)
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* Up Next List */}
      <div className="panel" style={{flex: 1}}>
        <div className="panel-head" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div>Next in Queue <span style={{background: 'var(--color-primary)', color: 'white', padding: '2px  8px', borderRadius: '12px', fontSize: '12px', marginLeft: '8px'}}>{tickets.length - (currentServing ? 1 : 0)} Waiting</span></div>
          <button className="action-btn" style={{background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a'}} onClick={resetQueue}>Reset Queue</button>
        </div>
        <div>
          <AnimatePresence>
            {nextUp.map((t, idx) => (
              <motion.div 
                key={t.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  padding: '16px 24px', borderBottom: '1px solid var(--color-border)',
                  background: t.status === 'PAUSED' ? '#f3f4f6' : 'white'
                }}
              >
                <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                  <div style={{width: '28px', fontSize: '14px', color: 'var(--color-foreground-muted)', fontWeight: 600}}>
                    {idx + 1}
                  </div>
                  <div style={{fontSize: '24px', fontWeight: 700, width: '80px', fontFamily: '"Fira Code", monospace', color: 'var(--color-primary)'}}>
                    {t.ticket_number}
                  </div>
                  <div>
                    <div style={{fontSize: '15px', fontWeight: 600, color: 'var(--color-foreground)'}}>
                      {t.user?.full_name || 'Walk-in'}
                      {t.status === 'PAUSED' && <span style={{marginLeft: '8px', fontSize: '11px', background: '#9ca3af', color: 'white', padding: '2px 8px', borderRadius: '10px'}}>PAUSED</span>}
                    </div>
                    <div style={{fontSize: '13px', color: 'var(--color-foreground-muted)', marginTop: '4px'}}>
                      Waiting since {formatTime(new Date(t.joined_at))} • {t.priority_level}
                      {t.service_type && t.service_type.startsWith('Slot:') && (
                        <span style={{marginLeft: '8px', fontWeight: 700, color: '#E07A5F'}}>
                          • Requested {t.service_type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{display: 'flex', gap: '8px'}}>
                  {t.status === 'PAUSED' ? (
                     <button onClick={() => updateStatus(t.id, 'WAITING')} style={{background: 'var(--color-primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer'}}>
                       Resume
                     </button>
                  ) : (
                     <button onClick={() => updateStatus(t.id, 'PAUSED')} style={{background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer'}}>
                       Pause
                     </button>
                  )}
                  <button onClick={() => updateStatus(t.id, 'CANCELLED')} style={{background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer'}}>
                    Remove
                  </button>
                </div>

              </motion.div>
            ))}
          </AnimatePresence>
          {nextUp.length === 0 && tickets.length <= 1 && (
            <div style={{padding: '40px', textAlign: 'center', color: 'var(--color-foreground-muted)', fontSize: '14px'}}>
              There is nobody waiting in line.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
