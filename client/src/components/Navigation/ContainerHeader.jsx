import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

function ContainerHeader({
  activeTab,
  setActiveTab,
  searchOpen,
  setSearchOpen,
  globalSearchQuery,
  setGlobalSearchQuery,
  user,
  showProfile,
  setShowProfile,
  wishlist,
  triggerToggleWishlist,
  logout,
  rawInventoryItems = [],
  rawNewsItems = [],
  rawAdItems = []
}) {
  const [showPredictions, setShowPredictions] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowPredictions(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);
  const query = (globalSearchQuery || "").toLowerCase().trim();

  // 🔮 ACTIVE FUZZY MATCHING MATRIX LOOKUPS
  const matchingExtensions = [];
  if (query.length > 0) {
    if ("warehouse data extension tools catalog pipelines barcode hub central".includes(query) || "warehouse".includes(query) || "data".includes(query) || "hub".includes(query)) {
      matchingExtensions.push({ id: "dl_engine", name: "📦 Warehouse Central Hub", tab: "home" });
    }
    if ("desktop ledger syncer cross-platform configurations multi-merchant accounts hub".includes(query) || "ledger".includes(query) || "syncer".includes(query)) {
      matchingExtensions.push({ id: "dl_syncer", name: "🔄 Desktop Ledger Syncer", tab: "home" });
    }
  }

  const matchingNews = (rawNewsItems || []).filter(newsItem => query && (
    (newsItem.title || "").toLowerCase().includes(query) ||
    (newsItem.summary || "").toLowerCase().includes(query) ||
    (newsItem.fullText || "").toLowerCase().includes(query) ||
    (newsItem.author || "").toLowerCase().includes(query) ||
    (newsItem.authorName || "").toLowerCase().includes(query)
  )).slice(0, 2);

  const matchingInventory = (rawInventoryItems || []).filter(item => query && (
    (item.name || "").toLowerCase().includes(query) ||
    (item.brand || "").toLowerCase().includes(query) ||
    (item.category || "").toLowerCase().includes(query)
  )).slice(0, 3);

  const matchingAds = (rawAdItems || []).filter(adItem => query && (
    (adItem.title || "").toLowerCase().includes(query) ||
    (adItem.description || "").toLowerCase().includes(query)
  )).slice(0, 2);

  const hasPredictions = query.length > 0 && (
    matchingExtensions.length > 0 || 
    matchingNews.length > 0 || 
    matchingInventory.length > 0 ||
    matchingAds.length > 0
  );
  const handlePredictionClick = (targetTab, elementId = null) => {
    setActiveTab(targetTab);
    setShowPredictions(false);

    if (elementId) {
      setTimeout(() => {
        const targetElement = document.getElementById(elementId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetElement.style.transition = 'all 0.4s ease';
          const originalBg = targetElement.style.backgroundColor || 'transparent';
          targetElement.style.backgroundColor = 'rgba(37, 99, 235, 0.12)';
          setTimeout(() => { targetElement.style.backgroundColor = originalBg; }, 1200);
        }
      }, 300);
    }
  };
  return (
    <header className="dashboard-header">
      <div className="header-left-group">
        <h1 className="header-logo" onClick={() => setActiveTab('home')} style={{ cursor: 'pointer' }}>
          StockMaster
        </h1>
        <ul className="nav-links-row">
          <li><button className={activeTab === 'home' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveTab('home')}>🏠 Home</button></li>
          <li><button className={activeTab === 'items' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveTab('items')}>📦 Inventory Items</button></li>
          <li><button className={activeTab === 'profile_tab' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveTab('profile_tab')}>👤 Profile Account</button></li>
          <li><button className={activeTab === 'settings' ? 'nav-btn active' : 'nav-btn'} onClick={() => setActiveTab('settings')}>⚙️ Settings</button></li>
        </ul>
      </div>

      <div className={`advanced-search-bar ${searchOpen ? "open" : ""}`} style={{ position: 'relative', overflow: 'visible' }} ref={dropdownRef}>
        <button type="button" className="search-toggle" onClick={() => setSearchOpen(!searchOpen)}>
          <Search size={18} />
          {!searchOpen && <span>Search</span>}
        </button>
        <input 
          type="text" 
          placeholder="Universal platform search..." 
          value={globalSearchQuery || ""} 
          onChange={(e) => { setGlobalSearchQuery(e.target.value); setShowPredictions(true); }} 
          onFocus={() => setShowPredictions(true)}
          className="search-input" 
        />
        {showPredictions && hasPredictions && (
          <div 
            className="search-predictions-dropdown" 
            style={{ 
              position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: '280px',             
              backgroundColor: '#ffffff', border: '1px solid var(--border-color, #cbd5e1)',
              borderRadius: '16px', boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.12), 0 8px 16px -6px rgba(0, 0, 0, 0.08)', 
              zIndex: 999999, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px',                
              maxHeight: '345px', overflowY: 'auto'
            }}
          >
            {matchingExtensions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', paddingBottom: '4px', borderBottom: '1px dashed #f1f5f9' }}>Matching System Tools</div>
                {matchingExtensions.map(ext => (
                  <div key={ext.id} onClick={() => handlePredictionClick(ext.tab)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px 0', cursor: 'pointer', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: '#1e293b', fontWeight: '500' }}>{ext.name}</span>
                    <span style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: '600', marginTop: '2px' }}>Navigate ➔</span>
                  </div>
                ))}
              </div>
            )}

            {matchingNews.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', paddingBottom: '4px', borderBottom: '1px dashed #f1f5f9' }}>Matching News Stream</div>
                {matchingNews.map(news => (
                  <div key={news._id} onClick={() => handlePredictionClick('home', `news-card-${news._id}`)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px 0', cursor: 'pointer', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: '#1e293b', fontWeight: '600' }}>📢 {news.title}</span>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{news.summary}</span>
                    <span style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: '600', marginTop: '2px' }}>Read Article ➔</span>
                  </div>
                ))}
              </div>
            )}

            {matchingInventory.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', paddingBottom: '4px', borderBottom: '1px dashed #f1f5f9' }}>Matching Warehouse Catalog Items</div>
                {matchingInventory.map(item => (
                  <div key={item._id} onClick={() => handlePredictionClick('items', `inventory-item-${item._id}`)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px 0', cursor: 'pointer', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: '#1e293b', fontWeight: '600' }}>🛠️ {item.name}</span>
                    <span style={{ fontSize: '0.7rem', color: '#475569' }}>Brand: {item.brand || 'Generic'}</span>
                    <strong style={{ color: '#10b981', fontSize: '0.8rem', marginTop: '2px' }}>${parseFloat(item.price || 0).toFixed(2)}</strong>
                  </div>
                ))}
              </div>
            )}

            {matchingAds.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', paddingBottom: '4px', borderBottom: '1px dashed #f1f5f9' }}>Matching Campaigns</div>
                {matchingAds.map(ad => (
                  <div key={ad._id} onClick={() => handlePredictionClick('home', `ad-banner-${ad._id}`)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px 0', cursor: 'pointer', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: '#1e293b', fontWeight: '600' }}>🎯 {ad.title}</span>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ad.description}</span>
                    <span style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: '600', marginTop: '2px' }}>View Promo ➔</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="navbar-profile-container">
        <button className={`profile-trigger-element ${showProfile ? 'active' : ''}`} onClick={() => setShowProfile(!showProfile)}>
          <div className="profile-trigger-avatar-sphere">
            {user?.profileImage ? ( <img src={`http://localhost:5000${user.profileImage}`} alt="User Profile" /> ) : ( <span>{(user?.firstName || user?.username || "U").charAt(0).toUpperCase()}</span> )}
          </div>
          <span className="profile-trigger-text-wrapper">Hi, {user?.firstName || user?.username || 'Operator'}</span>
          <svg className={`profile-trigger-arrow-icon ${showProfile ? 'active' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>

        {showProfile && (
          <div className="profile-overlay-dropdown-card fade-in">
            <div className="profile-dropdown-avatar-large">
              {user?.profileImage ? ( <img src={`http://localhost:5000${user.profileImage}`} alt="Avatar" /> ) : ( <span>{(user?.firstName || user?.username || "U").charAt(0).toUpperCase()}</span> )}
            </div>
            <div className="profile-dropdown-text-pane">
              <div className="profile-dropdown-fullname">{user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.username}</div>
              <div className="profile-dropdown-email-meta">{user?.email || `${user?.username || 'user'}@stockmaster.net`}</div>
            </div>
            <div className="dropdown-wishlist-viewport-flex-pane">
              <div className="dropdown-wishlist-header-row-container">
                <h5 className="dropdown-snippet-section-title">Wishlist Snippet ({wishlist?.length || 0})</h5>
                {wishlist?.length > 0 && ( <button className="dropdown-wishlist-quick-shortcut-view-all-link" onClick={() => { setActiveTab('profile_tab'); setShowProfile(false); }}>View All</button> )}
              </div>
              {(!wishlist || wishlist.length === 0) ? ( <p className="dropdown-wishlist-stale-empty-msg">No saved bookmarks found.</p> ) : (
                <ul className="dropdown-wishlist-list-scroller-node">
                  {wishlist.slice(0, 3).map((wItem) => (
                    <li key={wItem._id} className="dropdown-wishlist-miniature-card-row">
                      <span className="dropdown-wishlist-item-title-truncate">{wItem.name}</span>
                      <div className="dropdown-wishlist-price-action-right-group">
                        <strong className="dropdown-wishlist-green-cost-text">${parseFloat(wItem.price || 0).toFixed(2)}</strong>
                        <button className="dropdown-wishlist-miniature-card-cancel-cross-btn" onClick={(e) => { e.stopPropagation(); triggerToggleWishlist(wItem); }}>✕</button>
                      </div>
                    </li>
                  ))}
                  {wishlist.length > 3 && <li className="dropdown-wishlist-overflow-counter-row">+ {wishlist.length - 3} more items bookmarked</li>}
                </ul>
              )}
            </div>
            <div className="profile-dropdown-action-rows-group">
              <button onClick={() => { setActiveTab('profile_tab'); setShowProfile(false); }} className="dropdown-utility-navigation-row-btn">👤 Manage Shipping & Profile Details</button>
              <button onClick={logout} className="dropdown-destructive-logout-session-btn">End Account Session</button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default ContainerHeader;
