// src/pages/HomeContainer.jsx
import React from 'react';
import HomePage from './HomePage';
import InventoryPage from './InventoryPage';
import ProfilePage from './ProfilePage';
import SettingsPage from './SettingsPage';
import ProductPurchasePage from './ProductPurchasePage';
import DeleteModal from '../components/Modal/DeleteModal';

// Shared Context Hooks & Sub-Modules
import useMetrics from '../hooks/useMetrics';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext'; // 🔌 Injects socket connection data layer
import { useInventory } from '../hooks/useInventory';
import { useContainerData } from '../hooks/useContainerData';
import { useHomeData } from '../hooks/useHomeData';

import ContainerHeader from '../components/Navigation/ContainerHeader';
import DashboardFooter from '../components/Navigation/DashboardFooter';
import { LiveChatDrawer } from '../components/Dashboard/LiveChatDrawer'; // 💬 Injects layout chat

const HomeContainer = ({ theme, setTheme }) => {
    const { user, logout, token } = useAuth();
    const socketContext = useSocket();

    console.log("FULL SOCKET CONTEXT:", socketContext);

    const { socket } = socketContext;

    console.log("EXTRACTED SOCKET:", socket);
    console.log("SOCKET ON FUNCTION:", socket?.on);
    const inventory = useInventory();
    const { metricHistory, createSnapshot, metricLoading, snapshotStatus } = useMetrics();
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
        triggerConfirmDelete,
        deleteTargetId,
        setDeleteTargetId,
        openDeleteModal
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
                user={user}
                showProfile={showProfile}
                setShowProfile={setShowProfile}
                wishlist={wishlist}
                triggerToggleWishlist={triggerToggleWishlist}
                logout={logout}
                rawInventoryItems={Array.isArray(inventory.itemList) ? inventory.itemList : []}
                rawNewsItems={homeData.liveNews || []}
            />

            <main className="main-viewport" style={{ flex: 1, padding: '24px' }}>
                <div className="content-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {activeTab === 'home' && (
                        <div className="fade-in">
                            <HomePage
                                itemList={Array.isArray(inventory.itemList) ? inventory.itemList : []}
                                metricHistory={metricHistory}
                                createSnapshot={createSnapshot}
                                metricLoading={metricLoading}
                                snapshotStatus={snapshotStatus}
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

                    {activeTab === 'items' && (
                        <div className="fade-in">
                            <InventoryPage
                                inventory={activeFilteredInventory}
                                searchQuery={inventorySearchQuery}
                                setSearchQuery={setInventorySearchQuery}
                                searchCategory={searchCategory}
                                setSearchCategory={setSearchCategory}
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

                    {activeTab === 'settings' && (
                        <div className="fade-in" style={{ margin: '1.5rem' }}>
                            <SettingsPage theme={theme} setTheme={setTheme} />
                        </div>
                    )}

                    {activeTab === 'purchase_item' && (
                        <div className="fade-in">
                            <ProductPurchasePage itemId={selectedPurchaseId} onBack={() => setActiveTab('items')} />
                        </div>
                    )}
                </div>
            </main>
            <DashboardFooter />

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

            {/* 🎯 FLOATING COLLABORATIVE CHAT MODULE TRIGGER BLOCK */}
            <LiveChatDrawer socket={socket} user={user} />

        </div>
    );
};

export default HomeContainer;
