import React from 'react';
import { createPortal } from 'react-dom';
import ImageUploadCrop from '../components/Modal/ImageUploadCrop';
import PaginationModal from '../components/Modal/PaginationModal';
import DeleteModal from '../components/Modal/DeleteModal';

// Architecture Decoupled Nodes
import { useInventoryData } from '../hooks/useInventoryData';
import InventorySkeleton from '../components/Inventory/InventorySkeleton';
import InventoryCard from '../components/Inventory/InventoryCard';
import ProductChatModal from '../components/Inventory/ProductChatModal';
import { API_BASE_URL } from '../api/config';
import { useSocket } from '../context/SocketContext';
import { Search, X, SlidersHorizontal, ChevronDown, Trash2 } from 'lucide-react';

const paymentPreferenceLabel = method => ({ cash_on_delivery: 'Cash on delivery', card_to_seller: 'Debit or credit card with seller', bank_transfer: 'Bank transfer' }[method] || 'Confirm with seller');
const deliveryPreferenceLabel = method => method === 'pickup' ? 'Arrange pickup' : 'Request delivery';
const orderStatusLabel = status => ({ pending: 'Awaiting seller', accepted: 'Accepted', processing: 'Preparing', packed: 'Packed', ready_for_pickup: 'Ready for pickup', shipped: 'In transit', out_for_delivery: 'Out for delivery', delivered: 'Delivered', fulfilled: 'Fulfilled', cancelled: 'Cancelled', custom_checkpoint: 'Checkpoint', checkpoint_completed: 'Completed' }[status] || status);
const formatOrderDate = value => value ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent update';
const getOrderTimeline = order => {
  const history = order.statusHistory?.length ? order.statusHistory : [{ status: order.status, createdAt: order.updatedAt || order.createdAt }];
  const events = history.map(event => ({ ...event, title: orderStatusLabel(event.status) }));
  (order.checkpoints || []).forEach(checkpoint => {
    events.push({ status: 'custom_checkpoint', title: checkpoint.label, note: checkpoint.note || 'Custom checkpoint added', createdAt: checkpoint.createdAt, checkpointId: checkpoint._id });
    if (checkpoint.completedAt) events.push({ status: 'checkpoint_completed', title: `${checkpoint.label} complete`, note: checkpoint.note || '', createdAt: checkpoint.completedAt, checkpointId: checkpoint._id });
  });
  return events.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
};

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
  onBuyNow,
  user,
  initialView = 'browse'
}) {
  const { socket } = useSocket() || {};
  
  // Connect decoupled logic engine
  const {
    showAddForm, setShowAddForm,
    isCropOpen, setIsCropOpen,
    finalProductFile, setFinalProductFile,
    productPreviewUrl, setProductPreviewUrl,
    hoveredWishlistId, setHoveredWishlistId,
    hoveredBtnId, setHoveredBtnId,
    currentPage, setCurrentPage,
    filteredItems,
    handleCroppedProductReturn
  } = useInventoryData({ inventory, searchQuery, searchCategory });

  const { itemName, setItemName, itemBrand, setItemBrand, itemQuantity, setItemQuantity, itemPrice, setItemPrice, itemCategory, setItemCategory, itemDescription, setItemDescription, addItem } = inventory;
  const [view, setView] = React.useState(initialView);
  const [formError, setFormError] = React.useState('');
  const [newListingMedia, setNewListingMedia] = React.useState([]);
  const [conversations, setConversations] = React.useState([]);
  const [orders, setOrders] = React.useState([]);
  const [ordersLoading, setOrdersLoading] = React.useState(false);
  const [ordersError, setOrdersError] = React.useState('');
  const [orderUpdatingId, setOrderUpdatingId] = React.useState(null);
  const [orderConfirm, setOrderConfirm] = React.useState(null);
  const [trackingDrafts, setTrackingDrafts] = React.useState({});
  const [purchaseOrders, setPurchaseOrders] = React.useState([]);
  const [purchaseOrdersLoading, setPurchaseOrdersLoading] = React.useState(false);
  const [purchaseOrdersError, setPurchaseOrdersError] = React.useState('');
  const [openConversation, setOpenConversation] = React.useState(null);
  const [sortOrder, setSortOrder] = React.useState('relevance');
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const filterDropdownRef = React.useRef(null);
  const itemsPerPage = 6;
  const allOwnListings = (inventory.itemList || []).filter(item => String(item.createdBy?._id || item.createdBy) === String(user?._id || user?.id));
  const trendingScore = item => (Number(item.viewCount) || 0) + (Number(item.saveCount) || 0) * 4 + (item.reviews?.length || 0) * 3 + (Number(item.averageRating) || 0);
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortOrder === 'price-low') return Number(a.price || 0) - Number(b.price || 0);
    if (sortOrder === 'price-high') return Number(b.price || 0) - Number(a.price || 0);
    if (sortOrder === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    return trendingScore(b) - trendingScore(a);
  });
  const ownListings = sortedItems.filter(item => String(item.createdBy?._id || item.createdBy) === String(user?._id || user?.id));
  const resultItems = view === 'sell' ? ownListings : view === 'orders' ? [] : sortedItems;
  const visibleItems = resultItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const resultCount = resultItems.length;
  const resultPages = Math.ceil(resultCount / itemsPerPage);
  const normalizedQuery = (searchQuery || '').trim();
  const closeAddForm = () => {
    setShowAddForm(false);
    setFormError('');
    if (productPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(productPreviewUrl);
    setProductPreviewUrl(null);
    setFinalProductFile(null);
    setNewListingMedia([]);
  };
  const closeAddFormRef = React.useRef(closeAddForm);
  closeAddFormRef.current = closeAddForm;
  React.useEffect(() => { setCurrentPage(1); }, [view, setCurrentPage]);
  React.useEffect(() => { setView(initialView); }, [initialView]);
  React.useEffect(() => {
    if (!showAddForm) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = event => { if (event.key === 'Escape' && !isCropOpen) closeAddFormRef.current(); };
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', closeOnEscape); };
  }, [showAddForm, isCropOpen]);
  React.useEffect(() => {
    if (!filtersOpen) return undefined;
    const closeOnOutsideClick = event => {
      if (!filterDropdownRef.current?.contains(event.target)) setFiltersOpen(false);
    };
    const closeOnEscape = event => { if (event.key === 'Escape') setFiltersOpen(false); };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [filtersOpen]);
  React.useEffect(() => {
    if (view === 'orders') {
      const token = localStorage.getItem('token');
      setPurchaseOrdersLoading(true);
      setPurchaseOrdersError('');
      fetch(`${API_BASE_URL}/inventory/orders/buying`, { headers: { Authorization: `Bearer ${token}` } })
        .then(async response => {
          const data = await response.json().catch(() => []);
          if (!response.ok) throw new Error(data.error || 'Could not load orders.');
          setPurchaseOrders(Array.isArray(data) ? data : []);
        })
        .catch(error => setPurchaseOrdersError(error.message || 'Could not load order history.'))
        .finally(() => setPurchaseOrdersLoading(false));
      return;
    }
    if (view !== 'sell') return;
    const token = localStorage.getItem('token');
    fetch(`${API_BASE_URL}/inventory/conversations`, { headers: { Authorization: `Bearer ${token}` } })
      .then(response => response.ok ? response.json() : [])
      .then(data => setConversations(Array.isArray(data) ? data.filter(chat => String(chat.vendor?._id || chat.vendor) === String(user?._id || user?.id)) : []))
      .catch(() => setConversations([]));
    setOrdersLoading(true);
    setOrdersError('');
    fetch(`${API_BASE_URL}/inventory/orders/selling`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async response => {
        const data = await response.json().catch(() => []);
        if (!response.ok) throw new Error(data.error || 'Could not load incoming orders.');
        setOrders(Array.isArray(data) ? data : []);
      })
      .catch(error => setOrdersError(error.message || 'Could not load incoming orders.'))
      .finally(() => setOrdersLoading(false));
  }, [view, user]);

  React.useEffect(() => {
    if (!['sell', 'orders'].includes(view) || !socket) return undefined;
    const refreshOrders = () => {
      const token = localStorage.getItem('token');
      const endpoint = view === 'sell' ? 'selling' : 'buying';
      fetch(`${API_BASE_URL}/inventory/orders/${endpoint}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(async response => {
          const data = await response.json().catch(() => []);
          if (response.ok && Array.isArray(data)) {
            if (view === 'sell') { setOrders(data); setOrdersError(''); }
            else setPurchaseOrders(data);
          }
        })
        .catch(() => {});
    };
    socket.on('inventory_updated', refreshOrders);
    return () => socket.off('inventory_updated', refreshOrders);
  }, [view, socket]);

  const updateOrder = async (order, status, tracking = {}) => {
    const token = localStorage.getItem('token');
    setOrderUpdatingId(order._id);
    setFormError('');
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/orders/${order._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status, ...tracking }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update order.');
      const updatedOrder = data.order || { ...order, status };
      setOrders(current => current.map(row => row._id === order._id ? updatedOrder : row));
      setPurchaseOrders(current => current.map(row => row._id === order._id ? updatedOrder : row));
      if (tracking.checkpoint) setTrackingDrafts(current => ({ ...current, [order._id]: { ...(current[order._id] || {}), checkpointLabel: '', checkpointNote: '' } }));
      inventory.loadItems?.();
      return true;
    } catch (error) {
      setFormError(error.message || 'Could not connect to the server.');
      return false;
    } finally {
      setOrderUpdatingId(null);
    }
  };

  const confirmOrderAction = async () => {
    if (!orderConfirm) return;
    const { order, action } = orderConfirm;
    if (action === 'cancel') {
      if (await updateOrder(order, 'cancelled')) setOrderConfirm(null);
      return;
    }
    const token = localStorage.getItem('token');
    setOrderUpdatingId(order._id);
    setFormError('');
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/orders/${order._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not remove this order.');
      setOrders(current => current.filter(row => row._id !== order._id));
      setPurchaseOrders(current => current.filter(row => row._id !== order._id));
      setOrderConfirm(null);
      inventory.loadItems?.();
    } catch (error) {
      setFormError(error.message || 'Could not connect to the server.');
    } finally {
      setOrderUpdatingId(null);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (typeof inventory.setItemName === 'function') inventory.setItemName(itemName);
    if (typeof inventory.setItemBrand === 'function') inventory.setItemBrand(itemBrand);
    if (typeof inventory.setItemQuantity === 'function') inventory.setItemQuantity(itemQuantity);
    if (typeof inventory.setItemPrice === 'function') inventory.setItemPrice(itemPrice);
    if (typeof inventory.setItemCategory === 'function') inventory.setItemCategory(itemCategory);
    try {
      setFormError('');
      if (typeof addItem === 'function') await addItem([...newListingMedia, ...(finalProductFile ? [finalProductFile] : [])]);
    } catch (error) { setFormError(error.response?.data?.error || error.message || 'Could not publish listing.'); return; }
    
    closeAddForm();
  };

  // 1. Intercept loading conditions with sub-component
  if (inventory?.loading === true) {
    return <InventorySkeleton />;
  }

  return (
      <div style={{ width: '100%', fontFamily: 'system-ui, sans-serif' }} className="inventory-view marketplace-page">
      <header className="articles-heading marketplace-heading">
        <div><span className="articles-eyebrow">BAZZAR MARKETPLACE</span><h1>Inventory</h1><p>Explore tools, equipment, and useful parts from sellers in your community.</p></div>
      </header>
      
      {/* Control Navigation & Filter Bar */}
      <div className="inventory-filter-panel marketplace-filter-panel">
        <div role="group" aria-label="Marketplace view" className="marketplace-scope-switch">
          <button type="button" className={view === 'browse' ? 'is-active' : ''} aria-pressed={view === 'browse'} onClick={() => setView('browse')}>Browse</button>
          <button type="button" className={view === 'sell' ? 'is-active' : ''} aria-pressed={view === 'sell'} onClick={() => setView('sell')}>My listings ({ownListings.length})</button>
          <button type="button" className={view === 'orders' ? 'is-active' : ''} aria-pressed={view === 'orders'} onClick={() => setView('orders')}>My orders</button>
        </div>
        {view !== 'orders' && <button className="marketplace-list-button" onClick={() => { setFormError(''); setShowAddForm(true); }}>
          + List an item
        </button>} 
        {view !== 'orders' && <><div className="marketplace-search-wrap">
          <Search className="marketplace-search-icon" size={19} aria-hidden="true" />
          <input type="search" aria-label="Search marketplace" placeholder="Search products, brands, sellers…" value={searchQuery} onChange={(e) => setSearchQuery?.(e.target.value)} className="marketplace-search" />
          {normalizedQuery && <button className="marketplace-search-clear" type="button" aria-label="Clear search" onClick={() => setSearchQuery?.('')}><X size={16} /></button>}
        </div>
        </>}
      </div> 

      {view !== 'orders' && <div className="marketplace-filter-dropdown-wrap" ref={filterDropdownRef}>
        <button type="button" className={`marketplace-filter-trigger ${filtersOpen ? 'is-open' : ''}`} aria-expanded={filtersOpen} aria-haspopup="true" onClick={() => setFiltersOpen(open => !open)}>
          <SlidersHorizontal size={16} /><span>Filters &amp; sort</span>
          {(searchCategory !== 'all' || sortOrder !== 'relevance') && <span className="marketplace-filter-active-dot" aria-label="Filters active" />}
          <ChevronDown size={15} className="marketplace-filter-chevron" />
        </button>
        {filtersOpen && <div className="marketplace-filter-dropdown" role="group" aria-label="Inventory filters">
          <label className="marketplace-dropdown-field">Category
            <select value={searchCategory || 'all'} onChange={event => setSearchCategory?.(event.target.value)}>
              <option value="all">All categories</option><option value="tools">Tools</option><option value="hardware">Hardware</option><option value="machinery">Machinery</option>
            </select>
          </label>
          <label className="marketplace-dropdown-field">Sort by
            <select value={sortOrder} onChange={event => { setSortOrder(event.target.value); setCurrentPage(1); }}>
              <option value="relevance">Trending</option><option value="newest">Newest first</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option>
            </select>
          </label>
          {(searchCategory !== 'all' || sortOrder !== 'relevance') && <button type="button" className="marketplace-reset-filters" onClick={() => { setSearchCategory?.('all'); setSortOrder('relevance'); setCurrentPage(1); }}>Reset filters</button>}
        </div>}
      </div>}

      {view !== 'orders' && <div className="marketplace-search-status" aria-live="polite">
        <span>{resultCount} {resultCount === 1 ? 'listing' : 'listings'}{normalizedQuery ? <> matching <strong>“{normalizedQuery}”</strong></> : ' available'}</span>
      </div>}

      {/* Main Inventory Layout Stream */}
      {formError && !showAddForm && <p role="alert" style={{ color: '#b91c1c', padding: '10px 14px', borderRadius: 9, background: '#fef2f2' }}>{formError}</p>}
      <div className="marketplace-results"> 
        {view === 'sell' && <section className="marketplace-incoming-orders" aria-labelledby="incoming-orders-title">
          <div className="marketplace-incoming-heading"><div><span className="marketplace-eyebrow">SELLER DESK</span><h2 id="incoming-orders-title">Incoming orders</h2><p>Review requests, update delivery progress, and share tracking with buyers.</p></div><span className="marketplace-order-count">{orders.length} {orders.length === 1 ? 'order' : 'orders'}</span></div>
          {ordersLoading ? <div className="marketplace-order-empty" role="status"><strong>Loading incoming orders…</strong></div> : ordersError ? <div className="marketplace-order-error" role="alert">{ordersError}</div> : !orders.length ? <div className="marketplace-order-empty"><span>📦</span><strong>No incoming orders</strong><p>New requests for your listings will show up here.</p></div> : <div className="marketplace-incoming-list">{orders.map(order => {
            const draft = trackingDrafts[order._id] || { carrier: order.trackingCarrier || '', number: order.trackingNumber || '', checkpointLabel: '', checkpointNote: '' };
            const history = getOrderTimeline(order);
            return <article className="marketplace-incoming-card" key={order._id}>
              <div className="marketplace-incoming-top"><div><span className="marketplace-order-reference">{order.orderNumber}</span><h3>{order.productSnapshot?.name || 'Marketplace item'}</h3><p>{order.quantity} × ${Number(order.productSnapshot?.unitPrice || 0).toFixed(2)} <b>·</b> {order.buyer?.username || 'Buyer'} <b>·</b> {formatOrderDate(order.createdAt)}</p></div><div className="marketplace-order-card-meta"><strong>${Number(order.total || 0).toFixed(2)}</strong><span className={`marketplace-order-status status-${order.status}`}>{orderStatusLabel(order.status)}</span></div></div>
              <div className="marketplace-incoming-details"><span>{paymentPreferenceLabel(order.paymentMethod)}</span><span>{deliveryPreferenceLabel(order.deliveryMethod)}</span>{order.deliveryAddress && <span className="marketplace-incoming-address">Deliver to: {order.deliveryAddress}</span>}</div>
              <div className="marketplace-order-tracking"><strong>Order progress</strong><ol>{history.map((event, index) => <li key={`${event.status}-${event.createdAt || index}-${index}`} className={`is-complete ${index === history.length - 1 ? 'is-current' : ''}`}><span className="marketplace-tracking-dot"/><div><b>{event.title}</b>{event.note && <small>{event.note}</small>}<small>{formatOrderDate(event.createdAt)}</small></div></li>)}</ol></div>
              {((order.status === 'processing' || order.status === 'packed') && order.deliveryMethod !== 'pickup') && <div className="marketplace-tracking-fields"><label>Delivery carrier<input value={draft.carrier} onChange={event => setTrackingDrafts(current => ({ ...current, [order._id]: { ...draft, carrier: event.target.value } }))} placeholder="e.g. Local courier" /></label><label>Tracking number or link<input value={draft.number} onChange={event => setTrackingDrafts(current => ({ ...current, [order._id]: { ...draft, number: event.target.value } }))} placeholder="Optional tracking reference" /></label><small>Add a carrier or tracking reference before shipping.</small></div>}
              {order.status !== 'cancelled' && !['delivered', 'fulfilled'].includes(order.status) && <div className="marketplace-custom-checkpoints"><div className="marketplace-checkpoint-heading"><strong>Custom checkpoints</strong><span>{order.checkpoints?.length || 0} / 20</span></div>
                {(order.checkpoints || []).length > 0 && <ul>{order.checkpoints.map(checkpoint => <li key={checkpoint._id} className={checkpoint.completedAt ? 'is-done' : ''}><span><b>{checkpoint.label}</b>{checkpoint.note && <small>{checkpoint.note}</small>}<small>{checkpoint.completedAt ? `Completed ${formatOrderDate(checkpoint.completedAt)}` : `Added ${formatOrderDate(checkpoint.createdAt)}`}</small></span>{!checkpoint.completedAt && <button type="button" disabled={orderUpdatingId === order._id} onClick={() => updateOrder(order, undefined, { completeCheckpointId: checkpoint._id })}>Mark done</button>}</li>)}</ul>}
                {(order.checkpoints?.length || 0) < 20 && <div className="marketplace-checkpoint-form"><label>Checkpoint name<input value={draft.checkpointLabel} onChange={event => setTrackingDrafts(current => ({ ...current, [order._id]: { ...draft, checkpointLabel: event.target.value } }))} placeholder="e.g. Quality checked" maxLength={80} /></label><label>Details<input value={draft.checkpointNote} onChange={event => setTrackingDrafts(current => ({ ...current, [order._id]: { ...draft, checkpointNote: event.target.value } }))} placeholder="Optional update for the buyer" maxLength={300} /></label><button type="button" className="marketplace-action-secondary" disabled={orderUpdatingId === order._id || !draft.checkpointLabel.trim()} onClick={() => updateOrder(order, undefined, { checkpoint: { label: draft.checkpointLabel, note: draft.checkpointNote } })}>Add checkpoint</button></div>}
              </div>}
              <div className="marketplace-incoming-actions">{order.status === 'pending' && <><button type="button" className="marketplace-action-primary" disabled={orderUpdatingId === order._id} onClick={() => updateOrder(order, 'accepted')}>Accept request</button><button type="button" className="marketplace-action-secondary" disabled={orderUpdatingId === order._id} onClick={() => setOrderConfirm({ order, action: 'cancel' })}>Decline</button></>}{order.status === 'accepted' && <><button type="button" className="marketplace-action-primary" disabled={orderUpdatingId === order._id} onClick={() => updateOrder(order, 'processing')}>Start preparing</button><button type="button" className="marketplace-action-secondary" disabled={orderUpdatingId === order._id} onClick={() => setOrderConfirm({ order, action: 'cancel' })}>Cancel order</button></>}{order.status === 'processing' && <><button type="button" className="marketplace-action-primary" disabled={orderUpdatingId === order._id} onClick={() => updateOrder(order, 'packed')}>Mark packed</button><button type="button" className="marketplace-action-secondary" disabled={orderUpdatingId === order._id} onClick={() => setOrderConfirm({ order, action: 'cancel' })}>Cancel order</button></>}{order.status === 'packed' && <>{order.deliveryMethod === 'pickup' ? <button type="button" className="marketplace-action-primary" disabled={orderUpdatingId === order._id} onClick={() => updateOrder(order, 'ready_for_pickup')}>Ready for pickup</button> : <button type="button" className="marketplace-action-primary" disabled={orderUpdatingId === order._id} onClick={() => updateOrder(order, 'shipped', { trackingCarrier: draft.carrier, trackingNumber: draft.number })}>Mark as shipped</button>}<button type="button" className="marketplace-action-secondary" disabled={orderUpdatingId === order._id} onClick={() => setOrderConfirm({ order, action: 'cancel' })}>Cancel order</button></>}{order.status === 'ready_for_pickup' && <button type="button" className="marketplace-action-primary" disabled={orderUpdatingId === order._id} onClick={() => updateOrder(order, 'delivered')}>Confirm handover</button>}{order.status === 'shipped' && <><button type="button" className="marketplace-action-primary" disabled={orderUpdatingId === order._id} onClick={() => updateOrder(order, 'out_for_delivery')}>Out for delivery</button><button type="button" className="marketplace-action-secondary" disabled={orderUpdatingId === order._id} onClick={() => updateOrder(order, 'delivered')}>Mark delivered</button></>}{order.status === 'out_for_delivery' && <button type="button" className="marketplace-action-primary" disabled={orderUpdatingId === order._id} onClick={() => updateOrder(order, 'delivered')}>Mark delivered</button>}{['delivered', 'fulfilled', 'cancelled'].includes(order.status) && <button type="button" className="marketplace-action-secondary" disabled={orderUpdatingId === order._id} onClick={() => setOrderConfirm({ order, action: 'delete' })}><Trash2 size={14} /> Remove from history</button>}{orderUpdatingId === order._id && <span className="marketplace-order-saving">Updating order…</span>}</div>
            </article>;
          })}</div>}
        </section>}
        {view === 'sell' && <section style={{ marginBottom: 20, padding: 20, border: '1px solid var(--border-color, #e2e8f0)', borderRadius: 16, background: 'var(--bg-card, #fff)' }}>
          <h2 style={{ margin: '0 0 12px', color: 'var(--text-primary, #0f172a)' }}>Buyer messages</h2>
          {!conversations.length ? <p style={{ color: 'var(--text-muted, #64748b)', margin: 0 }}>Product questions from buyers will appear here.</p> : conversations.map(chat => <button key={chat._id} type="button" onClick={() => setOpenConversation(chat)} style={{ width: '100%', textAlign: 'left', padding: 13, marginTop: 8, border: '1px solid var(--border-color, #e2e8f0)', borderRadius: 10, background: 'var(--bg-main, #f8fafc)', color: 'var(--text-primary, #0f172a)', cursor: 'pointer' }}><strong>{chat.customer?.username || 'Buyer'}</strong> · {chat.product?.name || 'Product'} <span style={{ float: 'right', color: 'var(--text-muted, #64748b)' }}>{chat.messages?.length || 0} messages</span></button>)}
        </section>}
        {view === 'orders' && <section className="marketplace-order-history" aria-labelledby="marketplace-order-history-title">
          <div className="marketplace-order-history-heading"><div><span className="marketplace-eyebrow">YOUR ACTIVITY</span><h2 id="marketplace-order-history-title">Order history</h2><p>Track requests you have sent to marketplace sellers.</p></div><span className="marketplace-order-count">{purchaseOrders.length} {purchaseOrders.length === 1 ? 'order' : 'orders'}</span></div>
          {purchaseOrdersLoading ? <div className="marketplace-order-empty" role="status"><strong>Loading your orders…</strong></div> : purchaseOrdersError ? <div className="marketplace-order-error" role="alert">{purchaseOrdersError} <button type="button" onClick={() => setView('browse')}>Back to marketplace</button></div> : !purchaseOrders.length ? <div className="marketplace-order-empty"><span>🧾</span><strong>No orders yet</strong><p>When you request an item, its status and order total will appear here.</p></div> : <div className="marketplace-order-list">{purchaseOrders.map(order => {
            const history = getOrderTimeline(order);
            return <article className="marketplace-order-card marketplace-buyer-order-card" key={order._id}>
              <div className="marketplace-order-card-main"><div className="marketplace-order-product-icon"><span>▦</span></div><div className="marketplace-order-copy"><strong>{order.productSnapshot?.name || 'Marketplace item'}</strong><span>{order.orderNumber} · {formatOrderDate(order.createdAt)}</span><small>Seller: {order.vendor?.username || 'Marketplace seller'} · {order.quantity} {order.quantity === 1 ? 'unit' : 'units'}</small><small>{paymentPreferenceLabel(order.paymentMethod)} · {deliveryPreferenceLabel(order.deliveryMethod)}</small></div></div>
              <div className="marketplace-order-card-meta"><strong>${Number(order.total || 0).toFixed(2)}</strong><span className={`marketplace-order-status status-${order.status}`}>{orderStatusLabel(order.status)}</span></div>
              {(order.trackingCarrier || order.trackingNumber) && <div className="marketplace-buyer-tracking"><strong>Delivery tracking</strong><span>{order.trackingCarrier}{order.trackingCarrier && order.trackingNumber ? ' · ' : ''}{order.trackingNumber && (/^https?:\/\//i.test(order.trackingNumber) ? <a href={order.trackingNumber} target="_blank" rel="noreferrer">Open tracking link</a> : order.trackingNumber)}</span></div>}
              <ol className="marketplace-buyer-timeline">{history.map((event, index) => <li key={`${event.status}-${event.createdAt || index}-${index}`} className={index === history.length - 1 ? 'is-current' : ''}><span className="marketplace-tracking-dot"/><div><b>{event.title}</b>{event.note && <small>{event.note}</small>}<small>{formatOrderDate(event.createdAt)}</small></div></li>)}</ol>
              {['pending', 'accepted'].includes(order.status) && <button type="button" className="marketplace-action-secondary marketplace-confirm-delivery" disabled={orderUpdatingId === order._id} onClick={() => setOrderConfirm({ order, action: 'cancel' })}>Cancel order</button>}
              {['shipped', 'out_for_delivery', 'ready_for_pickup'].includes(order.status) && <button type="button" className="marketplace-action-primary marketplace-confirm-delivery" disabled={orderUpdatingId === order._id} onClick={() => updateOrder(order, 'delivered')}>{orderUpdatingId === order._id ? 'Updating…' : order.status === 'ready_for_pickup' ? 'Confirm pickup' : 'Confirm delivery'}</button>}
              {['delivered', 'fulfilled', 'cancelled'].includes(order.status) && <button type="button" className="marketplace-action-secondary marketplace-confirm-delivery" disabled={orderUpdatingId === order._id} onClick={() => setOrderConfirm({ order, action: 'delete' })}><Trash2 size={14} /> Remove from history</button>}
            </article>;
          })}</div>}
          {!purchaseOrdersLoading && !purchaseOrdersError && purchaseOrders.length > 0 && <p className="marketplace-order-note">Orders are requests between you and the seller. Payment and delivery are arranged separately.</p>}
        </section>}
        {view !== 'orders' && (visibleItems.length === 0 ? ( 
          <p className="marketplace-empty-state"> 
            {view === 'sell' && allOwnListings.length === 0 ? 'You have not published any listings yet.' : 'No listings match your search. Try a different name, brand, seller, or category.'}
          </p> 
        ) : ( 
          <ul className="inventory-cards-list"> 
            {visibleItems.map(item => ( 
              <InventoryCard 
                key={item._id}
                item={item}
                canManage={user?.role === 'admin' || String(item.createdBy?._id || item.createdBy) === String(user?._id || user?.id)}
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
        ))} 
      </div>

      {view !== 'orders' && <div className="marketplace-search-status" aria-live="polite">
        <span>{resultCount} {resultCount === 1 ? 'listing' : 'listings'}{normalizedQuery ? <> matching <strong>“{normalizedQuery}”</strong></> : ' available'}</span>
        {normalizedQuery && <button type="button" onClick={() => setSearchQuery?.('')}>Clear search <X size={13} /></button>}
      </div>}
      {view !== 'orders' && <div style={{ marginTop: '32px' }}> 
        <PaginationModal currentPage={currentPage} totalPages={resultPages} totalPosts={resultCount} onPageChange={setCurrentPage} /> 
      </div>} 

      {showAddForm && createPortal((
        <div className="inventory-listing-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) closeAddForm(); }}>
          <section className="inventory-listing-modal" role="dialog" aria-modal="true" aria-labelledby="inventory-listing-title">
            <header className="inventory-listing-header">
              <div><span className="inventory-listing-kicker">SELL ON BAZZAR</span><h2 id="inventory-listing-title">List an item</h2><p>Add clear details so buyers know exactly what you’re offering.</p></div>
              <button type="button" className="inventory-listing-close" aria-label="Close listing form" onClick={closeAddForm}><X size={19} /></button>
            </header>
            <form onSubmit={handleFormSubmit} className="inventory-listing-form">
              <div className="inventory-listing-media-grid">
                <div className="inventory-listing-photo">
                  {productPreviewUrl ? <img src={productPreviewUrl} alt="Main product preview" /> : <div><span aria-hidden="true">▧</span><strong>Main product photo</strong><small>A clear front view helps buyers decide.</small></div>}
                </div>
                <div className="inventory-listing-media-actions">
                  <div><strong>Product photos</strong><small>Choose a main photo, then add extra photos or a short video.</small></div>
                  <button type="button" className="inventory-photo-button" onClick={() => setIsCropOpen(true)}>{finalProductFile ? 'Change main photo' : 'Add main photo'}</button>
                  <label className="inventory-upload-button">Add photos or video<input type="file" accept="image/*,video/*" multiple onChange={event => { const files = Array.from(event.target.files || []); setNewListingMedia(current => [...current, ...files].slice(0, Math.max(0, 10 - (finalProductFile ? 1 : 0)))); event.target.value = ''; }} /></label>
                  <small>{(newListingMedia.length + (finalProductFile ? 1 : 0))}/10 media files selected</small>
                </div>
              </div>
              {newListingMedia.length > 0 && <ul className="inventory-listing-file-list" aria-label="Selected media">{newListingMedia.map((file, index) => <li key={`${file.name}-${index}`}><span>{file.type.startsWith('video/') ? 'Video' : 'Photo'} · {file.name}</span><button type="button" aria-label={`Remove ${file.name}`} onClick={() => setNewListingMedia(current => current.filter((_, fileIndex) => fileIndex !== index))}>Remove</button></li>)}</ul>}
              <div className="inventory-listing-fields">
                <label className="inventory-listing-field">Item name <span>Use the name buyers will search for.</span><input type="text" placeholder="e.g. Cordless drill" value={itemName || ''} onChange={event => setItemName(event.target.value)} maxLength={120} required /></label>
                <label className="inventory-listing-field">Brand <span>Add the maker or brand name.</span><input type="text" placeholder="e.g. Makita" value={itemBrand || ''} onChange={event => setItemBrand(event.target.value)} maxLength={80} required /></label>
                <label className="inventory-listing-field">Category <span>Choose the closest match.</span><select value={itemCategory || 'tools'} onChange={event => setItemCategory(event.target.value)}><option value="tools">Tools</option><option value="hardware">Hardware</option><option value="machinery">Machinery</option></select></label>
                <label className="inventory-listing-field">Available quantity <span>Enter 0 if it is currently out of stock.</span><input type="number" min="0" step="1" placeholder="e.g. 5" value={itemQuantity} onChange={event => setItemQuantity(event.target.value)} required /></label>
                <label className="inventory-listing-field">Price per item <span>Set your price in US dollars.</span><div className="inventory-price-input"><span>$</span><input type="number" min="0" step="0.01" placeholder="0.00" value={itemPrice} onChange={event => setItemPrice(event.target.value)} required /></div></label>
                <label className="inventory-listing-field inventory-listing-description">Description <span>Share condition, included accessories, and useful details.</span><textarea placeholder="Describe the item for potential buyers…" value={itemDescription || ''} onChange={event => setItemDescription(event.target.value)} maxLength={5000} rows={4} /></label>
              </div>
              {formError && <p className="inventory-listing-error" role="alert">{formError}</p>}
              <footer className="inventory-listing-footer"><span>Listings with complete details are easier to trust.</span><div><button type="button" className="inventory-listing-cancel" onClick={closeAddForm}>Cancel</button><button type="submit" className="inventory-listing-submit">Publish listing</button></div></footer>
            </form>
          </section>
        </div>
      ), document.body)}
      <ImageUploadCrop isOpen={isCropOpen} onClose={() => setIsCropOpen(false)} onCropComplete={handleCroppedProductReturn} title="Crop New Inventory Product Picture" aspect={1} />
      {openConversation && <ProductChatModal product={openConversation.product} conversationId={openConversation._id} token={localStorage.getItem('token')} user={user} onClose={() => setOpenConversation(null)} />}
      <DeleteModal
        deleteTargetId={orderConfirm?.order?._id || null}
        setDeleteTargetId={setOrderConfirm}
        handleConfirmDelete={confirmOrderAction}
        title={orderConfirm?.action === 'cancel' ? (view === 'sell' && orderConfirm.order?.status === 'pending' ? 'Decline this request?' : 'Cancel this order?') : 'Remove this order?'}
        message={orderConfirm?.action === 'cancel' ? 'The order will be marked cancelled and the buyer will see the update.' : 'This completed or cancelled order will be removed from your order history.'}
        confirmLabel={orderConfirm?.action === 'cancel' ? (orderConfirm.order?.status === 'pending' && view === 'sell' ? 'Decline request' : 'Cancel order') : 'Remove order'}
        busy={Boolean(orderConfirm && orderUpdatingId === orderConfirm.order?._id)}
      />
    </div> 
  ); 
} 

export default InventoryPage;


