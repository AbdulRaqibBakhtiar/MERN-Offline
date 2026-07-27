// src/components/Dashboard/LeftSidebar.jsx
import React, { useState, useEffect } from 'react';
import { Download, PlusCircle, XCircle, CheckCircle, UploadCloud, AlertCircle } from 'lucide-react';
import ImageUploadCrop from '../Modal/ImageUploadCrop';

function LeftSidebar({ 
  totalInventoryValue = 0, lowStockCount = 0, hoveredBtnId, setHoveredBtnId, 
  softwareList = [], loadSoftwareCatalog, handleSaveApp, setDeleteTargetId, 
  openDeleteModal, metricHistory = [] 
}) {
  // Modal layout open toggle flags
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [activeAppMenuId, setActiveAppMenuId] = useState(null);

  // Data target field memory maps
  const [selectedId, setSelectedId] = useState(null);
  const [name, setName] = useState('');
  const [version, setVersion] = useState('v1.0');
  const [description, setDescription] = useState('');
  const [downloadLink, setDownloadLink] = useState('/404');

  // Local thumbnail preview states
  const [croppedFile, setCroppedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Field validation error states
  const [errors, setErrors] = useState({});
  const [successStatus, setSuccessStatus] = useState('');

  // ⏱️ AUTOMATIC CLOSE: Shuts form and clears message banner 2.2 seconds after success
  useEffect(() => {
    let timer;
    if (successStatus) {
      timer = setTimeout(() => {
        setSuccessStatus('');
        setIsFormOpen(false);
      }, 2200);
    }
    return () => clearTimeout(timer);
  }, [successStatus]);
  const handleOpenCreate = () => {
    setSelectedId(null); setName(''); setVersion('v1.0'); setDescription(''); setDownloadLink('/404');
    setCroppedFile(null); setPreviewUrl(null); setErrors({}); setIsFormOpen(true);
  };

  const handleOpenEdit = (app) => {
    setSelectedId(app._id); setName(app.name || ''); setVersion(app.version || 'v1.0');
    setDescription(app.description || ''); setDownloadLink(app.downloadLink || '/404'); setCroppedFile(null);
    if (app.image) {
      const cleanPath = app.image.startsWith('/public') ? app.image : `/public${app.image}`;
      setPreviewUrl(`http://localhost:5000${cleanPath}`);
    } else {
      setPreviewUrl(null);
    }
    setErrors({}); setIsFormOpen(true);
  };

  const handleCropComplete = (file) => {
    setCroppedFile(file); setPreviewUrl(URL.createObjectURL(file)); setIsCropOpen(false);
  };

  const validateFormFields = () => {
    const activeErrors = {}; const versionRegex = /^v\d+\.\d+(\.\d+)?$/;
    if (!name.trim()) activeErrors.name = "Extension title cannot be left blank.";
    if (!version.trim()) { activeErrors.version = "Version string node required."; }
    else if (!versionRegex.test(version.trim())) { activeErrors.version = "Use structure like v1.0."; }
    if (!description.trim() || description.trim().length < 15) { activeErrors.description = "Minimum 15 characters required."; }
    setErrors(activeErrors); return Object.keys(activeErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!validateFormFields()) return;
    const payload = { name, version, description, downloadLink: downloadLink.trim() || '/404', slug: name.toLowerCase().trim().replace(/[^a-z0-9_]+/g, '_') };
    if (selectedId) payload._id = selectedId;
    if (typeof handleSaveApp === 'function') {
      try {
        await handleSaveApp(payload, croppedFile);
        setSuccessStatus('🚀 Software configuration committed successfully!');
      } catch (error) {
        console.error("[CRASH] Save sequence failure:", error);
      }
    }
  };
  return (
    <aside className="grid-left-aside" style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '320px' }}>
      <style>{`
        @keyframes pulseDot {
          0% { transform: scale(0.92); opacity: 1; box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.6); }
          70% { transform: scale(1.15); opacity: 0.3; box-shadow: 0 0 0 6px rgba(37, 99, 235, 0); }
          100% { transform: scale(0.92); opacity: 1; box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
        }
      `}</style>
      <div style={{ border: '2px solid var(--border-color)', borderRadius: '20px', padding: '16px', boxShadow: '0 12px 30px -5px rgba(0,0,0,0.15)', transition: 'background-color 0.3s ease, border-color 0.3s ease' }} className="panel-card home-left-sidebar-card">
        <div style={{ textAlign: 'center', borderBottom: '2px solid var(--border-color)', paddingBottom: '12px', marginBottom: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#ffffff', margin: '0 auto 8px auto', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>⚡</div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: '900', color: 'inherit', letterSpacing: '-0.02em', lineHeight: '1.2' }}>StockMaster Hub</h3>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'inherit', opacity: 0.7, fontWeight: '600' }}>Production Tools Catalog</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h4 style={{ margin: 0, fontSize: '0.78rem', color: 'inherit', opacity: 0.6, fontWeight: '800', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Available Extensions</h4>
            <button type="button" aria-label="Deploy new software extension module inline" onClick={handleOpenCreate} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#2563eb', display: 'flex', alignItems: 'center', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
              <PlusCircle size={18} />
            </button>
          </div>
          {successStatus && <div style={{ padding: '8px 10px', background: '#d1fae5', color: '#065f46', borderRadius: '8px', fontSize: '0.72rem', fontWeight: '700', marginBottom: '4px' }}>{successStatus}</div>}
          {isFormOpen && (
            <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{selectedId ? "Modify App Data" : "Deploy Inline Software"}</div>
                <button type="button" onClick={() => setIsFormOpen(false)} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', padding: '0 4px' }}>✕</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <input type="text" placeholder="Application Title" value={name} onChange={e => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: null }); }} style={{ padding: '8px 10px', borderRadius: '6px', border: errors.name ? '2px solid #ef4444' : '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'inherit', fontSize: '0.8rem', outline: 'none' }} />
                {errors.name && <span style={{ color: '#ef4444', fontSize: '0.68rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}><AlertCircle size={11} /> {errors.name}</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <input type="text" placeholder="Version String (v1.0)" value={version} onChange={e => { setVersion(e.target.value); if (errors.version) setErrors({ ...errors, version: null }); }} style={{ padding: '8px 10px', borderRadius: '6px', border: errors.version ? '2px solid #ef4444' : '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'inherit', fontSize: '0.8rem', outline: 'none' }} />
                {errors.version && <span style={{ color: '#ef4444', fontSize: '0.68rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}><AlertCircle size={11} /> {errors.version}</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <textarea placeholder="Description narrative brief..." value={description} onChange={e => { setDescription(e.target.value); if (errors.description) setErrors({ ...errors, description: null }); }} style={{ padding: '8px 10px', borderRadius: '6px', border: errors.description ? '2px solid #ef4444' : '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'inherit', fontSize: '0.8rem', height: '52px', resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: '1.4' }} />
                {errors.description && <span style={{ color: '#ef4444', fontSize: '0.68rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}><AlertCircle size={11} /> {errors.description}</span>}
              </div>
              <input type="text" placeholder="Link Destination (or /404)" value={downloadLink} onChange={(e) => setDownloadLink(e.target.value)} style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'inherit', fontSize: '0.8rem', outline: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button type="button" onClick={() => setIsCropOpen(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '6px 10px', borderRadius: '6px', border: '1px dashed var(--accent-blue)', background: 'var(--bg-main)', color: '#2563eb', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}><UploadCloud size={13} /> {previewUrl ? "Change Logo" : "Upload Icon"}</button>
                {previewUrl && <img src={previewUrl} alt="" style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--border-color)' }} />}
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                <button type="button" onClick={handleSubmit} style={{ flex: 1, padding: '6px', background: '#10b981', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}><CheckCircle size={12} /> Save</button>
                <button type="button" onClick={() => setIsFormOpen(false)} style={{ flex: 1, padding: '6px', background: 'rgba(100,116,139,0.15)', color: 'inherit', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}><XCircle size={12} /> Cancel</button>
              </div>
            </div>
          )}
          <ImageUploadCrop isOpen={isCropOpen} onClose={() => setIsCropOpen(false)} onCropComplete={handleCropComplete} title="Crop Extension Application Icon Logo" />
          {softwareList.map((app) => {
            const isMenuOpen = activeAppMenuId === app._id;
            const computedImagePath = app.image ? (app.image.startsWith('/public') ? app.image : `/public${app.image}`) : null;
            return (
              <div key={app._id} onMouseEnter={() => setHoveredBtnId(app.slug)} onMouseLeave={() => { setHoveredBtnId(null); if (isMenuOpen) setActiveAppMenuId(null); }} style={{ padding: '12px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', transform: hoveredBtnId === app.slug ? 'translateY(-2px)' : 'translateY(0)', boxShadow: hoveredBtnId === app.slug ? '0 8px 20px rgba(0,0,0,.15)' : 'none' }}>
                <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
                  <button type="button" aria-label="Open extension settings drop menu list panel" onClick={(e) => { e.stopPropagation(); setActiveAppMenuId(isMenuOpen ? null : app._id); }} style={{ background: 'none', border: 'none', outline: 'none', boxShadow: 'none', color: 'inherit', opacity: 0.5, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', width: '24px', height: '24px', backgroundColor: isMenuOpen ? 'var(--bg-main)' : 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => { if (!isMenuOpen) e.currentTarget.style.opacity = 0.5; }}>
                    <svg width="4" height="12" viewBox="0 0 4 16" fill="currentColor"><circle cx="2" cy="2" r="2"></circle><circle cx="2" cy="8" r="2"></circle><circle cx="2" cy="14" r="2"></circle></svg>
                  </button>
                  {isMenuOpen && (
                    <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)', minWidth: '120px', display: 'flex', flexDirection: 'column', padding: '4px', zIndex: 99 }}>
                      <button type="button" onClick={(e) => { e.stopPropagation(); handleOpenEdit(app); setActiveAppMenuId(null); }} style={{ padding: '8px 10px', background: 'none', border: 'none', fontSize: '0.78rem', fontWeight: '700', color: 'inherit', cursor: 'pointer', textAlign: 'left', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }} onMouseEnter={(e) => e.target.style.background = 'var(--bg-main)'} onMouseLeave={(e) => e.target.style.background = 'none'}>✍️ Edit Data</button>
                      <button type="button" aria-label="Purge software marketplace link app entirely" onClick={(e) => { e.stopPropagation(); if (typeof setDeleteTargetId === 'function') { setDeleteTargetId(`software_purge:${app._id}`); } else { openDeleteModal(`software_purge:${app._id}`); } setActiveAppMenuId(null); }} style={{ padding: '8px 10px', background: 'none', border: 'none', fontSize: '0.78rem', fontWeight: '700', color: '#ef4444', cursor: 'pointer', textAlign: 'left', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', borderTop: '1px solid rgba(100,116,139,0.1)' }} onMouseEnter={(e) => e.target.style.background = 'rgba(239,68,68,0.08)'} onMouseLeave={(e) => e.target.style.background = 'none'}>🗑️ Delete App</button>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {computedImagePath ? ( <img src={`http://localhost:5000${computedImagePath}`} alt="" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(100,116,139,0.2)' }} /> ) : ( <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>💿</div> )}
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-primary)', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.name}</span>
                  </div>
                  <span style={{ fontSize: '9px', background: app.version?.includes('1.') ? 'rgba(16,185,129,0.15)' : 'rgba(37,99,235,0.15)', color: app.version?.includes('1.') ? '#065f46' : '#2563eb', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>{app.version || 'v1.0'}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4', textAlign: 'left', paddingRight: '12px', fontWeight: '500' }}>{app.description}</p>
                <a href={app.downloadLink} target={app.downloadLink === '/404' ? '_self' : '_blank'} rel="noreferrer" style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px', alignSelf: 'flex-start' }}><Download size={12} strokeWidth={2.5} /> Download Setup</a>
              </div>
            );
          })}
        </div>
        <div style={{ borderTop: '2px dashed rgba(100, 116, 139, 0.2)', paddingTop: '10px' }} className="home-analytics-quick-list">
          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.78rem', color: 'inherit', opacity: 0.6, fontWeight: '800', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Metrics Snapshot</h4>
          {(() => {
            const uniqueDaysMap = {}; const todayStr = new Date().toISOString().split('T')[0];
            (metricHistory || []).forEach(item => {
              const targetDate = item.date || item.createdAt; const dateObj = new Date(targetDate);
              if (!isNaN(dateObj.getTime())) { const calendarKey = dateObj.toISOString().split('T')[0]; uniqueDaysMap[calendarKey] = item; }
            });
            const formattedUniqueList = Object.keys(uniqueDaysMap).sort().slice(-7).map(key => {
              const rawItem = uniqueDaysMap[key]; const dObj = new Date(rawItem.date || rawItem.createdAt);
              const weekdayString = dObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              return { ...rawItem, formattedDate: weekdayString, dateStringKey: key };
            });
            if (formattedUniqueList.length > 0) {
              const graphPoints = formattedUniqueList.map(item => Number(item.totalInventoryValue || 0));
              let maxVal = Math.max(...graphPoints); let minVal = Math.min(...graphPoints);
              if (maxVal === minVal) { maxVal = maxVal === 0 ? 1000 : maxVal * 1.1; minVal = minVal === 0 ? -1000 : minVal * 0.9; }
              const valueRange = maxVal - minVal || 1;
              const svgPointsPath = graphPoints.map((val, index) => {
                const xCoord = (index / Math.max(graphPoints.length - 1, 1)) * 170;
                const yCoord = 22 - ((val - minVal) / valueRange) * 16; return `${xCoord},${yCoord}`;
              }).join(' ');
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '110px', overflowY: 'auto', paddingRight: '2px' }}>
                    {formattedUniqueList.map((item, idx) => {
                      const isToday = item.dateStringKey === todayStr;
                      const valueDisplay = `$${Number(item.totalInventoryValue || 0).toLocaleString()}`;
                      const tooltipContent = `🗓️ Date: ${item.formattedDate}\n💰 Inventory Value: ${valueDisplay}\n⚠️ Low Stock items: ${item.lowStockCount || 0}\n📦 Total Unique Items: ${item.totalItems || 0}\n❌ Out of Stock items: ${item.outOfStockCount || 0}`;
                      return (
                        <div key={item._id || `snap_${idx}`} title={tooltipContent} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid rgba(100, 116, 139, 0.25)', fontSize: '0.72rem', cursor: 'help', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.05)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {isToday && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2563eb', display: 'inline-block', animation: 'pulseDot 2s infinite ease-in-out' }} />}
                            <span style={{ color: 'var(--text-primary, #0f172a)', fontWeight: '700' }}>{item.formattedDate}</span>
                          </div>
                          <span style={{ color: '#2563eb', fontWeight: '800' }}>{valueDisplay}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid rgba(100, 116, 139, 0.25)', padding: '8px 10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#475569', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.02em' }}><span>Valuation Slope</span><span style={{ color: '#2563eb' }}>Sparkline Trend</span></div>
                      <div style={{ display: 'flex', alignItems: 'center', padding: '4px 0' }}>
                        <svg width="100%" height="26" viewBox="0 0 170 26" style={{ overflow: 'visible' }}>
                          <polyline fill="none" stroke="rgba(100, 116, 139, 0.2)" strokeWidth="1" strokeDasharray="3,3" points="0,13 170,13" />
                          {graphPoints.length > 1 && <polyline fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={svgPointsPath} />}
                          <circle cx="170" cy={22 - ((graphPoints[graphPoints.length - 1] - minVal) / valueRange) * 16} r="3" fill="#2563eb" />
                        </svg>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(100, 116, 139, 0.15)', paddingTop: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#475569', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.02em' }}><span>Value Distribution</span><span style={{ color: '#2563eb' }}>Column Matrix</span></div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '38px', paddingTop: '4px' }}>
                        {formattedUniqueList.map((item, idx) => {
                          const val = Number(item.totalInventoryValue || 0); const pctHeight = Math.max(((val - minVal) / valueRange) * 100, 15);
                          const isToday = item.dateStringKey === todayStr; const labelDisplay = `$${(val / 1000).toFixed(1)}k`;
                          return (
                            <div key={`bar_${idx}`} title={`${item.formattedDate}\nValuation: $${val.toLocaleString()}`} style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '3px', height: '100%', justifyContent: 'flex-end', alignItems: 'center', cursor: 'help' }}>
                              <span style={{ fontSize: '8px', fontWeight: '800', color: isToday ? '#2563eb' : 'var(--text-primary, #0f172a)' }}>{labelDisplay}</span>
                              <div style={{ width: '65%', maxHeight: '24px', height: `${pctHeight}%`, background: isToday ? 'linear-gradient(to top, #2563eb, #60a5fa)' : 'linear-gradient(to top, #475569, #94a3b8)', borderRadius: '2px 2px 0 0', transition: 'all 0.3s ease', boxShadow: isToday ? '0 2px 4px rgba(37,99,235,0.2)' : 'none' }} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            return <div style={{ fontSize: '0.72rem', color: 'inherit', opacity: 0.6, fontStyle: 'italic', textAlign: 'center', padding: '6px 0' }}>No snapshots captured yet.</div>;
          })()}
        </div>
      </div>
    </aside>
  );
}

export default LeftSidebar;
