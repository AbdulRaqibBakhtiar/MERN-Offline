import React from 'react';

function WishlistItemCard({ item, hoveredBtn, setHoveredBtn, onRemoveFromWishlist }) {
  return (
    <div 
      style={{ background: 'var(--bg-main, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '8px', padding: '16px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '100px', transition: 'transform 0.2s', transform: hoveredBtn === item._id ? 'scale(1.02)' : 'none' }} 
      onMouseEnter={() => setHoveredBtn(item._id)} 
      onMouseLeave={() => setHoveredBtn(null)} 
      className="wishlist-item-node"
    >
      <button type="button" onClick={() => { if (typeof onRemoveFromWishlist === 'function') onRemoveFromWishlist(item); }} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', fontWeight: '700', opacity: '0.7', transition: 'opacity 0.2s' }} onMouseEnter={(e) => e.target.style.opacity = '1'} onMouseLeave={(e) => e.target.style.opacity = '0.7'}>✕</button>
      <div style={{ paddingRight: '20px' }}>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary, #1e293b)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</h4>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', display: 'block', marginBottom: '8px' }}>Brand: {item.brand}</span>
      </div>
      <div style={{ borderTop: '1px dashed var(--border-color, #e2e8f0)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: '700', color: '#10b981', fontSize: '0.95rem' }}>${parseFloat(item.price || 0).toFixed(2)}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontWeight: '500' }}>Pool: {item.quantity}</span>
      </div>
    </div>
  );
}

export default WishlistItemCard;
