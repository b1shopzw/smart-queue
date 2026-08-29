import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Building2, MapPin, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { supabase } from './utils/supabase';

const BANK_DATA: Record<string, Record<string, string[]>> = {
  "Harare Metropolitan": {
    "Harare CBD": ["CBZ Bank – 1st St","Stanbic Bank – Jason Moyo Ave","Standard Chartered – Samora Machel","FBC Bank – Rotten Row","Nedbank – First St","Ecobank – Angwa St","NMB Bank – Jason Moyo","BancABC – Speke Ave","BancABC – Heritage House","First Capital Bank – 1st St","ZB Bank – Kwame Nkrumah","CABS – Eastgate Mall","POSB – Kaguvi St","NBS – Broadstone","GetBucks Microfinance Bank","EmpowerBank – Kwame Nkrumah"],
    "Borrowdale": ["CBZ Bank – Sam Levy Village","Stanbic – Borrowdale Village","Steward Bank – Borrowdale","Standard Chartered – Borrowdale","BancABC – Sam Levy Village"],
    "Avondale": ["Steward Bank – Avondale","POSB – Avondale","ZB Bank – Avondale"],
    "Chitungwiza": ["CBZ Bank – Chitungwiza","ZB Bank – St Marys","POSB – Chitungwiza Town Centre","Steward Bank – Unit H"],
    "Highfield": ["POSB – Highfield","ZB Bank – Highfield","Steward Bank – Highfield"],
    "Glen View": ["CBZ – Glen View","POSB – Glen View"],
    "Mbare": ["Steward Bank – Mbare Musika","POSB – Mbare"],
  },
  "Bulawayo Metropolitan": {
    "Bulawayo CBD": ["CBZ – 8th Ave / Jason Moyo","Stanbic – Joshua Nkomo St","FBC Bank – 9th Ave","Nedbank – Fort St","BancABC – 10th Ave / Jason Moyo","First Capital Bank – Joshua Nkomo","Steward Bank – Fife St","ZB Bank – 10th Ave","CABS – Jason Moyo Ave","POSB – 8th Ave","NBS – Fort St","EmpowerBank – Bulawayo"],
    "Nkulumane": ["POSB – Nkulumane","ZB Bank – Nkulumane","Steward Bank – Nketa"],
    "Luveve": ["POSB – Luveve","CBZ – Luveve"],
  },
  "Midlands": {
    "Gweru": ["CBZ – Main St Gweru","Stanbic – Gweru","FBC Bank – Gweru","ZB Bank – Gweru","BancABC – Main St Gweru","CABS – Gweru","POSB – Gweru"],
    "Kwekwe": ["CBZ – Kwekwe","Steward Bank – Kwekwe","POSB – Kwekwe","ZB Bank – Kwekwe","FBC – Kwekwe","BancABC – Kwekwe Branch"],
    "Zvishavane": ["POSB – Zvishavane","FBC Bank – Zvishavane","ZB Bank – Zvishavane","BancABC – Zvishavane Branch"],
    "Shurugwi": ["POSB – Shurugwi"],
  },
  "Manicaland": {
    "Mutare": ["CBZ – H. Chitepo Ave Mutare","Stanbic – Mutare","FBC Bank – Mutare","Nedbank – Mutare","BancABC – Herbert Chitepo Ave","Steward Bank – Mutare","CABS – Mutare","POSB – Mutare","First Capital Bank – Mutare","ZB Bank – Mutare","Agribank/AFC – Mutare"],
    "Rusape": ["CBZ – Rusape","Agribank/AFC – Rusape","POSB – Rusape"],
    "Chipinge": ["FBC – Chipinge","POSB – Chipinge","ZB Bank – Chipinge"],
    "Nyanga": ["POSB – Nyanga"],
  },
  "Masvingo": {
    "Masvingo": ["CBZ – Masvingo","Steward Bank – Masvingo","FBC Bank – Masvingo","BancABC – Robert Mugabe Way","CABS – Masvingo","POSB – Masvingo","ZB Bank – Masvingo","First Capital Bank – Masvingo"],
    "Chiredzi": ["CBZ – Chiredzi","POSB – Chiredzi"],
    "Triangle": ["Stanbic – Triangle"],
    "Bikita": ["POSB – Bikita"],
  },
  "Mashonaland West": {
    "Chinhoyi": ["CBZ – Chinhoyi","Stanbic – Chinhoyi","ZB Bank – Chinhoyi","BancABC – Chinhoyi Branch","POSB – Chinhoyi","FBC – Chinhoyi"],
    "Kadoma": ["CBZ – Kadoma","FBC Bank – Kadoma","CABS – Kadoma","POSB – Kadoma"],
    "Chegutu": ["POSB – Chegutu","ZB Bank – Chegutu"],
    "Norton": ["POSB – Norton","Steward Bank – Norton"],
    "Kariba": ["POSB – Kariba","ZB Bank – Kariba"],
  },
  "Mashonaland East": {
    "Marondera": ["CBZ – Marondera","FBC Bank – Marondera","Steward Bank – Marondera","BancABC – Marondera Branch","CABS – Marondera","POSB – Marondera","ZB Bank – Marondera","AFC Land Bank – Marondera"],
    "Mutoko": ["CBZ – Mutoko","POSB – Mutoko"],
    "Murehwa": ["POSB – Murehwa"],
    "Goromonzi": ["POSB – Goromonzi"],
  },
  "Matabeleland South": {
    "Gwanda": ["CBZ – Gwanda","FBC Bank – Gwanda","POSB – Gwanda","ZB Bank – Gwanda"],
    "Beitbridge": ["CBZ – Beitbridge","Stanbic – Beitbridge","BancABC – Beitbridge Branch","CABS – Beitbridge","POSB – Beitbridge"],
    "Plumtree": ["POSB – Plumtree"],
  },
  "Matabeleland North": {
    "Victoria Falls": ["CBZ – Victoria Falls","BancABC – Victoria Falls Branch","POSB – Victoria Falls","Steward Bank – Victoria Falls"],
    "Hwange": ["CBZ – Hwange","POSB – Hwange","ZB Bank – Hwange"],
    "Lupane": ["POSB – Lupane"],
  },
  "Mashonaland Central": {
    "Bindura": ["CBZ – Bindura","BancABC – Bindura Branch","POSB – Bindura","ZB Bank – Bindura"],
    "Mount Darwin": ["POSB – Mount Darwin","CBZ – Mount Darwin"],
    "Guruve": ["POSB – Guruve"],
    "Concession": ["ZB Bank – Concession"],
  },
};

const PASSPORT_DATA: Record<string, Record<string, string[]>> = {
  "Harare Metropolitan": {
    "Harare": ["Makombe Building – Main Passport Centre","Registrar General Office (86 Mbuya Nehanda)"],
  },
  "Bulawayo Metropolitan": {
    "Bulawayo": ["Mhlahlandlela Govt Complex – Bulawayo Passport","Bulawayo Airport Sub-office"],
  },
  "Midlands": {
    "Gweru": ["Gweru Provincial Passport Office"],
    "Kwekwe": ["Kwekwe Passport Sub-office"],
  },
  "Manicaland": {
    "Mutare": ["Mutare Provincial Passport Office (ZIMRE Centre)"],
    "Chipinge": ["Chipinge Passport Sub-office"],
  },
  "Masvingo": {
    "Masvingo": ["Masvingo Provincial Passport Office"],
    "Chiredzi": ["Chiredzi Passport Sub-office"],
  },
  "Mashonaland West": {
    "Chinhoyi": ["Chinhoyi Provincial Passport Office"],
    "Kariba": ["Kariba Passport Sub-office"],
  },
  "Mashonaland East": {
    "Marondera": ["Marondera Provincial Passport Office"],
  },
  "Mashonaland Central": {
    "Bindura": ["Bindura Provincial Passport Office"],
    "Mount Darwin": ["Mount Darwin Passport Sub-office"],
  },
  "Matabeleland": {
    "Hwange": ["Hwange Government Complex Passport Office"],
    "Victoria Falls": ["Victoria Falls Passport Office (Chinotimba)"],
    "Beitbridge": ["Beitbridge Border Post – Passport Services"],
    "Plumtree": ["Plumtree Passport Sub-office"],
  },
};

const ID_DATA: Record<string, Record<string, string[]>> = {
  "Harare Metropolitan": {
    "Harare CBD": ["Makombe Building – Main ID Centre","Market Square (86 Mbuya Nehanda)"],
    "Highfield": ["Highfield Community Centre ID Office","Mabvuku (Former Wenela Offices)"],
    "Hatfield": ["Hatfield District Office"],
    "Kuwadzana": ["Kuwadzana Holland Old Farm House"],
    "Mount Pleasant": ["Mount Pleasant District Office"],
    "Chitungwiza": ["Chitungwiza (Seke North) ID Office"],
  },
  "Bulawayo Metropolitan": {
    "Bulawayo CBD": ["Mhlahlandlela Govt Complex – ID Registry","Bulawayo Airport Sub-office"],
    "Mpopoma": ["Western Commonage – Mpopoma ID Office"],
    "Nkulumane": ["Nkulumane Complex ID Office"],
  },
  "Manicaland": {
    "Mutare": ["Mutare Provincial Registry (ZIMRE Centre)","Mutare District Registry (43 Tembwe)"],
    "Rusape": ["Rusape (Makoni DA Complex)"],
    "Chipinge": ["Chipinge New Government Complex"],
    "Nyanga": ["Nyanga DA Complex"],
    "Chimanimani": ["Chimanimani RDC Offices"],
    "Murambinda": ["Buhera (Murambinda) ID Office"],
  },
  "Midlands": {
    "Gweru": ["Gweru Provincial Registry (New Govt Block)"],
    "Kwekwe": ["Kwekwe District Registry"],
    "Zvishavane": ["Zvishavane Government Complex"],
    "Gokwe South": ["Gokwe South Government Complex"],
    "Gokwe North": ["Gokwe North (Nembudziya) ID Office"],
    "Shurugwi": ["Shurugwi Town Council ID Office"],
  },
  "Masvingo": {
    "Masvingo": ["Masvingo Provincial Registry"],
    "Chiredzi": ["Chiredzi DA Complex"],
    "Bikita": ["Bikita DA Office"],
    "Chivi": ["Chivi Government Complex"],
    "Zaka": ["Zaka Growth Point ID Office"],
    "Mwenezi": ["Mwenezi (Neshuro) ID Office"],
  },
  "Mashonaland West": {
    "Chinhoyi": ["Chinhoyi Provincial Complex"],
    "Kadoma": ["Kadoma District Registry"],
    "Chegutu": ["Chegutu Town Council ID Office"],
    "Kariba": ["Kariba District Registry"],
    "Norton": ["Norton Sub-office"],
  },
  "Mashonaland East": {
    "Marondera": ["Marondera Provincial Registry"],
    "Murehwa": ["Murehwa DA Complex"],
    "Mutoko": ["Mutoko DDF Complex"],
    "Goromonzi": ["Goromonzi Public Works ID Office"],
    "Mudzi": ["Mudzi (Kotwa Growth Point) ID Office"],
  },
  "Mashonaland Central": {
    "Bindura": ["Bindura Provincial Registry (Mutungagore)"],
    "Mount Darwin": ["Mount Darwin DA Complex"],
    "Guruve": ["Guruve Old Magistrate Court"],
    "Concession": ["Mazowe (Concession) ID Office"],
  },
  "Matabeleland": {
    "Lupane": ["Lupane (Kusile RDC Offices)"],
    "Hwange": ["Hwange Government Complex ID Office"],
    "Victoria Falls": ["Victoria Falls (Chinotimba) ID Office"],
    "Gwanda": ["Gwanda Provincial Complex"],
    "Beitbridge": ["Beitbridge Border Post – ID Services"],
    "Plumtree": ["Plumtree ID Sub-office"],
  },
};

const TELECOM_DATA: Record<string, Record<string, string[]>> = {
  "Harare Metropolitan": {
    "Harare CBD": ["Econet Shop – Joina City","Econet Shop – First St","NetOne Customer Care – Kopje","NetOne Customer Care – First St","Telecel Shop – Inez Terrace","TelOne Client Center – Runhare House"],
    "Borrowdale": ["Econet Shop – Sam Levy's Village","Liquid Home – Borrowdale"],
    "Avondale": ["Econet Shop – Avondale","TelOne Client Center – Avondale"],
    "Chitungwiza": ["Econet Shop – Chitungwiza Town Centre","NetOne – Chitungwiza","TelOne – Chitungwiza"],
  },
  "Bulawayo Metropolitan": {
    "Bulawayo CBD": ["Econet Shop – Main Branch (Jason Moyo)","NetOne Customer Care – Leopold Takawira","Telecel Shop – 8th Ave","TelOne Client Center – Main Post Office"],
  },
  "Midlands": {
    "Gweru": ["Econet Shop – Main St Gweru","NetOne – Gweru","TelOne – Gweru"],
    "Kwekwe": ["Econet Shop – Kwekwe","TelOne – Kwekwe"],
  },
  "Manicaland": {
    "Mutare": ["Econet Shop – Herbert Chitepo Mutare","NetOne – Mutare","TelOne – Mutare"],
  },
  "Masvingo": {
    "Masvingo": ["Econet Shop – Masvingo","NetOne – Masvingo","TelOne – Masvingo"],
  },
  "Mashonaland West": {
    "Chinhoyi": ["Econet Shop – Chinhoyi","TelOne – Chinhoyi"],
  },
};

const UTILITY_DATA: Record<string, Record<string, string[]>> = {
  "Harare Metropolitan": {
    "Harare CBD": ["ZETDC / ZESA – Harare Central (Samora Machel)","ZIMRA Customs – Kurima House","NSSA House – Harare","City of Harare – Town House","ZINARA – Belvedere Head Office"],
    "Eastlea": ["VID – Eastlea Vehicle Inspection Depot"],
    "Wynford": ["ZETDC – Wynford Depot"],
    "Chitungwiza": ["ZETDC – Chitungwiza Depot","Chitungwiza Municipality Head Office"],
  },
  "Bulawayo Metropolitan": {
    "Bulawayo CBD": ["ZETDC – Bulawayo Central","ZIMRA – Mhlahlandlela Govt Complex","Bulawayo City Council – Tower Block","NSSA – Bulawayo Regional Office","VID – Bulawayo Depot"],
  },
  "Manicaland": {
    "Mutare": ["ZETDC – Mutare District","ZIMRA – Forbes Border Post","City of Mutare – Civic Centre","NSSA – Mutare"],
  },
  "Midlands": {
    "Gweru": ["ZETDC – Gweru Main Depot","Gweru City Council – Civic Centre","NSSA – Gweru"],
  },
  "Masvingo": {
    "Masvingo": ["ZETDC – Masvingo District","Masvingo City Council","NSSA – Masvingo"],
  },
};

const REMITTANCE_DATA: Record<string, Record<string, string[]>> = {
  "Harare Metropolitan": {
    "Harare CBD": ["Mukuru – Joina City","Mukuru – Speke Ave","Western Union – Post Office Arcade","WorldRemit Hub – Samora Machel"],
    "Chitungwiza": ["Mukuru – Chitungwiza Town Centre"],
  },
  "Bulawayo Metropolitan": {
    "Bulawayo CBD": ["Mukuru – 8th Ave Bulawayo","Western Union – Main Post Office"],
  },
  "Manicaland": {
    "Mutare": ["Mukuru – Mutare Central"],
  },
  "Midlands": {
    "Gweru": ["Mukuru – Gweru Main St"],
  },
};

function getDataMap(service: string): Record<string, Record<string, string[]>> {
  if (service === 'banks') return BANK_DATA;
  if (service === 'passport') return PASSPORT_DATA;
  if (service === 'id') return ID_DATA;
  if (service === 'telecoms') return TELECOM_DATA;
  if (service === 'utilities') return UTILITY_DATA;
  if (service === 'remittances') return REMITTANCE_DATA;
  return BANK_DATA;
}

const sel: React.CSSProperties = {
  width: '100%', padding: '12px 36px 12px 42px',
  background: 'var(--color-background)', border: '1px solid var(--color-border)',
  borderRadius: '8px', color: 'var(--color-foreground)', fontSize: '13px', appearance: 'none',
};

export default function AdminSignup() {
  const [service, setService] = useState('passport');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const dataMap = getDataMap(service);
  const provinces = Object.keys(dataMap);
  const cities = province ? Object.keys(dataMap[province] ?? {}) : [];
  const branches = province && city ? (dataMap[province]?.[city] ?? []) : [];

  const onServiceChange = (v: string) => { setService(v); setProvince(''); setCity(''); };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email') || '').trim();
    const password = String(fd.get('password') || '');
    const fullName = String(fd.get('full_name') || '').trim();
    const branchName = String(fd.get('branch_name') || '');

    try {
      const prefixMap: Record<string, string> = {
        banks: 'BNK', passport: 'PASS', id: 'ID', telecoms: 'TEL', utilities: 'UTL', remittances: 'REM'
      };
      const prefix = prefixMap[service] || 'ADM';
      const employeeId = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Supabase Auth Registration
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            service_type: service,
            branch_name: branchName,
            employee_id: employeeId,
          }
        }
      });

      if (authError && !authError.message.includes('User already registered')) {
        throw new Error(authError.message);
      }

      // 2. Supabase Database `employees` table insertion
      const { error: dbError } = await supabase.from('employees').upsert([
        {
          employee_id: employeeId,
          emp_id: employeeId,
          full_name: fullName,
          email,
          service_type: service,
          branch_name: branchName,
          password,
          user_id: authData?.user?.id || null,
          created_at: new Date().toISOString()
        }
      ], { onConflict: 'email' });

      if (dbError) {
        console.warn('Employees database insertion note:', dbError.message);
      }

      alert(`Account Provisioned in Supabase!\n\nYour Employee ID is: ${employeeId}\n\nPlease save this ID to log in.`);
      navigate('/login');
    } catch (err: any) {
      console.error('Supabase registration error:', err);
      setErrorMsg(err.message || 'Could not provision account in Supabase. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const labelStyle: React.CSSProperties = { display:'block', fontSize:'12px', fontWeight:600, color:'var(--color-foreground)', marginBottom:'8px' };
  const iconStyle: React.CSSProperties = { position:'absolute', left:'14px', top:'12px', color:'var(--color-foreground-muted)' };
  const chevronStyle: React.CSSProperties = { position:'absolute', right:'12px', top:'13px', color:'var(--color-foreground-muted)', pointerEvents:'none' };

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--color-background)',padding:'24px'}}>
      <motion.div
        initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} transition={{type:'spring' as const,damping:25}}
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
              <label style={labelStyle}>Full Name</label>
              <div style={{position:'relative'}}>
                <User style={iconStyle} size={18} />
                <input name="full_name" required type="text" placeholder="T. Chigumira"
                  style={{...sel, padding:'12px 14px 12px 38px'}} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <div style={{position:'relative'}}>
                <Mail style={iconStyle} size={18} />
                <input name="email" required type="email" placeholder="admin@rg.gov.zw"
                  style={{...sel, padding:'12px 14px 12px 38px'}} />
              </div>
            </div>
          </div>

          {/* ① Service */}
          <div>
            <label style={labelStyle}>Service Entity</label>
            <div style={{position:'relative'}}>
              <Building2 style={iconStyle} size={18} />
              <select value={service} onChange={e => onServiceChange(e.target.value)} style={sel}>
                <option value="passport">Passport Offices</option>
                <option value="id">National ID Centers</option>
                <option value="banks">Retail Banks & Microfinance</option>
                <option value="telecoms">Telecoms & Internet (Econet, NetOne, TelOne, Liquid)</option>
                <option value="utilities">Utilities & Municipalities (ZETDC/ZESA, ZIMRA, NSSA, VID, City Councils)</option>
                <option value="remittances">Remittance & Money Transfer (Mukuru, Western Union, WorldRemit)</option>
              </select>
              <ChevronDown style={chevronStyle} size={16} />
            </div>
          </div>

          {/* ② Province */}
          <div>
            <label style={labelStyle}>Province</label>
            <div style={{position:'relative'}}>
              <MapPin style={iconStyle} size={18} />
              <select value={province} onChange={e => { setProvince(e.target.value); setCity(''); }} required style={sel}>
                <option value="">— Select Province —</option>
                {provinces.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <ChevronDown style={chevronStyle} size={16} />
            </div>
          </div>

          {/* ③ City / Town */}
          {province && (
            <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} transition={{duration:0.18}}>
              <label style={labelStyle}>City / Town</label>
              <div style={{position:'relative'}}>
                <MapPin style={iconStyle} size={18} />
                <select value={city} onChange={e => setCity(e.target.value)} required style={sel}>
                  <option value="">— Select City / Town —</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown style={chevronStyle} size={16} />
              </div>
            </motion.div>
          )}

          {/* ④ Specific Branch */}
          {city && (
            <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} transition={{duration:0.18}}>
              <label style={labelStyle}>Specific Branch</label>
              <div style={{position:'relative'}}>
                <Building2 style={iconStyle} size={18} />
                <select name="branch_name" required style={sel}>
                  <option value="">— Select Branch —</option>
                  {branches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <ChevronDown style={chevronStyle} size={16} />
              </div>
            </motion.div>
          )}

          {/* Password */}
          <div>
            <label style={labelStyle}>Access Password</label>
            <div style={{position:'relative'}}>
              <Lock style={iconStyle} size={18} />
              <input name="password" required type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                style={{...sel, padding:'12px 42px 12px 42px'}} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{position:'absolute',right:'14px',top:'12px',background:'none',border:'none',color:'var(--color-foreground-muted)',cursor:'pointer',padding:0,display:'flex',alignItems:'center'}}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div style={{background:'rgba(229,72,77,0.1)',border:'1px solid rgba(229,72,77,0.2)',borderRadius:'var(--radius-sm)',padding:'10px 14px',fontSize:'13px',color:'#E5484D'}}>
              {errorMsg}
            </div>
          )}

          <motion.button whileHover={{scale: loading ? 1 : 1.02}} whileTap={{scale: loading ? 1 : 0.98}} type="submit"
            disabled={loading}
            style={{width:'100%',background:'var(--color-primary)',color:'var(--color-on-primary)',border:'none',padding:'14px',borderRadius:'var(--radius-md)',fontSize:'14px',fontWeight:700,cursor:loading?'not-allowed':'pointer',marginTop:'8px',opacity:loading?0.7:1}}>
            {loading ? 'Provisioning Supabase Account...' : 'Provision Branch Dashboard'}
          </motion.button>
        </form>

        <div style={{marginTop:'24px',textAlign:'center',fontSize:'13px',color:'var(--color-foreground-muted)'}}>
          Already allocated? <Link to="/login" style={{color:'var(--color-primary)',fontWeight:700,textDecoration:'none'}}>Sign in</Link>
        </div>
      </motion.div>
    </div>
  );
}
