// src/components/Dashboard/RightSidebar.jsx
import React, { useState, useEffect } from 'react';

function RightSidebar({ 
  liveAd = [], editingAdId, setEditingAdId, editAdPreviewUrl, setIsEditAdCropOpen, 
  editAdTitle, setEditAdTitle, editAdDescription, setEditAdDescription, executeAdSave, 
  activeAdMenuId, setActiveAdMenuId, startEditingAd, openDeleteModal, setSearchCategory, 
  hoveredBtnId, setHoveredBtnId, croppedAdFile, setCroppedAdFile, adPreviewUrl, 
  setAdPreviewUrl, setIsAdCropOpen, loadAdBanners 
}) {
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');

  const sidebarTransition = 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease';

  // ⏱️ AUTOMATIC CLOSE: Collapses the ribbon console 2.2s after a campaign injection success
  useEffect(() => {
    let countdown;
    if (successBanner) {
      countdown = setTimeout(() => {
        setSuccessBanner('');
        setIsConsoleOpen(false);
      }, 2200);
    }
    return () => clearTimeout(countdown);
  }, [successBanner]);

  return (
    <aside className="grid-right" style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '14px', transition: sidebarTransition }}>
      
      {/* ⚙️ RESTORED ADMIN CONSOLE: Placed directly at the top of the Right Sidebar */}
      <article className="panel-card sponsorship-card" style={{ background: 'var(--bg-card, transparent)', border: '2px solid rgba(37, 99, 235, 0.35)', borderRadius: '16px', padding: '12px', boxSizing: 'border-box', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)', transition: sidebarTransition }}>
        <details className="admin-details-panel" open={isConsoleOpen} onToggle={(e) => setIsConsoleOpen(e.target.open)} style={{ width: '100%' }}>
          
          <summary style={{ fontSize: '0.82rem', fontWeight: '800', color: '#2563eb', cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}>
            <span>⚙️ Admin Panel: New Ad Banner</span>
            {isConsoleOpen && (
              <button 
                type="button" 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsConsoleOpen(false); }}
                style={{ background: 'transparent', border: 'none', color: '#ef4444', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', padding: '0 4px', marginLeft: 'auto' }}
              >✕</button>
            )}
          </summary>

          {successBanner && (
            <div style={{ marginTop: '10px', padding: '8px 10px', background: '#d1fae5', color: '#065f46', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700' }}>
              {successBanner}
            </div>
          )}

          <form onSubmit={(e) => {
            e.preventDefault(); const formData = new FormData(e.target); if (croppedAdFile) formData.append('image', croppedAdFile);
            fetch('http://localhost:5000/content/ads', { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: formData })
              .then(() => { setCroppedAdFile(null); setAdPreviewUrl(null); e.target.reset(); loadAdBanners(); setSuccessBanner('🚀 Ad campaign injected successfully!'); });
          }} className="admin-upload-form" style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input type="text" name="title" placeholder="Ad Title..." required style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color, rgba(100, 116, 139, 0.25))', background: 'var(--bg-input, transparent)', color: 'var(--text-primary, inherit)', fontSize: '0.8rem', boxSizing: 'border-box' }} className="input-field" />
            <input type="text" name="description" placeholder="Ad copy lines..." required style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color, rgba(100, 116, 139, 0.25))', background: 'var(--bg-input, transparent)', color: 'var(--text-primary, inherit)', fontSize: '0.8rem', boxSizing: 'border-box' }} className="input-field" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button type="button" onClick={() => setIsAdCropOpen(true)} style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-btn-secondary, rgba(100, 116, 139, 0.05))', border: '1px solid var(--border-color, rgba(100, 116, 139, 0.25))', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer', color: 'var(--text-primary, inherit)', transition: sidebarTransition }}>📷 Configure Graphic</button>
              {adPreviewUrl && <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: '700' }}>✓ Staged</span>}
            </div>
            <button type="submit" style={{ background: '#10b981', padding: '10px', fontSize: '0.82rem', fontWeight: '800', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}>Inject Ad Campaign</button>
          </form>

        </details>
      </article>
      {/* 📊 CORE PANEL CARD HOUSING THE ADS FEED */}
      <div style={{ background: 'var(--bg-card, transparent)', border: '2px solid rgba(37, 99, 235, 0.35)', borderRadius: '16px', padding: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)', transition: sidebarTransition }} className="panel-card sponsorship-card">
        <span style={{ fontSize: '0.75rem', fontWeight: '900', color: 'inherit', opacity: 0.6, letterSpacing: '0.06em', display: 'block', marginBottom: '14px', textTransform: 'uppercase' }}>SPONSORED LINKS FEED</span>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} className="ads-feed-container">
          {liveAd.length === 0 ? (
            <div style={{ padding: '24px', background: 'var(--bg-main, #ffffff)', borderRadius: '12px', border: '1px solid var(--border-color, rgba(100, 116, 139, 0.25))', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', transition: sidebarTransition }} className="ad-banner-box tall-ad">
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.92rem', fontWeight: '800', color: 'var(--text-primary, #0f172a)' }}>Upgrade to Pro Suite</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary, #475569)', lineHeight: '1.45', fontWeight: '500' }}>Unlock predictive automated warehouse metrics logs.</p>
            </div>
          ) : (
            liveAd.map((adItem) => {
              const isEditing = editingAdId === adItem._id;

              return (
                <div key={adItem._id} style={{ padding: '14px', border: '1px solid var(--border-color, rgba(100, 116, 139, 0.25))', borderRadius: '12px', background: 'var(--bg-main, #ffffff)', color: 'var(--text-primary, #0f172a)', position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', transition: sidebarTransition }} className="ad-banner-box tall-ad">
                  
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ height: 'auto', width: '100%', borderRadius: '8px', overflow: 'hidden', background: 'rgba(100, 116, 139, 0.05)', border: '1px solid var(--border-color, rgba(100, 116, 139, 0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {editAdPreviewUrl ? (
                          <img src={editAdPreviewUrl} alt="Preview" style={{ width: '100%', height: 'auto', objectFit: 'cover', display: 'block' }} />
                        ) : adItem.imagePath ? (
                          <img src={`http://localhost:5000${adItem.imagePath}`} alt="Current" style={{ width: '100%', height: 'auto', objectFit: 'cover', display: 'block' }} />
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)', padding: '16px 0' }}>No Image Staged</span>
                        )}
                      </div>
                      
                      <button type="button" onClick={() => setIsEditAdCropOpen(true)} style={{ padding: '6px', fontSize: '0.75rem', background: 'var(--bg-btn-secondary, rgba(100, 116, 139, 0.08))', border: '1px solid var(--border-color, rgba(100, 116, 139, 0.25))', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-secondary, #475569)', fontWeight: '700', transition: sidebarTransition }}>📷 Swap Photo Asset</button>
                      <input type="text" value={editAdTitle} onChange={(e) => setEditAdTitle(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color, rgba(100, 116, 139, 0.25))', background: 'var(--bg-input, transparent)', color: 'var(--text-primary, #0f172a)', fontSize: '0.82rem', fontWeight: '700', outline: 'none', transition: sidebarTransition }} />
                      <input type="text" value={editAdDescription} onChange={(e) => setEditAdDescription(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color, rgba(100, 116, 139, 0.25))', background: 'var(--bg-input, transparent)', color: 'var(--text-secondary, #475569)', fontSize: '0.82rem', outline: 'none', transition: sidebarTransition }} />
                      
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button type="button" onClick={() => executeAdSave(adItem._id, adItem)} style={{ padding: '8px', background: '#10b981', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', flex: 1, fontWeight: '700', cursor: 'pointer' }}>Save</button>
                        <button type="button" onClick={() => setEditingAdId(null)} style={{ padding: '8px', background: 'transparent', border: '1px solid var(--border-color, rgba(100, 116, 139, 0.25))', color: 'var(--text-secondary, #475569)', borderRadius: '6px', fontSize: '0.78rem', flex: 1, fontWeight: '700', cursor: 'pointer', transition: sidebarTransition }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <React.Fragment>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }} className="home-card-header-flex-row">
                        <h4 style={{ color: '#2563eb', margin: 0, fontSize: '0.95rem', fontWeight: '900', letterSpacing: '-0.01em' }}>{adItem.title}</h4>
                        <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                          <button type="button" aria-label="Open ad administration context dropdown menu" onClick={(e) => { e.stopPropagation(); setActiveAdMenuId(activeAdMenuId === adItem._id ? null : adItem._id); }} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#94a3b8', cursor: 'pointer', padding: '0 2px' }}>⋮</button>
                          
                          {activeAdMenuId === adItem._id && (
                            <div style={{ position: 'absolute', top: '100%', right: 0, background: 'var(--bg-card, #ffffff)', border: '1px solid var(--border-color, rgba(100, 116, 139, 0.25))', borderRadius: '12px', boxShadow: '0 12px 30px rgba(0,0,0,0.15)', padding: '4px', minWidth: '140px', zIndex: 60 }}>
                              <button type="button" onClick={(e) => { e.stopPropagation(); startEditingAd(adItem); setActiveAdMenuId(null); }} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-primary, #334155)', fontWeight: '700', borderRadius: '6px' }} onMouseEnter={(e) => e.target.style.background = 'var(--bg-main, rgba(37, 99, 235, 0.08))'} onMouseLeave={(e) => e.target.style.background = 'none'}>⚙️ Edit Banner</button>
                              <button type="button" onClick={(e) => { e.stopPropagation(); setSearchCategory("ads"); openDeleteModal(adItem._id); setActiveAdMenuId(null); }} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#ef4444', fontWeight: '800', borderRadius: '6px' }} onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.08)'} onMouseLeave={(e) => e.target.style.background = 'none'}>🗑️ Clear Ad</button>
                            </div>
                          )}
                        </div>
                      </div>

                      {adItem.imagePath && (
                        <img src={`http://localhost:5000${adItem.imagePath}`} alt="Sponsor Content" style={{ width: '100%', height: 'auto', borderRadius: '8px', marginBottom: '10px', objectFit: 'cover', display: 'block', border: '1px solid var(--border-color, rgba(100, 116, 139, 0.15))' }} />
                      )}

                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #334155)', margin: '0 0 12px 0', lineHeight: '1.5', fontWeight: '600' }}>{adItem.description}</p>
                      
                      <button 
                        type="button" 
                        onClick={() => { alert("Redirecting secure connection tunnel to corporate sponsor node destination..."); window.location.href = "/not-found"; }} 
                        onMouseEnter={() => setHoveredBtnId(`${adItem._id}_ad`)} 
                        onMouseLeave={() => setHoveredBtnId(null)} 
                        style={{ width: '100%', padding: '8px', textAlign: 'center', background: hoveredBtnId === `${adItem._id}_ad` ? 'rgba(37, 99, 235, 0.18)' : 'rgba(37, 99, 235, 0.08)', color: '#2563eb', border: '1px solid rgba(37, 99, 235, 0.25)', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.25s', boxShadow: '0 2px 6px rgba(37,99,235,0.05)' }}
                      >
                        Learn More
                      </button>
                    </React.Fragment>
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>
    </aside>
  );
}

export default RightSidebar;
