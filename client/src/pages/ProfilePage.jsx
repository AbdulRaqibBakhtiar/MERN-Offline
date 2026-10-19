import React, { useEffect, useRef, useState } from 'react';
import { Banknote, Camera, Check, CreditCard, Heart, LogOut, MapPin, Pencil, ShieldCheck, UserRound, X } from 'lucide-react';
import { API_BASE_URL } from '../api/config';
import ImageUploadCrop from '../components/Modal/ImageUploadCrop';
import SuccessModal from '../components/Modal/SuccessModal';
import { useProfileData } from '../hooks/useProfileData';
import { useAuth } from '../context/AuthContext';
import { getAvatarUrl } from '../utils/avatar';
import UserAvatar from '../components/Layout/UserAvatar';

const ProfileField = ({ label, value, onChange, type = 'text', isEditing = false, required = false, placeholder = '', emptyText = 'Not added' }) => (
  <label className={`account-field ${isEditing ? 'is-editing' : ''}`}>
    <span className="account-field-label">{label}</span>
    {isEditing ? <input type={type} value={value} onChange={onChange} required={required} placeholder={placeholder} />
      : <div className="account-field-value">{value || <span className="account-field-empty">{emptyText}</span>}</div>}
  </label>
);

const paymentPreferenceNames = {
  cash_on_delivery: 'Cash on delivery',
  card_to_seller: 'Debit or credit card with seller',
  bank_transfer: 'Bank transfer'
};

const ProfilePage = ({ user, handleLogout, wishlist = [], onRemoveFromWishlist }) => {
  const { updateProfileState } = useAuth();
  const [editingSection, setEditingSection] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [savedSection, setSavedSection] = useState(null);
  const savedTimer = useRef(null);
  const {
    isCropModalOpen, setIsCropModalOpen,
    isSuccessModalOpen, setIsSuccessModalOpen, modalMessage,
    isSaving, firstName, setFirstName, lastName, setLastName,
    phone, setPhone, email, setEmail, street, setStreet, city, setCity,
    stateLocation, setStateLocation, zipCode, setZipCode, country, setCountry,
    preferredPaymentMethod, setPreferredPaymentMethod,
    avatarPreviewUrl, handleCroppedAvatarArrival, handleProfileFormSubmit, resetProfileForm
  } = useProfileData({ user, handleLogout, onProfileUpdateSuccess: updateProfileState });

  const displayName = [firstName, lastName].filter(Boolean).join(' ') || user?.username || 'Your profile';
  const avatar = avatarPreviewUrl || getAvatarUrl(user?.profileImage) || '';
  const hasDeliveryAddress = [street, city, stateLocation, zipCode].some(value => value?.trim());

  useEffect(() => () => window.clearTimeout(savedTimer.current), []);

  const requestSave = event => {
    event.preventDefault();
    setConfirmation({ type: 'save', section: editingSection });
  };
  const confirmAction = async () => {
    if (!confirmation) return;
    const { type, section } = confirmation;
    if (type === 'discard') {
      resetProfileForm(section);
      setEditingSection(null);
      setConfirmation(null);
      return;
    }
    const saved = await handleProfileFormSubmit(null, section);
    setConfirmation(null);
    if (saved) {
      setEditingSection(null);
      setSavedSection(section);
      window.clearTimeout(savedTimer.current);
      savedTimer.current = window.setTimeout(() => setSavedSection(null), 3200);
    }
  };
  const cancelEditing = section => setConfirmation({ type: 'discard', section });

  return (
    <main className="account-page">
      <section className="account-hero">
        <div className="account-identity">
          <button className="account-avatar" type="button" onClick={() => setIsCropModalOpen(true)} aria-label="Change profile photo" title="Change profile photo">
            <UserAvatar person={{ firstName: displayName, profileImage: avatar }} className="account-profile-avatar" alt={`${displayName} profile photo`} />
            <span className="account-avatar-hover"><Camera size={15} /><small>Edit photo</small></span>
          </button>
          <div className="account-identity-copy"><span className="account-eyebrow">YOUR ACCOUNT</span><h1>{displayName}</h1><p>@{user?.username || 'member'} <span className="account-identity-dot">·</span> <span className="account-role"><ShieldCheck size={13} /> {user?.role || 'Member'}</span></p></div>
        </div>
        <button className="account-button account-button-logout" type="button" onClick={handleLogout}><LogOut size={15} /> Sign out</button>
      </section>

      <form id="account-personal-form" className="account-panel" onSubmit={requestSave}>
        <div className="account-panel-heading">
          <div className="account-panel-icon"><UserRound size={17} /></div><div className="account-panel-title"><h2>Personal information {savedSection === 'personal' && <span className="account-saved-badge"><Check size={13} /> Saved</span>}</h2><p>Your name and preferred contact details.</p></div>
          {editingSection === 'personal' ? <div className="account-section-actions"><button type="button" className="account-section-cancel" onClick={() => cancelEditing('personal')} disabled={isSaving}><X size={14} /> Cancel</button><button type="submit" className="account-section-save" disabled={isSaving}>{isSaving ? 'Saving…' : <><Check size={14} /> Save changes</>}</button></div>
            : <button type="button" className="account-section-edit" disabled={editingSection !== null} onClick={() => setEditingSection('personal')}><Pencil size={14} /> Edit</button>}
        </div>
        <div className="account-fields-grid">
          <ProfileField label="First name" value={firstName} onChange={event => setFirstName(event.target.value)} isEditing={editingSection === 'personal'} required />
          <ProfileField label="Last name" value={lastName} onChange={event => setLastName(event.target.value)} isEditing={editingSection === 'personal'} required />
          <ProfileField label="Email address" value={email} onChange={event => setEmail(event.target.value)} type="email" isEditing={editingSection === 'personal'} required />
          <ProfileField label="Phone number" value={phone} onChange={event => setPhone(event.target.value)} type="tel" isEditing={editingSection === 'personal'} placeholder="Add a phone number" />
        </div>
      </form>

      <form id="account-delivery-form" className="account-panel" onSubmit={requestSave}>
        <div className="account-panel-heading">
          <div className="account-panel-icon"><MapPin size={17} /></div><div className="account-panel-title"><h2>Delivery information {savedSection === 'address' && <span className="account-saved-badge"><Check size={13} /> Saved</span>}</h2><p>Your default address for marketplace orders.</p></div>
          {editingSection === 'address' ? <div className="account-section-actions"><button type="button" className="account-section-cancel" onClick={() => cancelEditing('address')} disabled={isSaving}><X size={14} /> Cancel</button><button type="submit" className="account-section-save" disabled={isSaving}>{isSaving ? 'Saving…' : <><Check size={14} /> Save changes</>}</button></div>
            : <button type="button" className="account-section-edit" disabled={editingSection !== null} onClick={() => setEditingSection('address')}><Pencil size={14} /> Edit</button>}
        </div>
        {!hasDeliveryAddress && editingSection !== 'address' && <div className="account-address-nudge"><div><strong>Add a delivery address</strong><span>Save an address to make marketplace checkout quicker.</span></div><button type="button" onClick={() => setEditingSection('address')} disabled={editingSection !== null}><MapPin size={14} /> Add address</button></div>}
        <div className="account-fields-grid account-address-grid">
          <ProfileField label="Street address" value={street} onChange={event => setStreet(event.target.value)} isEditing={editingSection === 'address'} emptyText="Add your street address" />
          <ProfileField label="City" value={city} onChange={event => setCity(event.target.value)} isEditing={editingSection === 'address'} emptyText="Add your city" />
          <ProfileField label="State or region" value={stateLocation} onChange={event => setStateLocation(event.target.value)} isEditing={editingSection === 'address'} emptyText="Add a state or region" />
          <ProfileField label="Postal code" value={zipCode} onChange={event => setZipCode(event.target.value)} isEditing={editingSection === 'address'} emptyText="Add a postal code" />
          <ProfileField label="Country" value={country} onChange={event => setCountry(event.target.value)} isEditing={editingSection === 'address'} emptyText="Choose a country" />
        </div>
      </form>

      <form id="account-payment-form" className="account-panel" onSubmit={requestSave}>
        <div className="account-panel-heading">
          <div className="account-panel-icon"><CreditCard size={17} /></div><div className="account-panel-title"><h2>Payment preference {savedSection === 'payment' && <span className="account-saved-badge"><Check size={13} /> Saved</span>}</h2><p>Your default preference for marketplace order requests.</p></div>
          {editingSection === 'payment' ? <div className="account-section-actions"><button type="button" className="account-section-cancel" onClick={() => cancelEditing('payment')} disabled={isSaving}><X size={14} /> Cancel</button><button type="submit" className="account-section-save" disabled={isSaving}>{isSaving ? 'Saving…' : <><Check size={14} /> Save changes</>}</button></div>
            : <button type="button" className="account-section-edit" disabled={editingSection !== null} onClick={() => setEditingSection('payment')}><Pencil size={14} /> Edit</button>}
        </div>
        <div className="account-fields-grid">
          <label className="account-field"><span className="account-field-label">Preferred method</span>{editingSection === 'payment' ? <select value={preferredPaymentMethod} onChange={event => setPreferredPaymentMethod(event.target.value)}><option value="cash_on_delivery">Cash on delivery</option><option value="card_to_seller">Debit or credit card with seller</option><option value="bank_transfer">Bank transfer</option></select> : <div className="account-field-value">{paymentPreferenceNames[preferredPaymentMethod] || paymentPreferenceNames.cash_on_delivery}</div>}</label>
        </div>
        <p className="account-payment-note"><Banknote size={14} /> This saves your preference only. Bazzar does not store card numbers or security codes, and does not process payments online.</p>
      </form>

      <section className="account-panel account-wishlist-panel">
        <div className="account-panel-heading account-wishlist-heading"><div className="account-panel-icon"><Heart size={17} /></div><div className="account-panel-title"><h2>Saved items <span>{wishlist.length}</span></h2><p>Your shortlist from the marketplace.</p></div></div>
        {wishlist.length ? <div className="account-wishlist-grid">{wishlist.map(item => <article className="account-wishlist-card" key={item._id}>
          <div className="account-wishlist-image">{item.imagePath ? <img src={`${API_BASE_URL}${item.imagePath}`} alt={item.name} /> : <span><Heart size={20} /></span>}</div>
          <div className="account-wishlist-copy"><span>{item.brand || item.category || 'Marketplace item'}</span><strong>{item.name}</strong><b>${Number(item.price || 0).toFixed(2)}</b></div>
          <button type="button" aria-label={`Remove ${item.name} from saved items`} onClick={() => onRemoveFromWishlist?.(item)}>×</button>
        </article>)}</div> : <div className="account-wishlist-empty"><Heart size={20} /><span>Nothing saved yet</span><p>Save an item from the marketplace and it will show up here.</p></div>}
      </section>

      {confirmation && <div className="account-confirm-overlay" role="presentation">
        <section className="account-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="account-confirm-title">
          <div className="account-confirm-icon">{confirmation.type === 'save' ? <Check size={19} /> : <X size={19} />}</div>
          <h2 id="account-confirm-title">{confirmation.type === 'save' ? 'Save these changes?' : 'Discard your changes?'}</h2>
          <p>{confirmation.type === 'save' ? `Your ${confirmation.section === 'personal' ? 'personal information' : confirmation.section === 'payment' ? 'payment preference' : 'delivery information'} will be updated.` : 'Your unsaved changes will be lost.'}</p>
          <div className="account-confirm-actions"><button type="button" className="account-confirm-secondary" onClick={() => setConfirmation(null)} disabled={isSaving}>Go back</button><button type="button" className={confirmation.type === 'save' ? 'account-confirm-primary' : 'account-confirm-danger'} onClick={confirmAction} disabled={isSaving}>{isSaving ? 'Saving…' : confirmation.type === 'save' ? 'Confirm and save' : 'Discard changes'}</button></div>
        </section>
      </div>}

      <ImageUploadCrop isOpen={isCropModalOpen} onClose={() => setIsCropModalOpen(false)} onCropComplete={async file => { handleCroppedAvatarArrival(file); await handleProfileFormSubmit(null, 'avatar', file); }} title="Update profile photo" aspect={1} />
      <SuccessModal isOpen={isSuccessModalOpen} message={modalMessage} onClose={() => setIsSuccessModalOpen(false)} />
    </main>
  );
};

export default ProfilePage;
