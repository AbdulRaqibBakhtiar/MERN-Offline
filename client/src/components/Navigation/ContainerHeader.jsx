import UserAvatar from '../Layout/UserAvatar';
import React, { useState, useEffect, useRef } from 'react';
import { Search, Sun, Moon, House, Newspaper, ShoppingBag, Info, X, ArrowUpRight, Package, Megaphone, FileText } from 'lucide-react';
import api from '../../api/axios';

function ContainerHeader({
  activeTab,
  setActiveTab,
  searchOpen,
  setSearchOpen,
  globalSearchQuery,
  setGlobalSearchQuery,
  setInventorySearchQuery,
  setSearchCategory,
  setArticleSearchQuery,
  user,
  showProfile,
  setShowProfile,
  wishlist,
  triggerToggleWishlist,
  logout,
  rawInventoryItems = [],
  rawNewsItems = [],
  rawArticleItems = [],
  rawAdItems = [],
  theme = 'light',
  setTheme
}) {
  const [showPredictions, setShowPredictions] = useState(false);
  const [articleItems, setArticleItems] = useState(rawArticleItems);
  const [articlesLoaded, setArticlesLoaded] = useState(rawArticleItems.length > 0);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchExpanded = Boolean(searchOpen || showPredictions);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowPredictions(false);
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [setSearchOpen]);
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);
  useEffect(() => {
    if (!searchExpanded || articlesLoaded) return;
    api.get('/articles').then(response => {
      setArticleItems(Array.isArray(response.data) ? response.data : []);
      setArticlesLoaded(true);
    }).catch(() => setArticlesLoaded(true));
  }, [searchExpanded, articlesLoaded]);
  const query = (globalSearchQuery || "").toLowerCase().trim();

  const matchingNews = (rawNewsItems || []).filter(newsItem => query && (
    (newsItem.title || "").toLowerCase().includes(query) ||
    (newsItem.summary || "").toLowerCase().includes(query) ||
    (newsItem.fullText || "").toLowerCase().includes(query) ||
    (newsItem.author || "").toLowerCase().includes(query) ||
    (newsItem.authorName || "").toLowerCase().includes(query)
  )).slice(0, 2);

  const matchingArticles = articleItems.filter(article => {
    const isVisibleToUser = article.status === 'published' || user?.role === 'admin' || String(article.editor?._id || article.editor) === String(user?._id || user?.id);
    const content = (article.contents || []).map(block => `${block.text || ''} ${block.caption || ''} ${block.url || ''}`).join(' ');
    return query.length > 1 && isVisibleToUser && [article.title, article.summary, content].some(value => (value || '').toLowerCase().includes(query));
  }).slice(0, 3);

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
    matchingArticles.length > 0 ||
    matchingNews.length > 0 || 
    matchingInventory.length > 0 ||
    matchingAds.length > 0
  );
  const handlePredictionClick = (targetTab, elementId = null, preserveArticleSearch = false) => {
    setActiveTab(targetTab);
    setShowPredictions(false);
    setSearchOpen(false);
    if (targetTab === 'articles' && !preserveArticleSearch) setArticleSearchQuery?.('');

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
  const selectInventoryResult = () => {
    setInventorySearchQuery?.(query);
    setSearchCategory?.('all');
    handlePredictionClick('items');
  };
  const selectArticleResult = () => {
    setArticleSearchQuery?.(query);
    handlePredictionClick('articles', null, true);
  };
  const openSearch = () => {
    if (searchExpanded) {
      setShowPredictions(false);
      setSearchOpen(false);
      searchInputRef.current?.blur();
      return;
    }
    setSearchOpen(true);
    setShowPredictions(true);
  };
  return (
    <header className="dashboard-header">
      <div className="header-left-group">
        <button type="button" className="header-brand" onClick={() => setActiveTab('home')} aria-label="Bazzar home">
          <span className="header-brand-mark"><ShoppingBag size={19} /></span><span>Bazzar</span>
        </button>
        <nav aria-label="Main navigation">
          <ul className="nav-links-row">
            {[['home', 'Home', House], ['items', 'Marketplace', ShoppingBag], ['articles', 'Articles', Newspaper], ['about', 'About', Info]].map(([tab, label, Icon]) => <li key={tab}><button type="button" className={activeTab === tab || (tab === 'items' && activeTab === 'purchase_item') ? 'nav-btn active' : 'nav-btn'} onClick={() => { if (tab === 'articles') setArticleSearchQuery?.(''); setActiveTab(tab); }} aria-current={activeTab === tab ? 'page' : undefined} title={label}><Icon size={16} /><span>{label}</span></button></li>)}
          </ul>
        </nav>
      </div>

      <div className={`advanced-search-bar ${searchExpanded ? 'open' : ''}`} ref={dropdownRef}>
        <button type="button" className="search-toggle" onClick={openSearch} aria-label={searchExpanded ? 'Close search' : 'Open search'}>
          {searchExpanded ? <X size={17} /> : <Search size={18} />}
        </button>
        <input
          ref={searchInputRef}
          type="search"
          placeholder="Search Bazzar"
          value={globalSearchQuery || ''}
          tabIndex={searchExpanded ? 0 : -1}
          aria-label="Search updates and marketplace listings"
          onChange={event => { setGlobalSearchQuery(event.target.value); setShowPredictions(true); }}
          onFocus={() => { setShowPredictions(true); setSearchOpen(true); }}
          onKeyDown={event => { if (event.key === 'Escape') { setShowPredictions(false); setSearchOpen(false); searchInputRef.current?.blur(); } }}
          className="search-input"
        />
        {searchExpanded && <div className="search-predictions-dropdown" role="region" aria-label="Search suggestions">
          {!query ? <>
            <div className="search-panel-heading"><div><span>QUICK LINKS</span><strong>What are you looking for?</strong></div></div>
            <div className="search-quick-links">
              <button type="button" onClick={() => handlePredictionClick('items')}><ShoppingBag size={17} /><span>Browse marketplace</span><ArrowUpRight size={14} /></button>
              <button type="button" onClick={() => handlePredictionClick('articles')}><Newspaper size={17} /><span>Read articles</span><ArrowUpRight size={14} /></button>
              <button type="button" onClick={() => handlePredictionClick('home')}><House size={17} /><span>Latest updates</span><ArrowUpRight size={14} /></button>
            </div>
            <p className="search-panel-hint">Search products, brands, categories, or updates</p>
          </> : <>
            <div className="search-panel-heading"><div><span>SEARCH RESULTS</span><strong>For “{globalSearchQuery.trim()}”</strong></div><span className="search-result-count">{matchingInventory.length + matchingArticles.length + matchingNews.length + matchingAds.length} found</span></div>
            {matchingInventory.length > 0 && <section className="search-result-group"><h3><ShoppingBag size={14} /> Marketplace</h3>{matchingInventory.map(item => <button className="search-result-row" type="button" key={item._id} onClick={selectInventoryResult}><span className="search-result-icon"><Package size={17} /></span><span className="search-result-copy"><strong>{item.name}</strong><small>{item.brand || item.category || 'Marketplace item'}</small></span><span className="search-result-price">${Number(item.price || 0).toFixed(2)}</span></button>)}</section>}
            {matchingArticles.length > 0 && <section className="search-result-group"><h3><FileText size={14} /> Articles</h3>{matchingArticles.map(article => <button className="search-result-row" type="button" key={article._id} onClick={selectArticleResult}><span className="search-result-icon"><FileText size={17} /></span><span className="search-result-copy"><strong>{article.title}</strong><small>{article.summary || 'Community article'}</small></span><ArrowUpRight size={15} className="search-result-arrow" /></button>)}</section>}
            {matchingNews.length > 0 && <section className="search-result-group"><h3><Newspaper size={14} /> Updates</h3>{matchingNews.map(news => <button className="search-result-row" type="button" key={news._id} onClick={() => handlePredictionClick('home', `news-card-${news._id}`)}><span className="search-result-icon"><Newspaper size={17} /></span><span className="search-result-copy"><strong>{news.title}</strong><small>{news.summary || news.authorName || 'Community update'}</small></span><ArrowUpRight size={15} className="search-result-arrow" /></button>)}</section>}
            {matchingAds.length > 0 && <section className="search-result-group"><h3><Megaphone size={14} /> Promotions</h3>{matchingAds.map(ad => <button className="search-result-row" type="button" key={ad._id} onClick={() => handlePredictionClick('home', `ad-banner-${ad._id}`)}><span className="search-result-icon"><Megaphone size={17} /></span><span className="search-result-copy"><strong>{ad.title}</strong><small>{ad.description || 'Featured promotion'}</small></span><ArrowUpRight size={15} className="search-result-arrow" /></button>)}</section>}
            {!hasPredictions && <div className="search-no-results"><Search size={19} /><strong>{!articlesLoaded ? 'Searching Bazzar…' : 'No matches found'}</strong><span>{!articlesLoaded ? 'Checking articles and marketplace content.' : 'Try a product name, brand, or a different search.'}</span></div>}
          </>}
        </div>}
      </div>
      <div className="navbar-profile-container">
        <button type="button" className="navbar-theme-toggle" aria-label={`Switch to ${theme === 'light' ? 'night' : 'day'} mode`} title={theme === 'light' ? 'Switch to night mode' : 'Switch to day mode'} onClick={() => setTheme?.(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? <Sun size={14} aria-hidden="true" /> : <Moon size={14} aria-hidden="true" />}
        </button>
        <button className={`profile-trigger-element ${showProfile ? 'active' : ''}`} onClick={() => setShowProfile(!showProfile)} aria-label="Open account menu" aria-expanded={showProfile} title={`Account menu for ${user?.firstName || user?.username || 'member'}`}>
          <div className="profile-trigger-avatar-sphere"><UserAvatar person={user} className="navbar-user-avatar" /></div>
          <span className="profile-trigger-text-wrapper">Hi, {user?.firstName || user?.username || 'User'}</span>
          <svg className={`profile-trigger-arrow-icon ${showProfile ? 'active' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>

        {showProfile && (
          <div className="profile-overlay-dropdown-card fade-in">
            <div className="profile-dropdown-avatar-large"><UserAvatar person={user} className="navbar-user-avatar" /></div>
            <div className="profile-dropdown-text-pane">
              <div className="profile-dropdown-fullname">{user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.username}</div>
              <div className="profile-dropdown-email-meta">{user?.email || 'Bazzar member'}</div>
              {user?.role === 'admin' && <span className="profile-dropdown-role-badge">Administrator</span>}
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
