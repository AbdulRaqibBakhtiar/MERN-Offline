
import { API_BASE_URL } from '../../api/config';
import React, { useEffect, useRef, useState } from 'react';
import {
  Megaphone,
  PlusCircle,
  XCircle,
  CheckCircle,
  UploadCloud,
  Pencil,
  Trash2,
  MoreVertical,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Image as ImageIcon,
  AlertCircle,
  Zap,
  Package,
  Newspaper,
  BarChart3,
  ChevronRight,
  Clock3,
  ChevronLeft,
  Pause,
  Play,
  GripVertical,
  MousePointerClick,
  Eye,
  ShieldCheck,
} from 'lucide-react';

function RightSidebar({
  isAdmin = false,
  liveAd = [],
  editingAdId,
  setEditingAdId,
  editAdPreviewUrl,
  setIsEditAdCropOpen,
  editAdTitle,
  setEditAdTitle,
  setEditAdDescription,
  executeAdSave,
  activeAdMenuId,
  setActiveAdMenuId,
  startEditingAd,
  setSearchCategory,
  hoveredBtnId,
  setHoveredBtnId,
  croppedAdFile,
  setCroppedAdFile,
  adPreviewUrl,
  setAdPreviewUrl,
  setIsAdCropOpen,
  loadAdBanners,
}) {
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');
  const [errorBanner, setErrorBanner] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [activityItems, setActivityItems] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedPreviews, setSelectedPreviews] = useState([]);
  const [previewIndex, setPreviewIndex] = useState({});
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editImages, setEditImages] = useState([]);
  const [editImagePreviews, setEditImagePreviews] = useState([]);
  const [dragIndex, setDragIndex] = useState(null);
  const [hoveredAdId, setHoveredAdId] = useState(null);
  const [pausedAds, setPausedAds] = useState({});
  const [targetUrl, setTargetUrl] = useState('');
  const [editTargetUrl, setEditTargetUrl] = useState('');
  const [stats, setStats] = useState({});

  const previewCleanupRefs = useRef({
    selected: [],
    editing: [],
  });

  const font =
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  previewCleanupRefs.current = {
    selected: selectedPreviews,
    editing: editImagePreviews,
  };

  useEffect(
    () => () => {
      previewCleanupRefs.current.selected.forEach(url =>
        URL.revokeObjectURL(url)
      );

      previewCleanupRefs.current.editing.forEach(url =>
        URL.revokeObjectURL(url)
      );
    },
    []
  );

  useEffect(() => {
    if (!successBanner && !errorBanner) return;

    const timer = setTimeout(() => {
      setSuccessBanner('');
      setErrorBanner('');
    }, 2800);

    return () => clearTimeout(timer);
  }, [successBanner, errorBanner]);

  useEffect(() => {
    if (!activeAdMenuId) return;

    const close = e => {
      if (!e.target.closest('[data-ad-menu]')) {
        setActiveAdMenuId(null);
      }
    };

    document.addEventListener('mousedown', close);

    return () => document.removeEventListener('mousedown', close);
  }, [activeAdMenuId, setActiveAdMenuId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setPreviewIndex(prev => {
        const next = { ...prev };

        liveAd.forEach(ad => {
          const images = getImages(ad);
          const paused = pausedAds[ad._id] || hoveredAdId === ad._id;

          if (images.length > 1 && !paused) {
            next[ad._id] = ((next[ad._id] || 0) + 1) % images.length;
          }
        });

        return next;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [liveAd, pausedAds, hoveredAdId]);

  useEffect(() => {
    setPreviewIndex(prev => {
      const next = { ...prev };

      liveAd.forEach(ad => {
        const images = getImages(ad);

        if (!images.length) {
          delete next[ad._id];
        } else if (next[ad._id] >= images.length) {
          next[ad._id] = 0;
        }
      });

      return next;
    });
  }, [liveAd]);

  useEffect(() => {
    if (!Array.isArray(liveAd)) return;

    setActivityItems(prev => {
      const existing = new Set(prev.map(item => item.id));

      const additions = liveAd
        .filter(ad => ad?._id)
        .map(ad => ({
          id: `ad-${ad._id}`,
          type: 'campaign',
          title: ad.title || 'Advertisement',
          time: ad.updatedAt || ad.createdAt,
        }))
        .filter(item => !existing.has(item.id));

      return additions.length
        ? [...additions, ...prev].slice(0, 5)
        : prev;
    });
  }, [liveAd]);

  useEffect(() => {
    const next = {};

    liveAd.forEach(ad => {
      next[ad._id] = {
        impressions: Number(ad.impressions || 0),
        clicks: Number(ad.clicks || 0),
        views: Number(ad.views || 0),
      };
    });

    setStats(next);
  }, [liveAd]);

  function getImages(ad) {
    if (Array.isArray(ad?.images) && ad.images.length) {
      return ad.images;
    }

    return ad?.imagePath ? [ad.imagePath] : [];
  }

  const getImageUrl = image => {
    if (!image) return '';

    if (typeof image === 'object') {
      image = image.url || image.path || image.imagePath || '';
    }

    if (!image) return '';

    if (
      image.startsWith('http://') ||
      image.startsWith('https://') ||
      image.startsWith('blob:')
    ) {
      return image;
    }

    return `${API_BASE_URL}${image}`;
  };

  const getTargetUrl = ad =>
    ad?.targetUrl || ad?.destinationUrl || ad?.url || '';

  const getStatus = ad =>
    String(ad?.status || ad?.state || 'active').toLowerCase();

  const isPaused = ad =>
    Boolean(pausedAds[ad?._id] || getStatus(ad) === 'paused');

  const showSuccess = message => {
    setErrorBanner('');
    setSuccessBanner(message);
  };

  const showError = message => {
    setSuccessBanner('');
    setErrorBanner(message);
  };

  const formatRelativeTime = value => {
    if (!value) return 'Recently';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return 'Recently';

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);

    if (hours < 24) return `${hours}h ago`;

    return `${Math.floor(hours / 24)}d ago`;
  };

  const clearCreateImages = () => {
    selectedPreviews.forEach(url => URL.revokeObjectURL(url));

    setSelectedImages([]);
    setSelectedPreviews([]);
    setCroppedAdFile(null);
    setAdPreviewUrl(null);
    setDragIndex(null);
  };

  const handleImageSelection = e => {
    const files = Array.from(e.target.files || [])
      .filter(file => file.type.startsWith('image/'))
      .slice(0, 10);

    selectedPreviews.forEach(url => URL.revokeObjectURL(url));

    const previews = files.map(file => URL.createObjectURL(file));

    setSelectedImages(files);
    setSelectedPreviews(previews);
    setAdPreviewUrl(previews[0] || null);

    e.target.value = '';
  };

  const removeSelectedImage = index => {
    const nextFiles = selectedImages.filter((_, i) => i !== index);
    const nextPreviews = selectedPreviews.filter((_, i) => i !== index);

    if (selectedPreviews[index]) {
      URL.revokeObjectURL(selectedPreviews[index]);
    }

    setSelectedImages(nextFiles);
    setSelectedPreviews(nextPreviews);
    setAdPreviewUrl(nextPreviews[0] || null);
  };

  const reorderSelectedImages = (from, to) => {
    if (from === to || from === null || to === null) return;

    const files = [...selectedImages];
    const previews = [...selectedPreviews];

    const [file] = files.splice(from, 1);
    const [preview] = previews.splice(from, 1);

    files.splice(to, 0, file);
    previews.splice(to, 0, preview);

    setSelectedImages(files);
    setSelectedPreviews(previews);
    setAdPreviewUrl(previews[0] || null);
  };

  const handleCreateAd = async e => {
    e.preventDefault();

    if (isCreating) return;

    const form = e.currentTarget;

    try {
      setIsCreating(true);

      const formData = new FormData();

      formData.append('title', form.elements.title.value.trim());
      formData.append(
        'description',
        form.elements.description.value.trim()
      );
      formData.append('targetUrl', targetUrl.trim());
      formData.append('status', 'active');
      formData.append(
        'creativeOrder',
        JSON.stringify(selectedImages.map((_, i) => i))
      );

      selectedImages.forEach(file => formData.append('images', file));

      if (!selectedImages.length && croppedAdFile) {
        formData.append('images', croppedAdFile);
      }

      const response = await fetch(`${API_BASE_URL}/content/ads`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Unable to publish campaign.');
      }

      clearCreateImages();
      setTargetUrl('');
      form.reset();

      if (typeof loadAdBanners === 'function') {
        await loadAdBanners();
      }

      setActivityItems(prev =>
        [
          {
            id: `created-${Date.now()}`,
            type: 'campaign',
            title: 'New campaign published',
            time: new Date().toISOString(),
          },
          ...prev,
        ].slice(0, 5)
      );

      showSuccess(
        `Campaign published with ${selectedImages.length || 1} creative${
          selectedImages.length === 1 ? '' : 's'
        }.`
      );

      setIsConsoleOpen(false);
    } catch (error) {
      console.error('Advertisement creation error:', error);
      showError(error.message || 'Unable to publish campaign.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartEdit = ad => {
    setActiveAdMenuId(null);
    setConfirmDeleteId(null);
    setEditImages([]);
    setEditImagePreviews([]);
    setEditTargetUrl(getTargetUrl(ad));

    if (typeof startEditingAd === 'function') {
      startEditingAd(ad);
    }

    showSuccess('Edit mode opened.');
  };

  const handleRequestDelete = ad => {
    setActiveAdMenuId(null);
    setConfirmDeleteId(ad?._id || null);
  };

  const handleConfirmDelete = async ad => {
    if (!ad?._id || deleteLoading) return;

    try {
      setDeleteLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/content/ads/${ad._id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || 'Unable to delete campaign.');
      }

      setConfirmDeleteId(null);
      setActiveAdMenuId(null);

      if (editingAdId === ad._id) {
        setEditingAdId(null);
      }

      if (typeof loadAdBanners === 'function') {
        await loadAdBanners();
      }

      setActivityItems(prev =>
        [
          {
            id: `delete-${Date.now()}`,
            type: 'delete',
            title: `${ad.title || 'Campaign'} deleted`,
            time: new Date().toISOString(),
          },
          ...prev,
        ].slice(0, 5)
      );

      showSuccess('Campaign deleted successfully.');
    } catch (error) {
      console.error('Delete ad error:', error);
      showError(error.message || 'Unable to delete campaign.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSaveEdit = async ad => {
    if (!ad?._id) return;

    try {
      if (typeof executeAdSave !== 'function') {
        throw new Error('Ad save handler is unavailable.');
      }

      const payload = {
        ...ad,
        targetUrl: editTargetUrl.trim(),
        creativeOrder: editImages.map((_, i) => i),
      };

      await executeAdSave(ad._id, payload);

      if (typeof loadAdBanners === 'function') {
        await loadAdBanners();
      }

      setEditingAdId(null);
      setEditTargetUrl('');

      setActivityItems(prev =>
        [
          {
            id: `edit-${Date.now()}`,
            type: 'edit',
            title: `${editAdTitle || ad.title || 'Campaign'} updated`,
            time: new Date().toISOString(),
          },
          ...prev,
        ].slice(0, 5)
      );

      showSuccess('Campaign updated successfully.');
    } catch (error) {
      console.error('Update ad error:', error);
      showError(error.message || 'Unable to update campaign.');
    }
  };

  const togglePause = async ad => {
    if (!ad?._id) return;

    const nextPaused = !isPaused(ad);

    try {
      const response = await fetch(
        `${API_BASE_URL}/content/ads/${ad._id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            status: nextPaused ? 'paused' : 'active',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Status update unavailable.');
      }

      setPausedAds(prev => ({
        ...prev,
        [ad._id]: nextPaused,
      }));

      setActiveAdMenuId(null);

      if (typeof loadAdBanners === 'function') {
        await loadAdBanners();
      }

      showSuccess(
        nextPaused ? 'Campaign paused.' : 'Campaign activated.'
      );
    } catch (error) {
      console.error('Campaign status error:', error);
      showError(error.message || 'Unable to update campaign status.');
    }
  };

  const openDestination = ad => {
    const url = getTargetUrl(ad);

    if (!url) {
      showError('This campaign has no destination URL.');
      return;
    }

    let destination = url.trim();

    if (!/^https?:\/\//i.test(destination)) {
      destination = `https://${destination}`;
    }

    setStats(prev => {
      const current = prev[ad._id] || {};

      return {
        ...prev,
        [ad._id]: {
          ...current,
          clicks: Number(current.clicks || 0) + 1,
        },
      };
    });

    window.open(destination, '_blank', 'noopener,noreferrer');
  };

  const handleQuickAction = type => {
    const events = {
      inventory: 'bazzar:open-inventory',
      news: 'bazzar:open-news',
      reports: 'bazzar:open-reports',
    };

    if (type === 'ads') {
      setIsConsoleOpen(true);
      showSuccess('Campaign console opened.');
      return;
    }

    if (events[type]) {
      window.dispatchEvent(new CustomEvent(events[type]));
      showSuccess(
        `${type.charAt(0).toUpperCase() + type.slice(1)} opened.`
      );
    }
  };

  const moveAdImage = (ad, direction) => {
    const images = getImages(ad);

    if (images.length < 2) return;

    setPreviewIndex(prev => {
      const current = prev[ad._id] || 0;

      return {
        ...prev,
        [ad._id]:
          direction === 'next'
            ? (current + 1) % images.length
            : (current - 1 + images.length) % images.length,
      };
    });
  };

  return (
    <aside
      className="grid-right"
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        fontFamily: font,
      }}
    >
      <style>{`
        .rs-card {
          background: var(--bg-card, #fff);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 15px;
          box-shadow: 0 4px 18px rgba(15, 23, 42, .045);
          overflow: visible;
          transition: border-color .2s ease, box-shadow .2s ease;
        }

        .rs-card:hover {
          border-color: rgba(100, 116, 139, .28);
        }

        .rs-campaign-center,
        .rs-sponsored-feed,
        .rs-extra-panel {
          padding: 13px !important;
        }

        .rs-campaign-center {
          background:
            radial-gradient(ellipse at top right, rgba(37, 99, 235, .075), transparent 65%),
            var(--bg-card, #fff);
        }

        .rs-sponsored-feed > div:first-child,
        .rs-extra-panel > div:first-child {
          gap: 8px !important;
          margin-bottom: 11px !important;
        }

        .rs-sponsored-feed > div:first-child span,
        .rs-extra-panel > div:first-child span {
          font-size: .7rem !important;
          font-weight: 850 !important;
          letter-spacing: .045em;
        }

        .rs-input {
          width: 100%;
          box-sizing: border-box;
          padding: 9px 11px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 9px;
          background: var(--bg-input, var(--bg-main, #f8fafc));
          color: var(--text-primary, inherit);
          font: 500 .75rem Inter, system-ui, sans-serif;
          outline: none;
          transition: border-color .18s ease, box-shadow .18s ease;
        }

        .rs-input::placeholder {
          color: var(--text-secondary, #94a3b8);
          opacity: .8;
        }

        .rs-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, .11);
        }

        .rs-btn {
          border: 1px solid var(--border-color, #e2e8f0);
          background: var(--bg-card, #fff);
          color: var(--text-primary, inherit);
          border-radius: 9px;
          cursor: pointer;
          font: 650 .68rem Inter, system-ui, sans-serif;
          transition: background .18s ease, border-color .18s ease, transform .18s ease;
        }

        .rs-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          border-color: rgba(37, 99, 235, .35);
          background: rgba(37, 99, 235, .055);
        }

        .rs-btn:disabled {
          cursor: not-allowed;
          opacity: .55;
        }

        .rs-btn:focus-visible,
        .rs-menu button:focus-visible,
        .rs-ad button:focus-visible {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        .rs-menu {
          position: absolute;
          top: 31px;
          right: 0;
          z-index: 9999;
          min-width: 175px;
          padding: 5px;
          background: var(--bg-card, #fff);
          color: var(--text-primary, #0f172a);
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 12px;
          box-shadow: 0 16px 40px rgba(15, 23, 42, .17);
          animation: rsMenuIn .15s ease-out;
        }

        .rs-menu button {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: inherit;
          cursor: pointer;
          text-align: left;
          font: 600 .7rem Inter, system-ui, sans-serif;
          transition: background .15s ease;
        }

        .rs-menu button:hover {
          background: var(--bg-main, #f1f5f9);
        }

        .rs-ad {
          padding: 11px !important;
          margin-bottom: 10px !important;
          border-radius: 12px !important;
          background: var(--bg-card, #fff) !important;
          transition: box-shadow .2s ease, border-color .2s ease;
        }

        .rs-ad:hover {
          transform: none !important;
          box-shadow: 0 7px 20px rgba(15, 23, 42, .065) !important;
          border-color: rgba(37, 99, 235, .28) !important;
        }

        .rs-ad p {
          overflow-wrap: anywhere;
        }

        .rs-ad button {
          transition: background .16s ease, border-color .16s ease;
        }

        .rs-toast {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-top: 10px;
          padding: 10px 11px;
          border: 1px solid rgba(16, 185, 129, .14);
          border-radius: 10px;
          font: 600 .68rem Inter, system-ui, sans-serif;
          line-height: 1.45;
          animation: rsToast .2s ease;
          overflow-wrap: anywhere;
        }

        .rs-drag {
          cursor: grab;
        }

        .rs-drag:active {
          cursor: grabbing;
        }

        .rs-scroll {
          max-height: 155px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(100, 116, 139, .3) transparent;
        }

        .rs-scroll::-webkit-scrollbar {
          width: 4px;
        }

        .rs-scroll::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, .3);
          border-radius: 99px;
        }

        .rs-extra-panel .rs-scroll > div {
          padding: 8px 2px !important;
        }

        .rs-extra-panel .rs-scroll > div:last-child {
          border-bottom: 0 !important;
        }

        @keyframes rsToast {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes rsMenuIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 480px) {
          .rs-campaign-center,
          .rs-sponsored-feed,
          .rs-extra-panel {
            padding: 11px !important;
          }

          .rs-ad {
            padding: 9px !important;
          }

          .rs-menu {
            min-width: 165px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .rs-card,
          .rs-ad,
          .rs-btn,
          .rs-input,
          .rs-menu button {
            transition: none !important;
            animation: none !important;
          }
        }
      `}</style>

      {/* Admin Campaign Center */}
      {isAdmin && (
        <section className="rs-card rs-campaign-center">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(37,99,235,.1)',
                  color: '#2563eb',
                  flexShrink: 0,
                }}
              >
                <Megaphone size={18} />
              </div>

              <div>
                <div style={{ fontSize: '.82rem', fontWeight: 800 }}>
                  Campaign Center
                </div>
                <div
                  style={{
                    marginTop: '3px',
                    fontSize: '.65rem',
                    color: 'var(--text-secondary, #64748b)',
                  }}
                >
                  {liveAd.filter(ad => !isPaused(ad)).length} active
                  {' · '}
                  {liveAd.filter(ad => isPaused(ad)).length} paused
                </div>
              </div>
            </div>

            <button
              type="button"
              aria-label={isConsoleOpen ? 'Close campaign form' : 'Create campaign'}
              onClick={() => setIsConsoleOpen(v => !v)}
              style={{
                width: '32px',
                height: '32px',
                border: '1px solid rgba(37,99,235,.2)',
                borderRadius: '9px',
                background: isConsoleOpen
                  ? 'rgba(37,99,235,.1)'
                  : 'var(--bg-card, #fff)',
                color: '#2563eb',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isConsoleOpen ? <XCircle size={16} /> : <PlusCircle size={16} />}
            </button>
          </div>

          {(successBanner || errorBanner) && (
            <div
              className="rs-toast"
              role="status"
              style={{
                background: errorBanner
                  ? 'rgba(239,68,68,.08)'
                  : 'rgba(16,185,129,.08)',
                color: errorBanner ? '#dc2626' : '#047857',
              }}
            >
              {errorBanner ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
              <span>{errorBanner || successBanner}</span>
            </div>
          )}

          {isConsoleOpen && (
            <form
              onSubmit={handleCreateAd}
              style={{
                marginTop: '13px',
                paddingTop: '13px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '9px',
              }}
            >
              <input
                name="title"
                required
                placeholder="Campaign title"
                className="rs-input"
              />

              <textarea
                name="description"
                required
                placeholder="Campaign description"
                className="rs-input"
                style={{ resize: 'vertical', minHeight: '65px' }}
              />

              <input
                value={targetUrl}
                onChange={e => setTargetUrl(e.target.value)}
                placeholder="Destination URL (optional)"
                className="rs-input"
                type="url"
              />

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  border: '1px dashed rgba(37,99,235,.4)',
                  borderRadius: '10px',
                  background: 'rgba(37,99,235,.045)',
                  color: '#2563eb',
                  fontSize: '.7rem',
                  fontWeight: 750,
                  cursor: 'pointer',
                }}
              >
                <ImageIcon size={15} />
                {selectedImages.length
                  ? `${selectedImages.length} creatives selected`
                  : 'Choose creatives · up to 10'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleImageSelection}
                />
              </label>

              {selectedImages.length > 0 && (
                <>
                  <div
                    style={{
                      fontSize: '.62rem',
                      color: 'var(--text-secondary, #64748b)',
                      fontWeight: 600,
                    }}
                  >
                    Drag to reorder · first creative is the cover
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                      gap: '7px',
                    }}
                  >
                    {selectedPreviews.map((url, index) => (
                      <div
                        key={`${selectedImages[index]?.name || 'image'}-${index}`}
                        className="rs-drag"
                        draggable
                        onDragStart={() => setDragIndex(index)}
                        onDragOver={e => e.preventDefault()}
                        onDrop={() => {
                          reorderSelectedImages(dragIndex, index);
                          setDragIndex(null);
                        }}
                        style={{
                          position: 'relative',
                          height: '65px',
                          minWidth: 0,
                        }}
                      >
                        <img
                          src={url}
                          alt={`Creative ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '65px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border:
                              index === 0
                                ? '2px solid #2563eb'
                                : '1px solid var(--border-color)',
                          }}
                        />

                        {index === 0 && (
                          <span
                            style={{
                              position: 'absolute',
                              left: '4px',
                              bottom: '4px',
                              padding: '3px 5px',
                              borderRadius: '4px',
                              background: '#2563eb',
                              color: '#fff',
                              fontSize: '.48rem',
                              fontWeight: 800,
                            }}
                          >
                            COVER
                          </span>
                        )}

                        <GripVertical
                          size={12}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            left: '4px',
                            color: '#fff',
                            filter: 'drop-shadow(0 1px 2px #000)',
                          }}
                        />

                        <button
                          type="button"
                          aria-label={`Remove creative ${index + 1}`}
                          onClick={() => removeSelectedImage(index)}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            width: '21px',
                            height: '21px',
                            border: 0,
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,.7)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          <XCircle size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isCreating}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                  padding: '11px',
                  border: 0,
                  borderRadius: '9px',
                  background: isCreating ? '#94a3b8' : '#059669',
                  color: '#fff',
                  fontSize: '.72rem',
                  fontWeight: 750,
                  cursor: isCreating ? 'not-allowed' : 'pointer',
                }}
              >
                {isCreating ? <RefreshCw size={14} /> : <Megaphone size={14} />}
                {isCreating ? 'Publishing...' : 'Publish Campaign'}
              </button>
            </form>
          )}
        </section>
      )}

      {/* Sponsored Feed */}
      <section className="rs-card rs-sponsored-feed">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              width: '29px',
              height: '29px',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(37,99,235,.09)',
            }}
          >
            <Sparkles size={15} color="#2563eb" />
          </div>

          <div>
            <div
              style={{
                fontSize: '.75rem',
                fontWeight: 800,
                color: 'var(--text-primary, inherit)',
              }}
            >
              Sponsored Feed
            </div>
            <div
              style={{
                fontSize: '.63rem',
                color: 'var(--text-secondary, #64748b)',
                marginTop: '2px',
              }}
            >
              Featured campaigns
            </div>
          </div>
        </div>

        {!liveAd.length ? (
          <div
            style={{
              padding: '22px 10px',
              textAlign: 'center',
              border: '1px dashed var(--border-color)',
              borderRadius: '11px',
              background: 'var(--bg-main, #f8fafc)',
            }}
          >
            <Sparkles size={22} style={{ opacity: 0.35 }} />

            <div
              style={{
                marginTop: '8px',
                fontSize: '.75rem',
                fontWeight: 750,
              }}
            >
              No campaigns yet
            </div>

            <div
              style={{
                marginTop: '4px',
                fontSize: '.67rem',
                color: 'var(--text-secondary, #64748b)',
              }}
            >
              New sponsored content will appear here.
            </div>
          </div>
        ) : (
          liveAd.map(adItem => {
            const images = getImages(adItem);
            const index = previewIndex[adItem._id] || 0;
            const image = images[index] || images[0];
            const editing = editingAdId === adItem._id;
            const isDeleting = confirmDeleteId === adItem._id;
            const paused = isPaused(adItem);
            const target = getTargetUrl(adItem);
            const adStats = stats[adItem._id] || {};

            const ctr = adStats.impressions
              ? ((adStats.clicks / adStats.impressions) * 100).toFixed(1)
              : '0.0';

            return (
              <article
                key={adItem._id}
                id={`ad-banner-${adItem._id}`}
                className="rs-ad"
                onMouseEnter={() => setHoveredAdId(adItem._id)}
                onMouseLeave={() => setHoveredAdId(null)}
                style={{
                  position: 'relative',
                  border: isDeleting
                    ? '1px solid rgba(239,68,68,.35)'
                    : paused
                      ? '1px solid rgba(245,158,11,.35)'
                      : '1px solid var(--border-color)',
                  opacity: paused ? 0.88 : 1,
                }}
              >
                {editing ? (
                  <>
                    <div
                      style={{
                        overflow: 'hidden',
                        borderRadius: '9px',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      {editAdPreviewUrl || image ? (
                        <img
                          src={editAdPreviewUrl || getImageUrl(image)}
                          alt=""
                          style={{
                            width: '100%',
                            maxHeight: '200px',
                            display: 'block',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <div style={{ padding: '24px', textAlign: 'center' }}>
                          <ImageIcon size={20} />
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="rs-btn"
                      onClick={() => setIsEditAdCropOpen(true)}
                      style={{
                        width: '100%',
                        marginTop: '8px',
                        padding: '9px',
                      }}
                    >
                      <UploadCloud
                        size={13}
                        style={{ verticalAlign: 'middle', marginRight: '5px' }}
                      />
                      Replace Graphic
                    </button>

                    <input
                      className="rs-input"
                      value={editAdTitle || ''}
                      onChange={e => setEditAdTitle(e.target.value)}
                      placeholder="Campaign title"
                      style={{ marginTop: '8px' }}
                    />

                    <textarea
                      className="rs-input"
                      value={adItem.description || ''}
                      onChange={e => setEditAdDescription?.(e.target.value)}
                      placeholder="Campaign description"
                      style={{
                        marginTop: '8px',
                        resize: 'vertical',
                        minHeight: '65px',
                      }}
                    />

                    <input
                      className="rs-input"
                      value={editTargetUrl}
                      onChange={e => setEditTargetUrl(e.target.value)}
                      placeholder="Destination URL"
                      type="url"
                      style={{ marginTop: '8px' }}
                    />

                    <div style={{ display: 'flex', gap: '7px', marginTop: '9px' }}>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(adItem)}
                        style={{
                          flex: 1,
                          padding: '9px',
                          border: 0,
                          borderRadius: '8px',
                          background: '#059669',
                          color: '#fff',
                          fontSize: '.7rem',
                          fontWeight: 750,
                          cursor: 'pointer',
                        }}
                      >
                        <CheckCircle
                          size={13}
                          style={{ verticalAlign: 'middle', marginRight: '4px' }}
                        />
                        Save
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingAdId(null);
                          setEditImages([]);
                          setEditImagePreviews([]);
                          setEditTargetUrl('');
                        }}
                        className="rs-btn"
                        style={{ flex: 1, padding: '9px' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '8px',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            color: paused ? '#d97706' : '#2563eb',
                            fontSize: '.61rem',
                            fontWeight: 750,
                            flexWrap: 'wrap',
                          }}
                        >
                          <span>Sponsored</span>
                          <span>·</span>
                          <span>Campaign</span>
                          <span>·</span>
                          <span>
                            {formatRelativeTime(adItem.updatedAt || adItem.createdAt)}
                          </span>

                          {paused && (
                            <>
                              <span>·</span>
                              <span>Paused</span>
                            </>
                          )}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '7px',
                            marginTop: '7px',
                            color: 'var(--text-primary, inherit)',
                            fontSize: '.83rem',
                            lineHeight: 1.35,
                            fontWeight: 800,
                          }}
                        >
                          <Megaphone
                            size={15}
                            color={paused ? '#d97706' : '#2563eb'}
                            style={{ flexShrink: 0, marginTop: '1px' }}
                          />
                          <span style={{ overflowWrap: 'anywhere' }}>
                            {adItem.title || 'Untitled campaign'}
                          </span>
                        </div>
                      </div>

                      {isAdmin && (
                        <div data-ad-menu style={{ position: 'relative', zIndex: 10000 }}>
                          <button
                            type="button"
                            aria-label="Campaign options"
                            aria-expanded={activeAdMenuId === adItem._id}
                            onClick={e => {
                              e.stopPropagation();
                              setActiveAdMenuId(
                                activeAdMenuId === adItem._id ? null : adItem._id
                              );
                            }}
                            style={{
                              width: '30px',
                              height: '30px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid var(--border-color)',
                              borderRadius: '9px',
                              background:
                                activeAdMenuId === adItem._id
                                  ? 'var(--bg-main)'
                                  : 'transparent',
                              color: 'var(--text-primary, inherit)',
                              cursor: 'pointer',
                              flexShrink: 0,
                            }}
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeAdMenuId === adItem._id && (
                            <div
                              className="rs-menu"
                              onClick={e => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => handleStartEdit(adItem)}
                              >
                                <Pencil size={14} />
                                Edit Campaign
                              </button>

                              <button
                                type="button"
                                onClick={() => togglePause(adItem)}
                              >
                                {paused ? <Play size={14} /> : <Pause size={14} />}
                                {paused ? 'Activate Campaign' : 'Pause Campaign'}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveAdMenuId(null);
                                  showSuccess(
                                    'Creative management is available through campaign editing.'
                                  );
                                }}
                              >
                                <ImageIcon size={14} />
                                Manage Creatives
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveAdMenuId(null);
                                  showSuccess(
                                    'Campaign duplication will use the same creatives.'
                                  );
                                }}
                              >
                                <RefreshCw size={14} />
                                Duplicate Campaign
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRequestDelete(adItem)}
                                style={{ color: '#ef4444' }}
                              >
                                <Trash2 size={14} />
                                Delete Campaign
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {image && (
                      <div
                        style={{
                          position: 'relative',
                          marginTop: '11px',
                          overflow: 'hidden',
                          borderRadius: '10px',
                          background: 'var(--bg-main, #f1f5f9)',
                          cursor: target && !paused ? 'pointer' : 'default',
                        }}
                        onClick={() => target && !paused && openDestination(adItem)}
                      >
                        <img
                          src={getImageUrl(image)}
                          alt={adItem.title || 'Advertisement'}
                          style={{
                            width: '100%',
                            maxHeight: '250px',
                            display: 'block',
                            objectFit: 'cover',
                            borderRadius: '10px',
                          }}
                        />

                        {paused && (
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'rgba(15,23,42,.4)',
                              color: '#fff',
                              fontSize: '.75rem',
                              fontWeight: 800,
                            }}
                          >
                            <Pause size={14} style={{ marginRight: '5px' }} />
                            CAMPAIGN PAUSED
                          </div>
                        )}

                        {images.length > 1 && (
                          <>
                            <button
                              type="button"
                              aria-label="Previous creative"
                              onClick={e => {
                                e.stopPropagation();
                                moveAdImage(adItem, 'prev');
                              }}
                              style={{
                                position: 'absolute',
                                left: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '30px',
                                height: '30px',
                                border: '1px solid rgba(255,255,255,.3)',
                                borderRadius: '50%',
                                background: 'rgba(15,23,42,.58)',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                              }}
                            >
                              <ChevronLeft size={16} />
                            </button>

                            <button
                              type="button"
                              aria-label="Next creative"
                              onClick={e => {
                                e.stopPropagation();
                                moveAdImage(adItem, 'next');
                              }}
                              style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '30px',
                                height: '30px',
                                border: '1px solid rgba(255,255,255,.3)',
                                borderRadius: '50%',
                                background: 'rgba(15,23,42,.58)',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                              }}
                            >
                              <ChevronRight size={16} />
                            </button>

                            <div
                              style={{
                                position: 'absolute',
                                left: '9px',
                                right: '9px',
                                bottom: '8px',
                                display: 'flex',
                                gap: '4px',
                              }}
                            >
                              {images.map((_, i) => (
                                <span
                                  key={i}
                                  style={{
                                    flex: 1,
                                    height: '3px',
                                    borderRadius: '10px',
                                    background:
                                      i === index
                                        ? '#fff'
                                        : 'rgba(255,255,255,.45)',
                                  }}
                                />
                              ))}
                            </div>

                            <div
                              style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                padding: '4px 8px',
                                borderRadius: '99px',
                                background: 'rgba(15,23,42,.68)',
                                color: '#fff',
                                fontSize: '.58rem',
                                fontWeight: 750,
                              }}
                            >
                              {index + 1} / {images.length}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        marginTop: '8px',
                        fontSize: '.59rem',
                        color: 'var(--text-secondary, #64748b)',
                        fontWeight: 650,
                      }}
                    >
                      <span>
                        {images.length || 1} creative{images.length === 1 ? '' : 's'}
                      </span>

                      {images.length > 1 && (
                        <span>
                          {hoveredAdId === adItem._id
                            ? 'Paused on hover'
                            : 'Auto-playing'}
                        </span>
                      )}
                    </div>

                    {adItem.description && (
                      <p
                        style={{
                          margin: '10px 0',
                          fontSize: '.72rem',
                          lineHeight: 1.6,
                          color: 'var(--text-secondary, #64748b)',
                          fontWeight: 450,
                        }}
                      >
                        {adItem.description}
                      </p>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: '10px',
                        margin: '10px 0',
                        padding: '9px 10px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '9px',
                        background: 'var(--bg-main, #f8fafc)',
                        fontSize: '.61rem',
                        color: 'var(--text-secondary, #64748b)',
                        fontWeight: 650,
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Eye size={13} />
                        {adStats.impressions || 0} impressions
                      </span>

                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MousePointerClick size={13} />
                        {adStats.clicks || 0} clicks
                      </span>

                      <span
                        style={{
                          marginLeft: 'auto',
                          color: '#059669',
                          fontWeight: 800,
                        }}
                      >
                        CTR {ctr}%
                      </span>
                    </div>

                    {isDeleting ? (
                      <div
                        style={{
                          padding: '12px',
                          borderRadius: '10px',
                          background: 'rgba(239,68,68,.055)',
                          border: '1px solid rgba(239,68,68,.2)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            gap: '9px',
                            alignItems: 'flex-start',
                          }}
                        >
                          <Trash2 size={16} color="#dc2626" />

                          <div>
                            <div
                              style={{
                                color: '#b91c1c',
                                fontSize: '.75rem',
                                fontWeight: 800,
                              }}
                            >
                              Delete campaign?
                            </div>

                            <div
                              style={{
                                marginTop: '4px',
                                fontSize: '.67rem',
                                lineHeight: 1.5,
                                color: 'var(--text-secondary, #64748b)',
                              }}
                            >
                              All campaign creatives will be removed.
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '7px',
                            marginTop: '12px',
                          }}
                        >
                          <button
                            type="button"
                            className="rs-btn"
                            disabled={deleteLoading}
                            onClick={() => setConfirmDeleteId(null)}
                            style={{ padding: '8px 12px' }}
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            disabled={deleteLoading}
                            onClick={() => handleConfirmDelete(adItem)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 12px',
                              border: 0,
                              borderRadius: '8px',
                              background: '#dc2626',
                              color: '#fff',
                              fontSize: '.68rem',
                              fontWeight: 750,
                              cursor: deleteLoading ? 'not-allowed' : 'pointer',
                              opacity: deleteLoading ? 0.65 : 1,
                            }}
                          >
                            <Trash2 size={13} />
                            {deleteLoading ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={paused}
                        onClick={() => openDestination(adItem)}
                        onMouseEnter={() =>
                          setHoveredBtnId?.(`${adItem._id}_ad`)
                        }
                        onMouseLeave={() => setHoveredBtnId?.(null)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '7px',
                          padding: '10px',
                          borderRadius: '9px',
                          border: '1px solid rgba(37,99,235,.2)',
                          background:
                            hoveredBtnId === `${adItem._id}_ad`
                              ? 'rgba(37,99,235,.13)'
                              : 'rgba(37,99,235,.065)',
                          color: '#2563eb',
                          fontSize: '.72rem',
                          fontWeight: 750,
                          cursor: paused ? 'not-allowed' : 'pointer',
                          opacity: paused ? 0.55 : 1,
                        }}
                      >
                        {paused ? 'Campaign Paused' : 'Learn More'}
                        <ExternalLink size={13} />
                      </button>
                    )}
                  </>
                )}
              </article>
            );
          })
        )}
      </section>

      {/* Quick Actions */}
      <section className="rs-card rs-extra-panel">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '11px',
          }}
        >
          <div
            style={{
              width: '29px',
              height: '29px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '9px',
              background: 'rgba(37,99,235,.09)',
            }}
          >
            <Zap size={15} color="#2563eb" />
          </div>

          <span
            style={{
              fontSize: '.75rem',
              fontWeight: 800,
              color: 'var(--text-primary, inherit)',
            }}
          >
            Quick Actions
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '7px',
          }}
        >
          {[
            ['inventory', Package, '#2563eb', 'Inventory'],
            ['news', Newspaper, '#8b5cf6', 'News'],
            ['ads', Megaphone, '#d97706', 'Campaign'],
            ['reports', BarChart3, '#059669', 'Reports'],
          ].map(([type, Icon, color, label]) => (
            <button
              key={type}
              type="button"
              className="rs-btn"
              onClick={() => handleQuickAction(type)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minWidth: 0,
                padding: '10px',
                textAlign: 'left',
              }}
            >
              <span
                style={{
                  width: '27px',
                  height: '27px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  borderRadius: '8px',
                  background: `${color}12`,
                }}
              >
                <Icon size={14} color={color} />
              </span>

              <span style={{ fontSize: '.69rem', fontWeight: 700 }}>
                {label}
              </span>

              <ChevronRight
                size={13}
                style={{ marginLeft: 'auto', opacity: 0.45, flexShrink: 0 }}
              />
            </button>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="rs-card rs-extra-panel">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '9px',
          }}
        >
          <div
            style={{
              width: '29px',
              height: '29px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '9px',
              background: 'rgba(37,99,235,.09)',
            }}
          >
            <Clock3 size={15} color="#2563eb" />
          </div>

          <div>
            <div
              style={{
                fontSize: '.75rem',
                fontWeight: 800,
                color: 'var(--text-primary, inherit)',
              }}
            >
              Recent Activity
            </div>
            <div
              style={{
                marginTop: '2px',
                fontSize: '.63rem',
                color: 'var(--text-secondary, #64748b)',
              }}
            >
              Latest campaign updates
            </div>
          </div>
        </div>

        <div className="rs-scroll">
          {activityItems.length ? (
            activityItems.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '9px',
                  padding: '9px 2px',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '9px',
                    background:
                      item.type === 'delete'
                        ? 'rgba(239,68,68,.09)'
                        : item.type === 'edit'
                          ? 'rgba(139,92,246,.09)'
                          : 'rgba(37,99,235,.09)',
                    color:
                      item.type === 'delete'
                        ? '#dc2626'
                        : item.type === 'edit'
                          ? '#8b5cf6'
                          : '#2563eb',
                  }}
                >
                  {item.type === 'delete' ? (
                    <Trash2 size={14} />
                  ) : item.type === 'edit' ? (
                    <Pencil size={14} />
                  ) : (
                    <Megaphone size={14} />
                  )}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: '.7rem',
                      fontWeight: 700,
                      lineHeight: 1.45,
                      overflowWrap: 'anywhere',
                      color: 'var(--text-primary, inherit)',
                    }}
                  >
                    {item.title}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      marginTop: '4px',
                      fontSize: '.62rem',
                      color: 'var(--text-secondary, #64748b)',
                    }}
                  >
                    <Clock3 size={11} />
                    {formatRelativeTime(item.time)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div
              style={{
                padding: '18px 8px',
                textAlign: 'center',
                borderRadius: '9px',
                background: 'var(--bg-main, #f8fafc)',
                color: 'var(--text-secondary, #64748b)',
                fontSize: '.69rem',
              }}
            >
              <Clock3 size={18} style={{ opacity: 0.45 }} />
              <div style={{ marginTop: '6px', fontWeight: 650 }}>
                No recent activity yet
              </div>
            </div>
          )}
        </div>
      </section>
    </aside>
  );
}

export default RightSidebar;
