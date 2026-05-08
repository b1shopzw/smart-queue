import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Lock, LogIn, User } from 'lucide-react';
import { apiRequest } from './utils/api';
import { supabase } from './utils/supabase';

export default function AdminLogin() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (employeeId) {
      setLoading(true);
      try {
        const response = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ 
            emp_id: employeeId, 
            password: password || 'password123' 
          }),
        });
        
        if (response.access_token) {
          // Fetch branch info via supabase for legacy dashboard compatibility
          const { data: empData } = await supabase
            .from('employees')
            .select('*, branch:branches(*)')
            .eq('emp_id', employeeId)
            .single();

          if (!empData || !empData.branch || !empData.branch.active) {
             alert('Login Failed: Your assigned branch is inactive or not found.');
             return;
          }

          const sessionCtx = { 
            access_token: response.access_token,
            user: response.user,
            emp: empData,
            branch: empData.branch,
            role: response.user.role 
          };
          
          localStorage.setItem('user', JSON.stringify(sessionCtx));
          navigate('/dashboard');
        }
      } catch (err: any) {
        alert('Login Failed: ' + (err.message || 'Invalid credentials'));
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--color-background)',padding:'24px'}}>
      <motion.div 
        initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{type:'spring', damping:25}}
        style={{width:'100%',maxWidth:'400px',background:'var(--color-panel)',padding:'32px',borderRadius:'16px',boxShadow:'var(--shadow-lg)',border:'1px solid var(--color-border)'}}
      >
        <div style={{display:'flex',justifyContent:'center',marginBottom:'24px'}}>
          <img src="/icon.png" alt="Zim Queue Logo" style={{width:'56px',height:'56px',borderRadius:'16px',boxShadow:'var(--shadow-sm)'}} />
        </div>
        
        <h1 style={{fontSize:'24px',fontWeight:700,color:'var(--color-foreground)',textAlign:'center',marginBottom:'8px'}}>Admin Login</h1>
        <p style={{fontSize:'14px',color:'var(--color-foreground-muted)',textAlign:'center',marginBottom:'32px'}}>Sign in to manage Zim Queue services</p>

        <form onSubmit={handleLogin} style={{display:'flex',flexDirection:'column',gap:'16px'}}>
          <div>
            <label style={{display:'block',fontSize:'13px',fontWeight:600,color:'var(--color-foreground)',marginBottom:'8px'}}>Employee ID</label>
            <div style={{position:'relative'}}>
              <User style={{position:'absolute',left:'14px',top:'12px',color:'var(--color-foreground-muted)'}} size={18} />
              <input 
                type="text" required placeholder="ZIM001"
                value={employeeId} onChange={(e)=>setEmployeeId(e.target.value)}
                style={{width:'100%',padding:'12px 14px 12px 42px',background:'var(--color-background)',border:'1px solid var(--color-border)',borderRadius:'8px',color:'var(--color-foreground)',fontSize:'14px'}}
              />
            </div>
          </div>

          <div>
            <label style={{display:'block',fontSize:'13px',fontWeight:600,color:'var(--color-foreground)',marginBottom:'8px'}}>Password</label>
            <div style={{position:'relative'}}>
              <Lock style={{position:'absolute',left:'14px',top:'12px',color:'var(--color-foreground-muted)'}} size={18} />
              <input 
                type="password" placeholder="••••••••"
                value={password} onChange={(e)=>setPassword(e.target.value)}
                style={{width:'100%',padding:'12px 14px 12px 42px',background:'var(--color-background)',border:'1px solid var(--color-border)',borderRadius:'8px',color:'var(--color-foreground)',fontSize:'14px'}}
              />
            </div>
            <p style={{fontSize:'10px',color:'var(--color-foreground-muted)',marginTop:'4px'}}>Default is 'password123' if not set</p>
          </div>

          <motion.button 
            whileHover={{scale:1.02}} whileTap={{scale:0.98}} type="submit"
            disabled={loading}
            style={{width:'100%',background:'var(--color-primary)',color:'white',border:'none',padding:'14px',borderRadius:'8px',fontSize:'14px',fontWeight:700,cursor:'pointer',marginTop:'8px',display:'flex',justifyContent:'center',alignItems:'center',gap:'8px',opacity:loading?0.7:1}}
          >
            {loading ? 'Authenticating...' : <><LogIn size={18} /> Access Command Center</>}
          </motion.button>
        </form>


      </motion.div>
    </div>
  );
}
