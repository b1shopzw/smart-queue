import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Lock, LogIn, User, Eye, EyeOff, UserPlus } from 'lucide-react';
import { apiRequest } from './utils/api';
import { supabase } from './utils/supabase';

export default function AdminLogin() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
          // Fetch branch info via supabase for dashboard compatibility
          let empData: any = null;
          
          try {
            const { data } = await supabase
              .from('employees')
              .select('*, branch:branches(*)')
              .or(`emp_id.eq.${employeeId},employee_id.eq.${employeeId}`)
              .maybeSingle();
            empData = data;
          } catch(e) {
            console.warn('Employee query failed:', e);
          }

          // Fallback: If employee branch lookup fails, grab the first active branch
          if (!empData || !empData.branch) {
            const { data: fallbackBranch } = await supabase
              .from('branches')
              .select('*')
              .eq('active', true)
              .limit(1)
              .single();

            if (fallbackBranch) {
              empData = {
                emp_id: employeeId,
                employee_id: employeeId,
                full_name: response.user?.full_name || 'Admin User',
                branch: fallbackBranch
              };
            }
          }

          if (!empData || !empData.branch) {
             alert('Login Failed: No active branches are currently configured.');
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
        initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{type:'spring' as const, damping:25}}
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
                type={showPassword ? "text" : "password"} placeholder="••••••••"
                value={password} onChange={(e)=>setPassword(e.target.value)}
                style={{width:'100%',padding:'12px 42px 12px 42px',background:'var(--color-background)',border:'1px solid var(--color-border)',borderRadius:'8px',color:'var(--color-foreground)',fontSize:'14px'}}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
                style={{position:'absolute',right:'14px',top:'12px',background:'none',border:'none',color:'var(--color-foreground-muted)',cursor:'pointer',padding:0,display:'flex',alignItems:'center'}}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
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

        <div style={{marginTop:'24px',textAlign:'center',fontSize:'13px',color:'var(--color-foreground-muted)'}}>
          New branch administrator?{' '}
          <a href="/signup" style={{color:'var(--color-primary)',fontWeight:700,textDecoration:'none'}}>
            Register here
          </a>
        </div>

        <div style={{marginTop:'16px',display:'flex',justifyContent:'center'}}>
          <motion.a
            href="/signup"
            whileHover={{scale:1.02}} whileTap={{scale:0.98}}
            style={{
              display:'flex',alignItems:'center',gap:'8px',
              width:'100%',justifyContent:'center',
              background:'transparent',
              border:'1px solid var(--color-border)',
              color:'var(--color-foreground)',
              padding:'12px',borderRadius:'8px',
              fontSize:'14px',fontWeight:600,cursor:'pointer',
              textDecoration:'none',
              transition:'border-color 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          >
            <UserPlus size={18} />
            Register as Branch Admin
          </motion.a>
        </div>

      </motion.div>
    </div>
  );
}
