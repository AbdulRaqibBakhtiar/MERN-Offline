import React from 'react';

function LoginPage({ 
  username, setUsername, 
  password, setPassword, 
  confirmPassword, setConfirmPassword, 
  email, setEmail, 
  firstName, setFirstName, 
  lastName, setLastName, 
  phoneNumber, setPhoneNumber, 
  authError, isLoginMode, setIsLoginMode, setAuthError, 
  handleAuthSubmit, successModal, handleCloseSuccessModal, 
  toast, closeToast 
}) {
  
  // Safe responsive layout text mapping variables
  const textReadabilityStyle = { color: 'var(--text-primary, #0f172a)' };

  return (
    <div className="auth-master-universe" style={textReadabilityStyle}>
      {/* Toast Warning/Success Monitor */}
      {toast?.isOpen && (
        <div className="premium-toast-banner" style={{ background: toast.type === 'error' ? '#e11d48' : '#059669' }}>
          <span>{toast.type === 'error' ? '⚠️ ' : '✓ '} {toast.message}</span>
          <button type="button" onClick={closeToast} style={{ border: 'none', background: 'rgba(255,255,255,0.2)', width: '20px', height: '20px', borderRadius: '50%', cursor: 'pointer', color: '#ffffff', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
        </div>
      )}

      {/* Main Glass Form Container Card */}
      <div className="glass-card" style={{ color: 'var(--text-primary, #0f172a)' }}>
        {/* 🛠️ Minimalist Technical Operations Header Module */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '18px' }}>
          <span style={{ fontSize: '1.1rem', filter: 'drop-shadow(0 2px 4px rgba(37, 99, 235, 0.1))' }}>⚙️</span>
          <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted, #475569)', letterSpacing: '1.8px', textTransform: 'uppercase' }}>
            StockMaster Asset Network
          </span>
        </div>

        <h1 style={{ textAlign: 'center', margin: '0 0 6px 0', fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.5px', color: 'var(--text-primary, #0f172a)' }}>
          {isLoginMode ? "Login Portal" : "Create Account"}
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)', textAlign: 'center', margin: '0 0 28px 0', lineHeight: '1.4' }}>
          {isLoginMode ? "Secure Authorization Gateway Node." : "Password requires: 8+ characters, 1 capital, 1 number."}
        </p>

        <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="auth-input-label">Username</label>
            <input type='text' placeholder='Enter username' value={username} onChange={(e) => setUsername(e.target.value)} className="shiny-input" required />
          </div>

          {!isLoginMode && (
            <React.Fragment>
              <div>
                <label className="auth-input-label">Email Address</label>
                <input type='email' placeholder='name@domain.com' value={email} onChange={(e) => setEmail(e.target.value)} className="shiny-input" required={!isLoginMode} />
              </div>
              <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <div style={{ flex: 1 }}>
                  <label className="auth-input-label">First Name</label>
                  <input type='text' placeholder='John' value={firstName} onChange={(e) => setFirstName(e.target.value)} className="shiny-input" />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="auth-input-label">Last Name</label>
                  <input type='text' placeholder='Doe' value={lastName} onChange={(e) => setLastName(e.target.value)} className="shiny-input" />
                </div>
              </div>
              <div>
                <label className="auth-input-label">Phone Number</label>
                <input type='tel' placeholder='+1 (555) 000-0000' value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="shiny-input" />
              </div>
            </React.Fragment>
          )}
          <div>
            <label className="auth-input-label">Password</label>
            <input type='password' placeholder='Enter password' value={password} onChange={(e) => setPassword(e.target.value)} className="shiny-input" required />
          </div>

          {!isLoginMode && (
            <div>
              <label className="auth-input-label">Confirm Password</label>
              <input type='password' placeholder='Repeat password' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`shiny-input ${password && confirmPassword && password !== confirmPassword ? 'shiny-input-error' : ''}`} required={!isLoginMode} />
            </div>
          )}

          {authError && !toast?.isOpen && (
            <div style={{ background: 'var(--app-error-bg, #fef2f2)', color: 'var(--app-error-text, #ef4444)', padding: '10px 12px', borderRadius: '6px', fontSize: '0.82rem', border: '1px solid var(--app-error-border, #fee2e2)', lineHeight: '1.4' }}>
              ⚠️ {authError}
            </div>
          )}

          <button type="submit" className="neon-btn" style={{ background: isLoginMode ? '#2563eb' : '#10b981', width: '100%' }}>
            {isLoginMode ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted, #64748b)' }}>
          {isLoginMode ? "New to the platform?" : "Already have an account?"}
          <span onClick={() => { setIsLoginMode(!isLoginMode); if (typeof setAuthError === 'function') { setAuthError(""); } }} style={{ color: '#3b82f6', cursor: 'pointer', marginLeft: '6px', fontWeight: '600' }}>
            {isLoginMode ? "Register here" : "Login here"}
          </span>
        </p>
      </div>

      {/* Success Central Dialog Modal Box */}
      {successModal?.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }} className="modal-overlay">
          <div style={{ width: '90%', maxWidth: '380px', textAlign: 'center', padding: '36px 24px', background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }} className="modal">
            <div style={{ width: '50px', height: '50px', backgroundColor: 'rgba(5, 150, 105, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', fontSize: '20px', color: '#059669', border: '1px solid #059669' }}>✓</div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary, #0f172a)' }}>Success Account Setup</h3>
            <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.88rem', margin: '0 0 24px 0', lineHeight: '1.5' }}>{successModal.message}</p>
            <button onClick={handleCloseSuccessModal} style={{ background: '#059669', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', width: '100%' }}>Proceed to Terminal 🚀</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
