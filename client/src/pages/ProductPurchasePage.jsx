import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MessageCircle, PackageCheck, Play, ShieldCheck, Star, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../api/config';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { usePurchaseData } from '../hooks/usePurchaseData';
import PurchaseLoading from '../components/Inventory/PurchaseLoading';
import PurchaseError from '../components/Inventory/PurchaseError';
import DeleteModal from '../components/Modal/DeleteModal';
import SuccessModal from '../components/Modal/SuccessModal';
import PurchaseInvoiceModal from '../components/Modal/PurchaseInvoiceModal';
import { LiveChatDrawer } from '../components/Dashboard/LiveChatDrawer';
import UserAvatar from '../components/Layout/UserAvatar';

const mediaUrl = path => path?.startsWith('http') ? path : `${API_BASE_URL}${path || ''}`;

function ProductPurchasePage({ itemId: propItemId, onBack, onOpenSellerChat }) {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { socket } = useSocket();
  const { itemId: routeItemId } = useParams();
  const itemId = propItemId || routeItemId;
  const handleBack = () => onBack ? onBack() : navigate('/home');
  const [chatRequest, setChatRequest] = useState(null);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [keptMedia, setKeptMedia] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [quantity, setQuantity] = useState(1);

  const {
    isSuccessOpen, setIsSuccessOpen, successMsg, setSuccessMsg,
    product, setProduct, loading, error,
    userRating, setUserRating, userComment, setUserComment,
    reviewSubmitting, setReviewSubmitting, hoverRating, setHoverRating,
    isCheckoutOpen, setIsCheckoutOpen, setOrderQuantity, purchaseSubmitting, checkoutError, setCheckoutError,
    isEditMode, setIsEditMode,
    editName, setEditName, editBrand, setEditBrand,
    editQuantity, setEditQuantity, editPrice, setEditPrice,
    editCategory, setEditCategory, editDescription, setEditDescription,
    editCondition, setEditCondition, editWarranty, setEditWarranty,
    editDimensions, setEditDimensions, editWeight, setEditWeight,
    editPowerSource, setEditPowerSource, saveSubmitting, setSaveSubmitting,
    deleteTargetId, setDeleteTargetId, hydrateFormStates, handleCompletePurchase
  } = usePurchaseData({ itemId, token, onBack });

  useEffect(() => {
    if (!product) return;
    const media = Array.isArray(product.media) ? product.media.filter(item => item?.url) : [];
    if (product.imagePath && !media.some(item => item.url === product.imagePath)) {
      media.unshift({ url: product.imagePath, type: 'image' });
    }
    setKeptMedia(media);
    setNewFiles([]);
    setMediaIndex(0);
  }, [product]);

  useEffect(() => {
    const previews = newFiles.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image',
      name: file.name,
      staged: true
    }));
    setFilePreviews(previews);
    return () => previews.forEach(item => URL.revokeObjectURL(item.url));
  }, [newFiles]);

  const gallery = useMemo(() => [...keptMedia, ...filePreviews], [keptMedia, filePreviews]);
  const activeMedia = gallery[mediaIndex] || null;
  if (loading) return <PurchaseLoading />;
  if (error || !product) return <PurchaseError error={error} onBack={handleBack} />;

  const sellerId = typeof product.createdBy === 'object' ? product.createdBy?._id : product.createdBy;
  const hasSellerAccount = Boolean(sellerId);
  const isOwner = String(sellerId) === String(user?._id || user?.id);
  const canManage = user?.role === 'admin' || isOwner;
  const hasReviewed = product.reviews?.some(review => String(review.userId?._id || review.userId) === String(user?._id || user?.id));
  const average = Number(product.averageRating || 0);
  const reviewCount = product.reviews?.length || 0;
  const openSellerChat = () => {
    if (!hasSellerAccount) {
      setSuccessMsg('Seller chat is unavailable because this listing has no seller account linked.');
      setIsSuccessOpen(true);
      return;
    }
    const request = { vendor: product.createdBy, product, requestId: Date.now() };
    if (onOpenSellerChat) onOpenSellerChat(request);
    else setChatRequest(request);
  };

  const claimListing = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/${product._id || itemId}/claim`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not assign this listing.');
      setProduct(data);
      setSuccessMsg('Listing assigned to your admin account. Buyers can now contact you and place orders.');
      setIsSuccessOpen(true);
    } catch (claimError) {
      setSuccessMsg(claimError.message || 'Could not connect to the server.');
      setIsSuccessOpen(true);
    }
  };

  const saveListing = async () => {
    try {
      setSaveSubmitting(true);
      const formData = new FormData();
      Object.entries({ name: editName, brand: editBrand, quantity: Number(editQuantity), price: Number(editPrice), category: editCategory, description: editDescription, condition: editCondition, warranty: editWarranty }).forEach(([key, value]) => formData.append(key, value));
      formData.append('specifications[dimensions]', editDimensions);
      formData.append('specifications[weight]', editWeight);
      formData.append('specifications[powerSource]', editPowerSource);
      formData.append('keepMedia', JSON.stringify(keptMedia));
      newFiles.forEach(file => formData.append('productMedia', file));
      const response = await fetch(`${API_BASE_URL}/inventory/${product._id || itemId}`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save this listing.');
      setProduct(data);
      setKeptMedia(data.media || []);
      setNewFiles([]);
      setMediaIndex(0);
      setIsEditMode(false);
      setSuccessMsg('Your listing has been updated.');
      setIsSuccessOpen(true);
    } catch (saveError) {
      setSuccessMsg(saveError.message || 'Could not connect to the server.');
      setIsSuccessOpen(true);
    } finally {
      setSaveSubmitting(false);
    }
  };

  const submitReview = async event => {
    event.preventDefault();
    if (!userComment.trim()) return;
    try {
      setReviewSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/inventory/${itemId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating: userRating, comment: userComment.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not post your review.');
      setProduct(data);
      setUserComment('');
      setUserRating(5);
      setSuccessMsg('Your review has been posted.');
      setIsSuccessOpen(true);
    } catch (reviewError) {
      setSuccessMsg(reviewError.message || 'Could not connect to the server.');
      setIsSuccessOpen(true);
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <main className="product-detail-page">
      <div className="product-detail-topbar">
        <button className="product-back-link" type="button" onClick={handleBack}><ArrowLeft size={16} /> Back to marketplace</button>
        {canManage && <div className="product-owner-actions">
          {user?.role === 'admin' && !hasSellerAccount && <button type="button" className="product-edit-action" onClick={claimListing}>Assign to my account</button>}
          <button type="button" className="product-edit-action" onClick={() => { if (isEditMode) hydrateFormStates(product); setIsEditMode(value => !value); }}>{isEditMode ? 'Discard changes' : 'Edit listing'}</button>
          <button type="button" className="product-delete-action" onClick={() => setDeleteTargetId(product._id || itemId)}><Trash2 size={15} /> Delete</button>
        </div>}
      </div>

      <section className="product-detail-layout">
        <div className="product-gallery-card">
          <div className="product-gallery-canvas">
            {activeMedia ? activeMedia.type === 'video' ? (
              <video key={activeMedia.url} src={activeMedia.staged ? activeMedia.url : mediaUrl(activeMedia.url)} controls playsInline preload="metadata" />
            ) : (
              <img src={activeMedia.staged ? activeMedia.url : mediaUrl(activeMedia.url)} alt={`${product.name} media ${mediaIndex + 1}`} />
            ) : <div className="product-empty-gallery"><span>✳</span><strong>See the product up close</strong><small>Seller photos and videos will appear here.</small></div>}
            {gallery.length > 1 && <div className="product-gallery-arrows">
              <button type="button" aria-label="Previous media" onClick={() => setMediaIndex(index => (index - 1 + gallery.length) % gallery.length)}>‹</button>
              <span>{mediaIndex + 1} / {gallery.length}</span>
              <button type="button" aria-label="Next media" onClick={() => setMediaIndex(index => (index + 1) % gallery.length)}>›</button>
            </div>}
          </div>
          {gallery.length > 0 && <div className="product-gallery-strip" aria-label="Product gallery">
            {gallery.map((item, index) => <div className="product-gallery-tile-wrap" key={`${item.url}-${index}`}>
              <button type="button" className={`product-gallery-tile ${index === mediaIndex ? 'is-selected' : ''}`} onClick={() => setMediaIndex(index)} aria-label={`Show media ${index + 1}`}>
                {item.type === 'video' ? <span><Play size={16} fill="currentColor" /> Video</span> : <img src={item.staged ? item.url : mediaUrl(item.url)} alt="" />}
              </button>
              {isEditMode && !item.staged && <button type="button" className="product-media-remove" aria-label="Remove media" onClick={() => { setKeptMedia(current => current.filter((_, mediaPosition) => mediaPosition !== index)); setMediaIndex(0); }}>×</button>}
            </div>)}
          </div>}
          {isEditMode && <label className="product-media-picker"><span>Add product photos or videos</span><input type="file" accept="image/*,video/*" multiple onChange={event => { setNewFiles(current => [...current, ...Array.from(event.target.files || [])].slice(0, 10)); event.target.value = ''; }} /><small>Select up to 10 new files. Images and videos are both supported.</small>
            {filePreviews.map((item, index) => <button key={item.url} type="button" onClick={event => { event.preventDefault(); setNewFiles(current => current.filter((_, fileIndex) => fileIndex !== index)); }}>Remove {item.name}</button>)}
          </label>}
        </div>

        <aside className="product-buy-panel">
          <div className="product-title-area">
            <span className="product-category-pill">{product.category || 'Product'}</span>
            {isEditMode ? <div className="product-edit-grid"><label>Product name<input value={editName} onChange={event => setEditName(event.target.value)} /></label><label>Brand<input value={editBrand} onChange={event => setEditBrand(event.target.value)} /></label></div> : <><h1>{product.name}</h1><p className="product-brand-line">by <strong>{product.brand}</strong></p></>}
            <div className="product-rating-line"><span className="product-stars">{'★'.repeat(Math.round(average))}{'☆'.repeat(5 - Math.round(average))}</span><span>{average ? average.toFixed(1) : 'New'} · {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}</span></div>
          </div>

          {!hasSellerAccount && <div className="product-seller-missing" role="status">
            <strong>Seller account needed</strong>
            <span>This older listing is missing its seller link, so buyers cannot order or message its owner yet.</span>
            {user?.role === 'admin' && <small>Assign it to your admin account above to restore ordering and seller chat.</small>}
          </div>}

          {isEditMode ? <div className="product-edit-grid product-edit-pricing">
            <label>Price<input type="number" min="0" step="0.01" value={editPrice} onChange={event => setEditPrice(event.target.value)} /></label>
            <label>Available quantity<input type="number" min="0" value={editQuantity} onChange={event => setEditQuantity(event.target.value)} /></label>
            <label>Category<select value={editCategory} onChange={event => setEditCategory(event.target.value)}><option value="tools">Tools</option><option value="hardware">Hardware</option><option value="machinery">Machinery</option></select></label>
          </div> : <div className="product-price-stock"><div><span>Price</span><strong>${Number(product.price || 0).toFixed(2)}</strong></div><div className="product-stock-status"><PackageCheck size={17} /><span>{Number(product.quantity) > 0 ? `${product.quantity} available` : 'Currently unavailable'}</span></div></div>}

          <div className="product-purchase-actions">
            {!canManage && <>
              <label className="product-quantity">Qty<select value={quantity} onChange={event => setQuantity(Number(event.target.value))} disabled={!Number(product.quantity)}>{Array.from({ length: Math.min(10, Math.max(1, Number(product.quantity))) }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label>
              <button type="button" className="product-order-button" disabled={!Number(product.quantity) || !hasSellerAccount} onClick={() => { setCheckoutError(''); setOrderQuantity(quantity); setIsCheckoutOpen(true); }}>{!hasSellerAccount ? 'Seller unavailable' : Number(product.quantity) ? 'Request to buy' : 'Out of stock'}</button>
              <button type="button" className="product-chat-button" disabled={!hasSellerAccount} onClick={openSellerChat}><MessageCircle size={17} /> Chat with seller</button>
            </>}
            {isEditMode && <button type="button" className="product-order-button" disabled={saveSubmitting} onClick={saveListing}>{saveSubmitting ? 'Saving…' : 'Save listing'}</button>}
          </div>

          <div className="product-trust-row"><span><ShieldCheck size={16} /> Seller listing</span><span><PackageCheck size={16} /> Stock checked</span></div>
          <div className="product-seller-card"><UserAvatar person={product.createdBy} className="product-seller-avatar" /><div><small>Sold by</small><strong>{product.createdBy?.username || 'Marketplace seller'}</strong><span>{product.condition || 'Condition not specified'}</span></div></div>
        </aside>
      </section>

      <section className="product-information-card">
        <div className="product-section-heading"><div><span>PRODUCT INFORMATION</span><h2>Details that help you decide</h2></div></div>
        {isEditMode ? <label className="product-description-edit">Description<textarea rows={5} value={editDescription} onChange={event => setEditDescription(event.target.value)} /></label> : <p className="product-description">{product.description || 'The seller has not added a description yet.'}</p>}
        <div className="product-spec-grid">
          {[
            ['Condition', editCondition, setEditCondition, product.condition || 'Not specified'],
            ['Warranty', editWarranty, setEditWarranty, product.warranty || 'Not specified'],
            ['Dimensions', editDimensions, setEditDimensions, product.specifications?.dimensions || 'Not specified'],
            ['Weight', editWeight, setEditWeight, product.specifications?.weight || 'Not specified'],
            ['Power source', editPowerSource, setEditPowerSource, product.specifications?.powerSource || 'Not specified']
          ].map(([label, value, setter, display]) => <div className="product-spec-item" key={label}><span>{label}</span>{isEditMode ? <input value={value} onChange={event => setter(event.target.value)} /> : <strong>{display}</strong>}</div>)}
        </div>
      </section>

      <section className="product-reviews-section">
        <div className="product-section-heading"><div><span>COMMUNITY FEEDBACK</span><h2>Customer reviews</h2></div><div className="product-review-summary"><Star size={17} fill="currentColor" /> {average ? average.toFixed(1) : '—'} <small>({reviewCount})</small></div></div>
        {!canManage && !hasReviewed && <form className="product-review-form" onSubmit={submitReview}>
          <div><span className="product-review-label">Your rating</span><div className="product-review-stars">{[1, 2, 3, 4, 5].map(star => <button key={star} type="button" aria-label={`${star} stars`} onClick={() => setUserRating(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} className={star <= (hoverRating || userRating) ? 'is-on' : ''}>★</button>)}</div></div>
          <label className="product-review-input">Your review<input value={userComment} onChange={event => setUserComment(event.target.value)} placeholder="What should other buyers know?" required /></label>
          <button type="submit" disabled={reviewSubmitting}>{reviewSubmitting ? 'Posting…' : 'Post review'}</button>
        </form>}
        {hasReviewed && <p className="product-no-reviews">You have already reviewed this listing.</p>}
        <div className="product-review-list">{product.reviews?.length ? product.reviews.map((review, index) => <article className="product-review" key={review._id || `${review.username}-${index}`}><div className="product-review-byline"><strong>{review.username || 'Buyer'}</strong><span className="product-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span></div><p>{review.comment}</p></article>) : <div className="product-no-reviews">No reviews yet. Be the first to share your experience.</div>}</div>
      </section>

      <PurchaseInvoiceModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} product={product} user={user} initialQuantity={quantity} checkoutError={checkoutError} onCompletePurchase={handleCompletePurchase} isSubmitting={purchaseSubmitting} />
      <DeleteModal deleteTargetId={deleteTargetId} setDeleteTargetId={setDeleteTargetId} handleConfirmDelete={async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/inventory/${deleteTargetId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Could not remove listing.');
          setDeleteTargetId(null); setSuccessMsg('Listing removed.'); setIsSuccessOpen(true); setTimeout(handleBack, 900);
        } catch (deleteError) { setSuccessMsg(deleteError.message || 'Could not remove listing.'); setIsSuccessOpen(true); }
      }} />
      <SuccessModal isOpen={isSuccessOpen} message={successMsg} onClose={() => setIsSuccessOpen(false)} />
      {!onOpenSellerChat && <LiveChatDrawer socket={socket} user={user} chatRequest={chatRequest} onChatRequestHandled={() => setChatRequest(null)} />}
    </main>
  );
}

export default ProductPurchasePage;
