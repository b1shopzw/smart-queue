import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiRequest } from './utils/api';
import { supabase } from './utils/supabase';

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, y: 0, 
    transition: { type: 'spring', stiffness: 300, damping: 24 } 
  }
};

export default function AnalyticsAdmin({ branchId }: { branchId: string }) {
  const [stats, setStats] = useState({
    waitingNow: 0,
    servedToday: 0,
    avgWaitTime: 0,
    noShowRate: 0,
    missedToday: 0,
    appUsers: 0
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await apiRequest(`/analytics/branch/${branchId}/performance`);
        setStats(data);
      } catch (err) {
        console.error('Failed to load analytics from backend:', err);
      }
    }

    loadStats();
    
    // Periodically refresh stats (every 30 seconds)
    const interval = setInterval(loadStats, 30000);

    // Also keep Supabase subscription for real-time reactivity if database changes
    const subscription = supabase
      .channel('analytics-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_tickets', filter: `branch_id=eq.${branchId}` }, () => {
        loadStats();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(subscription);
    }
  }, [branchId]);

  return (
    <motion.div variants={itemVariants} className="stat6">
      <motion.div whileHover={{ y: -4 }} className="stat-box">
        <div className="lbl">Waiting now</div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="num">{stats.waitingNow}</motion.div>
        <div className="trend" style={{color: '#d97706'}}>Live tracking</div>
      </motion.div>
      <motion.div whileHover={{ y: -4 }} className="stat-box">
        <div className="lbl">Served today</div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="num">{stats.servedToday}</motion.div>
        <div className="trend" style={{color: '#166534'}}>+0% vs yesterday</div>
      </motion.div>
      <motion.div whileHover={{ y: -4 }} className="stat-box">
        <div className="lbl">Avg wait time</div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="num">{stats.avgWaitTime} <span style={{fontSize: '16px'}}>min</span></motion.div>
        <div className="trend" style={{color: stats.avgWaitTime > 30 ? '#DC2626' : '#166534'}}>Based on {stats.servedToday} served</div>
      </motion.div>
      <motion.div whileHover={{ y: -4 }} className="stat-box">
        <div className="lbl">No-show rate</div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="num">{stats.noShowRate}%</motion.div>
        <div className="trend" style={{color: '#DC2626'}}>{stats.missedToday} missed today</div>
      </motion.div>
      <motion.div whileHover={{ y: -4 }} className="stat-box">
        <div className="lbl">Satisfaction</div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="num">4.5 <span style={{fontSize: '16px'}}>★</span></motion.div>
        <div className="trend" style={{color: '#166534'}}>+0.2 this week</div>
      </motion.div>
      <motion.div whileHover={{ y: -4 }} className="stat-box">
        <div className="lbl">Total App Users</div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="num">{stats.appUsers}</motion.div>
        <div className="trend" style={{color: '#d97706'}}>Global registered</div>
      </motion.div>
    </motion.div>
  );
}
