import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ImageUploadCrop from './ImageUploadCrop'; // 🔌 Connecting your active crop modal module here

function SoftwareManageModal({ isOpen, onClose, activeApp, onSave, onDelete }) {
  const [formData, setFormData] = useState({ name: '', version: '', description: '', downloadLink: '', slug: '' });
  const [hoveredNode, setHoveredNode] = useState(null);
  
  // 📸 Image Cropping State Tracking Vectors
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [croppedFile, setCroppedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (activeApp) {
      setFormData(activeApp);
      setPreviewUrl(activeApp.image ? `http://localhost:5000${activeApp.image}` : null);
      setCroppedFile(null);
    } else {
      setFormData({ name: '', version: 'v1.0', description: '', downloadLink: '/404', slug: '' });
      setPreviewUrl(null);
      setCroppedFile(null);
    }
  }, [activeApp, isOpen]);

  if (!isOpen) return null;

  const handleNewsCroppedReturn = (file) => {
    setCroppedFile(file);
    setPreviewUrl(URL.createObjectURL(file)); // Mounts localized blob rendering memory index paths instantly
    setIsCropOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, croppedFile); // 🎯 Passes fields array along with cropped data up to hook handler
  };

  const handleBackdropClick = (e) => {
    if (e.target.className === "modal-premium-overlay") onClose();
  };

  return createPortal(
    <div 
      className="modal-premium-overlay"
      onClick={handleBackdropClick}
      style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999999, 
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        animation: 'premiumModalEntrance 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
    >
      <style>{`@keyframes premiumModalEntrance { 0% { opacity: 0; transform: scale(0.96); } 100% { opacity: 1; transform: scale(1); } }`}</style>

      <div 
        className="premium-glass-modal-card"
        style={{ 
          background: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          borderRadius: '24px', width: '90%', maxWidth: '380px', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative'
        }}
      >
        <button
          type="button" onClick={onClose} onMouseEnter={() => setHoveredNode('cross_btn')} onMouseLeave={() => setHoveredNode(null)}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '1.1rem', color: '#94a3b8', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: hoveredNode === 'cross_btn' ? '#f1f5f9' : 'transparent', transition: 'all 0.2s ease' }}
        >✕</button>

        <div style={{ textAlign: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#ffffff', margin: '0 auto 10px auto', boxShadow: '0 6px 16px rgba(37, 99, 235, 0.35)' }}>
            {activeApp ? "✍️" : "🚀"}
          </div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.02em' }}>
            {activeApp ? "Modify System Extension" : "Deploy Extension Component"}
          </h3>
        </div>

        {/* 🎯 THE IMAGE PLACEHOLDER PREVIEW MODULE */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
          <div 
            onClick={() => setIsCropOpen(true)}
            style={{ 
              width: '74px', height: '74px', borderRadius: '16px', border: '2px dashed #cbd5e1', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              overflow: 'hidden', background: '#f8fafc', transition: 'all 0.2s', position: 'relative'
            }}
            onMouseEnter={() => setHoveredNode('img_box')} onMouseLeave={() => setHoveredNode(null)}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="App logo avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '1.4rem' }}>📷</span>
            )}
            {hoveredNode === 'img_box' && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: '700' }}>EDIT</div>
            )}
          </div>
          <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '600' }}>Configure Application Graphics Banner</span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input type="text" placeholder="Application Extension Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '_')})} required style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '0.85rem', color: '#0f172a', outline: 'none' }} />
          <input type="text" placeholder="Version Tag Node (e.g. v1.0)" value={formData.version} onChange={e => setFormData({...formData, version: e.target.value})} required style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '0.85rem', color: '#0f172a', outline: 'none' }} />
          <textarea placeholder="Functional summary brief description details..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '0.85rem', color: '#0f172a', height: '60px', resize: 'none', outline: 'none', fontFamily: 'inherit' }} />
          <input type="text" placeholder="Download Destination URL Route (or /404)" value={formData.downloadLink} onChange={e => setFormData({...formData, downloadLink: e.target.value || '/404'})} style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '0.85rem', color: '#0f172a', outline: 'none' }} />
          
          <button 
            type="submit" onMouseEnter={() => setHoveredNode('save')} onMouseLeave={() => setHoveredNode(null)}
            style={{ padding: '11px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem', marginTop: '4px', boxShadow: hoveredNode === 'save' ? '0 6px 20px rgba(37, 99, 235, 0.4)' : '0 4px 12px rgba(37, 99, 235, 0.2)', transform: hoveredNode === 'save' ? 'translateY(-1px)' : 'translateY(0)', transition: 'all 0.2s' }}
          >Save Parameters</button>

          {activeApp && (
            <button 
              type="button" onClick={() => onDelete(formData._id)} onMouseEnter={() => setHoveredNode('delete')} onMouseLeave={() => setHoveredNode(null)}
              style={{ padding: '11px', background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem', boxShadow: hoveredNode === 'delete' ? '0 6px 20px rgba(239, 68, 68, 0.4)' : 'none', transform: hoveredNode === 'delete' ? 'translateY(-1px)' : 'translateY(0)', transition: 'all 0.2s' }}
            >Remove Extension</button>
          )}
        </form>
      </div>

      {/* Render your nested image cropper directly inside portal stacking scope */}
      <ImageUploadCrop 
        isOpen={isCropOpen} 
        onClose={() => setIsCropOpen(false)} 
        onCropCompleteSuccess={handleNewsCroppedReturn} 
        title="Crop Extension Application Icon Logo" 
      />
    </div>,
    document.body
  );
}

export default SoftwareManageModal;
