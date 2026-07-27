// src/pages/AdminBroadcastConsole.jsx
import React, { useState, useEffect } from 'react';

/* =========================================================================
   1. CENTRAL NEWS FEED BROADCASTER (For HomePage Center Grid)
   ========================================================================= */
export const AdminBroadcastConsole = ({
  croppedNewsFile, setCroppedNewsFile, newsPreviewUrl, setNewsPreviewUrl, setIsNewsCropOpen, loadNewsFeed, themeTransition
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let t; if (success) t = setTimeout(() => { setSuccess(''); setIsOpen(false); }, 2200);
    return () => clearTimeout(t);
  }, [success]);

  return (
    <article className="panel-card home-feed-item-card" style={{ background: 'var(--bg-card, transparent)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '16px', padding: '12px', transition: themeTransition, width: '100%' }}>
      <details open={isOpen} onToggle={(e) => setIsOpen(e.target.open)} style={{ width: '100%' }}>
        <summary style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary-accent, #4f46e5)', cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', userSelect: 'none' }}>
          <span>⚙️ Admin Portal: Broadcast Live News Feed Bulletin</span>
          {isOpen && <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(false); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', marginLeft: 'auto', padding: '0 8px' }}>✕</button>}
        </summary>
        {success && <div style={{ marginTop: '12px', padding: '10px', background: '#d1fae5', color: '#065f46', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600' }}>{success}</div>}
        <form onSubmit={(e) => {
          e.preventDefault(); const f = new FormData(e.target); if (croppedNewsFile) f.append('image', croppedNewsFile);
          fetch('http://localhost:5000/content/news', { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: f })
            .then(() => { setCroppedNewsFile(null); setNewsPreviewUrl(null); e.target.reset(); loadNewsFeed(); setSuccess('🚀 News published! Closing...'); });
        }} style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input type="text" name="title" placeholder="Article Title..." required style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', background: 'var(--bg-input, #ffffff)', color: 'var(--text-primary, #0f172a)', fontSize: '0.8rem', outline: 'none' }} />
          <input type="text" name="summary" placeholder="Short summary narrative statement..." required style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', background: 'var(--bg-input, #ffffff)', color: 'var(--text-primary, #0f172a)', fontSize: '0.8rem', outline: 'none' }} />
          <input type="text" name="fullText" placeholder="Full expanded body text..." style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', background: 'var(--bg-input, #ffffff)', color: 'var(--text-primary, #0f172a)', fontSize: '0.8rem', outline: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button type="button" onClick={() => setIsNewsCropOpen(true)} style={{ padding: '8px 12px', background: 'var(--bg-btn-secondary, #f1f5f9)', color: 'var(--text-secondary, #475569)', border: '1px solid var(--border-color, #cbd5e1)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>📷 Attach Graphics</button>
            {newsPreviewUrl && <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: '600' }}>✓ Media Loaded</span>}
          </div>
          <button type="submit" style={{ padding: '10px', background: 'var(--primary-button, #3b82f6)', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' }}>Publish Stream To Dashboard</button>
        </form>
      </details>
    </article>
  );
};

/* =========================================================================
   2. SOFTWARE BUILD INDEXER (For placement inside LeftSidebar)
   ========================================================================= */
export const AdminSoftwareConsole = ({ handleSaveApp, loadSoftwareCatalog, themeTransition }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let t; if (success) t = setTimeout(() => { setSuccess(''); setIsOpen(false); }, 2200);
    return () => clearTimeout(t);
  }, [success]);

  return (
    <article className="panel-card sidebar-admin-node" style={{ background: 'var(--bg-card, transparent)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '10px', transition: themeTransition, width: '100%', marginBottom: '14px' }}>
      <details open={isOpen} onToggle={(e) => setIsOpen(e.target.open)} style={{ width: '100%' }}>
        <summary style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--primary-accent, #4f46e5)', cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', userSelect: 'none' }}>
          <span>⚙️ Add Software</span>
          {isOpen && <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(false); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', marginLeft: 'auto' }}>✕</button>}
        </summary>
        {success && <div style={{ marginTop: '8px', padding: '8px', background: '#d1fae5', color: '#065f46', borderRadius: '6px', fontSize: '0.75rem' }}>{success}</div>}
        <form onSubmit={(e) => {
          e.preventDefault();
          const data = { name: e.target.name.value, version: e.target.version.value, developer: e.target.developer.value };
          handleSaveApp(data).then(() => { e.target.reset(); if (typeof loadSoftwareCatalog === 'function') loadSoftwareCatalog(); setSuccess('🚀 Indexed! Closing...'); });
        }} style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input type="text" name="name" placeholder="Package Name..." required style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color, #cbd5e1)', background: 'var(--bg-input, #ffffff)', color: 'var(--text-primary, #0f172a)', fontSize: '0.75rem', outline: 'none' }} />
          <input type="text" name="version" placeholder="Version Build..." required style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color, #cbd5e1)', background: 'var(--bg-input, #ffffff)', color: 'var(--text-primary, #0f172a)', fontSize: '0.75rem', outline: 'none' }} />
          <input type="text" name="developer" placeholder="Distributor..." required style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color, #cbd5e1)', background: 'var(--bg-input, #ffffff)', color: 'var(--text-primary, #0f172a)', fontSize: '0.75rem', outline: 'none' }} />
          <button type="submit" style={{ padding: '8px', background: 'var(--primary-button, #3b82f6)', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>Commit Build</button>
        </form>
      </details>
    </article>
  );
};
// CONTINUATION OF FILE: src/pages/AdminBroadcastConsole.jsx

/* =========================================================================
   3. ADVERTISEMENT CAMPAIGN MANAGER (For placement inside RightSidebar)
   ========================================================================= */
export const AdminAdConsole = ({
  croppedAdFile, setCroppedAdFile, adPreviewUrl, setAdPreviewUrl, setIsAdCropOpen, loadAdBanners, themeTransition
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let t; if (success) t = setTimeout(() => { setSuccess(''); setIsOpen(false); }, 2200);
    return () => clearTimeout(t);
  }, [success]);

  return (
    <article className="panel-card sidebar-admin-node" style={{ background: 'var(--bg-card, transparent)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px', padding: '10px', transition: themeTransition, width: '100%', marginBottom: '14px' }}>
      <details open={isOpen} onToggle={(e) => setIsOpen(e.target.open)} style={{ width: '100%' }}>
        <summary style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--primary-accent, #4f46e5)', cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', userSelect: 'none' }}>
          <span>⚙️ Launch Campaign Promo</span>
          {isOpen && <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(false); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', marginLeft: 'auto' }}>✕</button>}
        </summary>
        {success && <div style={{ marginTop: '8px', padding: '8px', background: '#d1fae5', color: '#065f46', borderRadius: '6px', fontSize: '0.75rem' }}>{success}</div>}
        <form onSubmit={(e) => {
          e.preventDefault(); const f = new FormData(e.target); if (croppedAdFile) f.append('image', croppedAdFile);
          fetch('http://localhost:5000/content/ads', { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: f })
            .then(() => { setCroppedAdFile(null); setAdPreviewUrl(null); e.target.reset(); loadAdBanners(); setSuccess('🚀 Ad live! Closing...'); });
        }} style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input type="text" name="title" placeholder="Campaign Title..." required style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color, #cbd5e1)', background: 'var(--bg-input, #ffffff)', color: 'var(--text-primary, #0f172a)', fontSize: '0.75rem', outline: 'none' }} />
          <input type="text" name="description" placeholder="Marketing description..." required style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border-color, #cbd5e1)', background: 'var(--bg-input, #ffffff)', color: 'var(--text-primary, #0f172a)', fontSize: '0.75rem', outline: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button type="button" onClick={() => setIsAdCropOpen(true)} style={{ padding: '6px 10px', background: 'var(--bg-btn-secondary, #f1f5f9)', color: 'var(--text-secondary, #475569)', border: '1px solid var(--border-color, #cbd5e1)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: '600' }}>📷 Graphics</button>
            {adPreviewUrl && <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: '600' }}>✓ Loaded</span>}
          </div>
          <button type="submit" style={{ padding: '8px', background: 'var(--primary-button, #3b82f6)', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>Publish Active Campaign</button>
        </form>
      </details>
    </article>
  );
};
