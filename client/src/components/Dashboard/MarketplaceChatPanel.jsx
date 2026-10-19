import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Search, Store, Clock3, Package } from 'lucide-react';
import { API_BASE_URL } from '../../api/config';
import ProductChatModal from '../Inventory/ProductChatModal';

const authHeaders = token => ({ Authorization: `Bearer ${token}` });

export default function MarketplaceChatPanel({ user, chatProps, onSelectVendor, onOpenWorkspaceChat }) {
  const [vendors, setVendors] = useState([]);
  const [legacyChats, setLegacyChats] = useState([]);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('sellers');
  const [error, setError] = useState('');
  const [selectedLegacyChat, setSelectedLegacyChat] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;
    let active = true;
    Promise.all([
      fetch(`${API_BASE_URL}/inventory/vendors`, { headers: authHeaders(token) }),
      fetch(`${API_BASE_URL}/inventory/conversations`, { headers: authHeaders(token) })
    ]).then(async ([vendorResponse, chatResponse]) => {
      const [vendorData, chatData] = await Promise.all([vendorResponse.json(), chatResponse.json()]);
      if (!vendorResponse.ok) throw new Error(vendorData.error || 'Could not load sellers.');
      if (!chatResponse.ok) throw new Error(chatData.error || 'Could not load marketplace history.');
      if (active) { setVendors(Array.isArray(vendorData) ? vendorData : []); setLegacyChats(Array.isArray(chatData) ? chatData : []); }
    }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [token]);

  const matchingVendors = useMemo(() => vendors.filter(vendor => `${vendor.username} ${vendor.firstName} ${vendor.lastName} ${vendor.featuredProduct?.name}`.toLowerCase().includes(query.toLowerCase())), [vendors, query]);
  const currentId = String(user?._id || user?.id || '');
  const legacyHistory = legacyChats.map(chat => {
    const isVendor = String(chat.vendor?._id || chat.vendor) === currentId;
    const other = isVendor ? chat.customer : chat.vendor;
    return { ...chat, other, isVendor };
  });

  return <section className="seller-inbox seller-inbox-embedded" aria-label="Marketplace conversations">
    <div className="seller-inbox-tabs" role="tablist" aria-label="Marketplace chats">
      <button type="button" role="tab" aria-selected={tab === 'sellers'} className={tab === 'sellers' ? 'is-active' : ''} onClick={() => setTab('sellers')}><Store size={15} /> Sellers <span>{vendors.length}</span></button>
      <button type="button" role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? 'is-active' : ''} onClick={() => setTab('history')}><Clock3 size={15} /> History <span>{(chatProps.recentChatsList?.length || 0) + legacyChats.length}</span></button>
    </div>
    <label className="seller-inbox-search"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={tab === 'sellers' ? 'Find a seller or listing' : 'Filter conversations'} /></label>
    <div className="seller-inbox-list">
      {error && <p className="seller-inbox-error" role="alert">{error}</p>}
      {tab === 'sellers' ? matchingVendors.map(vendor => <button type="button" className="seller-inbox-row" key={vendor._id} onClick={() => onSelectVendor(vendor)}>
        {vendor.profileImage ? <img src={vendor.profileImage.startsWith('http') ? vendor.profileImage : `${API_BASE_URL}/${vendor.profileImage.replace(/^\/+/, '')}`} alt="" /> : <span className="seller-inbox-avatar">{(vendor.username || 'S').slice(0, 1).toUpperCase()}</span>}
        <span className="seller-inbox-row-copy"><strong>{vendor.username || [vendor.firstName, vendor.lastName].filter(Boolean).join(' ') || 'Seller'}</strong><small>{vendor.featuredProduct?.name || 'Marketplace seller'} · {vendor.listingCount} listing{vendor.listingCount === 1 ? '' : 's'}</small></span>
        <MessageCircle size={17} />
      </button>) : <>
        {(chatProps.recentChatsList || []).filter(item => `${item.name} ${item.lastMessage}`.toLowerCase().includes(query.toLowerCase())).map(item => <button type="button" className="seller-inbox-row" key={`workspace-${item.id}`} onClick={() => onOpenWorkspaceChat(item)}>
          <span className="seller-inbox-avatar">{(item.name || 'C').slice(0, 1).toUpperCase()}</span><span className="seller-inbox-row-copy"><strong>{item.name || 'Conversation'}</strong><small>{item.lastMessage || 'Open conversation'}{item.unreadCount ? ` · ${item.unreadCount} new` : ''}</small></span><MessageCircle size={17} />
        </button>)}
        {legacyHistory.filter(chat => `${chat.other?.username || ''} ${chat.product?.name || ''}`.toLowerCase().includes(query.toLowerCase())).map(chat => <button type="button" className="seller-inbox-row seller-inbox-legacy" key={`listing-${chat._id}`} onClick={() => setSelectedLegacyChat(chat)}>
          <span className="seller-inbox-avatar"><Package size={16} /></span><span className="seller-inbox-row-copy"><strong>{chat.other?.username || 'Marketplace contact'}</strong><small>Listing chat · {chat.product?.name || 'Product'} · {chat.messages?.length || 0} messages</small></span><span className="seller-inbox-legacy-tag">Saved</span>
        </button>)}
        {!chatProps.recentChatsList?.length && !legacyChats.length && <p className="seller-inbox-empty">Your conversations will stay here after you start chatting.</p>}
      </>}
      {tab === 'sellers' && !matchingVendors.length && !error && <p className="seller-inbox-empty">No sellers match your search.</p>}
    </div>
    {selectedLegacyChat && <ProductChatModal product={selectedLegacyChat.product} conversationId={selectedLegacyChat._id} token={token} user={user} presentation="drawer" onClose={() => setSelectedLegacyChat(null)} />}
  </section>;
}
