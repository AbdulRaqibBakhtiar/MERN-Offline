import React from 'react';
import { API_BASE_URL } from '../../api/config';
import UserAvatar from '../Layout/UserAvatar';

function InventoryCard({ item, canManage, hoveredBtnId, setHoveredBtnId, hoveredWishlistId, setHoveredWishlistId, wishlist, onToggleWishlist, onBuyNow, setSelectedPurchaseId, setActiveTab }) {
  const saved = wishlist?.some(wishlistItem => wishlistItem._id === item._id);
  const rating = Math.max(0, Math.min(5, Math.round(Number(item.averageRating) || 0)));
  const outOfStock = Number(item.quantity) < 1;
  const openProduct = () => {
    if (typeof onBuyNow === 'function') onBuyNow(item._id);
    else if (setSelectedPurchaseId && setActiveTab) { setSelectedPurchaseId(item._id); setActiveTab('purchase_item'); }
  };

  return (
    <li className="inventory-card" onMouseEnter={() => setHoveredBtnId(item._id)} onMouseLeave={() => setHoveredBtnId(null)}>
      <div className="inventory-card-image">
        <button type="button" className="inventory-image-open" onClick={openProduct} aria-label={`View ${item.name}`}>
          {item.imagePath ? <img src={`${API_BASE_URL}${item.imagePath}`} alt={item.name} loading="lazy" /> : <span aria-hidden="true">📦</span>}
        </button>
        <span className="inventory-category-badge">{item.category || 'Tools'}</span>
        <button type="button" className={`inventory-save-button ${saved ? 'is-saved' : ''}`} aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={saved} onClick={event => { event.stopPropagation(); onToggleWishlist?.(item); }} onMouseEnter={() => setHoveredWishlistId(item._id)} onMouseLeave={() => setHoveredWishlistId(null)}>{saved ? '♥' : '♡'}</button>
      </div>
      <div className="inventory-card-content">
        <div className="inventory-seller-line"><span className="inventory-seller-identity"><UserAvatar person={item.createdBy} className="inventory-seller-avatar" />{item.createdBy?.username || 'Marketplace seller'}</span><span className="inventory-rating" aria-label={`${rating} out of 5 stars`}>{'★'.repeat(rating)}{'☆'.repeat(5 - rating)} <small>({item.reviews?.length || 0})</small></span></div>
        <button type="button" className="inventory-product-title" onClick={openProduct}>{item.name || 'Untitled product'}</button>
        <p className="inventory-product-brand">{item.brand || 'Unbranded'}</p>
        {item.description && <p className="inventory-product-description">{item.description}</p>}
        <div className="inventory-card-purchase-row"><strong className="inventory-product-price">${Number(item.price || 0).toFixed(2)}</strong><span className={`inventory-stock-label ${outOfStock ? 'out-of-stock' : ''}`}>{outOfStock ? 'Out of stock' : `${item.quantity} available`}</span></div>
        <div className="inventory-card-actions">
          <button type="button" className="inventory-primary-action" disabled={outOfStock && !canManage} onClick={openProduct}>{canManage ? 'Manage item' : outOfStock ? 'Unavailable' : 'View item'}</button>
        </div>
      </div>
    </li>
  );
}

export default InventoryCard;
