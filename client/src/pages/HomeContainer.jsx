// src/pages/HomeContainer.jsx
import React, { useState } from 'react';
import HomePage from './HomePage';
import InventoryPage from './InventoryPage';
import ProfilePage from './ProfilePage';
import AboutPage from './AboutPage';
import ProductPurchasePage from './ProductPurchasePage';
import ArticlesPage from './ArticlesPage';
import DeleteModal from '../components/Modal/DeleteModal';

// Shared Context Hooks & Sub-Modules
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useInventory } from '../hooks/useInventory';
import { useContainerData } from '../hooks/useContainerData';
import { useHomeData } from '../hooks/useHomeData';

import ContainerHeader from '../components/Navigation/ContainerHeader';
import DashboardFooter from '../components/Navigation/DashboardFooter';
import { LiveChatDrawer } from '../components/Dashboard/LiveChatDrawer';

const HomeContainer = ({ theme, setTheme }) => {
    const { user, logout, token } = useAuth();
    const { socket } = useSocket();
    const [chatRequest, setChatRequest] = useState(null);
    const [articleSearchQuery, setArticleSearchQuery] = useState('');
    const inventory = useInventory();
    const [marketplaceInitialView, setMarketplaceInitialView] = useState('browse');
    const {
        activeTab,
        setActiveTab,
        showProfile,
        setShowProfile,
        selectedPurchaseId,
        setSelectedPurchaseId,
        wishlist,
        globalSearchQuery,
        setGlobalSearchQuery,
        inventorySearchQuery,
        setInventorySearchQuery,
        searchCategory,
        setSearchCategory,
        searchOpen,
        setSearchOpen,
        successNotice,
        triggerToggleWishlist,
        handleCloseNotice,
        triggerSaveEdit,
        triggerConfirmDelete
    } = useContainerData({ token, inventory });

    const homeData = useHomeData({
        itemList: Array.isArray(inventory.itemList) ? inventory.itemList : [],
        deleteTargetId: inventory.deleteTargetId,
        handleSavePostEdit: triggerSaveEdit,
        externalSearchQuery: globalSearchQuery,
        externalSearchCategory: searchCategory
    });

    const activeFilteredInventory = {
        ...inventory,
        itemList: (inventory.itemList || []).filter(item => {
            const targetQuery = inventorySearchQuery || "";
            if (!targetQuery.trim()) return true;
            const term = targetQuery.toLowerCase();
            return (item.name || "").toLowerCase().includes(term) || (item.brand || "").toLowerCase().includes(term);
        })
    };
    return (
        <div className="dashboard-container" style={{ minHeight: '100vh', background: 'var(--bg-main, #121214)', color: 'var(--text-primary, #0f172a)', display: 'flex', flexDirection: 'column' }}>
            <ContainerHeader
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                searchOpen={searchOpen}
                setSearchOpen={setSearchOpen}
                globalSearchQuery={globalSearchQuery}
                setGlobalSearchQuery={setGlobalSearchQuery}
                setInventorySearchQuery={setInventorySearchQuery}
                setSearchCategory={setSearchCategory}
                setArticleSearchQuery={setArticleSearchQuery}
                user={user}
                theme={theme}
                setTheme={setTheme}
                showProfile={showProfile}
                setShowProfile={setShowProfile}
                wishlist={wishlist}
                triggerToggleWishlist={triggerToggleWishlist}
                logout={logout}
                rawInventoryItems={Array.isArray(inventory.itemList) ? inventory.itemList : []}
                rawNewsItems={homeData.liveNews || []}
                rawAdItems={homeData.liveAd || []}
            />

            <main className="main-viewport" style={{ flex: 1, padding: activeTab === 'purchase_item' ? '8px 24px 24px' : '24px' }}>
                <div className="content-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {activeTab === 'home' && (
                        <div className="fade-in">
                            <HomePage
                                user={user}
                                setActiveTab={setActiveTab}
                                setMarketplaceInitialView={setMarketplaceInitialView}
                                itemList={Array.isArray(inventory.itemList) ? inventory.itemList : []}
                                isAdmin={user?.role === 'admin'}
                                openDeleteModal={inventory.openDeleteModal}
                                deleteTargetId={inventory.deleteTargetId}
                                setDeleteTargetId={inventory.setDeleteTargetId}
                                handleConfirmDelete={triggerConfirmDelete}
                                externalSearchQuery={globalSearchQuery}
                                externalSearchCategory={searchCategory}
                                handleSavePostEdit={triggerSaveEdit}
                                setSearchCategory={setSearchCategory}
                                homeDataProps={homeData}
                            />
                        </div>
                    )}

                    {activeTab === 'articles' && <div className="fade-in"><ArticlesPage user={user} searchQuery={articleSearchQuery} onClearSearch={() => setArticleSearchQuery('')} /></div>}

                    {activeTab === 'items' && (
                        <div className="fade-in">
                            <InventoryPage
                                inventory={activeFilteredInventory}
                                user={user}
                                searchQuery={inventorySearchQuery}
                                setSearchQuery={setInventorySearchQuery}
                                searchCategory={searchCategory}
                                setSearchCategory={setSearchCategory}
                                initialView={marketplaceInitialView}
                                wishlist={wishlist}
                                onToggleWishlist={triggerToggleWishlist}
                                onBuyNow={(itemId) => { setSelectedPurchaseId(itemId); setActiveTab('purchase_item'); }}
                            />
                        </div>
                    )}

                    {activeTab === 'profile_tab' && (
                        <div className="fade-in">
                            <ProfilePage
                                user={user}
                                handleLogout={logout}
                                wishlist={wishlist}
                                onRemoveFromWishlist={triggerToggleWishlist}
                                onProfileUpdateSuccess={() => { window.location.reload(); }}
                            />
                        </div>
                    )}

                    {activeTab === 'about' && <div className="fade-in"><AboutPage /></div>}

                    {activeTab === 'purchase_item' && (
                        <div className="fade-in">
                            <ProductPurchasePage itemId={selectedPurchaseId} onBack={() => setActiveTab('items')} onOpenSellerChat={request => setChatRequest({ ...request, requestId: Date.now() })} />
                        </div>
                    )}
                </div>
            </main>
            <DashboardFooter />

            <LiveChatDrawer socket={socket} user={user} chatRequest={chatRequest} onChatRequestHandled={() => setChatRequest(null)} />

            <DeleteModal
                deleteTargetId={inventory.deleteTargetId}
                handleConfirmDelete={triggerConfirmDelete}
                setDeleteTargetId={inventory.setDeleteTargetId}
            />

            {successNotice.show && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifycontent: 'center', zIndex: 999999 }}>
                    <div className="modal" style={{ background: 'var(--bg-card, #1a1a1e)', borderTop: successNotice.type === 'DELETE' ? '4px solid #dc3545' : successNotice.type === 'NO_CHANGES' ? '4px solid #2563eb' : '4px solid #28a745', padding: '24px', borderRadius: '12px', textAlign: 'center', width: '90%', maxWidth: '340px', borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
                        <span>{successNotice.type === 'DELETE' ? '🗑️' : successNotice.type === 'NO_CHANGES' ? 'ℹ️' : '✅'}</span>
                        <h3 style={{ marginTop: '10px', color: 'var(--text-primary, #0f172a)', fontSize: '1.1rem' }}>{successNotice.message}</h3>
                        <button className="add-button" style={{ background: successNotice.type === 'DELETE' ? '#dc3545' : successNotice.type === 'NO_CHANGES' ? '#2563eb' : '#28a745', color: '#ffffff', border: 'none', padding: '10px 24px', cursor: 'pointer', marginTop: '14px', width: '100%', borderRadius: '6px', fontWeight: '600' }} onClick={handleCloseNotice}>Continue Operations</button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default HomeContainer;
