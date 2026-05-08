import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './AdminLogin';
import './index.css';

const Dashboard = lazy(() => import('./Dashboard'));
const BankDashboard = lazy(() => import('./BankDashboard'));
const PassportDashboard = lazy(() => import('./PassportDashboard'));
const NationalIDDashboard = lazy(() => import('./NationalIDDashboard'));

const DASHBOARD_MAP: Record<string, React.FC<any>> = {
  bank_admin: BankDashboard,
  branch_admin: BankDashboard,
  passport_admin: PassportDashboard,
  id_admin: NationalIDDashboard,
  super_admin: Dashboard,
};

function DashboardRouter() {
  const ctxString = localStorage.getItem('user');
  if (!ctxString) return <Navigate to="/login" replace />;

  try {
    const ctx = JSON.parse(ctxString);
    const Component = DASHBOARD_MAP[ctx.role];
    
    if (!Component) {
      return (
        <div style={{padding:'24px',textAlign:'center'}}>
          <h2>Access Denied</h2>
          <p>Role "{ctx.role}" is not authorized for any dashboard.</p>
          <button onClick={() => { localStorage.removeItem('user'); window.location.href='/login'; }}>Return to Login</button>
        </div>
      );
    }

    return (
      <Suspense fallback={<div style={{padding: '48px', textAlign: 'center', color: 'var(--color-foreground-muted)'}}>Loading dashboard...</div>}>
        <Component ctx={ctx} />
      </Suspense>
    );
  } catch (e) {
    return <Navigate to="/login" replace />;
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/dashboard" element={<DashboardRouter />} />
      </Routes>
    </BrowserRouter>
  );
}
