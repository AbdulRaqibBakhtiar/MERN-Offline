import React, { useState } from 'react';

function PaginationModal({ currentPage, totalPages, onPageChange, totalPosts }) {
  // 🚀 FIXED: Hooks must always be declared first at the top of the component!
  const [hoveredNode, setHoveredNode] = useState(null);

  // 🚀 FIXED: Move the early return check right below the state hook definition
  if (totalPages <= 1 || totalPosts === 0) return null;

  const handlePageSelect = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Smart Node Compiler: Builds clean sequential numbers with elegant dividers
  const renderCircularNodes = () => {
    const nodes = [];
    const windowSize = 1;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || 
        i === totalPages || 
        (i >= currentPage - windowSize && i <= currentPage + windowSize)
      ) {
        const isActive = i === currentPage;
        const isThisHovered = hoveredNode === i;

        nodes.push(
          <button 
            key={i} 
            type="button" 
            onClick={() => handlePageSelect(i)} 
            onMouseEnter={() => setHoveredNode(i)} 
            onMouseLeave={() => setHoveredNode(null)} 
            style={{ width: '38px', height: '38px', borderRadius: '50%', border: isActive ? 'none' : '1px solid var(--border-color, #e2e8f0)', fontSize: '0.86rem', fontWeight: isActive ? '700' : '500', cursor: 'pointer', background: isActive ? 'var(--accent-blue, #2563eb)' : 'var(--bg-card, #ffffff)', color: isActive ? '#ffffff' : 'var(--text-muted, #475569)', boxShadow: isActive ? '0 6px 16px rgba(37, 99, 235, 0.35)' : isThisHovered ? '0 4px 12px rgba(0, 0, 0, 0.05)' : '0 1px 2px rgba(0, 0, 0, 0.02)', transform: isThisHovered && !isActive ? 'translateY(-1px) scale(1.04)' : 'translateY(0) scale(1)', transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} 
          >
            {i}
          </button>
        );
      } else if (
        i === currentPage - windowSize - 1 || 
        i === currentPage + windowSize + 1
      ) {
        nodes.push(
          <span 
            key={`gap-${i}`} 
            style={{ width: '34px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', letterSpacing: '1.5px', userSelect: 'none', fontWeight: '700' }} 
          >
            •••
          </span>
        );
      }
    }
    return nodes;
  };
  return (
    <div className="pagination-premium-container" style={{ gridColumn: '1 / -1', width: '100%', maxWidth: '1200px', margin: '55px auto 25px auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', clear: 'both', fontFamily: 'Inter, system-ui, -apple-system, sans-serif', animation: 'premiumWidgetEntrance 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards' }} >
      <style>{`
        @keyframes premiumWidgetEntrance { 
          0% { opacity: 0; transform: translateY(16px) scale(0.985); } 
          100% { opacity: 1; transform: translateY(0) scale(1); } 
        }
      `}</style>

      {/* Glassmorphic Structural Control Dock */}
      <div className="premium-glass-dock-deck" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card, rgba(255, 255, 255, 0.65))', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '8px 10px', borderRadius: '40px', border: '1px solid var(--border-color, rgba(226, 232, 240, 0.7))', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.01), 0 10px 30px -5px rgba(0, 0, 0, 0.04)' }} >
        
        {/* Sleek SVG Left Trigger */}
        <button 
          type="button" 
          disabled={currentPage === 1} 
          onClick={() => handlePageSelect(currentPage - 1)} 
          onMouseEnter={() => setHoveredNode('prev')} 
          onMouseLeave={() => setHoveredNode(null)} 
          style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1px solid var(--border-color, #e2e8f0)', background: 'var(--bg-card, #ffffff)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? 'var(--text-muted, #cbd5e1)' : 'var(--text-primary, #0f172a)', opacity: currentPage === 1 ? 0.35 : 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: hoveredNode === 'prev' && currentPage !== 1 ? '0 4px 12px rgba(0,0,0,0.05)' : '0 1px 2px rgba(0,0,0,0.02)', transform: hoveredNode === 'prev' && currentPage !== 1 ? 'translateX(-2px)' : 'translateX(0)', transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)' }} 
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>

        {/* Center Numbers List Column */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {renderCircularNodes()}
        </div>

        {/* Sleek SVG Right Trigger */}
        <button 
          type="button" 
          disabled={currentPage === totalPages} 
          onClick={() => handlePageSelect(currentPage + 1)} 
          onMouseEnter={() => setHoveredNode('next')} 
          onMouseLeave={() => setHoveredNode(null)} 
          style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1px solid var(--border-color, #e2e8f0)', background: 'var(--bg-card, #ffffff)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? 'var(--text-muted, #cbd5e1)' : 'var(--text-primary, #0f172a)', opacity: currentPage === totalPages ? 0.35 : 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: hoveredNode === 'next' && currentPage !== totalPages ? '0 4px 12px rgba(0,0,0,0.05)' : '0 1px 2px rgba(0,0,0,0.02)', transform: hoveredNode === 'next' && currentPage !== totalPages ? 'translateX(2px)' : 'translateX(0)', transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)' }} 
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>

      {/* Elegant Minimal Range Indicator Capsule */}
      <div className="premium-metadata-capsule" style={{ background: 'var(--bg-main, rgba(0, 0, 0, 0.03))', padding: '5px 12px', borderRadius: '30px', fontSize: '0.72rem', fontWeight: '500', color: 'var(--text-muted, #64748b)', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.01)' }} >
        <span>Showing records</span>
        <span style={{ color: 'var(--text-primary, #0f172a)', fontWeight: '600' }}>
          {((currentPage - 1) * 10) + 1} – {Math.min(currentPage * 10, totalPosts)}
        </span>
        <span>of</span>
        <span style={{ color: 'var(--text-primary, #0f172a)', fontWeight: '600' }}>
          {totalPosts} items
        </span>
      </div>
    </div>
  );
}

export default PaginationModal;
