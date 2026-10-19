
import { API_BASE_URL } from '../api/config';
import React, { useState } from 'react';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import '../App.css';
import ImageUploadCrop from '../components/Modal/ImageUploadCrop';
import PaginationModal from '../components/Modal/PaginationModal';
import LeftSidebar from '../components/Dashboard/LeftSideBar';
import NewsCard from '../components/Dashboard/NewsCard';
import RightSidebar from '../components/Dashboard/RightSideBar';
import { AdminBroadcastConsole } from './AdminBroadcastConsole';

function HomePage({
  user,
  setActiveTab,
  setMarketplaceInitialView,
  itemList = [],
  openDeleteModal,
  deleteTargetId,
  setDeleteTargetId,
  handleConfirmDelete,
  externalSearchQuery = '',
  externalSearchCategory = '',
  handleSavePostEdit,
  setSearchCategory,
  homeDataProps,
  isAdmin = false,
}) {
  const [, setDeleteCommentTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    liveNews,
    liveAd,
    softwareList,
    loadSoftwareCatalog,
    handleSaveApp,
    isNewsCropOpen,
    setIsNewsCropOpen,
    isAdCropOpen,
    setIsAdCropOpen,
    isEditNewsCropOpen,
    setIsEditNewsCropOpen,
    isEditAdCropOpen,
    setIsEditAdCropOpen,
    croppedNewsFile,
    setCroppedNewsFile,
    newsPreviewUrl,
    setNewsPreviewUrl,
    croppedAdFile,
    setCroppedAdFile,
    adPreviewUrl,
    setAdPreviewUrl,
    editNewsPreviewUrl,
    editAdPreviewUrl,
    isNewsExpanded,
    setIsNewsExpanded,
    newComment,
    setNewComment,
    currentPage,
    setCurrentPage,
    editingNewsId,
    setEditingNewsId,
    editTitle,
    setEditTitle,
    editSummary,
    setEditSummary,
    editFullText,
    setEditFullText,
    editingAdId,
    setEditingAdId,
    editAdTitle,
    setEditAdTitle,
    editAdDescription,
    setEditAdDescription,
    expandedCommentsMap,
    setExpandedCommentsMap,
    activeMenuId,
    setActiveMenuId,
    activeAdMenuId,
    setActiveAdMenuId,
    hoveredBtnId,
    setHoveredBtnId,
    currentNewsPosts,
    totalPages,
    handleNewsCroppedReturn,
    handleAdCroppedReturn,
    handleNewsEditCroppedReturn,
    handleAdEditCroppedReturn,
    handleCommentSubmit,
    handleCommentDelete,
    handleNewsLike,
    handleCommentApprove,
    handleCommentDisapprove,
    startEditingNews,
    startEditingAd,
    executeNewsSave,
    executeAdSave,
    loadNewsFeed,
    loadAdBanners,
  } = homeDataProps;

  const handleCommentEdit = async (newsId, commentId, text) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_BASE_URL}/content/news/${newsId}/comments/${commentId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to edit comment.');
      }

      await loadNewsFeed();
      return true;
    } catch (err) {
      console.error('Comment edit error:', err);
      return false;
    }
  };

  const requestNewsDelete = async (id) => {
    if (!id || deleteLoading) return false;

    setDeleteLoading(true);

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${API_BASE_URL}/content/news/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        let message = 'Failed to delete news article.';

        try {
          const data = await response.json();

          if (data?.message) {
            message = data.message;
          }
        } catch {}

        throw new Error(message);
      }

      setActiveMenuId(null);
      await loadNewsFeed();
      return true;
    } catch (err) {
      console.error('News deletion error:', err);
      return false;
    } finally {
      setDeleteLoading(false);
    }
  };

  const themeTransition =
    'background-color .3s ease, border-color .3s ease, color .3s ease, box-shadow .3s ease';

  return (
    <div
      className="dashboard-grid unique-three-column-layout"
      style={{
        display: 'grid',
        gridTemplateColumns: '220px minmax(0, 1fr) 240px',
        gap: '10px',
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '12px',
        fontFamily: 'system-ui, sans-serif',
        transition: themeTransition,
      }}
    >
      {/* LEFT SIDEBAR */}
      <LeftSidebar
        user={user}
        itemList={itemList}
        onOpenMarketplace={(view) => {
          setMarketplaceInitialView?.(view);
          setActiveTab?.('items');
        }}
        isAdmin={isAdmin}
        hoveredBtnId={hoveredBtnId}
        setHoveredBtnId={setHoveredBtnId}
        softwareList={softwareList}
        loadSoftwareCatalog={loadSoftwareCatalog}
        handleSaveApp={handleSaveApp}
      />

      {/* CENTER CONTENT */}
      <section
        className="grid-center"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          minWidth: 0,
        }}
      >
        {/* BAZZAR MARKETPLACE HERO */}
        <section
          className="home-marketplace-hero"
          aria-label="Browse the Bazzar marketplace"
          style={{
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '24px',
            padding: '30px',
            borderRadius: '20px',
            border: '1px solid var(--border-color, #e2e8f0)',
            background:
              'linear-gradient(135deg, var(--card-bg, #ffffff) 0%, var(--bg-secondary, #f8fafc) 100%)',
            boxShadow: '0 8px 28px rgba(15, 23, 42, 0.06)',
            transition: themeTransition,
          }}
        >
          {/* Decorative background accent */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '-65px',
              right: '-45px',
              width: '190px',
              height: '190px',
              borderRadius: '50%',
              background: 'rgba(37, 99, 235, 0.07)',
              pointerEvents: 'none',
            }}
          />

          {/* Hero icon and copy */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '18px',
              flex: '1 1 260px',
              minWidth: 0,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                width: '50px',
                height: '50px',
                borderRadius: '15px',
                color: '#ffffff',
                background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                boxShadow: '0 6px 16px rgba(37, 99, 235, 0.24)',
              }}
            >
              <ShoppingBag size={24} strokeWidth={2} />
            </div>

            <div style={{ minWidth: 0 }}>
              <span
                style={{
                  display: 'inline-block',
                  marginBottom: '10px',
                  color: 'var(--accent-color, #2563eb)',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                }}
              >
                Bazzar Marketplace
              </span>

              <h1
                style={{
                  margin: '0 0 10px',
                  color: 'var(--text-color, #0f172a)',
                  fontSize: 'clamp(22px, 2.5vw, 30px)',
                  fontWeight: 800,
                  lineHeight: 1.25,
                  letterSpacing: '-0.8px',
                }}
              >
                Find useful things from your community.
              </h1>

              <p
                style={{
                  margin: 0,
                  maxWidth: '460px',
                  color: 'var(--text-muted, #64748b)',
                  fontSize: '14px',
                  lineHeight: 1.8,
                }}
              >
                Explore tools, equipment, and parts. Discover listings,
                connect with sellers, and send order requests.
              </p>
            </div>
          </div>

          {/* Marketplace navigation */}
          <button
            type="button"
            onClick={() => setActiveTab?.('items')}
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '13px 19px',
              border: 'none',
              borderRadius: '12px',
              background: '#2563eb',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              boxShadow: '0 5px 14px rgba(37, 99, 235, 0.2)',
              transition:
                'background-color 0.2s ease, transform 0.2s ease',
            }}
          >
            Browse listings
            <ArrowRight size={17} />
          </button>
        </section>

        {/* ADMIN BROADCAST CONSOLE */}
        {['admin', 'editor', 'author'].includes(user?.role) && (
          <AdminBroadcastConsole
            croppedNewsFile={croppedNewsFile}
            setCroppedNewsFile={setCroppedNewsFile}
            newsPreviewUrl={newsPreviewUrl}
            setNewsPreviewUrl={setNewsPreviewUrl}
            setIsNewsCropOpen={setIsNewsCropOpen}
            loadNewsFeed={loadNewsFeed}
            croppedAdFile={croppedAdFile}
            setCroppedAdFile={setCroppedAdFile}
            adPreviewUrl={adPreviewUrl}
            setAdPreviewUrl={setAdPreviewUrl}
            setIsAdCropOpen={setIsAdCropOpen}
            loadAdBanners={loadAdBanners}
            softwareList={softwareList}
            loadSoftwareCatalog={loadSoftwareCatalog}
            handleSaveApp={handleSaveApp}
            themeTransition={themeTransition}
          />
        )}

        {/* NEWS FEED */}
        <div
          className="home-news-deck-wrapper"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {liveNews.length === 0 ? (
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                color: 'var(--text-muted, #64748b)',
                borderRadius: '16px',
                border: '1px dashed var(--border-color, #cbd5e1)',
                fontWeight: '500',
                fontStyle: 'italic',
              }}
            >
              📢 No news announcements published yet.
            </div>
          ) : (
            currentNewsPosts.map((newsItem) => (
              <NewsCard
                key={newsItem._id}
                newsItem={newsItem}
                user={user}
                editingNewsId={editingNewsId}
                setEditingNewsId={setEditingNewsId}
                editNewsPreviewUrl={editNewsPreviewUrl}
                setIsEditNewsCropOpen={setIsEditNewsCropOpen}
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                editSummary={editSummary}
                setEditSummary={setEditSummary}
                editFullText={editFullText}
                setEditFullText={setEditFullText}
                executeNewsSave={executeNewsSave}
                setSearchCategory={setSearchCategory}
                activeMenuId={activeMenuId}
                setActiveMenuId={setActiveMenuId}
                startEditingNews={startEditingNews}
                requestNewsDelete={requestNewsDelete}
                isNewsExpanded={isNewsExpanded}
                setIsNewsExpanded={setIsNewsExpanded}
                expandedCommentsMap={expandedCommentsMap}
                setExpandedCommentsMap={setExpandedCommentsMap}
                handleCommentDelete={handleCommentDelete}
                handleCommentSubmit={handleCommentSubmit}
                handleNewsLike={handleNewsLike}
                handleCommentApprove={handleCommentApprove}
                handleCommentDisapprove={handleCommentDisapprove}
                newComment={newComment}
                setNewComment={setNewComment}
                setDeleteCommentTarget={setDeleteCommentTarget}
                handleCommentEdit={handleCommentEdit}
              />
            ))
          )}
        </div>
      </section>

      {/* RIGHT SIDEBAR */}
      <RightSidebar
        isAdmin={isAdmin}
        liveAd={liveAd}
        editingAdId={editingAdId}
        setEditingAdId={setEditingAdId}
        editAdPreviewUrl={editAdPreviewUrl}
        setIsEditAdCropOpen={setIsEditAdCropOpen}
        editAdTitle={editAdTitle}
        setEditAdTitle={setEditAdTitle}
        editAdDescription={editAdDescription}
        setAdEditDescription={setEditAdDescription}
        executeAdSave={executeAdSave}
        activeAdMenuId={activeAdMenuId}
        setActiveAdMenuId={setActiveAdMenuId}
        startEditingAd={startEditingAd}
        openDeleteModal={openDeleteModal}
        setSearchCategory={setSearchCategory}
        hoveredBtnId={hoveredBtnId}
        setHoveredBtnId={setHoveredBtnId}
        croppedAdFile={croppedAdFile}
        setCroppedAdFile={setCroppedAdFile}
        adPreviewUrl={adPreviewUrl}
        setAdPreviewUrl={setAdPreviewUrl}
        setIsAdCropOpen={setIsAdCropOpen}
        loadAdBanners={loadAdBanners}
      />

      {/* NEWS IMAGE CROP MODAL */}
      <ImageUploadCrop
        isOpen={isNewsCropOpen}
        onClose={() => setIsNewsCropOpen(false)}
        onCropCompleteSuccess={handleNewsCroppedReturn}
        title="Configure Live News Feed Asset Image"
      />

      {/* AD IMAGE CROP MODAL */}
      <ImageUploadCrop
        isOpen={isAdCropOpen}
        onClose={() => setIsAdCropOpen(false)}
        onCropCompleteSuccess={handleAdCroppedReturn}
        title="Configure Promo Campaign Banner Graphics"
      />

      {/* EDIT NEWS IMAGE CROP MODAL */}
      <ImageUploadCrop
        isOpen={isEditNewsCropOpen}
        onClose={() => setIsEditNewsCropOpen(false)}
        onCropCompleteSuccess={handleNewsEditCroppedReturn}
        title="Modify Existing News Article Image"
      />

      {/* EDIT AD IMAGE CROP MODAL */}
      <ImageUploadCrop
        isOpen={isEditAdCropOpen}
        onClose={() => setIsEditAdCropOpen(false)}
        onCropCompleteSuccess={handleAdEditCroppedReturn}
        title="Modify Promo Campaign Banner Graphics"
      />

      {/* PAGINATION */}
      <div
        style={{
          gridColumn: '1 / -1',
          marginTop: '20px',
        }}
      >
        <PaginationModal
          currentPage={currentPage}
          totalPages={totalPages}
          totalPosts={liveNews.length}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}

export default HomePage;
