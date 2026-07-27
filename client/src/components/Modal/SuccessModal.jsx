// src/components/Modal/SuccessModal.jsx
import React, { useState } from "react";
import ReactDOM from 'react-dom';

function SuccessModal({ isOpen, message, onClose }) {
  const [hoveredButton, setHoveredButton] = useState(null);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)', // Identical sophisticated slate overlay tint
        backdropFilter: 'blur(4px)', // Matches ImageUploadCrop frosted glass effect
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        animation: 'successFadeIn 0.2s ease-out'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="modal"
        style={{
          width: '100%',
          maxWidth: '380px', // Exact matching width to your form blocks
          background: 'var(--bg-card, #ffffff)',
          padding: '24px 30px',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.04)',
          boxSizing: 'border-box',
          textAlign: 'center',
          border: '1px solid var(--border-color, #e2e8f0)',
          animation: 'successSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)' // Sleek slide-up animation
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing Emerald Success Icon Ring Anchor */}
        <div
          style={{
            width: '56px',
            height: '56px',
            backgroundColor: '#d1fae5', // Light emerald green accent background ring
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            fontSize: '24px',
            color: '#10b981', // Clean emerald green icon coloring
            fontWeight: 'bold'
          }}
        >
          ✓
        </div>

        <h3
          style={{
            margin: '0 0 8px 0',
            fontSize: '1.25rem',
            fontWeight: '700',
            color: 'var(--text-primary, #0f172a)',
            letterSpacing: '-0.025em'
          }}
        >
          Operation Success!
        </h3>

        <p
          style={{
            color: 'var(--text-secondary, #64748b)',
            fontSize: '0.9rem',
            margin: '0 0 24px 0',
            lineHeight: '1.5'
          }}
        >
          {message || "The inventory database log coordinates have synced completely."}
        </p>

        {/* Interactive Action Confirm Button Node */}
        <div>
          <button
            type="button"
            onClick={onClose}
            onMouseEnter={() => setHoveredButton('confirm')}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              width: '100%',
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              boxShadow: hoveredButton === 'confirm' ? '0 4px 12px rgba(16, 185, 129, 0.25)' : 'none',
              transform: hoveredButton === 'confirm' ? 'translateY(-1px)' : 'none',
              backgroundColor: hoveredButton === 'confirm' ? '#059669' : '#10b981'
            }}
          >
            Acknowledge & Continue
          </button>
        </div>

        {/* Embedded Keyframe Micro-animations injected natively */}
        <style>{`
          @keyframes successFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes successSlideUp {
            from { transform: translateY(12px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
      </div>
    </div>,
    document.body // 🚀 FORCES PORTAL ATTACHMENT TO DOCUMENT ROOT BYPASSING TRANSFORMS
  );
}

export default SuccessModal;
