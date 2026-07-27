// src/components/Modal/DeleteModal.jsx
import React, { useState } from "react";

function DeleteModal({ deleteTargetId, handleConfirmDelete, setDeleteTargetId }) {
  // Track button hover states locally to inject clean interactive scaling transitions
  const [hoveredButton, setHoveredRatio] = useState(null);

  if (!deleteTargetId) {
    return null;
  }

  return (
    <div 
      className="modal-overlay" 
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, animation: 'fadeIn 0.2s ease-out' }} 
    >
      <div 
        className="modal" 
        style={{ width: '100%', maxWidth: '380px', background: 'var(--bg-card, #ffffff)', padding: '24px 30px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.04)', boxSizing: 'border-box', textAlign: 'center', border: '1px solid var(--border-color, #e2e8f0)', animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }} 
      >
        {/* Visual Attention Indicator Anchor Icon Sphere */}
        <div style={{ width: '56px', height: '56px', backgroundColor: 'var(--app-error-bg, rgba(220, 53, 69, 0.15))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', fontSize: '24px', color: 'var(--app-error-text, #dc3545)', border: '1px solid var(--app-error-border, transparent)' }} > 
          🗑️ 
        </div>

        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary, #0f172a)', letterSpacing: '-0.025em' }} > 
          Remove Catalog Asset? 
        </h3>
        <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.9rem', margin: '0 0 24px 0', lineHeight: '1.5' }} > 
          Are you sure you want to delete this inventory item? This operation cannot be undone. 
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* Cancel Secondary Button */}
          <button 
            type="button" 
            onClick={() => setDeleteTargetId(null)} 
            onMouseEnter={() => setHoveredRatio('cancel')} 
            onMouseLeave={() => setHoveredRatio(null)} 
            style={{ flex: 1, color: 'var(--text-primary, #334155)', border: '1px solid var(--border-color, #cbd5e1)', borderRadius: '6px', padding: '12px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease-in-out', transform: hoveredButton === 'cancel' ? 'translateY(-1px)' : 'none', backgroundColor: hoveredButton === 'cancel' ? 'var(--border-color, #e2e8f0)' : 'var(--bg-main, #f1f5f9)' }} 
          > 
            Cancel 
          </button>

          {/* Confirm Destruction Primary Button */}
          <button 
            type="button" 
            onClick={handleConfirmDelete} 
            onMouseEnter={() => setHoveredRatio('delete')} 
            onMouseLeave={() => setHoveredRatio(null)} 
            className="delete-button" 
            style={{ flex: 1, backgroundColor: hoveredButton === 'delete' ? '#bd2130' : '#dc3545', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '12px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease-in-out', boxShadow: hoveredButton === 'delete' ? '0 4px 12px rgba(220, 53, 69, 0.25)' : 'none', transform: hoveredButton === 'delete' ? 'translateY(-1px)' : 'none' }} 
          > 
            Confirm Delete 
          </button>
        </div>

        {/* Embedded Keyframe Micro-animations CSS rule strings inject styles natively */}
        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        `}</style>
      </div>
    </div>
  );
}

export default DeleteModal;
