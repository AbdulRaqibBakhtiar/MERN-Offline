import { API_BASE_URL } from '../../api/config';
import React, { useEffect, useRef, useState } from 'react';

import {
  Download, PlusCircle, XCircle, CheckCircle, UploadCloud, AlertCircle,
  Package, AlertTriangle, Box, Activity,
  MoreVertical, Pencil, Trash2, ExternalLink,
  RefreshCw, Sparkles
} from 'lucide-react';

import ImageUploadCrop from '../Modal/ImageUploadCrop';
import HomeMarketplacePanel from './HomeMarketplacePanel';

function LeftSidebar({
  user,
  itemList = [],
  onOpenMarketplace,
  isAdmin = false,
  hoveredBtnId,
  setHoveredBtnId,
  softwareList = [],
  loadSoftwareCatalog,
  handleSaveApp,
  setDeleteTargetId,
  openDeleteModal
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [activeAppMenuId, setActiveAppMenuId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [name, setName] = useState('');
  const [version, setVersion] = useState('v1.0');
  const [description, setDescription] = useState('');
  const [downloadLink, setDownloadLink] = useState('');
  const [croppedFile, setCroppedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const [successStatus, setSuccessStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const softwareListRef = useRef(null);

  const availableListingCount = itemList.filter(item => Number(item.quantity) > 0).length;
  const outOfStockListingCount = itemList.filter(item => Number(item.quantity) <= 0).length;

  const getValidDownloadUrl = value => {
    if (!value || typeof value !== 'string') return null;
    const clean = value.trim();
    if (!clean || clean === '/404' || clean === '#' || clean === '404') return null;
    return clean;
  };

  const getImageUrl = image => {
    if (!image) return null;
    if (/^(https?:\/\/|blob:)/.test(image)) return image;

    const clean = image.startsWith('/public')
      ? image
      : `/public${image.startsWith('/') ? image : `/${image}`}`;

    return `${API_BASE_URL}${clean}`;
  };

  useEffect(() => {
    if (!successStatus) return;

    const timer = setTimeout(() => {
      setSuccessStatus('');
      setIsFormOpen(false);
    }, 2200);

    return () => clearTimeout(timer);
  }, [successStatus]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    const handleOutsideClick = e => {
      if (
        softwareListRef.current &&
        !softwareListRef.current.contains(e.target)
      ) {
        setActiveAppMenuId(null);
        setConfirmDeleteId(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const resetForm = () => {
    setSelectedId(null);
    setName('');
    setVersion('v1.0');
    setDescription('');
    setDownloadLink('');
    setCroppedFile(null);

    if (previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
    setErrors({});
  };

  const handleOpenCreate = () => {
    resetForm();
    setConfirmDeleteId(null);
    setActiveAppMenuId(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = app => {
    setSelectedId(app?._id || null);
    setName(app?.name || '');
    setVersion(app?.version || 'v1.0');
    setDescription(app?.description || '');
    setDownloadLink(
      app?.downloadLink && app.downloadLink !== '/404'
        ? app.downloadLink
        : ''
    );

    setCroppedFile(null);

    if (previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(getImageUrl(app?.image));
    setErrors({});
    setConfirmDeleteId(null);
    setActiveAppMenuId(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setErrors({});
  };

  const handleCropComplete = file => {
    if (!file) return;

    if (previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setCroppedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setIsCropOpen(false);
  };

  const validateFormFields = () => {
    const activeErrors = {};
    const cleanName = name.trim();
    const cleanVersion = version.trim();
    const cleanDescription = description.trim();

    const versionRegex = /^v\d+\.\d+(?:\.\d+)?$/i;

    if (!cleanName) {
      activeErrors.name = 'Extension title cannot be left blank.';
    }

    if (!cleanVersion) {
      activeErrors.version = 'Version is required.';
    } else if (!versionRegex.test(cleanVersion)) {
      activeErrors.version = 'Use a version such as v1.0 or v1.2.3.';
    }

    if (cleanDescription.length < 15) {
      activeErrors.description = 'Minimum 15 characters required.';
    }

    setErrors(activeErrors);

    return Object.keys(activeErrors).length === 0;
  };

  const handleSubmit = async e => {
    e?.preventDefault?.();

    if (isSaving || !validateFormFields()) return;

    if (typeof handleSaveApp !== 'function') {
      setErrors({ submit: 'Save handler is not available.' });
      return;
    }

    const cleanName = name.trim();

    const payload = {
      name: cleanName,
      version: version.trim(),
      description: description.trim(),
      downloadLink: downloadLink.trim(),
      slug: cleanName
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, '_')
        .replace(/^_+|_+$/g, '')
    };

    if (selectedId) {
      payload._id = selectedId;
    }

    try {
      setIsSaving(true);

      await handleSaveApp(payload, croppedFile);

      setSuccessStatus(
        selectedId
          ? '✓ Software configuration updated successfully.'
          : '✓ Software extension deployed successfully.'
      );

      if (typeof loadSoftwareCatalog === 'function') {
        await loadSoftwareCatalog();
      }
    } catch (error) {
      console.error('[LeftSidebar] Save error:', error);

      setErrors({
        submit:
          error?.response?.data?.message ||
          error?.message ||
          'Unable to save the software configuration.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestDelete = app => {
    if (!app?._id) return;

    setActiveAppMenuId(null);
    setConfirmDeleteId(app._id);
  };

  const handleDeleteApp = async app => {
    if (!app?._id || isDeleting) return;

    try {
      setIsDeleting(true);

      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_BASE_URL}/software/${app._id}`,
        {
          method: 'DELETE',
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {}
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Software deletion failed.');
      }

      setConfirmDeleteId(null);
      setActiveAppMenuId(null);
      setSuccessStatus('✓ Software extension deleted successfully.');

      if (typeof loadSoftwareCatalog === 'function') {
        await loadSoftwareCatalog();
      }
    } catch (error) {
      console.error('[LeftSidebar] Software deletion error:', error);

      setErrors({
        submit:
          error?.message ||
          'Unable to delete this software extension.'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
      <aside
      className="grid-left-aside"
      style={{
        display: 'block',
        width: '100%',
        maxWidth: '320px',
        alignSelf: 'start'
      }}
    >
      <style>{`
        @keyframes leftSidebarPulse{
          0%{transform:scale(.9);opacity:.55;box-shadow:0 0 0 0 rgba(37,99,235,.45)}
          70%{transform:scale(1);opacity:1;box-shadow:0 0 0 5px rgba(37,99,235,0)}
          100%{transform:scale(.9);opacity:.55;box-shadow:0 0 0 0 rgba(37,99,235,0)}
        }
        @keyframes leftSidebarDeleteIn{
          from{opacity:0;transform:translateY(-5px) scale(.98)}
          to{opacity:1;transform:translateY(0) scale(1)}
        }
        .left-sidebar-app-card{transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
        .left-sidebar-app-card:hover{transform:translateY(-2px);box-shadow:0 10px 25px rgba(15,23,42,.1);border-color:rgba(37,99,235,.28)!important}
        .left-sidebar-menu-item{transition:background-color .15s ease,transform .15s ease}
        .left-sidebar-menu-item:hover{transform:translateX(2px);background:var(--bg-main)}
        .left-sidebar-download:hover{text-decoration:underline!important}
        .left-sidebar-scrollbar::-webkit-scrollbar{width:5px}
        .left-sidebar-scrollbar::-webkit-scrollbar-track{background:transparent}
        .left-sidebar-scrollbar::-webkit-scrollbar-thumb{background:rgba(100,116,139,.25);border-radius:999px}
        .left-sidebar-delete-confirm{animation:leftSidebarDeleteIn .16s ease-out}
      `}</style>

      <div
        className="panel-card home-left-sidebar-card"
        style={{
          border: '2px solid var(--border-color)',
          borderRadius: '20px',
          padding: '15px',
          background: 'var(--bg-card)',
          boxShadow: '0 12px 30px -5px rgba(0,0,0,.12)'
        }}
      >
        <div
          style={{
            textAlign: 'center',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '14px',
            marginBottom: '14px'
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background:
                'linear-gradient(135deg,#2563eb,#3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px',
              color: '#fff',
              boxShadow:
                '0 7px 18px rgba(37,99,235,.28)'
            }}
          >
            <Sparkles size={21} />
          </div>

          <h3
            style={{
              margin: '0 0 3px',
              fontSize: '1.04rem',
              fontWeight: 900,
              letterSpacing: '-.025em',
              color: 'var(--text-primary,inherit)'
            }}
          >
            Overview
          </h3>

        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '7px',
            marginBottom: '14px'
          }}
        >
          <div
            style={{
              padding: '9px',
              borderRadius: '10px',
              background: 'rgba(37,99,235,.07)',
              border: '1px solid rgba(37,99,235,.13)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                color: '#2563eb',
                fontSize: '.62rem',
                fontWeight: 800,
                textTransform: 'uppercase'
              }}
            >
              <Package size={11} />
              Available listings
            </div>

            <div
              style={{
                marginTop: '3px',
                fontSize: '.95rem',
                fontWeight: 900,
                color: 'var(--text-primary,#0f172a)'
              }}
            >
              {availableListingCount}
            </div>
          </div>

          <div
            style={{
              padding: '9px',
              borderRadius: '10px',
              background:
                outOfStockListingCount > 0
                  ? 'rgba(245,158,11,.08)'
                  : 'rgba(16,185,129,.08)',
              border:
                outOfStockListingCount > 0
                  ? '1px solid rgba(245,158,11,.16)'
                  : '1px solid rgba(16,185,129,.16)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                color:
                  outOfStockListingCount > 0
                    ? '#d97706'
                    : '#059669',
                fontSize: '.62rem',
                fontWeight: 800,
                textTransform: 'uppercase'
              }}
            >
              {outOfStockListingCount > 0 ? (
                <AlertTriangle size={11} />
              ) : (
                <CheckCircle size={11} />
              )}
              Out of stock
            </div>

            <div
              style={{
                marginTop: '3px',
                fontSize: '.95rem',
                fontWeight: 900,
                color: 'var(--text-primary,#0f172a)'
              }}
            >
              {outOfStockListingCount}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '9px'
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Activity size={13} color="#2563eb" />
                <h4
                  style={{
                    margin: 0,
                    fontSize: '.75rem',
                    fontWeight: 900,
                    letterSpacing: '.05em',
                    textTransform: 'uppercase'
                  }}
                >
                  Extensions
                </h4>
              </div>

              <div
                style={{
                  marginTop: '2px',
                  fontSize: '.62rem',
                  opacity: .65
                }}
              >
                {softwareList.length} module
                {softwareList.length === 1 ? '' : 's'} available
              </div>
            </div>

            {isAdmin && <button
              type="button"
              aria-label="Deploy new software extension"
              onClick={handleOpenCreate}
              style={{
                width: '29px',
                height: '29px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                border: '1px solid rgba(37,99,235,.18)',
                background: 'rgba(37,99,235,.07)',
                color: '#2563eb',
                cursor: 'pointer'
              }}
            >
              <PlusCircle size={17} />
            </button>}
          </div>

          {successStatus && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 9px',
                marginBottom: '8px',
                borderRadius: '8px',
                background: '#d1fae5',
                color: '#065f46',
                fontSize: '.69rem',
                fontWeight: 800
              }}
            >
              <CheckCircle size={13} />
              {successStatus}
            </div>
          )}

          {errors.submit && (
            <div
              style={{
                padding: '8px 9px',
                marginBottom: '8px',
                borderRadius: '8px',
                background: 'rgba(239,68,68,.08)',
                color: '#dc2626',
                fontSize: '.69rem',
                fontWeight: 700
              }}
            >
              {errors.submit}
            </div>
          )}

          {isAdmin && isFormOpen && (
            <form
              onSubmit={handleSubmit}
              style={{
                background: 'var(--bg-main)',
                padding: '11px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '9px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#2563eb',
                    fontSize: '.7rem',
                    fontWeight: 900,
                    textTransform: 'uppercase'
                  }}
                >
                  {selectedId ? (
                    <>
                      <Pencil size={12} />
                      Modify Extension
                    </>
                  ) : (
                    <>
                      <PlusCircle size={12} />
                      New Extension
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleCloseForm}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    padding: '2px'
                  }}
                >
                  <XCircle size={16} />
                </button>
              </div>

              <input
                type="text"
                placeholder="Application Title"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  if (errors.name) {
                    setErrors(p => ({
                      ...p,
                      name: null
                    }));
                  }
                }}
                style={inputStyle(errors.name)}
              />

              {errors.name && (
                <ErrorMessage text={errors.name} />
              )}

              <input
                type="text"
                placeholder="Version String (v1.0)"
                value={version}
                onChange={e => {
                  setVersion(e.target.value);
                  if (errors.version) {
                    setErrors(p => ({
                      ...p,
                      version: null
                    }));
                  }
                }}
                style={inputStyle(errors.version)}
              />

              {errors.version && (
                <ErrorMessage text={errors.version} />
              )}

              <textarea
                placeholder="Describe what this extension does..."
                value={description}
                onChange={e => {
                  setDescription(e.target.value);
                  if (errors.description) {
                    setErrors(p => ({
                      ...p,
                      description: null
                    }));
                  }
                }}
                style={{
                  ...inputStyle(errors.description),
                  height: '58px',
                  resize: 'none',
                  fontFamily: 'inherit',
                  lineHeight: 1.4
                }}
              />

              {errors.description && (
                <ErrorMessage text={errors.description} />
              )}

              <input
                type="text"
                placeholder="Download URL (optional)"
                value={downloadLink}
                onChange={e =>
                  setDownloadLink(e.target.value)
                }
                style={inputStyle(false)}
              />

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px'
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsCropOpen(true)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '7px',
                    border:
                      '1px dashed var(--accent-blue,#2563eb)',
                    background: 'var(--bg-main)',
                    color: '#2563eb',
                    fontSize: '.71rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    borderRadius: '7px'
                  }}
                >
                  <UploadCloud size={13} />
                  {previewUrl
                    ? 'Change Logo'
                    : 'Upload Icon'}
                </button>

                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt=""
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      objectFit: 'cover',
                      border:
                        '1px solid var(--border-color)'
                    }}
                  />
                )}
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    ...formButton('#10b981'),
                    background: isSaving
                      ? '#94a3b8'
                      : '#10b981',
                    cursor: isSaving
                      ? 'not-allowed'
                      : 'pointer'
                  }}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={12} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={12} />
                      Save
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCloseForm}
                  style={{
                    ...formButton(
                      'rgba(100,116,139,.12)'
                    ),
                    color: 'inherit'
                  }}
                >
                  <XCircle size={12} />
                  Cancel
                </button>
              </div>
            </form>
          )}

          <ImageUploadCrop
            isOpen={isCropOpen}
            onClose={() => setIsCropOpen(false)}
            onCropComplete={handleCropComplete}
            title="Crop Extension Application Icon Logo"
          />

          <div
            ref={softwareListRef}
            className="left-sidebar-scrollbar"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '7px',
              maxHeight:
                softwareList.length > 5
                  ? '430px'
                  : 'none',
              overflowY:
                softwareList.length > 5
                  ? 'auto'
                  : 'visible',
              paddingRight:
                softwareList.length > 5
                  ? '3px'
                  : '0'
            }}
          >
            {!softwareList.length && (
              <div
                style={{
                  padding: '17px 10px',
                  textAlign: 'center',
                  border:
                    '1px dashed var(--border-color)',
                  borderRadius: '10px'
                }}
              >
                <Box
                  size={22}
                  style={{
                    opacity: .4,
                    marginBottom: '5px'
                  }}
                />

                <div
                  style={{
                    fontSize: '.72rem',
                    fontWeight: 800
                  }}
                >
                  No extensions deployed
                </div>

                <div
                  style={{
                    fontSize: '.63rem',
                    opacity: .65,
                    marginTop: '2px'
                  }}
                >
                  Add your first production tool above.
                </div>
              </div>
            )}

            {softwareList.map(app => {
              const isMenuOpen =
                activeAppMenuId === app?._id;

              const isConfirmingDelete =
                confirmDeleteId === app?._id;

              const imageUrl =
                getImageUrl(app?.image);

              const appDownloadUrl =
                getValidDownloadUrl(
                  app?.downloadLink
                );

              const versionText = app?.version || 'v1.0';

              return (
                <div
                  key={app?._id}
                  className="left-sidebar-app-card"
                  onMouseEnter={() =>
                    typeof setHoveredBtnId ===
                      'function' &&
                    setHoveredBtnId(app?.slug)
                  }
                  onMouseLeave={() => {
                    typeof setHoveredBtnId ===
                      'function' &&
                      setHoveredBtnId(null);
                  }}
                  style={{
                    padding: '10px',
                    borderRadius: '11px',
                    background: 'var(--bg-card)',
                    border: isConfirmingDelete
                      ? '1px solid rgba(239,68,68,.35)'
                      : '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '7px',
                    position: 'relative',
                    boxShadow:
                      hoveredBtnId === app?.slug
                        ? '0 8px 20px rgba(0,0,0,.08)'
                        : 'none'
                  }}
                >
                  {isAdmin && <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      zIndex: 20
                    }}
                  >
                    <button
                      type="button"
                      aria-label={`Open ${
                        app?.name || 'extension'
                      } menu`}
                      onClick={e => {
                        e.stopPropagation();

                        setActiveAppMenuId(
                          isMenuOpen
                            ? null
                            : app?._id
                        );

                        setConfirmDeleteId(null);
                      }}
                      style={{
                        width: '25px',
                        height: '25px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        borderRadius: '7px',
                        background: isMenuOpen
                          ? 'var(--bg-main)'
                          : 'transparent',
                        color: 'inherit',
                        opacity: isMenuOpen
                          ? 1
                          : .5,
                        cursor: 'pointer'
                      }}
                    >
                      <MoreVertical size={15} />
                    </button>

                    {isMenuOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '29px',
                          right: 0,
                          minWidth: '145px',
                          padding: '4px',
                          background:
                            'var(--bg-card)',
                          border:
                            '1px solid var(--border-color)',
                          borderRadius: '10px',
                          boxShadow:
                            '0 14px 30px rgba(15,23,42,.16)'
                        }}
                      >
                        <button
                          type="button"
                          className="left-sidebar-menu-item"
                          onClick={e => {
                            e.stopPropagation();
                            handleOpenEdit(app);
                          }}
                          style={menuButton()}
                        >
                          <Pencil size={13} />
                          Edit Extension
                        </button>

                        <button
                          type="button"
                          className="left-sidebar-menu-item"
                          onClick={e => {
                            e.stopPropagation();
                            handleRequestDelete(app);
                          }}
                          style={{
                            ...menuButton(),
                            color: '#ef4444',
                            borderTop:
                              '1px solid rgba(100,116,139,.12)'
                          }}
                        >
                          <Trash2 size={13} />
                          Delete Extension
                        </button>
                      </div>
                    )}
                  </div>}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      alignItems: 'center',
                      paddingRight: '25px'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        minWidth: 0
                      }}
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt=""
                          style={{
                            width: '36px',
                            height: '36px',
                            flexShrink: 0,
                            borderRadius: '9px',
                            objectFit: 'cover',
                            border:
                              '1px solid rgba(100,116,139,.2)'
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            flexShrink: 0,
                            borderRadius: '9px',
                            background:
                              'linear-gradient(135deg,rgba(37,99,235,.08),rgba(59,130,246,.15))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#2563eb'
                          }}
                        >
                          <Package size={17} />
                        </div>
                      )}

                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '.8rem',
                            fontWeight: 900,
                            lineHeight: 1.25,
                            overflowWrap: 'anywhere'
                          }}
                        >
                          {app?.name ||
                            'Unnamed Extension'}
                        </div>

                        <div
                          style={{
                            marginTop: '3px',
                            fontSize: '.6rem',
                            opacity: .7
                          }}
                        >
                          {versionText}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p
                    style={{
                      margin: 0,
                      fontSize: '.7rem',
                      color:
                        'var(--text-secondary,#64748b)',
                      lineHeight: 1.45,
                      fontWeight: 500,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {app?.description ||
                      'No description has been provided for this extension.'}
                  </p>

                  {isConfirmingDelete ? (
                    <div
                      className="left-sidebar-delete-confirm"
                      style={{
                        padding: '12px',
                        borderRadius: '11px',
                        background:
                          'linear-gradient(135deg,rgba(239,68,68,.1),rgba(239,68,68,.04))',
                        border:
                          '1px solid rgba(239,68,68,.22)',
                        boxShadow:
                          '0 5px 15px rgba(239,68,68,.06)'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '9px'
                        }}
                      >
                        <div
                          style={{
                            width: '30px',
                            height: '30px',
                            flexShrink: 0,
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background:
                              'rgba(239,68,68,.12)',
                            color: '#dc2626'
                          }}
                        >
                          <Trash2 size={15} />
                        </div>

                        <div
                          style={{
                            minWidth: 0,
                            flex: 1
                          }}
                        >
                          <div
                            style={{
                              fontSize: '.74rem',
                              fontWeight: 900,
                              color: '#b91c1c',
                              lineHeight: 1.25
                            }}
                          >
                            Delete extension?
                          </div>

                          <div
                            style={{
                              fontSize: '.64rem',
                              color:
                                'var(--text-secondary,#64748b)',
                              lineHeight: 1.35,
                              marginTop: '3px'
                            }}
                          >
                            <strong>
                              {app?.name ||
                                'This extension'}
                            </strong>{' '}
                            will be permanently removed.
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: '6px',
                          marginTop: '10px',
                          paddingTop: '9px',
                          borderTop:
                            '1px solid rgba(239,68,68,.12)'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmDeleteId(null)
                          }
                          disabled={isDeleting}
                          style={{
                            border:
                              '1px solid var(--border-color)',
                            background:
                              'var(--bg-card)',
                            color: 'inherit',
                            borderRadius: '7px',
                            padding: '6px 10px',
                            fontSize: '.65rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteApp(app)
                          }
                          disabled={isDeleting}
                          style={{
                            border: 'none',
                            background: '#dc2626',
                            color: '#fff',
                            borderRadius: '7px',
                            padding: '6px 10px',
                            fontSize: '.65rem',
                            fontWeight: 800,
                            cursor: isDeleting
                              ? 'not-allowed'
                              : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            opacity: isDeleting
                              ? .7
                              : 1
                          }}
                        >
                          {isDeleting ? (
                            <>
                              <RefreshCw size={11} />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 size={11} />
                              Delete
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : appDownloadUrl ? (
                    <a
                      href={appDownloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="left-sidebar-download"
                      style={{
                        fontSize: '.7rem',
                        color: '#2563eb',
                        fontWeight: 800,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        marginTop: '1px',
                        alignSelf: 'flex-start'
                      }}
                    >
                      <Download size={12} />
                      Download Setup
                      <ExternalLink size={10} />
                    </a>
                  ) : (
                    <span
                      style={{
                        fontSize: '.65rem',
                        color:
                          'var(--text-secondary,#94a3b8)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        marginTop: '1px'
                      }}
                    >
                      <Download size={11} />
                      Download unavailable
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <HomeMarketplacePanel user={user} itemList={itemList} onOpenMarketplace={onOpenMarketplace} />
      </div>
    </aside>
  );
}

const inputStyle = error => ({
  padding: '8px 9px',
  borderRadius: '7px',
  border: error
    ? '2px solid #ef4444'
    : '1px solid var(--border-color)',
  background: 'var(--bg-card)',
  color: 'inherit',
  fontSize: '.78rem',
  outline: 'none'
});

const formButton = background => ({
  flex: 1,
  padding: '7px',
  background,
  color: '#fff',
  border: 'none',
  borderRadius: '7px',
  fontSize: '.72rem',
  fontWeight: 800,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px'
});

const menuButton = () => ({
  width: '100%',
  padding: '8px',
  border: 'none',
  background: 'none',
  color: 'inherit',
  borderRadius: '7px',
  textAlign: 'left',
  cursor: 'pointer',
  fontSize: '.72rem',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  gap: '7px'
});

function ErrorMessage({ text }) {
  return (
    <span
      style={{
        color: '#ef4444',
        fontSize: '.65rem',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
        marginTop: '-3px'
      }}
    >
      <AlertCircle size={11} />
      {text}
    </span>
  );
}

export default LeftSidebar;
