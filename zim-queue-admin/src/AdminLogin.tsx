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
    if (!employeeId) return;

    setLoading(true);
    const inputVal = employeeId.trim();
    const passVal = password || 'password123';

    try {
      let sessionCtx: any = null;

      // 1. Try Backend API Auth
      try {
        const response = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ 
            emp_id: inputVal,
            email: inputVal, 
            password: passVal 
          }),
        });

        if (response.access_token) {
          let empData: any = null;
          const { data } = await supabase
            .from('employees')
            .select('*, branch:branches(*)')
            .or(`emp_id.eq.${inputVal},employee_id.eq.${inputVal},email.eq.${inputVal}`)
            .maybeSingle();

          empData = data;

          if (!empData || !empData.branch) {
            const { data: fallbackBranch } = await supabase
              .from('branches')
              .select('*')
              .eq('active', true)
              .limit(1)
              .single();

            empData = {
              emp_id: inputVal,
              employee_id: inputVal,
              full_name: response.user?.full_name || 'Simbarashe Gudyanga',
              email: inputVal.includes('@') ? inputVal : 'simbarashe.b.gudyanga@gmail.com',
              branch: fallbackBranch || { branch_id: 'b1', bank_name: 'Super Admin Hub', branch_name: 'Harare HQ' }
            };
          }

          sessionCtx = {
            access_token: response.access_token,
            user: response.user,
            emp: empData,
            branch: empData.branch,
            role: response.user.role || 'super_admin'
          };
        }
      } catch (backendErr) {
        console.warn('Backend login fallback to Supabase:', backendErr);
      }

      // 2. Direct Supabase Fallback Auth / Lookup
      if (!sessionCtx) {
        // Search employees table in Supabase
        const { data: empData } = await supabase
          .from('employees')
          .select('*')
          .or(`emp_id.eq.${inputVal},employee_id.eq.${inputVal},email.eq.${inputVal}`)
          .maybeSingle();

        if (empData) {
          sessionCtx = {
            access_token: 'sb-access-token',
            user: { id: empData.user_id || 'u1', email: empData.email, full_name: empData.full_name },
            emp: empData,
            branch: { branch_id: 'b1', bank_name: empData.branch_name || 'HQ', branch_name: empData.branch_name || 'Main' },
            role: empData.service_type === 'super_admin' ? 'super_admin' : 'branch_admin'
          };
        } else if (inputVal.toLowerCase() === 'simbarashe.b.gudyanga@gmail.com' || inputVal.toUpperCase() === 'ZIM001' || inputVal.toUpperCase() === 'SUPERADMIN') {
          // Super Admin Master Override for Simbarashe
          sessionCtx = {
            access_token: 'super-admin-token',
            user: { id: 'super-1', email: 'simbarashe.b.gudyanga@gmail.com', full_name: 'Simbarashe Gudyanga' },
            emp: { emp_id: 'ZIM001', employee_id: 'ZIM001', full_name: 'Simbarashe Gudyanga', email: 'simbarashe.b.gudyanga@gmail.com', name: 'Simbarashe Gudyanga' },
            branch: { branch_id: 'hq-1', bank_name: 'Zim Queue Command Center', branch_name: 'Harare Central HQ' },
            role: 'super_admin'
          };
        }
      }

      if (!sessionCtx) {
        alert('Login Failed: No employee or admin account found for ' + inputVal);
        return;
      }

      localStorage.setItem('user', JSON.stringify(sessionCtx));
      navigate('/dashboard');
    } catch (err: any) {
      alert('Login Error: ' + (err.message || 'Authentication failed'));
    } finally {
      setLoading(false);
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
            <label style={{display:'block',fontSize:'13px',fontWeight:600,color:'var(--color-foreground)',marginBottom:'8px'}}>Employee ID or Email Address</label>
            <div style={{position:'relative'}}>
              <User style={{position:'absolute',left:'14px',top:'12px',color:'var(--color-foreground-muted)'}} size={18} />
              <input 
                type="text" required placeholder="ZIM001 or simbarashe.b.gudyanga@gmail.com"
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

          </div>

          <motion.button 
            whileHover={{scale:1.02}} whileTap={{scale:0.98}} type="submit"
            disabled={loading}
            style={{width:'100%',background:'var(--color-primary)',color:'var(--color-on-primary)',border:'none',padding:'14px',borderRadius:'var(--radius-md)',fontSize:'14px',fontWeight:700,cursor:'pointer',marginTop:'8px',display:'flex',justifyContent:'center',alignItems:'center',gap:'8px',opacity:loading?0.7:1}}
          >
            {loading ? 'Authenticating...' : <><LogIn size={18} /> Access Command Center</>}
          </motion.button>
        </form>

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
