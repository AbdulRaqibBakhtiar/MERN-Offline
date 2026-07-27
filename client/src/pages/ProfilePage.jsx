import React from 'react';
import ImageUploadCrop from '../components/Modal/ImageUploadCrop';
import SuccessModal from '../components/Modal/SuccessModal';

// Decoupled Business Hooks & Sub-Modules
import { useProfileData } from '../hooks/useProfileData';
import WishlistItemCard from '../components/Profile/WishlistItemCard';
import { useAuth } from "../context/AuthContext";

const ProfilePage = ({ user, handleLogout, wishlist = [], onRemoveFromWishlist, onProfileUpdateSuccess }) => {
  
  const { updateProfileState } = useAuth();
  const {
    editMode, setEditMode, isCropModalOpen, setIsCropModalOpen,
    isSuccessModalOpen, setIsSuccessModalOpen, modalMessage,
    isSaving, hoveredBtn, setHoveredBtn,
    firstName, setFirstName, lastName, setLastName, phone, setPhone, email, setEmail,
    street, setStreet, city, setCity, stateLocation, setStateLocation, zipCode, setZipCode, country, setCountry,
    avatarPreviewUrl, handleCroppedAvatarArrival, handleProfileFormSubmit
  } = useProfileData({ user, handleLogout, onProfileUpdateSuccess: updateProfileState });

  return (
    <div style={{ maxWidth: '950px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '25px', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif', color: 'var(--text-primary, #0f172a)', padding: '20px 0' }} className="profile-page-view">
      
      {/* Top Banner Context Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card, #fff)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', flexWrap: 'wrap', gap: '20px' }} className="profile-top-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div onClick={() => editMode && setIsCropModalOpen(true)} style={{ width: '88px', height: '88px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', overflow: 'hidden', border: editMode ? '3px solid #3b82f6' : '3px solid var(--bg-card, #fff)', position: 'relative', cursor: editMode ? 'pointer' : 'default', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} title={editMode ? "Click to configure profile picture" : ""} className="profile-avatar-frame">
            {avatarPreviewUrl ? (
              <img src={avatarPreviewUrl} alt="Cropped Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : user?.profileImage ? (
              <img src={`http://localhost:5000${user.profileImage}`} alt="Current Active Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '2rem', fontWeight: 'bold', letterSpacing: '-0.05em' }}>{(firstName || user?.username || "U").charAt(0).toUpperCase()}</span>
            )}
            {editMode && (
              <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(2px)', color: '#fff', fontSize: '9px', textAlign: 'center', padding: '5px 0', fontWeight: '700', letterSpacing: '0.05em' }}>📷 CHANGE</div>
            )}
          </div>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', fontWeight: '700', letterSpacing: '-0.025em', color: 'var(--text-primary, inherit)' }}>{firstName ? `${firstName} ${lastName}` : user?.username || "User Account Profile"}</h2>
            <p style={{ margin: '0', color: 'var(--text-muted, #64748b)', fontSize: '0.875rem' }}>Account Registry Handle: <strong style={{ color: 'var(--text-primary, #0f172a)' }}>{user?.username}</strong></p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="button" onClick={() => setEditMode(!editMode)} onMouseEnter={() => setHoveredBtn(editMode ? 'cancel' : 'edit')} onMouseLeave={() => setHoveredBtn(null)} style={{ padding: '12px 24px', backgroundColor: editMode ? 'var(--border-color, #f1f5f9)' : '#3b82f6', color: editMode ? 'var(--text-primary, #64748b)' : '#fff', border: editMode ? '1px solid var(--border-color, #cbd5e1)' : 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem', transition: 'all 0.2s', transform: hoveredBtn === 'edit' || hoveredBtn === 'cancel' ? 'translateY(-1px)' : 'translateY(0)' }} >
            {editMode ? "Cancel Revision" : "Modify User Profile"}
          </button>
          <button type="button" onClick={handleLogout} onMouseEnter={() => setHoveredBtn('logout')} onMouseLeave={() => setHoveredBtn(null)} style={{ padding: '12px 24px', backgroundColor: hoveredBtn === 'logout' ? '#b91c1c' : '#dc3545', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem', transition: 'all 0.2s', transform: hoveredBtn === 'logout' ? 'translateY(-1px)' : 'translateY(0)', boxShadow: hoveredBtn === 'logout' ? '0 4px 12px rgba(220,53,69,0.3)' : 'none' }} >
            Logout Session
          </button>
        </div>
      </div>
      <form onSubmit={handleProfileFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
        
        {/* Core Personal Information Metrics Section */}
        <div style={{ background: 'var(--bg-card, #fff)', padding: '28px', borderRadius: '16px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.15rem', borderBottom: '1px solid var(--border-color, #f1f5f9)', paddingBottom: '12px', color: '#2563eb', fontWeight: '700', letterSpacing: '-0.01em' }}>Personal Contacts & Core Correspondence</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div><label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '600', color: 'var(--text-primary, #475569)' }}>Given First Name</label><input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={!editMode || isSaving} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', background: editMode ? 'var(--bg-card, #fff)' : 'var(--bg-main, #f8fafc)', color: 'var(--text-primary, #0f172a)', boxSizing: 'border-box', fontSize: '0.9rem' }} /></div>
            <div><label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '600', color: 'var(--text-primary, #475569)' }}>Family Surname</label><input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={!editMode || isSaving} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', background: editMode ? 'var(--bg-card, #fff)' : 'var(--bg-main, #f8fafc)', color: 'var(--text-primary, #0f172a)', boxSizing: 'border-box', fontSize: '0.9rem' }} /></div>
            <div><label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '600', color: 'var(--text-primary, #475569)' }}>Primary Telephone Contact</label><input type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!editMode || isSaving} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', background: editMode ? 'var(--bg-card, #fff)' : 'var(--bg-main, #f8fafc)', color: 'var(--text-primary, #0f172a)', boxSizing: 'border-box', fontSize: '0.9rem' }} /></div>
            <div><label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '600', color: 'var(--text-primary, #475569)' }}>Electronic Mail Address</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!editMode || isSaving} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', background: editMode ? 'var(--bg-card, #fff)' : 'var(--bg-main, #f8fafc)', color: 'var(--text-primary, #0f172a)', boxSizing: 'border-box', fontSize: '0.9rem' }} /></div>
          </div>
        </div>

        {/* Shipping Parameters Address Box */}
        <div style={{ background: 'var(--bg-card, #fff)', padding: '28px', borderRadius: '16px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.15rem', borderBottom: '1px solid var(--border-color, #f1f5f9)', paddingBottom: '12px', color: '#2563eb', fontWeight: '700', letterSpacing: '-0.01em' }}>Default Fulfillment Shipping Address</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '600', color: 'var(--text-primary, #475569)' }}>Street Line Address Locator</label>
              <input type="text" placeholder="Apartment numbers, building name, street lines..." value={street} onChange={(e) => setStreet(e.target.value)} disabled={!editMode || isSaving} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', background: editMode ? 'var(--bg-card, #fff)' : 'var(--bg-main, #f8fafc)', color: 'var(--text-primary, #0f172a)', boxSizing: 'border-box', fontSize: '0.9rem' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
              <div><label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '600', color: 'var(--text-primary, #475569)' }}>City Hub</label><input type="text" value={city} onChange={(e) => setCity(e.target.value)} disabled={!editMode || isSaving} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', background: editMode ? 'var(--bg-card, #fff)' : 'var(--bg-main, #f8fafc)', color: 'var(--text-primary, #0f172a)', boxSizing: 'border-box', fontSize: '0.9rem' }} /></div>
              <div><label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '600', color: 'var(--text-primary, #475569)' }}>State / Region Province</label><input type="text" value={stateLocation} onChange={(e) => setStateLocation(e.target.value)} disabled={!editMode || isSaving} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', background: editMode ? 'var(--bg-card, #fff)' : 'var(--bg-main, #f8fafc)', color: 'var(--text-primary, #0f172a)', boxSizing: 'border-box', fontSize: '0.9rem' }} /></div>
              <div><label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '600', color: 'var(--text-primary, #475569)' }}>Postal Code / ZIP</label><input type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)} disabled={!editMode || isSaving} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', background: editMode ? 'var(--bg-card, #fff)' : 'var(--bg-main, #f8fafc)', color: 'var(--text-primary, #0f172a)', boxSizing: 'border-box', fontSize: '0.9rem' }} /></div>
              <div><label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px', fontWeight: '600', color: 'var(--text-primary, #475569)' }}>Sovereign Country</label><input type="text" value={country} onChange={(e) => setCountry(e.target.value)} disabled={!editMode || isSaving} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', background: editMode ? 'var(--bg-card, #fff)' : 'var(--bg-main, #f8fafc)', color: 'var(--text-primary, #0f172a)', boxSizing: 'border-box', fontSize: '0.9rem' }} /></div>
            </div>
          </div>
        </div>
        {editMode && (
          <button type="submit" disabled={isSaving} onMouseEnter={() => setHoveredBtn('submit')} onMouseLeave={() => setHoveredBtn(null)} style={{ padding: '16px', backgroundColor: isSaving ? 'var(--text-muted, #6b7280)' : hoveredBtn === 'submit' ? '#059669' : '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1.05rem', fontWeight: '700', cursor: isSaving ? 'not-allowed' : 'pointer', width: '100%', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', transform: hoveredBtn === 'submit' && !isSaving ? 'translateY(-2px)' : 'translateY(0)', boxShadow: hoveredBtn === 'submit' && !isSaving ? '0 10px 15px -3px rgba(16,185,129,0.4)' : '0 4px 6px -1px rgba(16,185,129,0.15)' }} >
            {isSaving ? "Synchronizing Storage Logs..." : "Commit Operational Profile Details"}
          </button>
        )}
      </form>
      {/* Lower Dashboard Bookmarked Wishlist Feed Module */}
      <div style={{ background: 'var(--bg-card, #fff)', padding: '28px', borderRadius: '16px', border: '1px solid var(--border-color, #e2e8f0)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }} className="profile-wishlist-panel">
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.15rem', color: '#2563eb', fontWeight: '700', letterSpacing: '-0.01em' }}>My Saved Wishlist Items ({wishlist.length})</h3>
        {wishlist.length === 0 ? (
          <p style={{ color: 'var(--text-muted, #64748b)', fontStyle: 'italic', margin: '5px 0', fontSize: '0.9rem' }}>Your wishlist is empty. Bookmark tools in the dashboard inventory catalog workspace.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '16px', marginTop: '10px' }} className="wishlist-grid-deck">
            {wishlist.map(item => (
              <WishlistItemCard 
                key={item._id}
                item={item}
                hoveredBtn={hoveredBtn}
                setHoveredBtn={setHoveredBtn}
                onRemoveFromWishlist={onRemoveFromWishlist}
              />
            ))}
          </div>
        )}
      </div>

      {/* Backdrop Crop Modal Controls */}
      <ImageUploadCrop isOpen={isCropModalOpen} onClose={() => setIsCropModalOpen(false)} onCropComplete={handleCroppedAvatarArrival} title="Crop Custom Account Avatar Photo" aspect={1} />
      <SuccessModal isOpen={isSuccessModalOpen} message={modalMessage} onClose={() => setIsSuccessModalOpen(false)} />
    </div>
  );
};

export default ProfilePage;
