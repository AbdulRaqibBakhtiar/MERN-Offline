import React from 'react';

function PurchaseLoading() {
  return (
    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-primary, #0f172a)', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '4px solid var(--border-color, #f3f3f3)', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>
      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600' }}>Loading Fleet Logistics Matrix...</h3>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default PurchaseLoading;
