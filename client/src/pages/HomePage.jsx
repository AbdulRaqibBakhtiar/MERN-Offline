// src/pages/HomePage.jsx
import React from 'react';
import '../App.css';
import ImageUploadCrop from '../components/Modal/ImageUploadCrop';
import PaginationModal from '../components/Modal/PaginationModal';
import LeftSidebar from '../components/Dashboard/LeftSideBar';
import NewsCard from '../components/Dashboard/NewsCard';
import RightSidebar from '../components/Dashboard/RightSideBar';
import { AdminBroadcastConsole } from './AdminBroadcastConsole';

function HomePage({ 
  itemList = [], openDeleteModal, deleteTargetId, setDeleteTargetId, handleConfirmDelete, 
  externalSearchQuery = "", externalSearchCategory = "", handleSavePostEdit, setSearchCategory, 
  homeDataProps, metricHistory, createSnapshot, metricLoading, snapshotStatus 
}) {
  const { 
    liveNews, liveAd, softwareList, loadSoftwareCatalog, handleSaveApp, isNewsCropOpen, setIsNewsCropOpen, 
    isAdCropOpen, setIsAdCropOpen, isEditNewsCropOpen, setIsEditNewsCropOpen, isEditAdCropOpen, setIsEditAdCropOpen, 
    croppedNewsFile, setCroppedNewsFile, newsPreviewUrl, setNewsPreviewUrl, croppedAdFile, setCroppedAdFile, 
    adPreviewUrl, setAdPreviewUrl, finalEditNewsFile, editNewsPreviewUrl, finalEditAdFile, editAdPreviewUrl, 
    isNewsExpanded, setIsNewsExpanded, newComment, setNewComment, currentPage, setCurrentPage, editingNewsId, 
    setEditingNewsId, editTitle, setEditTitle, editSummary, setEditSummary, editFullText, setEditFullText, 
    editingAdId, setEditingAdId, editAdTitle, setEditAdTitle, editAdDescription, setEditAdDescription, 
    expandedCommentsMap, setExpandedCommentsMap, activeMenuId, setActiveMenuId, activeAdMenuId, 
    setActiveAdMenuId, hoveredBtnId, setHoveredBtnId, totalInventoryValue, lowStockCount, 
    currentNewsPosts, totalPages, handleNewsCroppedReturn, handleAdCroppedReturn, handleNewsEditCroppedReturn, 
    handleAdEditCroppedReturn, handleCommentSubmit, handleCommentDelete, startEditingNews, startEditingAd, 
    executeNewsSave, executeAdSave, loadNewsFeed, loadAdBanners 
  } = homeDataProps;

  const themeTransition = 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 240px', gap: '14px', maxWidth: '1100px', margin: '0 auto', padding: '12px', fontFamily: 'system-ui, sans-serif', transition: themeTransition }} className="dashboard-grid unique-three-column-layout">
      
      <LeftSidebar totalInventoryValue={totalInventoryValue} lowStockCount={lowStockCount} metricHistory={metricHistory} createSnapshot={createSnapshot} metricLoading={metricLoading} snapshotStatus={snapshotStatus} hoveredBtnId={hoveredBtnId} setHoveredBtnId={setHoveredBtnId} softwareList={softwareList} loadSoftwareCatalog={loadSoftwareCatalog} handleSaveApp={handleSaveApp} />

      <section className="grid-center" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', transition: themeTransition }}>
        
        <AdminBroadcastConsole 
          croppedNewsFile={croppedNewsFile} setCroppedNewsFile={setCroppedNewsFile}
          newsPreviewUrl={newsPreviewUrl} setNewsPreviewUrl={setNewsPreviewUrl}
          setIsNewsCropOpen={setIsNewsCropOpen} loadNewsFeed={loadNewsFeed}
          croppedAdFile={croppedAdFile} setCroppedAdFile={setCroppedAdFile}
          adPreviewUrl={adPreviewUrl} setAdPreviewUrl={setAdPreviewUrl}
          setIsAdCropOpen={setIsAdCropOpen} loadAdBanners={loadAdBanners}
          softwareList={softwareList} loadSoftwareCatalog={loadSoftwareCatalog}
          handleSaveApp={handleSaveApp} themeTransition={themeTransition}
        />

        <div className="home-news-deck-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '16px', transition: themeTransition }}>
          {liveNews.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted, #64748b)', background: 'transparent', borderRadius: '16px', border: '1px dashed var(--border-color, #cbd5e1)', fontWeight: '500', fontStyle: 'italic', transition: themeTransition }}>📢 No news announcements published yet.</div>
          ) : (
            currentNewsPosts.map((newsItem) => (
              <div key={newsItem._id} id={`news-card-${newsItem._id}`} style={{ transition: themeTransition }}>
                <NewsCard newsItem={newsItem} editingNewsId={editingNewsId} setEditingNewsId={setEditingNewsId} editNewsPreviewUrl={editNewsPreviewUrl} setIsEditNewsCropOpen={setIsEditNewsCropOpen} editTitle={editTitle} setEditTitle={setEditTitle} editSummary={editSummary} setEditSummary={setEditSummary} editFullText={editFullText} setEditFullText={setEditFullText} executeNewsSave={executeNewsSave} setSearchCategory={setSearchCategory} activeMenuId={activeMenuId} setActiveMenuId={setActiveMenuId} startEditingNews={startEditingNews} openDeleteModal={openDeleteModal} isNewsExpanded={isNewsExpanded} setIsNewsExpanded={setIsNewsExpanded} expandedCommentsMap={expandedCommentsMap} setExpandedCommentsMap={setExpandedCommentsMap} handleCommentDelete={handleCommentDelete} handleCommentSubmit={handleCommentSubmit} newComment={newComment} setNewComment={setNewComment} />
              </div>
            ))
          )}
        </div>
      </section>

      <RightSidebar liveAd={liveAd} editingAdId={editingAdId} setEditingAdId={setEditingAdId} editAdPreviewUrl={editAdPreviewUrl} setIsEditAdCropOpen={setIsEditAdCropOpen} editAdTitle={editAdTitle} setEditAdTitle={setEditAdTitle} editAdDescription={editAdDescription} setAdEditDescription={setEditAdDescription} executeAdSave={executeAdSave} activeAdMenuId={activeAdMenuId} setActiveAdMenuId={setActiveAdMenuId} startEditingAd={startEditingAd} openDeleteModal={openDeleteModal} setSearchCategory={setSearchCategory} hoveredBtnId={hoveredBtnId} setHoveredBtnId={setHoveredBtnId} croppedAdFile={croppedAdFile} setCroppedAdFile={setCroppedAdFile} adPreviewUrl={adPreviewUrl} setAdPreviewUrl={setAdPreviewUrl} setIsAdCropOpen={setIsAdCropOpen} loadAdBanners={loadAdBanners} />

      <ImageUploadCrop isOpen={isNewsCropOpen} onClose={() => setIsNewsCropOpen(false)} onCropCompleteSuccess={handleNewsCroppedReturn} title="Configure Live News Feed Asset Image" />
      <ImageUploadCrop isOpen={isAdCropOpen} onClose={() => setIsAdCropOpen(false)} onCropCompleteSuccess={handleAdCroppedReturn} title="Configure Promo Campaign Banner Graphics" />
      <ImageUploadCrop isOpen={isEditNewsCropOpen} onClose={() => setIsEditNewsCropOpen(false)} onCropCompleteSuccess={handleNewsEditCroppedReturn} title="Modify Existing News Article Image" />
      <ImageUploadCrop isOpen={isEditAdCropOpen} onClose={() => setIsEditAdCropOpen(false)} onCropCompleteSuccess={handleAdEditCroppedReturn} title="Modify Promo Campaign Banner Graphics" />

      <div style={{ gridColumn: 'span 3', marginTop: '20px', transition: themeTransition }}>
        <PaginationModal currentPage={currentPage} totalPages={totalPages} totalPosts={liveNews.length} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}

export default HomePage;