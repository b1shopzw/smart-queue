import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Building2, MapPin, Eye, EyeOff } from 'lucide-react';
import { supabase } from './utils/supabase';

const BANK_BRANCHES = [
  {
    province: "Harare Metropolitan",
    locations: ["CBZ Bank", "Stanbic Bank", "Standard Chartered", "FBC Bank", "Nedbank", "Ecobank", "NMB Bank", "BancABC", "First Capital Bank", "Steward Bank", "ZB Bank", "CABS", "POSB", "NBS"]
  },
  {
    province: "Bulawayo Metropolitan",
    locations: ["CBZ (8th Ave/Jason Moyo)", "Stanbic (Joshua Nkomo St)", "FBC Bank", "Nedbank", "BancABC", "First Capital Bank", "Steward Bank (Fife St)", "ZB Bank", "CABS (Jason Moyo)", "POSB", "NBS"]
  },
  {
    province: "Midlands",
    locations: ["CBZ (Gweru/Kwekwe)", "Stanbic", "FBC Bank", "Steward Bank", "ZB Bank", "CABS", "POSB"]
  },
  {
    province: "Manicaland",
    locations: ["CBZ (Mutare/Rusape)", "Stanbic", "FBC Bank", "Nedbank", "Steward Bank", "CABS", "POSB", "First Capital Bank", "Agribank/AFC", "ZB Bank"]
  },
  {
    province: "Masvingo",
    locations: ["CBZ (Masvingo/Chiredzi)", "Steward Bank", "FBC Bank", "CABS", "POSB", "ZB Bank", "First Capital Bank", "Stanbic (Triangle)"]
  },
  {
    province: "Mashonaland West",
    locations: ["CBZ (Chinhoyi/Kadoma)", "Stanbic", "FBC Bank", "ZB Bank", "CABS", "POSB"]
  },
  {
    province: "Mashonaland East",
    locations: ["CBZ (Marondera/Mutoko)", "FBC Bank", "Steward Bank", "CABS", "POSB", "ZB Bank", "AFC Land Bank"]
  },
  {
    province: "Matabeleland South",
    locations: ["CBZ (Gwanda/Beitbridge)", "FBC Bank", "Stanbic", "CABS", "POSB", "ZB Bank"]
  }
];

const REGISTRY_BRANCHES = [
  {
    province: "Harare Metropolitan",
    locations: [
      "Makombe Building (Main Provincial Hub)",
      "Market Square (86 Mbuya Nehanda)",
      "Highfield Community Centre",
      "Mabvuku (Former Wenela Offices)",
      "Hatfield District Office",
      "Kuwadzana Holland Old Farm House",
      "Mount Pleasant District Office",
      "Chitungwiza (Seke North)"
    ]
  },
  {
    province: "Bulawayo Metropolitan",
    locations: [
      "Mhlahlandlela Government Complex",
      "Western Commonage (Mpopoma)",
      "Nkulumane Complex",
      "Bulawayo Airport Sub-office"
    ]
  },
  {
    province: "Manicaland",
    locations: [
      "Mutare Provincial (ZIMRE Centre)",
      "Mutare District (43 Tembwe)",
      "Rusape (Makoni DA Complex)",
      "Chipinge New Government Complex",
      "Nyanga DA Complex",
      "Chimanimani RDC Offices",
      "Buhera (Murambinda)"
    ]
  },
  {
    province: "Midlands",
    locations: [
      "Gweru Provincial (New Govt Block)",
      "Kwekwe Registry",
      "Zvishavane Government Complex",
      "Gokwe South Government Complex",
      "Gokwe North (Nembudziya)",
      "Shurugwi Town Council"
    ]
  },
  {
    province: "Masvingo",
    locations: [
      "Masvingo Provincial",
      "Chiredzi DA Complex",
      "Bikita DA Office",
      "Chivi Government Complex",
      "Zaka Growth Point",
      "Mwenezi (Neshuro)"
    ]
  },
  {
    province: "Mashonaland West",
    locations: [
      "Chinhoyi Provincial Complex",
      "Kadoma District Registry",
      "Chegutu Town Council",
      "Kariba District Registry",
      "Norton Sub-office"
    ]
  },
  {
    province: "Mashonaland East",
    locations: [
      "Marondera Provincial",
      "Murehwa DA Complex",
      "Mutoko DDF Complex",
      "Goromonzi Public Works",
      "Mudzi (Kotwa Growth Point)"
    ]
  },
  {
    province: "Mashonaland Central",
    locations: [
      "Bindura Provincial (Mutungagore)",
      "Mount Darwin DA Complex",
      "Guruve Old Magistrate Court",
      "Mazowe (Concession)"
    ]
  },
  {
    province: "Matabeleland",
    locations: [
      "Lupane (Kusile RDC Offices)",
      "Hwange Government Complex",
      "Victoria Falls (Chinotimba)",
      "Gwanda Provincial Complex",
      "Beitbridge Border Post",
      "Plumtree"
    ]
  }
];

export default function AdminSignup() {
  const [service, setService] = useState('passport');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const payload = {
      full_name: data.get('full_name'),
      email: data.get('email'),
      service_type: service,
      branch_name: data.get('branch_name'),
      password: data.get('password')
    };

    try {
      const prefix = service === 'banks' ? 'BNK' : (service === 'passport' ? 'PASS' : 'ID');
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const employee_id = `${prefix}${randomNum}`;

      const { error } = await supabase
        .from('employees')
        .insert([
          {
            employee_id,
            ...payload
          }
        ]);
        
      if (error) throw error;
      
      alert(`Account Provisioned to Supabase!\n\nYour Employee ID is: ${employee_id}\n\nPlease save this ID to log in.`);
      navigate('/login');
    } catch (err) {
      alert('Could not reach Supabase. Ensure valid configurations exist.');
    }
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--color-background)',padding:'24px'}}>
      <motion.div 
        initial={{opacity:0, y:-20}} animate={{opacity:1, y:0}} transition={{type:'spring' as const, damping:25}}
        style={{width:'100%',maxWidth:'480px',background:'var(--color-panel)',padding:'32px',borderRadius:'16px',boxShadow:'var(--shadow-lg)',border:'1px solid var(--color-border)'}}
      >
        <div style={{display:'flex',justifyContent:'center',marginBottom:'20px'}}>
          <img src="/icon.png" alt="Zim Queue Logo" style={{width:'56px',height:'56px',borderRadius:'16px',boxShadow:'var(--shadow-sm)'}} />
        </div>
        
        <h1 style={{fontSize:'23px',fontWeight:700,color:'var(--color-foreground)',textAlign:'center',marginBottom:'8px'}}>Register Branch Admin</h1>
        <p style={{fontSize:'13px',color:'var(--color-foreground-muted)',textAlign:'center',marginBottom:'32px'}}>Configure your specialized branch telemetry access</p>

        <form onSubmit={handleSignup} style={{display:'flex',flexDirection:'column',gap:'16px'}}>
          
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
            <div>
              <label style={{display:'block',fontSize:'12px',fontWeight:600,color:'var(--color-foreground)',marginBottom:'8px'}}>Full Name</label>
              <div style={{position:'relative'}}>
                <User style={{position:'absolute',left:'12px',top:'12px',color:'var(--color-foreground-muted)'}} size={18} />
                <input name="full_name" required type="text" placeholder="T. Chigumira" style={{width:'100%',padding:'12px 14px 12px 38px',background:'var(--color-background)',border:'1px solid var(--color-border)',borderRadius:'8px',color:'var(--color-foreground)',fontSize:'13px'}} />
              </div>
            </div>
            <div>
              <label style={{display:'block',fontSize:'12px',fontWeight:600,color:'var(--color-foreground)',marginBottom:'8px'}}>Email</label>
              <div style={{position:'relative'}}>
                <Mail style={{position:'absolute',left:'12px',top:'12px',color:'var(--color-foreground-muted)'}} size={18} />
                <input name="email" required type="email" placeholder="admin@rg.gov.zw" style={{width:'100%',padding:'12px 14px 12px 38px',background:'var(--color-background)',border:'1px solid var(--color-border)',borderRadius:'8px',color:'var(--color-foreground)',fontSize:'13px'}} />
              </div>
            </div>
          </div>

          <div>
            <label style={{display:'block',fontSize:'12px',fontWeight:600,color:'var(--color-foreground)',marginBottom:'8px'}}>Service Entity</label>
            <div style={{position:'relative'}}>
              <Building2 style={{position:'absolute',left:'14px',top:'12px',color:'var(--color-foreground-muted)'}} size={18} />
              <select 
                value={service} onChange={(e)=>setService(e.target.value)}
                style={{width:'100%',padding:'12px 14px 12px 42px',background:'var(--color-background)',border:'1px solid var(--color-border)',borderRadius:'8px',color:'var(--color-foreground)',fontSize:'13px',appearance:'none'}}
              >
                <option value="passport">Passport Offices</option>
                <option value="id">National ID Centers</option>
                <option value="banks">Retail Banks</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{display:'block',fontSize:'12px',fontWeight:600,color:'var(--color-foreground)',marginBottom:'8px'}}>Specific Branch Allocation</label>
            <div style={{position:'relative'}}>
              <MapPin style={{position:'absolute',left:'14px',top:'12px',color:'var(--color-foreground-muted)'}} size={18} />
              <select name="branch_name" required
                style={{width:'100%',padding:'12px 14px 12px 42px',background:'var(--color-background)',border:'1px solid var(--color-border)',borderRadius:'8px',color:'var(--color-foreground)',fontSize:'13px',appearance:'none'}}
              >
                {service === 'banks' && (
                  BANK_BRANCHES.map(prov => (
                    <optgroup key={prov.province} label={prov.province}>
                      {prov.locations.map(loc => (
                        <option key={loc}>{loc}</option>
                      ))}
                    </optgroup>
                  ))
                )}
                {service === 'passport' && (
                  <>
                    <optgroup label="Main Offices">
                      <option>Harare Registrar General</option>
                      <option>Bulawayo Passport Office</option>
                      <option>Gweru Passport Office</option>
                    </optgroup>
                  </>
                )}
                {service === 'id' && (
                  REGISTRY_BRANCHES.map(prov => (
                    <optgroup key={prov.province} label={prov.province}>
                      {prov.locations.map(loc => (
                        <option key={loc}>{loc}</option>
                      ))}
                    </optgroup>
                  ))
                )}
              </select>
            </div>
          </div>

          <div>
            <label style={{display:'block',fontSize:'12px',fontWeight:600,color:'var(--color-foreground)',marginBottom:'8px'}}>Access Password</label>
            <div style={{position:'relative'}}>
              <Lock style={{position:'absolute',left:'14px',top:'12px',color:'var(--color-foreground-muted)'}} size={18} />
              <input name="password" required type={showPassword ? "text" : "password"} placeholder="••••••••" style={{width:'100%',padding:'12px 42px 12px 42px',background:'var(--color-background)',border:'1px solid var(--color-border)',borderRadius:'8px',color:'var(--color-foreground)',fontSize:'13px'}} />
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
            style={{width:'100%',background:'var(--color-primary)',color:'white',border:'none',padding:'14px',borderRadius:'8px',fontSize:'14px',fontWeight:700,cursor:'pointer',marginTop:'8px'}}
          >
            Provision Branch Dashboard
          </motion.button>
        </form>

        <div style={{marginTop:'24px',textAlign:'center',fontSize:'13px',color:'var(--color-foreground-muted)'}}>
          Already allocated? <Link to="/login" style={{color:'var(--color-primary)',fontWeight:700,textDecoration:'none'}}>Sign in</Link>
        </div>
      </motion.div>
    </div>
  );
}
