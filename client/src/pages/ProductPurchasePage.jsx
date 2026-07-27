import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ImageUploadCrop from '../components/Modal/ImageUploadCrop';
import DeleteModal from '../components/Modal/DeleteModal';
import SuccessModal from '../components/Modal/SuccessModal';
import PurchaseInvoiceModal from '../components/Modal/PurchaseInvoiceModal';

// Decoupled Architectural Logic Modules
import { usePurchaseData } from '../hooks/usePurchaseData';
import PurchaseLoading from '../components/Inventory/PurchaseLoading';
import PurchaseError from '../components/Inventory/PurchaseError';

function ProductPurchasePage({ itemId: propItemId, onBack }) {
  const { token } = useAuth();
  const { itemId: urlItemId } = useParams();
  const itemId = propItemId || urlItemId;

  // Destructure logical hook matrices
    // Destructure logical hook matrices
  const {
    isSuccessOpen, setIsSuccessOpen, successMsg, setSuccessMsg,
    product, setProduct, loading, error,
    userRating, setUserRating, userComment, setUserComment,
    reviewSubmitting, setReviewSubmitting, // 👈 Added setReviewSubmitting here
    hoverRating, setHoverRating,
    isCheckoutOpen, setIsCheckoutOpen, orderQuantity, setOrderQuantity,
    hoveredBtnId, setHoveredBtnId, isEditMode, setIsEditMode,
    editName, setEditName, editBrand, setEditBrand, editQuantity, setEditQuantity,
    editPrice, setEditPrice, editCategory, setEditCategory, editDescription, setEditDescription,
    editCondition, setEditCondition, editWarranty, setEditWarranty, editDimensions, setEditDimensions,
    editWeight, setEditWeight, editPowerSource, setEditPowerSource,
    isEditCropOpen, setIsEditCropOpen, 
    finalEditFile, setFinalEditFile,       // 👈 Added setFinalEditFile here
    editPreviewUrl, setEditPreviewUrl,     // 👈 Added setEditPreviewUrl here
    saveSubmitting, setSaveSubmitting, deleteTargetId, setDeleteTargetId,
    hydrateFormStates, handleCroppedEditReturn, handleCompletePurchase
  } = usePurchaseData({ itemId, token, onBack });


  if (loading) return <PurchaseLoading />;
  if (error || !product) return <PurchaseError error={error} onBack={onBack} />;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', color: 'var(--text-primary, #0f172a)', fontFamily: 'system-ui, -apple-system, sans-serif', position: 'relative' }} className="purchase-page-view">
      
      {/* Upper Navigation Action Toolbar Block */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }} className="purchase-view-header">
        <button onClick={onBack} onMouseEnter={() => setHoveredBtnId('back_fleet')} onMouseLeave={() => setHoveredBtnId(null)} style={{ background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color, #cbd5e1)', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', color: 'var(--text-primary, #475569)', fontWeight: '600', fontSize: '0.875rem', transition: 'all 0.2s', transform: hoveredBtnId === 'back_fleet' ? 'translateY(-1px)' : 'translateY(0)' }} >
          ⬅️ Back to Fleet Workspace
        </button>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={() => setDeleteTargetId(product?._id || itemId)} onMouseEnter={() => setHoveredBtnId('remove_asset')} onMouseLeave={() => setHoveredBtnId(null)} style={{ background: hoveredBtnId === 'remove_asset' ? '#b91c1c' : '#dc3545', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }} >
            🗑️ Remove Asset
          </button>
          <button onClick={() => { if (isEditMode) hydrateFormStates(product); setIsEditMode(!isEditMode); }} onMouseEnter={() => setHoveredBtnId('modify_param')} onMouseLeave={() => setHoveredBtnId(null)} style={{ background: isEditMode ? 'var(--text-muted, #64748b)' : hoveredBtnId === 'modify_param' ? '#4338ca' : '#4f46e5', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem', transition: 'all 0.2s' }} >
            {isEditMode ? "❌ Cancel Mod" : "⚙️ Modify Parameters"}
          </button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '40px' }} className="purchase-workspace-grid">
        
        {/* Left Side: Media Workstation Frame Block */}
        <div style={{ background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '440px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }} className="purchase-media-workstation">
          {isEditMode ? (
            <div style={{ width: '100%', textAlign: 'center' }}>
              <div style={{ height: '320px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', border: '2px dashed var(--border-color, #cbd5e1)', borderRadius: '12px', background: 'var(--bg-main, #f8fafc)', marginBottom: '20px' }}>
                {editPreviewUrl ? (
                  <img src={editPreviewUrl} alt="New Crop" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                ) : product.imagePath ? (
                  <img src={`http://localhost:5000${product.imagePath}`} alt="Current" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted, #64748b)', fontWeight: '500' }}>No Photo Attached</span>
                )}
              </div>
              <button type="button" onClick={() => setIsEditCropOpen(true)} style={{ padding: '10px 20px', background: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }} >
                📷 {finalEditFile ? "New Picture Staged" : "Replace Product Image File Asset..."}
              </button>
            </div>
          ) : product.imagePath ? (
            <img src={`http://localhost:5000${product.imagePath}`} alt={product.name} style={{ maxWidth: '100%', maxHeight: '440px', objectFit: 'contain', borderRadius: '12px' }} />
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
              <span style={{ fontSize: '4.5rem', display: 'block', marginBottom: '12px' }}>🛠️</span>
              <p style={{ margin: 0, fontWeight: '500', fontSize: '0.95rem' }}>No Visual Attached</p>
            </div>
          )}
        </div>

        {/* Right Side: Core Parameters Matrix InfoPane */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="purchase-infopane">
          {isEditMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--bg-card, #ffffff)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color, #e2e8f0)' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary, #475569)', display: 'block', marginBottom: '6px' }}>Category Asset Code:</label>
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', width: '100%', outline: 'none', background: 'var(--bg-main, #ffffff)', color: 'var(--text-primary, inherit)', fontWeight: '500', fontSize: '0.9rem' }}>
                  <option value="tools">Tools</option>
                  <option value="hardware">Hardware</option>
                  <option value="machinery">Machinery</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary, #475569)', display: 'block', marginBottom: '6px' }}>Product Model Label:</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', width: '100%', outline: 'none', background: 'var(--bg-main, transparent)', color: 'var(--text-primary, inherit)', fontSize: '0.9rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary, #475569)', display: 'block', marginBottom: '6px' }}>Manufacturer Brand Blueprint:</label>
                <input type="text" value={editBrand} onChange={(e) => setEditBrand(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', width: '100%', outline: 'none', background: 'var(--bg-main, transparent)', color: 'var(--text-primary, inherit)', fontSize: '0.9rem' }} />
              </div>
            </div>
          ) : (
            <div>
              <span style={{ background: 'rgba(59,130,246,0.1)', color: '#2563eb', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{product.category}</span>
              <h1 style={{ fontSize: '2.5rem', margin: '14px 0 6px 0', fontWeight: '800', letterSpacing: '-0.03em', color: 'var(--text-primary, #0f172a)', lineHeight: '1.15' }}>{product.name}</h1>
              <p style={{ margin: '0', color: 'var(--text-muted, #64748b)', fontSize: '1.1rem', fontWeight: '500' }}>Brand Blueprint: <strong style={{ color: 'var(--text-primary, #334155)', fontWeight: '600' }}>{product.brand}</strong></p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', color: '#ffc107', fontSize: '1.2rem' }}>
                {"★".repeat(Math.round(product.averageRating || 5))}${"☆".repeat(5 - Math.round(product.averageRating || 5))}
                <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.875rem', fontWeight: '500', marginLeft: '4px' }}>({product.reviews?.length || 0} reviews)</span>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: '20px', padding: '24px', background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontWeight: '700', letterSpacing: '0.05em', display: 'block' }}>UNIT COST</span>
              {isEditMode ? (
                <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', width: '100%', marginTop: '8px', outline: 'none', background: 'var(--bg-main, transparent)', color: 'var(--text-primary, inherit)' }} />
              ) : (
                <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#10b981', marginTop: '6px', letterSpacing: '-0.02em' }}>${parseFloat(product.price).toFixed(2)}</div>
              )}
            </div>
            <div style={{ flex: 1, borderLeft: '1px solid var(--border-color, #f1f5f9)', paddingLeft: '20px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontWeight: '700', letterSpacing: '0.05em', display: 'block' }}>STOCK CORES</span>
              {isEditMode ? (
                <input type="number" value={editQuantity} onChange={(e) => setEditQuantity(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', width: '100%', marginTop: '8px', outline: 'none', background: 'var(--bg-main, transparent)', color: 'var(--text-primary, inherit)' }} />
              ) : (
                <div style={{ fontSize: '2.2rem', fontWeight: '800', marginTop: '6px', color: 'var(--text-primary, #1e293b)', letterSpacing: '-0.02em' }}>{product.quantity} <span style={{ fontSize: '1.1rem', fontWeight: '500', color: 'var(--text-muted, #64748b)' }}>units</span></div>
              )}
            </div>
          </div>

          <div style={{ padding: '24px', background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '16px', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontWeight: '700', letterSpacing: '0.05em' }}>RETAILER LOGISTICS ACCOUNT</h3>
            <p style={{ margin: '0', color: 'var(--text-primary, #475569)' }}><strong>Listed Operator:</strong> <span style={{ color: 'var(--text-primary, #0f172a)', fontWeight: '600' }}>{product.createdBy?.username || "Authorized Merchant Partner"}</span></p>
            <div>
              <label style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-primary, #475569)', display: 'block', marginBottom: '4px' }}>Contractual Security Guarantee:</label>
              {isEditMode ? (
                <input type="text" value={editWarranty} onChange={(e) => setEditWarranty(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', width: '100%', outline: 'none', background: 'var(--bg-main, transparent)', color: 'var(--text-primary, inherit)' }} />
              ) : (
                <p style={{ margin: '0', color: 'var(--text-primary, #0f172a)', fontWeight: '500' }}>{product.warranty || "Standard 1-Year Baseline Coverage"}</p>
              )}
            </div>
            <div>
              <label style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-primary, #475569)', display: 'block', marginBottom: '4px' }}>Physical Condition Frame:</label>
              {isEditMode ? (
                <input type="text" value={editCondition} onChange={(e) => setEditCondition(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', width: '100%', outline: 'none', background: 'var(--bg-main, transparent)', color: 'var(--text-primary, inherit)' }} />
              ) : (
                <p style={{ margin: '0', color: 'var(--text-primary, #0f172a)', fontWeight: '500' }}>{product.condition || "Factory Sealed Box"}</p>
              )}
            </div>
          </div>

          {!isEditMode && (
            <button onClick={() => { setOrderQuantity(1); setIsCheckoutOpen(true); }} onMouseEnter={() => setHoveredBtnId('buy_main')} onMouseLeave={() => setHoveredBtnId(null)} style={{ padding: '16px', background: hoveredBtnId === 'buy_main' ? '#059669' : '#10b981', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '1.1rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', transform: hoveredBtnId === 'buy_main' ? 'translateY(-2px)' : 'translateY(0)', boxShadow: hoveredBtnId === 'buy_main' ? '0 10px 15px -3px rgba(16,185,129,0.4)' : '0 4px 6px -1px rgba(16,185,129,0.15)' }} >
              🚀 Initialize Purchase Sequence Order
            </button>
          )}
        </div>
      </div>
      <div style={{ marginTop: '40px', background: 'var(--bg-card, #ffffff)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }} className="purchase-specs-blueprint">
        <h3 style={{ borderBottom: '2px solid var(--border-color, #f1f5f9)', paddingBottom: '14px', marginTop: '0', fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary, #0f172a)', letterSpacing: '-0.02em' }}>Technical Specifications Blueprint</h3>
        <label style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-primary, #475569)', display: 'block', marginTop: '16px', marginBottom: '8px' }}>Detailed Product Summary Statement:</label>
        {isEditMode ? (
          <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} style={{ width: '100%', minHeight: '100px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', boxSizing: 'border-box', marginBottom: '20px', outline: 'none', resize: 'vertical', background: 'var(--bg-main, transparent)', color: 'var(--text-primary, inherit)' }} />
        ) : (
          <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-primary, #475569)', marginTop: '0', background: 'var(--bg-main, #f8fafc)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color, #f1f5f9)' }}>{product.description || "No expanded blueprint technical metadata logged for this asset model label."}</p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginTop: '16px', fontSize: '0.9rem' }}>
          <div style={{ padding: '16px', background: 'var(--bg-main, #f8fafc)', borderRadius: '10px', border: '1px solid var(--border-color, #e2e8f0)' }}>
            <strong style={{ color: 'var(--text-primary, #475569)', display: 'block', marginBottom: '4px' }}>Dimensions Framework:</strong>
            {isEditMode ? <input type="text" value={editDimensions} onChange={(e) => setEditDimensions(e.target.value)} style={{ width: '100%', marginTop: '4px', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color, #cbd5e1)', background: 'var(--bg-card, transparent)', color: 'var(--text-primary, inherit)' }} /> : <span style={{ color: 'var(--text-primary, #0f172a)', fontWeight: '500' }}> {product.specifications?.dimensions || "Standard Size"}</span>}
          </div>
          <div style={{ padding: '16px', background: 'var(--bg-main, #f8fafc)', borderRadius: '10px', border: '1px solid var(--border-color, #e2e8f0)' }}>
            <strong style={{ color: 'var(--text-primary, #475569)', display: 'block', marginBottom: '4px' }}>Gross Weight Metric:</strong>
            {isEditMode ? <input type="text" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} style={{ width: '100%', marginTop: '4px', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color, #cbd5e1)', background: 'var(--bg-card, transparent)', color: 'var(--text-primary, inherit)' }} /> : <span style={{ color: 'var(--text-primary, #0f172a)', fontWeight: '500' }}> {product.specifications?.weight || "Standard Weight"}</span>}
          </div>
          <div style={{ padding: '16px', background: 'var(--bg-main, #f8fafc)', borderRadius: '10px', border: '1px solid var(--border-color, #e2e8f0)' }}>
            <strong style={{ color: 'var(--text-primary, #475569)', display: 'block', marginBottom: '4px' }}>Power Drive Module:</strong>
            {isEditMode ? <input type="text" value={editPowerSource} onChange={(e) => setEditPowerSource(e.target.value)} style={{ width: '100%', marginTop: '4px', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color, #cbd5e1)', background: 'var(--bg-card, transparent)', color: 'var(--text-primary, inherit)' }} /> : <span style={{ color: 'var(--text-primary, #0f172a)', fontWeight: '500' }}> {product.specifications?.powerSource || "N/A"}</span>}
          </div>
        </div>

        {isEditMode && (
          <button disabled={saveSubmitting} onClick={async () => { try { setSaveSubmitting(true); const formData = new FormData(); formData.append('name', editName); formData.append('brand', editBrand); formData.append('quantity', Number(editQuantity)); formData.append('price', Number(editPrice)); formData.append('category', editCategory); formData.append('description', editDescription); formData.append('condition', editCondition); formData.append('warranty', editWarranty); formData.append('specifications[dimensions]', editDimensions); formData.append('specifications[weight]', editWeight); formData.append('specifications[powerSource]', editPowerSource); if (finalEditFile) { formData.append('productImage', finalEditFile); } const res = await fetch(`http://localhost:5000/inventory/${product._id || itemId}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }, body: formData }); if (res.ok) { const updatedData = await res.json(); setProduct(updatedData); setIsEditMode(false); setFinalEditFile(null); setEditPreviewUrl(null); setSuccessMsg("Asset technical specifications modified cleanly!"); setIsSuccessOpen(true); } else { const errPayload = await res.json(); setSuccessMsg(`Update Fault: ${errPayload.error || "Operational breakdown."}`); setIsSuccessOpen(true); } } catch (err) { console.error(err); setSuccessMsg("Network connectivity failure executing update pipeline."); setIsSuccessOpen(true); } finally { setSaveSubmitting(false); } }} style={{ width: '100%', padding: '14px', marginTop: '24px', background: '#10b981', color: '#ffffff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '1rem', transition: 'all 0.2s' }} >
            {saveSubmitting ? "Persisting Specifications..." : "Commit Technical Modifications"}
          </button>
        )}
      </div>
      {!isEditMode && (
        <div style={{ marginTop: '40px' }} className="purchase-reviews-section">
          <h3 style={{ marginBottom: '20px', fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-primary, #0f172a)', letterSpacing: '-0.02em' }}>Customer Assessments Feed</h3>
          <form onSubmit={async (e) => { e.preventDefault(); if (!userComment.trim()) return; try { setReviewSubmitting(true); const response = await fetch(`http://localhost:5000/inventory/${itemId}/review`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ rating: userRating, comment: userComment.trim() }) }); if (response.ok) { const refreshed = await response.json(); setProduct(refreshed); setUserComment(""); setUserRating(5); setSuccessMsg("Review logged into catalog ledger successfully!"); setIsSuccessOpen(true); } else { const errData = await response.json(); setSuccessMsg(`Server Error: ${errData.error || "Failed to log review."}`); setIsSuccessOpen(true); } } catch (err) { console.error(err); setSuccessMsg("Network pipeline failure connecting to server."); setIsSuccessOpen(true); } finally { setReviewSubmitting(false); } }} style={{ background: 'var(--bg-card, #ffffff)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color, #e2e8f0)', marginBottom: '24px' }} >
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary, #1e293b)' }}>Submit Performance Evaluation Log</h4>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '600', color: 'var(--text-primary, #475569)' }}>Assign Star Metric:</label>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', height: '40px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} onClick={() => setUserRating(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} style={{ cursor: 'pointer', fontSize: '1.8rem', color: star <= (hoverRating || userRating) ? '#ffc107' : 'var(--border-color, #e2e8f0)', transition: 'color 0.1s' }}>★</span>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: '280px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '600', color: 'var(--text-primary, #475569)' }}>Performance Review Commentary:</label>
                <input type="text" value={userComment} onChange={(e) => setUserComment(e.target.value)} placeholder="Elaborate details detailing testing results, construction durability..." required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', boxSizing: 'border-box', background: 'var(--bg-main, #ffffff)', color: 'var(--text-primary, #0f172a)', height: '40px', outline: 'none', fontSize: '0.9rem' }} />
              </div>
            </div>
            <button type="submit" disabled={reviewSubmitting} style={{ padding: '12px 24px', background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>
              {reviewSubmitting ? "Submitting Track Record..." : "Publish Customer Evaluation"}
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="reviews-feed-container">
            {(!product.reviews || product.reviews.length === 0) ? (
              <p style={{ fontStyle: 'italic', color: 'var(--text-muted, #64748b)', margin: '10px 0', fontSize: '0.9rem' }}>No performance evaluation metrics logged yet.</p>
            ) : (
              product.reviews.map((rev) => (
                <div key={rev._id || Math.random()} style={{ background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color, #e2e8f0)', padding: '18px 24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary, #1e293b)' }}>👤 {rev.username || "Anonymous Operator"}</strong>
                    <span style={{ color: '#ffc107', fontSize: '0.95rem' }}>{"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}</span>
                  </div>
                  <p style={{ margin: '0', fontSize: '0.9rem', color: 'var(--text-primary, #475569)', lineHeight: '1.5' }}>{rev.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <ImageUploadCrop isOpen={isEditCropOpen} onClose={() => setIsEditCropOpen(false)} onCropComplete={handleCroppedEditReturn} title="Modify Existing Product Image" aspect={1} />
      <PurchaseInvoiceModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} product={product} onCompletePurchase={handleCompletePurchase} />
      <DeleteModal deleteTargetId={deleteTargetId} setDeleteTargetId={setDeleteTargetId} handleConfirmDelete={async () => { try { const res = await fetch(`http://localhost:5000/inventory/${deleteTargetId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); if (res.ok) { setDeleteTargetId(null); setSuccessMsg("Product item records dropped securely."); setIsSuccessOpen(true); setTimeout(() => { onBack(); }, 2000); } else { const errorPayload = await res.json(); setSuccessMsg(`Purge Fault: ${errorPayload.error || "Server validation anomaly."}`); setIsSuccessOpen(true); } } catch (err) { console.error(err); setSuccessMsg("Network failure handling deletion stream macros."); setIsSuccessOpen(true); } }} />
      <SuccessModal isOpen={isSuccessOpen} message={successMsg} onClose={() => setIsSuccessOpen(false)} />
    </div>
  );
}

export default ProductPurchasePage;
