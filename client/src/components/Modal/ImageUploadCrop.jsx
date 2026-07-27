import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import Cropper from 'react-easy-crop';

const ASPECT_RATIOS = [
  { label: "1:1 Square", value: 1 },
  { label: "4:3 Classic", value: 4 / 3 },
  { label: "16:9 Video", value: 16 / 9 },
  { label: "Free Crop", value: undefined }
];

function ImageUploadCrop({ isOpen, onClose, onCropComplete, onCropCompleteSuccess, title = "Upload & Crop Image" }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [hoveredRatio, setHoveredRatio] = useState(null);
  
  // 🚀 SLIDER CONTROLS: Manually manipulate box dimensions when aspect is undefined
  const [manualWidth, setManualWidth] = useState(220);
  const [manualHeight, setManualHeight] = useState(150);

  const onCropChangeComplete = useCallback((croppedArea, currentCroppedAreaPixels) => {
    setCroppedAreaPixels(currentCroppedAreaPixels);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result));
      reader.readAsDataURL(file);
    }
  };

  const handleRatioSelection = (value) => {
    setAspect(value);
  };

  const generateCroppedBlob = (imageSrcUrl, pixelCrop) => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = imageSrcUrl;
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = pixelCrop.width;
          canvas.height = pixelCrop.height;
          ctx.drawImage(
            image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
            0, 0, pixelCrop.width, pixelCrop.height
          );
          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error("Blob compilation failure"));
            resolve(new File([blob], `cropped-${Date.now()}.jpg`, { type: "image/jpeg" }));
          }, "image/jpeg", 0.9);
        } catch (err) {
          reject(err);
        }
      };
      image.onerror = (err) => reject(err);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const finalFileBinary = await generateCroppedBlob(imageSrc, croppedAreaPixels);
      if (typeof onCropComplete === 'function') onCropComplete(finalFileBinary);
      else if (typeof onCropCompleteSuccess === 'function') onCropCompleteSuccess(finalFileBinary);
      handleCloseClean();
    } catch (err) {
      console.error(err);
    }
  };
  const handleCloseClean = () => {
    setImageSrc(null);
    setCroppedAreaPixels(null);
    setZoom(1);
    setAspect(1);
    setManualWidth(220);
    setManualHeight(150);
    if (typeof onClose === 'function') onClose();
  };

  if (!isOpen) return null;

  // Build Cropper configuration properties package
  const cropperProps = {
    image: imageSrc,
    crop: crop,
    zoom: zoom,
    onCropChange: setCrop,
    onCropComplete: onCropChangeComplete,
    onZoomChange: setZoom,
    showGrid: true
  };

  // 🚀 DYNAMIC SWITCH: If aspect is undefined, enforce custom manual cropSize values instead
  if (aspect !== undefined) {
    cropperProps.aspect = aspect;
  } else {
    cropperProps.cropSize = { width: manualWidth, height: manualHeight };
  }

  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
      <div style={{ width: '440px', background: 'var(--bg-card, #ffffff)', padding: '24px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2), 0 10px 10px -5px rgba(0,0,0,0.1)', boxSizing: 'border-box', border: '1px solid var(--border-color, transparent)' }} className="modal-content-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary, inherit)' }}>{title}</h3>
          <button type="button" onClick={handleCloseClean} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-muted, #64748b)' }}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {imageSrc ? (
            <>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                {ASPECT_RATIOS.map((ratio) => (
                  <button 
                    key={ratio.label} 
                    type="button" 
                    onMouseEnter={() => setHoveredRatio(ratio.label)} 
                    onMouseLeave={() => setHoveredRatio(null)} 
                    onClick={() => handleRatioSelection(ratio.value)} 
                    style={{ flex: 1, padding: '8px 6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', borderRadius: '6px', whiteSpace: 'nowrap', transition: 'all 0.2s', border: aspect === ratio.value ? '1px solid #3b82f6' : '1px solid var(--border-color, #cbd5e1)', background: aspect === ratio.value ? '#3b82f6' : (hoveredRatio === ratio.label ? 'var(--border-color, #e2e8f0)' : 'var(--bg-main, #f8fafc)'), color: aspect === ratio.value ? '#ffffff' : 'var(--text-primary, #0f172a)' }} 
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
              <div style={{ position: 'relative', height: '260px', background: '#0f172a', borderRadius: '8px', overflow: 'hidden' }}>
                <Cropper {...cropperProps} />
              </div>

              {/* Universal Controls Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-main, #f8fafc)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary, #475569)', minWidth: '80px' }}>🔍 Image Zoom:</span>
                  <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} style={{ flex: 1, cursor: 'pointer' }} />
                </div>

                {/* 🚀 DYNAMIC FREE CROP SLIDERS PANEL */}
                {aspect === undefined && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderTop: '1px dashed var(--border-color, #e2e8f0)', paddingTop: '8px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary, #475569)', minWidth: '80px' }}>↔️ Box Width:</span>
                      <input type="range" min={50} max={380} step={1} value={manualWidth} onChange={(e) => setManualWidth(parseInt(e.target.value))} style={{ flex: 1, cursor: 'pointer' }} />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', minWidth: '35px', textAlign: 'right' }}>{manualWidth}px</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary, #475569)', minWidth: '80px' }}>↕️ Box Height:</span>
                      <input type="range" min={50} max={240} step={1} value={manualHeight} onChange={(e) => setManualHeight(parseInt(e.target.value))} style={{ flex: 1, cursor: 'pointer' }} />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', minWidth: '35px', textAlign: 'right' }}>{manualHeight}px</span>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div style={{ background: 'var(--bg-main, #f8fafc)', border: '2px dashed var(--border-color, #cbd5e1)', borderRadius: '8px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.85rem' }}>No file loaded into crop workspace</span>
            </div>
          )}

          <div>
            <input type="file" id="portalCropInput" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            <label htmlFor="portalCropInput" style={{ display: 'block', textAlign: 'center', padding: '10px', background: 'var(--border-color, #f1f5f9)', border: '1px solid var(--border-color, #cbd5e1)', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-primary, inherit)' }}>
              📷 {imageSrc ? "Change Selected Image" : "Choose Photo..."}
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" disabled={!imageSrc} style={{ background: imageSrc ? '#10b981' : 'var(--border-color, #cbd5e1)', color: '#ffffff', border: 'none', borderRadius: '6px', flex: 2, padding: '12px', fontSize: '0.9rem', fontWeight: 'bold', cursor: imageSrc ? 'pointer' : 'not-allowed' }}>Apply Crop Selection</button>
            <button type="button" onClick={handleCloseClean} style={{ background: 'var(--bg-card, #ffffff)', color: 'var(--text-primary, #0f172a)', border: '1px solid var(--border-color, #cbd5e1)', borderRadius: '6px', flex: 1, padding: '12px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default ImageUploadCrop;
