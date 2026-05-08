import React, { useState, useEffect } from 'react';
import { supabase } from './utils/supabase';

export default function ReportsAdmin({ branchId }: { branchId: string }) {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Default to last 7 days
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      generateReport();
    }
  }, [startDate, endDate, branchId]);

  const generateReport = async () => {
    setLoading(true);
    
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('queue_tickets')
      .select('*')
      .eq('branch_id', branchId)
      .gte('joined_at', new Date(startDate).toISOString())
      .lte('joined_at', endOfDay.toISOString())
      .order('joined_at', { ascending: false });

    if (!error && data) {
      // Group by date
      const grouped: Record<string, any> = {};
      
      data.forEach(ticket => {
        const dateStr = new Date(ticket.joined_at).toISOString().split('T')[0];
        if (!grouped[dateStr]) {
          grouped[dateStr] = { date: dateStr, total: 0, served: 0, skipped: 0, cancelled: 0, totalWaitMins: 0 };
        }
        
        grouped[dateStr].total++;
        if (ticket.status === 'SERVED') {
          grouped[dateStr].served++;
          if (ticket.served_at) {
            const waitTime = (new Date(ticket.served_at).getTime() - new Date(ticket.joined_at).getTime()) / 60000;
            grouped[dateStr].totalWaitMins += waitTime;
          }
        } else if (ticket.status === 'SKIPPED') {
          grouped[dateStr].skipped++;
        } else if (ticket.status === 'CANCELLED') {
          grouped[dateStr].cancelled++;
        }
      });

      const processed = Object.values(grouped).map(day => ({
        ...day,
        avgWait: day.served > 0 ? Math.round(day.totalWaitMins / day.served) : 0
      })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setReportData(processed);
    }
    setLoading(false);
  };

  const exportToCSV = () => {
    if (reportData.length === 0) return;
    
    const headers = ['Date', 'Total Tickets', 'Served', 'Skipped', 'Cancelled', 'Avg Wait (mins)'];
    const rows = reportData.map(r => [r.date, r.total, r.served, r.skipped, r.cancelled, r.avgWait]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `queue_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="panel" style={{gridColumn: 'span 3'}}>
      <div className="panel-head" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <span>Performance Reports</span>
        <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
          <input 
            type="date" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)}
            style={{padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '13px'}}
          />
          <span style={{fontSize: '14px', color:'var(--color-foreground-muted)'}}>to</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)}
            style={{padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '13px'}}
          />
          <button 
            onClick={exportToCSV}
            style={{background: 'var(--color-primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginLeft: '12px'}}
          >
            Export CSV
          </button>
        </div>
      </div>
      
      <div className="panel-body" style={{padding: 0}}>
        {loading ? (
          <div style={{padding: '24px', textAlign: 'center', color: 'var(--color-foreground-muted)'}}>Generating report...</div>
        ) : (
          <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px'}}>
            <thead>
              <tr style={{borderBottom: '1px solid var(--color-border)', background: '#f8fafc', color: 'var(--color-foreground-muted)'}}>
                <th style={{padding: '16px', fontWeight: 600}}>Date</th>
                <th style={{padding: '16px', fontWeight: 600}}>Total Queue Vol.</th>
                <th style={{padding: '16px', fontWeight: 600}}>Successfully Served</th>
                <th style={{padding: '16px', fontWeight: 600}}>Skipped (No-Show)</th>
                <th style={{padding: '16px', fontWeight: 600}}>Cancelled</th>
                <th style={{padding: '16px', fontWeight: 600}}>Avg Wait Time</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((row, idx) => (
                <tr key={idx} style={{borderBottom: '1px solid var(--color-border)'}}>
                  <td style={{padding: '16px', fontWeight: 600}}>{row.date}</td>
                  <td style={{padding: '16px'}}>{row.total}</td>
                  <td style={{padding: '16px', color: '#166534', fontWeight: 600}}>{row.served}</td>
                  <td style={{padding: '16px', color: '#991b1b'}}>{row.skipped}</td>
                  <td style={{padding: '16px', color: 'var(--color-foreground-muted)'}}>{row.cancelled}</td>
                  <td style={{padding: '16px', fontWeight: 600, color: row.avgWait > 30 ? '#DC2626' : 'inherit'}}>{row.avgWait} mins</td>
                </tr>
              ))}
              {reportData.length === 0 && (
                <tr><td colSpan={6} style={{padding: '32px', textAlign: 'center', color: 'var(--color-foreground-muted)'}}>No data found for the selected dates.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
