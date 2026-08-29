import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import LiveQueueAdmin from './LiveQueueAdmin';
import AnalyticsAdmin from './AnalyticsAdmin';
import BranchSettingsAdmin from './BranchSettingsAdmin';
import UsersAdmin from './UsersAdmin';
import ReportsAdmin from './ReportsAdmin';
import UserFeedbackAdmin from './UserFeedbackAdmin';
import OrgBranchManager from './OrgBranchManager';
import OrgStaffInviteModal from './OrgStaffInviteModal';
import './index.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.08 } 
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, y: 0, 
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 } 
  }
} as const;

export default function BankDashboard({ ctx }: { ctx: any }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('Overview');
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="admin">
      <div className="admin-nav">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{display:'flex',alignItems:'center',gap:'24px'}}
        >
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <img src="/icon.png" alt="Icon" style={{width:'28px',height:'28px',borderRadius:'6px'}} />
            <span style={{fontSize:'16px',fontWeight:700,letterSpacing:'-0.5px', color:'var(--color-foreground)'}}>
              {ctx.branch.bank_name} — {ctx.branch.city} ({ctx.branch.suburb}, Branch {ctx.branch.branch_num})
            </span>
          </div>
          <div className="nav-links">
            <div className={activeTab === 'Overview' ? 'active' : ''} onClick={() => setActiveTab('Overview')} style={{cursor:'pointer'}}>Overview</div>
            <div className={activeTab === 'Queue' ? 'active' : ''} onClick={() => setActiveTab('Queue')} style={{cursor:'pointer', color:'var(--color-primary)', fontWeight:600}}>Live Queue</div>
            <div className={activeTab === 'Analytics' ? 'active' : ''} onClick={() => setActiveTab('Analytics')} style={{cursor:'pointer'}}>Analytics</div>
            <div className={activeTab === 'Branches' ? 'active' : ''} onClick={() => setActiveTab('Branches')} style={{cursor:'pointer'}}>Branches</div>
            <div className={activeTab === 'Staff' ? 'active' : ''} onClick={() => setActiveTab('Staff')} style={{cursor:'pointer'}}>Staff</div>
            <div className={activeTab === 'Settings' ? 'active' : ''} onClick={() => setActiveTab('Settings')} style={{cursor:'pointer'}}>Settings</div>
            <div className={activeTab === 'Users' ? 'active' : ''} onClick={() => setActiveTab('Users')} style={{cursor:'pointer'}}>Users</div>
            <div className={activeTab === 'Feedback' ? 'active' : ''} onClick={() => setActiveTab('Feedback')} style={{cursor:'pointer'}}>Feedback</div>
            <div className={activeTab === 'Reports' ? 'active' : ''} onClick={() => setActiveTab('Reports')} style={{cursor:'pointer'}}>Reports</div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{display:'flex',alignItems:'center',gap:'12px'}}
        >
          <motion.div 
            animate={{ opacity: [1, 0.5, 1] }} 
            transition={{ repeat: Infinity, duration: 2 }}
            style={{background:'#dcfce7',border:'1px solid #bbf7d0',borderRadius:'6px',padding:'4px 10px',fontSize:'12px',color:'#166534',display:'flex',alignItems:'center',gap:'6px',fontWeight:600}}
          >
            <div style={{width:'6px',height:'6px',background:'#10b981',borderRadius:'50%'}}></div>Live
          </motion.div>
          <div style={{fontSize:'13px',color:'var(--color-foreground-muted)',fontWeight:500}}>{timeString}</div>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginLeft:'10px'}}>
            <motion.div 
              whileHover={{ scale: 1.1 }}
              style={{width:'32px',height:'32px',background:'var(--color-primary)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',color:'white',fontWeight:600}}
            >
              {ctx?.emp?.name?.charAt(0) || 'AD'}
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { localStorage.removeItem('user'); window.location.href = '/login'; }}
              style={{background:'transparent',border:'1px solid var(--color-border)',borderRadius:'6px',padding:'6px 12px',fontSize:'12px',color:'var(--color-foreground)',fontWeight:600,cursor:'pointer'}}
            >
              Logout
            </motion.button>
          </div>
        </motion.div>
      </div>

      <motion.div 
        className="admin-body"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:'24px'}}>
          <div>
            <div style={{fontSize:'26px',fontWeight:700,color:'var(--color-foreground)',fontFamily:'"Fira Code", monospace'}}>Good morning, {ctx.emp.name?.split(' ')[0] || 'Admin'}</div>
            <div style={{fontSize:'14px',color:'var(--color-foreground-muted)',marginTop:'4px'}}>Role: {ctx.role} | {activeTab === 'Queue' ? 'Live Queue Management' : 'Here\'s what\'s happening today'}</div>
          </div>
          <div style={{display:'flex',gap:'10px'}}>
            {activeTab === 'Overview' && (
              <select style={{background:'var(--color-panel)',border:'1px solid var(--color-border)',borderRadius:'8px',color:'var(--color-foreground)',fontSize:'13px',padding:'8px 14px',fontWeight:500}}>
                <option>Today</option><option>This week</option><option>This month</option>
              </select>
            )}
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="action-btn">Export PDF</motion.button>
          </div>
        </motion.div>

        {activeTab === 'Queue' ? (
          <motion.div variants={itemVariants}>
            <LiveQueueAdmin branchId={ctx.branch.branch_id} />
          </motion.div>
        ) : activeTab === 'Settings' ? (
          <motion.div variants={itemVariants}>
            <BranchSettingsAdmin branchId={ctx.branch.branch_id} />
          </motion.div>
        ) : activeTab === 'Users' ? (
          <motion.div variants={itemVariants}>
            <UsersAdmin />
          </motion.div>
        ) : activeTab === 'Feedback' ? (
          <motion.div variants={itemVariants}>
            <UserFeedbackAdmin branchId={ctx.branch.branch_id} />
          </motion.div>
        ) : activeTab === 'Reports' ? (
          <motion.div variants={itemVariants}>
            <ReportsAdmin branchId={ctx.branch.branch_id} />
          </motion.div>
        ) : activeTab === 'Branches' ? (
          <motion.div variants={itemVariants}>
            <OrgBranchManager orgId={ctx.emp?.org_id || ''} />
          </motion.div>
        ) : activeTab === 'Staff' ? (
          <motion.div variants={itemVariants}>
            <div style={{padding:32}}>
              <div style={{marginBottom:20,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <h2 style={{margin:0,color:'var(--color-foreground)'}}>Staff Management</h2>
                <motion.button
                  whileHover={{scale:1.04}} whileTap={{scale:0.97}}
                  onClick={() => setShowInviteModal(true)}
                  style={{background:'var(--color-primary)',color:'white',border:'none',padding:'10px 20px',borderRadius:8,fontWeight:700,cursor:'pointer',fontSize:13}}
                >
                  + Invite Staff Member
                </motion.button>
              </div>
              <OrgStaffInviteModal
                orgId={ctx.emp?.org_id || ''}
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
              />
            </div>
          </motion.div>
        ) : (
          <>

        <AnalyticsAdmin branchId={ctx.branch.branch_id} />

        <motion.div variants={itemVariants} className="row3">
          <div className="panel">
            <div className="panel-head">
              Hourly queue volume — all services
              <span style={{fontSize:'11px',color:'var(--color-foreground-muted)',fontWeight:600}}>Today</span>
            </div>
            <div className="panel-body">
              <div style={{display:'flex',alignItems:'flex-end',gap:'8px',height:'120px',marginBottom:'12px',paddingTop:'10px'}}>
                <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',height:'100%',justifyContent:'flex-end',gap:'4px'}}><motion.div initial={{ height: 0 }} animate={{ height: '18%' }} transition={{ duration: 1 }} style={{background:'var(--color-primary)',borderRadius:'4px 4px 0 0',width:'100%'}}></motion.div><span style={{fontSize:'11px',color:'var(--color-foreground-muted)',fontWeight:500}}>7</span></div>
                <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',height:'100%',justifyContent:'flex-end',gap:'4px'}}><motion.div initial={{ height: 0 }} animate={{ height: '42%' }} transition={{ duration: 1, delay: 0.1 }} style={{background:'var(--color-secondary)',borderRadius:'4px 4px 0 0',width:'100%'}}></motion.div><span style={{fontSize:'11px',color:'var(--color-foreground-muted)',fontWeight:500}}>8</span></div>
                <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',height:'100%',justifyContent:'flex-end',gap:'4px'}}><motion.div initial={{ height: 0 }} animate={{ height: '72%' }} transition={{ duration: 1, delay: 0.2 }} style={{background:'var(--color-secondary)',borderRadius:'4px 4px 0 0',width:'100%'}}></motion.div><span style={{fontSize:'11px',color:'var(--color-foreground-muted)',fontWeight:500}}>9</span></div>
                <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',height:'100%',justifyContent:'flex-end',gap:'4px'}}><motion.div initial={{ height: 0 }} animate={{ height: '100%' }} transition={{ duration: 1, delay: 0.3 }} style={{background:'var(--color-primary)',borderRadius:'4px 4px 0 0',width:'100%',border:'2px solid var(--color-foreground)'}}></motion.div><span style={{fontSize:'11px',color:'var(--color-primary)',fontWeight:700}}>Now</span></div>
                <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',height:'100%',justifyContent:'flex-end',gap:'4px'}}><motion.div initial={{ height: 0 }} animate={{ height: '88%' }} transition={{ duration: 1, delay: 0.4 }} style={{background:'#dbeafe',border:'1px dashed var(--color-secondary)',borderRadius:'4px 4px 0 0',width:'100%'}}></motion.div><span style={{fontSize:'11px',color:'var(--color-foreground-muted)',fontWeight:500}}>11</span></div>
                <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',height:'100%',justifyContent:'flex-end',gap:'4px'}}><motion.div initial={{ height: 0 }} animate={{ height: '92%' }} transition={{ duration: 1, delay: 0.5 }} style={{background:'#dbeafe',border:'1px dashed var(--color-secondary)',borderRadius:'4px 4px 0 0',width:'100%'}}></motion.div><span style={{fontSize:'11px',color:'var(--color-foreground-muted)',fontWeight:500}}>12</span></div>
                <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',height:'100%',justifyContent:'flex-end',gap:'4px'}}><motion.div initial={{ height: 0 }} animate={{ height: '72%' }} transition={{ duration: 1, delay: 0.6 }} style={{background:'#dbeafe',border:'1px dashed var(--color-secondary)',borderRadius:'4px 4px 0 0',width:'100%'}}></motion.div><span style={{fontSize:'11px',color:'var(--color-foreground-muted)',fontWeight:500}}>1</span></div>
              </div>
              <div style={{display:'flex',gap:'16px',justifyContent:'center',marginTop:'12px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'6px'}}><div style={{width:'10px',height:'10px',background:'var(--color-primary)',borderRadius:'2px'}}></div><span style={{fontSize:'12px',color:'var(--color-foreground-muted)',fontWeight:500}}>Actual</span></div>
                <div style={{display:'flex',alignItems:'center',gap:'6px'}}><div style={{width:'10px',height:'10px',border:'1.5px dashed var(--color-secondary)',borderRadius:'2px'}}></div><span style={{fontSize:'12px',color:'var(--color-foreground-muted)',fontWeight:500}}>Forecast</span></div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">Volume by service type</div>
            <div className="panel-body">
              <div style={{marginBottom:'12px'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}><span style={{fontSize:'13px',color:'var(--color-foreground-muted)',fontWeight:500}}>Banks</span><span style={{fontSize:'13px',color:'var(--color-primary)',fontWeight:700}}>58%</span></div>
                <div className="bar-wrap"><motion.div initial={{ width: 0 }} animate={{ width: '58%' }} transition={{ duration: 1, ease: "easeOut" }} className="bar-fill" style={{background:'var(--color-primary)'}}></motion.div></div>
              </div>
              <div style={{marginBottom:'12px'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}><span style={{fontSize:'13px',color:'var(--color-foreground-muted)',fontWeight:500}}>Passport</span><span style={{fontSize:'13px',color:'#166534',fontWeight:700}}>27%</span></div>
                <div className="bar-wrap"><motion.div initial={{ width: 0 }} animate={{ width: '27%' }} transition={{ duration: 1, delay: 0.2, ease: "easeOut" }} className="bar-fill" style={{background:'#10b981'}}></motion.div></div>
              </div>
              <div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}><span style={{fontSize:'13px',color:'var(--color-foreground-muted)',fontWeight:500}}>National ID</span><span style={{fontSize:'13px',color:'#92400e',fontWeight:700}}>15%</span></div>
                <div className="bar-wrap"><motion.div initial={{ width: 0 }} animate={{ width: '15%' }} transition={{ duration: 1, delay: 0.4, ease: "easeOut" }} className="bar-fill" style={{background:'#f59e0b'}}></motion.div></div>
              </div>
              <div style={{marginTop:'20px',paddingTop:'16px',borderTop:'1px solid var(--color-border)'}}>
                <div style={{fontSize:'11px',color:'var(--color-foreground-muted)',marginBottom:'10px',textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600}}>Peak service by city</div>
                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontSize:'13px',color:'var(--color-foreground)',fontWeight:500}}>Harare</span><span className="badge bb">Banks</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontSize:'13px',color:'var(--color-foreground)',fontWeight:500}}>Bulawayo</span><span className="badge bg">Passport</span></div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{fontSize:'13px',color:'var(--color-foreground)',fontWeight:500}}>Gweru</span><span className="badge ba">National ID</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">SLA performance</div>
            <div className="panel-body">
              <div style={{textAlign:'center',marginBottom:'16px'}}>
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" as const, stiffness: 200 }} style={{fontSize:'42px',fontWeight:700,color:'#166534',marginBottom:'2px',fontFamily:"Inter, system-ui, sans-serif"}}>91%</motion.div>
                <div style={{fontSize:'12px',color:'var(--color-foreground-muted)',fontWeight:500}}>served within 30-min SLA</div>
              </div>
              <div className="bar-wrap" style={{height:'6px',marginBottom:'16px'}}><div className="bar-fill" style={{background:'#10b981',width:'91%'}}></div></div>
              <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:'12px',color:'var(--color-foreground-muted)',fontWeight:500}}>Under 15 min</span>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <div style={{width:'60px',height:'4px',background:'var(--color-muted)',borderRadius:'2px',overflow:'hidden'}}><div style={{height:'100%',background:'var(--color-primary)',width:'34%'}}></div></div>
                    <span style={{fontSize:'12px',color:'var(--color-primary)',fontWeight:700,width:'24px'}}>34%</span>
                  </div>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:'12px',color:'var(--color-foreground-muted)',fontWeight:500}}>15–30 min</span>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <div style={{width:'60px',height:'4px',background:'var(--color-muted)',borderRadius:'2px',overflow:'hidden'}}><div style={{height:'100%',background:'#10b981',width:'57%'}}></div></div>
                    <span style={{fontSize:'12px',color:'#166534',fontWeight:700,width:'24px'}}>57%</span>
                  </div>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:'12px',color:'var(--color-foreground-muted)',fontWeight:500}}>Over 30 min</span>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <div style={{width:'60px',height:'4px',background:'var(--color-muted)',borderRadius:'2px',overflow:'hidden'}}><div style={{height:'100%',background:'#DC2626',width:'9%'}}></div></div>
                    <span style={{fontSize:'12px',color:'#991b1b',fontWeight:700,width:'24px'}}>9%</span>
                  </div>
                </div>
              </div>
              <div style={{marginTop:'16px',paddingTop:'12px',borderTop:'1px solid var(--color-border)'}}>
                <div style={{fontSize:'11px',color:'var(--color-foreground-muted)',marginBottom:'4px',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>Slowest branch today</div>
                <div style={{fontSize:'13px',color:'#991b1b',fontWeight:600}}>Harare RG — avg 51 min wait</div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="row3b">
          <div className="panel" style={{gridColumn:'span 1'}}>
            <div className="panel-head">Staff performance</div>
            <div style={{padding:'8px 0'}}>
              <motion.div whileHover={{ x: 4 }} className="list-item">
                <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'#dbeafe',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',color:'#1e40af',fontWeight:700}}>TC</div>
                <div style={{flex:1}}><div style={{fontSize:'13px',color:'var(--color-foreground)',fontWeight:600}}>T. Chigumira</div><div style={{fontSize:'11px',color:'var(--color-foreground-muted)',fontWeight:500}}>Counter 3 · CBZ Harare</div></div>
                <div style={{textAlign:'right'}}><div style={{fontSize:'18px',fontWeight:700,color:'#166534'}}>48</div><div style={{fontSize:'10px',color:'var(--color-foreground-muted)',fontWeight:600}}>served</div></div>
              </motion.div>
              <motion.div whileHover={{ x: 4 }} className="list-item">
                <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'#dcfce7',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',color:'#166534',fontWeight:700}}>SM</div>
                <div style={{flex:1}}><div style={{fontSize:'13px',color:'var(--color-foreground)',fontWeight:600}}>S. Moyo</div><div style={{fontSize:'11px',color:'var(--color-foreground-muted)',fontWeight:500}}>Counter 1 · CBZ Harare</div></div>
                <div style={{textAlign:'right'}}><div style={{fontSize:'18px',fontWeight:700,color:'#166534'}}>41</div><div style={{fontSize:'10px',color:'var(--color-foreground-muted)',fontWeight:600}}>served</div></div>
              </motion.div>
              <motion.div whileHover={{ x: 4 }} className="list-item">
                <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'#fef3c7',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',color:'#92400e',fontWeight:700}}>NK</div>
                <div style={{flex:1}}><div style={{fontSize:'13px',color:'var(--color-foreground)',fontWeight:600}}>N. Khumalo</div><div style={{fontSize:'11px',color:'var(--color-foreground-muted)',fontWeight:500}}>Counter 2 · FBC Harare</div></div>
                <div style={{textAlign:'right'}}><div style={{fontSize:'18px',fontWeight:700,color:'#d97706'}}>29</div><div style={{fontSize:'10px',color:'var(--color-foreground-muted)',fontWeight:600}}>served</div></div>
              </motion.div>
            </div>
          </div>

          <div className="panel" style={{gridColumn:'span 1'}}>
            <div className="panel-head">User satisfaction</div>
            <div className="panel-body">
              <div style={{display:'flex',alignItems:'baseline',gap:'8px',marginBottom:'16px'}}>
                <span style={{fontSize:'42px',fontWeight:700,color:'var(--color-primary)',fontFamily:'"Fira Code", monospace'}}>4.3</span><span style={{fontSize:'14px',color:'var(--color-foreground-muted)',fontWeight:600}}>/ 5.0</span>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'16px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}><span style={{fontSize:'12px',color:'var(--color-foreground)',width:'14px',fontWeight:700}}>5★</span><div style={{flex:1,height:'6px',background:'var(--color-muted)',borderRadius:'3px',overflow:'hidden'}}><div style={{height:'100%',background:'#10b981',width:'52%'}}></div></div><span style={{fontSize:'11px',color:'var(--color-foreground-muted)',width:'24px',fontWeight:600}}>52%</span></div>
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}><span style={{fontSize:'12px',color:'var(--color-foreground)',width:'14px',fontWeight:700}}>4★</span><div style={{flex:1,height:'6px',background:'var(--color-muted)',borderRadius:'3px',overflow:'hidden'}}><div style={{height:'100%',background:'#34d399',width:'28%'}}></div></div><span style={{fontSize:'11px',color:'var(--color-foreground-muted)',width:'24px',fontWeight:600}}>28%</span></div>
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}><span style={{fontSize:'12px',color:'var(--color-foreground)',width:'14px',fontWeight:700}}>3★</span><div style={{flex:1,height:'6px',background:'var(--color-muted)',borderRadius:'3px',overflow:'hidden'}}><div style={{height:'100%',background:'#fbbf24',width:'12%'}}></div></div><span style={{fontSize:'11px',color:'var(--color-foreground-muted)',width:'24px',fontWeight:600}}>12%</span></div>
              </div>
              <div style={{paddingTop:'12px',borderTop:'1px solid var(--color-border)'}}>
                <div style={{fontSize:'11px',color:'var(--color-foreground-muted)',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600}}>Top complaint theme</div>
                <div style={{fontSize:'13px',color:'#DC2626',fontWeight:500}}>"Wait time longer than app estimated"</div>
              </div>
            </div>
          </div>

          <div className="panel" style={{gridColumn:'span 1'}}>
            <div className="panel-head">Quick actions</div>
            <div style={{padding:'20px',display:'flex',flexDirection:'column',gap:'12px'}}>
              <motion.div whileHover={{ scale: 1.02 }} style={{background:'var(--color-primary)',borderRadius:'8px',padding:'12px 14px',fontSize:'13px',fontWeight:600,color:'white',cursor:'pointer',display:'flex',alignItems:'center',gap:'10px'}}>📣 Broadcast to all users</motion.div>
              <motion.div whileHover={{ scale: 1.02 }} style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'8px',padding:'12px 14px',fontSize:'13px',color:'#166534',cursor:'pointer',display:'flex',alignItems:'center',gap:'10px',fontWeight:600}}>➕ Add new branch or location</motion.div>
              <motion.div whileHover={{ scale: 1.02 }} style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:'8px',padding:'12px 14px',fontSize:'13px',color:'#92400e',cursor:'pointer',display:'flex',alignItems:'center',gap:'10px',fontWeight:600}}>🔄 Reset all queue counters</motion.div>
            </div>
          </div>
        </motion.div>
          </>
        )}

      </motion.div>
    </div>
  );
}
