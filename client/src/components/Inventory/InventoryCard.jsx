import React from 'react';

function InventoryCard({
  item,
  hoveredBtnId,
  setHoveredBtnId,
  hoveredWishlistId,
  setHoveredWishlistId,
  wishlist,
  onToggleWishlist,
  onBuyNow,
  setSelectedPurchaseId,
  setActiveTab
}) {
  return (
    <li 
      onMouseEnter={() => setHoveredBtnId(item._id)} 
      onMouseLeave={() => setHoveredBtnId(null)} 
      style={{ position: 'relative', width: '100%', listStyleType: 'none', background: 'var(--bg-card, #ffffff)', borderRadius: '16px', border: '1px solid var(--border-color, #e2e8f0)', padding: '24px', boxSizing: 'border-box', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', flexWrap: 'wrap', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', transform: hoveredBtnId === item._id ? 'translateY(-3px)' : 'translateY(0)', boxShadow: hoveredBtnId === item._id ? '0 12px 20px -3px rgba(0,0,0,0.12)' : '0 4px 6px -1px rgba(0,0,0,0.02)' }} 
      className="inventory-card"
    > 
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '120px', alignItems: 'center' }}> 
        <div style={{ width: '110px', height: '110px', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-main, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="inventory-photo-frame"> 
          {item.imagePath ? ( 
            <img src={`http://localhost:5000${item.imagePath}`} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> 
          ) : ( 
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', fontWeight: '500' }}>No Photo</span> 
          )} 
        </div> 
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', textAlign: 'center', fontWeight: '500' }}> 
          Logged by: <strong style={{ color: 'var(--text-primary, #0f172a)', fontWeight: '600' }}>{item.createdBy?.username || "Admin"}</strong> 
        </p> 
      </div> 

      <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', gap: '6px' }}> 
        <h3 style={{ margin: '0', fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary, #0f172a)', letterSpacing: '-0.02em' }}>{item.name || "Unnamed Product"}</h3> 
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)', fontWeight: '500' }}>brand: <strong style={{ color: 'var(--text-primary, #475569)', fontWeight: '600' }}>{item.brand || "Generic"}</strong></span> 
        <p style={{ margin: '6px 0 0 0', fontSize: '1.4rem', fontWeight: '800', color: '#10b981', letterSpacing: '-0.03em' }}>${parseFloat(item.price || 0).toFixed(2)}</p> 
      </div> 

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', minWidth: '240px' }} className="inventory-card-actions"> 
        <div style={{ display: 'flex', gap: '12px', width: '100%' }}> 
          <button 
            onMouseEnter={() => setHoveredBtnId(`${item._id}_buy`)} 
            onMouseLeave={() => setHoveredBtnId(item._id)} 
            onClick={() => { if (typeof onBuyNow === 'function') { onBuyNow(item._id); } else if (typeof setSelectedPurchaseId === 'function' && typeof setActiveTab === 'function') { setSelectedPurchaseId(item._id); setActiveTab('purchase_item'); } }} 
            style={{ flex: 1, padding: '10px 20px', backgroundColor: hoveredBtnId === `${item._id}_buy` ? '#059669' : '#10b981', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: hoveredBtnId === `${item._id}_buy` ? '0 4px 12px rgba(16,185,129,0.25)' : 'none' }} 
          > 
            Buy Now 
          </button> 
          <button 
            onMouseEnter={() => setHoveredWishlistId(item._id)} 
            onMouseLeave={() => setHoveredWishlistId(null)} 
            onClick={(e) => { e.stopPropagation(); if (typeof onToggleWishlist === 'function') { onToggleWishlist(item); } }} 
            style={{ flex: 1, padding: '10px 20px', cursor: 'pointer', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.2s ease-in-out', border: '1px solid', backgroundColor: wishlist?.some(wItem => wItem._id === item._id) ? (hoveredWishlistId === item._id ? '#e0a800' : '#ffc107') : (hoveredWishlistId === item._id ? 'rgba(255, 193, 7, 0.08)' : 'transparent'), color: wishlist?.some(wItem => wItem._id === item._id) ? '#000000' : 'var(--text-muted, #475569)', borderColor: (wishlist?.some(wItem => wItem._id === item._id) || hoveredWishlistId === item._id) ? '#ffc107' : 'var(--border-color, #cbd5e1)' }} 
          > 
            {wishlist?.some(wItem => wItem._id === item._id) ? '❤️ Wishlist' : '🖤 Wishlist'} 
          </button> 
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center' }}> 
          <div style={{ color: '#ffc107', fontSize: '1rem', letterSpacing: '2px', textAlign: 'center' }}> 
            {"★".repeat(Math.round(item.averageRating || 5))}${"☆".repeat(5 - Math.round(item.averageRating || 5))} 
          </div> 
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center', width: '100%' }}> 
            <span style={{ fontSize: '10px', backgroundColor: 'var(--bg-main, #f1f5f9)', color: '#3b82f6', padding: '3px 12px', borderRadius: '12px', fontWeight: '700', textTransform: 'uppercase', border: '1px solid var(--border-color, #cbd5e1)', letterSpacing: '0.02em' }} className="inventory-category-badge"> 
              🏷️ {item.category || "tools"} 
            </span> 
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', fontWeight: '500' }}> 
              In stock: <strong style={{ color: 'var(--text-primary, #0f172a)', fontWeight: '700' }}>{item.quantity || "0"}</strong> units 
            </p> 
          </div> 
        </div> 
      </div> 
    </li>
  );
}

export default InventoryCard;
