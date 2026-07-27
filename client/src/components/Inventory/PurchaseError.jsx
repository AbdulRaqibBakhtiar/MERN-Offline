import React from 'react';

function PurchaseError({ error, onBack }) {
  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui, sans-serif', maxWidth: '500px', margin: '40px auto', background: 'var(--bg-card, #ffffff)', borderRadius: '16px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }} className="purchase-error-card">
      <span style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }}>⚠️</span>
      <h3 style={{ color: '#dc3545', margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: '700' }}>Error Loading Asset Summary Node</h3>
      <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 20px 0' }}>{error || "The requested resource is missing from cluster collection tables."}</p>
      <button onClick={onBack} style={{ padding: '12px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', transition: 'all 0.2s' }}> Return to Fleet Catalog </button>
    </div>
  );
}

export default PurchaseError;
