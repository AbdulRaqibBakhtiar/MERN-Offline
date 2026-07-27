import React from 'react';
import ImageUploadCrop from '../components/Modal/ImageUploadCrop';
import PaginationModal from '../components/Modal/PaginationModal';

// Architecture Decoupled Nodes
import { useInventoryData } from '../hooks/useInventoryData';
import InventorySkeleton from '../components/Inventory/InventorySkeleton';
import InventoryCard from '../components/Inventory/InventoryCard';

function InventoryPage({ 
  inventory = {}, 
  searchQuery = "", 
  setSearchQuery, 
  searchCategory = "all", 
  setSearchCategory, 
  setActiveTab, 
  setSelectedPurchaseId, 
  wishlist = [], 
  onToggleWishlist, 
  onBuyNow 
}) {
  
  // Connect decoupled logic engine
  const {
    showAddForm, setShowAddForm,
    isCropOpen, setIsCropOpen,
    finalProductFile,
    productPreviewUrl, setProductPreviewUrl,
    hoveredWishlistId, setHoveredWishlistId,
    hoveredBtnId, setHoveredBtnId,
    currentPage, setCurrentPage,
    filteredItems, paginatedAndFilteredItems, totalPages,
    handleCroppedProductReturn
  } = useInventoryData({ inventory, searchQuery, searchCategory });

  const { itemName, setItemName, itemBrand, setItemBrand, itemQuantity, setItemQuantity, itemPrice, setItemPrice, itemCategory, setItemCategory, addItem } = inventory;

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (typeof inventory.setItemName === 'function') inventory.setItemName(itemName);
    if (typeof inventory.setItemBrand === 'function') inventory.setItemBrand(itemBrand);
    if (typeof inventory.setItemQuantity === 'function') inventory.setItemQuantity(itemQuantity);
    if (typeof inventory.setItemPrice === 'function') inventory.setItemPrice(itemPrice);
    if (typeof inventory.setItemCategory === 'function') inventory.setItemCategory(itemCategory);
    if (typeof addItem === 'function') await addItem(finalProductFile);
    
    setShowAddForm(false);
    setProductPreviewUrl(null);
  };

  // 1. Intercept loading conditions with sub-component
  if (inventory?.loading === true) {
    return <InventorySkeleton />;
  }

  return (
    <div style={{ width: '100%', fontFamily: 'system-ui, sans-serif' }} className="inventory-view">
      
      {/* Control Navigation & Filter Bar */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', background: 'var(--bg-card, #ffffff)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }} className="inventory-filter-panel">
        <button 
          onMouseEnter={() => setHoveredBtnId('add_main')} 
          onMouseLeave={() => setHoveredBtnId(null)} 
          onClick={() => setShowAddForm(true)} 
          style={{ margin: 0, whiteSpace: 'nowrap', padding: '12px 24px', backgroundColor: hoveredBtnId === 'add_main' ? '#2563eb' : '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          ➕ Add New Product
        </button> 
        <input type="text" placeholder="Filter current warehouse inventory..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ margin: 0, flex: 2, minWidth: '220px', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color, #cbd5e1)', fontSize: '0.9rem', outline: 'none', background: 'var(--bg-main, #f8fafc)', color: 'var(--text-primary, #0f172a)' }} /> 
        <select value={searchCategory || 'all'} onChange={(e) => setSearchCategory(e.target.value)} style={{ margin: 0, flex: 1, minWidth: '160px', cursor: 'pointer', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border-color, #e2e8f0)', fontSize: '0.9rem', outline: 'none', background: 'var(--bg-main, #f8fafc)', color: 'var(--text-primary, #0f172a)', fontWeight: '500' }}> 
          <option value="all">📁 All Categories</option> 
          <option value="tools">🛠️ Tools</option> 
          <option value="hardware">🔩 Hardware</option> 
          <option value="machinery">⚙️ Machinery</option> 
        </select> 
      </div> 

      {/* Main Inventory Layout Stream */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}> 
        {paginatedAndFilteredItems.length === 0 ? ( 
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted, #64748b)', textAlign: 'center', padding: '5rem 0', background: 'var(--bg-card, #ffffff)', borderRadius: '16px', border: '1px solid var(--border-color, #e2e8f0)', fontWeight: '500', fontStyle: 'italic' }}> 
            No records found matching current criteria. 
          </p> 
        ) : ( 
          <ul style={{ padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '20px' }} className="inventory-cards-list"> 
            {paginatedAndFilteredItems.map(item => ( 
              <InventoryCard 
                key={item._id}
                item={item}
                hoveredBtnId={hoveredBtnId}
                setHoveredBtnId={setHoveredBtnId}
                hoveredWishlistId={hoveredWishlistId}
                setHoveredWishlistId={setHoveredWishlistId}
                wishlist={wishlist}
                onToggleWishlist={onToggleWishlist}
                onBuyNow={onBuyNow}
                setSelectedPurchaseId={setSelectedPurchaseId}
                setActiveTab={setActiveTab}
              />
            ))} 
          </ul> 
        )} 
      </div> 
      <div style={{ marginTop: '32px' }}> 
        <PaginationModal currentPage={currentPage} totalPages={totalPages} totalPosts={filteredItems.length} onPageChange={setCurrentPage} /> 
      </div> 

      {/* Pop-up Overlay Creation Form Modal */}
      {showAddForm && ( 
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} className="modal-overlay" onClick={() => { setShowAddForm(false); setProductPreviewUrl(null); }}> 
          <div style={{ width: '100%', maxWidth: '440px', background: 'var(--bg-card, #ffffff)', padding: '32px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)', boxSizing: 'border-box', border: '1px solid var(--border-color, transparent)' }} className="modal-content-box" onClick={(e) => e.stopPropagation()}> 
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}> 
              <h3 style={{ margin: '0', fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary, #0f172a)' }}>Add New Product</h3> 
              <button onClick={() => { setShowAddForm(false); setProductPreviewUrl(null); }} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted, #64748b)' }}>✕</button> 
            </div> 
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}> 
              <div style={{ background: 'var(--bg-main, #f8fafc)', border: '1px dashed var(--border-color, #cbd5e1)', borderRadius: '12px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}> 
                {productPreviewUrl ? <img src={productPreviewUrl} alt="Cropped Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #64748b)' }}>No file attached yet.</span>} 
              </div> 
              <button type="button" onClick={() => setIsCropOpen(true)} style={{ width: '100%', background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}>📷 {finalProductFile ? "Change Image" : "Configure Product Photo Asset..."}</button> 
              <input type='text' placeholder='Item Name (e.g. Drill)' value={itemName || ""} onChange={(e) => setItemName(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', fontSize: '0.9rem', boxSizing: 'border-box', background: 'var(--bg-main, transparent)', color: 'var(--text-primary, inherit)' }} /> 
              <input type='text' placeholder='Brand (e.g. Makita)' value={itemBrand || ""} onChange={(e) => setItemBrand(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', fontSize: '0.9rem', boxSizing: 'border-box', background: 'var(--bg-main, transparent)', color: 'var(--text-primary, inherit)' }} /> 
              <input type='number' placeholder='Quantity In Stock' value={itemQuantity || ""} onChange={(e) => setItemQuantity(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', fontSize: '0.9rem', boxSizing: 'border-box', background: 'var(--bg-main, transparent)', color: 'var(--text-primary, inherit)' }} /> 
              <input type='number' placeholder='Price ($)' value={itemPrice || ""} onChange={(e) => setItemPrice(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', fontSize: '0.9rem', boxSizing: 'border-box', background: 'var(--bg-main, transparent)', color: 'var(--text-primary, inherit)' }} /> 
              <select value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', fontSize: '0.9rem', boxSizing: 'border-box', cursor: 'pointer', background: 'var(--bg-main, #ffffff)', color: 'var(--text-primary, inherit)', fontWeight: '500' }}> 
                <option value="tools">Tools</option> 
                <option value="hardware">Hardware</option> 
                <option value="machinery">Machinery</option> 
              </select> 
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}> 
                <button type="submit" style={{ background: '#10b981', color: '#ffffff', flex: 2, padding: '12px', border: 'none', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>Add Product to Catalog</button> 
                <button type="button" onClick={() => { setShowAddForm(false); setProductPreviewUrl(null); }} style={{ background: 'var(--border-color, #f1f5f9)', color: 'var(--text-primary, #475569)', border: '1px solid var(--border-color, #cbd5e1)', flex: 1, padding: '12px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>Cancel</button> 
              </div> 
            </form> 
          </div> 
        </div> 
      )} 
      <ImageUploadCrop isOpen={isCropOpen} onClose={() => setIsCropOpen(false)} onCropComplete={handleCroppedProductReturn} title="Crop New Inventory Product Picture" aspect={1} /> 
    </div> 
  ); 
} 

export default InventoryPage;
