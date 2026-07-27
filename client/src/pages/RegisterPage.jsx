import React from 'react';
import { Link } from 'react-router-dom';
import { useRegisterData } from '../hooks/useRegisterData';

const RegisterPage = () => {
  // Destructure logical hook matrices
  const {
    username, setUsername, email, setEmail, firstName, setFirstName,
    lastName, setLastName, phoneNumber, setPhoneNumber, password, setPassword,
    confirmPassword, setConfirmPassword, error, loading,
    sysTime, nodePing, handleRegisterSubmit
  } = useRegisterData();

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-main, #0f172a)', fontFamily: 'sans-serif', padding: '20px', boxSizing: 'border-box' }} className="auth-master-universe">
      <div style={{ display: 'flex', width: '100%', maxWidth: '840px', background: 'var(--bg-card, #1e293b)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color, #334155)' }} className="glass-card">
        
        {/* Diagnostic Sidebar Terminal look */}
        <div style={{ flex: 1, padding: '30px', background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,27,171,0.2) 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }} className="terminal-panel">
          <div>
            <h2 style={{ color: 'var(--text-primary, #ffffff)', margin: '0 0 10px 0', fontSize: '1.5rem' }}>Secure Node Setup</h2>
            <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.85rem', margin: 0 }}>Register parameters onto centralized warehouse asset networks.</p>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#34d399', border: '1px solid var(--border-color, transparent)' }}>
            <p style={{ margin: 0 }}>&gt; Core Clock: {sysTime}</p>
            <p style={{ margin: '4px 0 0 0' }}>&gt; Node Latency: {nodePing}ms</p>
          </div>
        </div>

        {/* Inputs Workspace Form Panel */}
        <div style={{ flex: 1.2, padding: '35px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }} className="form-workspace">
          {error && <div style={{ background: 'var(--app-error-bg, rgba(239,68,68,0.1))', color: 'var(--app-error-text, #f87171)', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.82rem', border: '1px solid var(--app-error-border, transparent)' }}>⚠️ {error}</div>}
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '4px' }}>Username *</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ width: '100%', padding: '8px', background: 'var(--bg-main, #0f172a)', border: '1px solid var(--border-color, #334155)', borderRadius: '6px', color: 'var(--text-primary, #fff)', outline: 'none' }} className="shiny-input" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '4px' }}>Email Address *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '8px', background: 'var(--bg-main, #0f172a)', border: '1px solid var(--border-color, #334155)', borderRadius: '6px', color: 'var(--text-primary, #fff)', outline: 'none' }} className="shiny-input" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '4px' }}>First Name</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} style={{ width: '100%', padding: '8px', background: 'var(--bg-main, #0f172a)', border: '1px solid var(--border-color, #334155)', borderRadius: '6px', color: 'var(--text-primary, #fff)', outline: 'none' }} className="shiny-input" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '4px' }}>Last Name</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} style={{ width: '100%', padding: '8px', background: 'var(--bg-main, #0f172a)', border: '1px solid var(--border-color, #334155)', borderRadius: '6px', color: 'var(--text-primary, #fff)', outline: 'none' }} className="shiny-input" />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '4px' }}>Phone Number</label>
              <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} style={{ width: '100%', padding: '8px', background: 'var(--bg-main, #0f172a)', border: '1px solid var(--border-color, #334155)', borderRadius: '6px', color: 'var(--text-primary, #fff)', outline: 'none' }} className="shiny-input" />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '4px' }}>Password *</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '8px', background: 'var(--bg-main, #0f172a)', border: '1px solid var(--border-color, #334155)', borderRadius: '6px', color: 'var(--text-primary, #fff)', outline: 'none' }} className="shiny-input" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '4px' }}>Confirm *</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={{ width: '100%', padding: '8px', background: 'var(--bg-main, #0f172a)', border: password && confirmPassword && password !== confirmPassword ? '1px solid #ef4444' : '1px solid var(--border-color, #334155)', borderRadius: '6px', color: 'var(--text-primary, #fff)', outline: 'none' }} className="shiny-input" />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontSize: '0.88rem', fontWeight: '600', cursor: 'pointer', marginTop: '8px' }} className="neon-btn">
              {loading ? 'Processing...' : 'Sign Up'}
            </button>
          </form>
          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', marginTop: '15px' }}>Already have an account? <Link to="/login" style={{ color: '#38bdf8', textDecoration: 'none' }}>Login here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
