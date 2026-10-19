import React from 'react';

function InventorySkeleton() {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', padding: '0px', boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }} className="inventory-view-loading">
      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted, #64748b)', fontWeight: '600', paddingLeft: '4px', letterSpacing: '-0.01em' }}>
        Loading the Bazzar marketplace…
      </div>
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', gap: '24px', background: 'var(--bg-card, #ffffff)', borderRadius: '16px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }} className="loading-skeleton-card">
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ width: '45%', height: '24px', backgroundColor: 'var(--border-color, #e2e8f0)', borderRadius: '6px' }}></div>
            <div style={{ width: '25%', height: '16px', backgroundColor: 'var(--bg-main, #f1f5f9)', borderRadius: '4px' }}></div>
            <div style={{ width: '15%', height: '28px', backgroundColor: 'var(--border-color, #e2e8f0)', borderRadius: '6px', marginTop: '12px' }}></div>
          </div>
          <div style={{ width: '120px', height: '120px', borderRadius: '12px', backgroundColor: 'var(--border-color, #e2e8f0)' }}></div>
        </div>
      ))}
    </div>
  );
}

export default InventorySkeleton;
