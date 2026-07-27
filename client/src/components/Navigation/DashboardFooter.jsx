import React from 'react';

function DashboardFooter() {
  return (
    <footer 
      className="dashboard-footer" 
      style={{ 
        background: 'var(--navbar-bg, #0b0b0d)', 
        borderTop: '1px solid var(--border-color, #2d2d34)', 
        padding: '32px 24px', 
        color: 'var(--text-muted, #a1a1aa)', 
        fontSize: '0.85rem',
        marginTop: 'auto',
        transition: 'all 0.2s ease-in-out'
      }}
    >
      <div 
        className="footer-links-grid" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '24px', 
          maxWidth: '1200px', 
          margin: '0 auto' 
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h5 style={{ margin: 0, fontSize: '0.88rem', fontWeight: '700', color: 'var(--navbar-text, #f8f9fa)', letterSpacing: '0.5px' }}>
            📞 Direct Hotline
          </h5>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-primary, #cbd5e1)', fontWeight: '600' }}>
            +1 (555) 019-2834
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h5 style={{ margin: 0, fontSize: '0.88rem', fontWeight: '700', color: 'var(--navbar-text, #f8f9fa)', letterSpacing: '0.5px' }}>
            💬 Instant Messenger
          </h5>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-primary, #cbd5e1)', fontWeight: '600' }}>
            WhatsApp: +1 (555) 019-8800
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h5 style={{ margin: 0, fontSize: '0.88rem', fontWeight: '700', color: 'var(--navbar-text, #f8f9fa)', letterSpacing: '0.5px' }}>
            ✉️ Dispatch Records
          </h5>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-primary, #cbd5e1)', fontWeight: '600' }}>
            support@stockmaster.domain
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h5 style={{ margin: 0, fontSize: '0.88rem', fontWeight: '700', color: 'var(--navbar-text, #f8f9fa)', letterSpacing: '0.5px' }}>
            📍 Central Depot HQ
          </h5>
          <span style={{ width: '100%', fontSize: '0.85rem', color: 'var(--text-primary, #cbd5e1)', fontWeight: '600' }}>
            500 Enterprise Way, Tech City
          </span>
        </div>
      </div>

      <div 
        className="footer-bottom-copyright" 
        style={{ 
          textAlign: 'center', 
          borderTop: '1px solid var(--border-color, #2d2d34)', 
          marginTop: '28px', 
          paddingTop: '16px',
          fontSize: '0.75rem',
          color: 'var(--text-muted, #71717a)'
        }}
      >
        &copy; {new Date().getFullYear()} StockMaster Inc. Secure Logistics Cluster. All rights reserved.
      </div>
    </footer>
  );
}

export default DashboardFooter;
