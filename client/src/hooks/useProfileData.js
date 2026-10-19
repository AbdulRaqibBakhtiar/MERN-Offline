// ==========================================
// USE PROFILE DATA HOOK - PART 1 OF 2
// ==========================================
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../api/config';

export function useProfileData({ user, handleLogout, onProfileUpdateSuccess }) {
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState(null);

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phone, setPhone] = useState(user?.phoneNumber || "");
  const [email, setEmail] = useState(user?.email || "");
  const [street, setStreet] = useState(user?.shippingAddress?.street || "");
  const [city, setCity] = useState(user?.shippingAddress?.city || "");
  const [stateLocation, setStateLocation] = useState(user?.shippingAddress?.state || "");
  const [zipCode, setZipCode] = useState(user?.shippingAddress?.postalCode || "");
  const [country, setCountry] = useState(user?.shippingAddress?.country || "United States");
  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState(user?.preferredPaymentMethod || 'cash_on_delivery');

  const [finalAvatarFile, setFinalAvatarFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(null);

  // 🛠️ FAIL-SAFE BASE URL: Points your phone directly to your laptop over the mobile hotspot LAN
const BASE_URL = API_BASE_URL;

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhone(user.phoneNumber || "");
      setEmail(user.email || "");
      setStreet(user.shippingAddress?.street || "");
      setCity(user.shippingAddress?.city || "");
      setStateLocation(user.shippingAddress?.state || "");
      setZipCode(user.shippingAddress?.postalCode || "");
      setCountry(user.shippingAddress?.country || "United States");
      setPreferredPaymentMethod(user.preferredPaymentMethod || 'cash_on_delivery');
    }
    setAvatarPreviewUrl(null);
    setFinalAvatarFile(null);
  }, [user]);

  useEffect(() => {
    if (!avatarPreviewUrl) return undefined;
    return () => URL.revokeObjectURL(avatarPreviewUrl);
  }, [avatarPreviewUrl]);

  const handleCroppedAvatarArrival = (fileBlob) => {
    setFinalAvatarFile(fileBlob);
    setAvatarPreviewUrl(URL.createObjectURL(fileBlob));
  };

  const resetProfileForm = (section = 'all') => {
    if (section === 'all' || section === 'personal') {
      setFirstName(user?.firstName || '');
      setLastName(user?.lastName || '');
      setPhone(user?.phoneNumber || '');
      setEmail(user?.email || '');
    }
    if (section === 'all' || section === 'address') {
      setStreet(user?.shippingAddress?.street || '');
      setCity(user?.shippingAddress?.city || '');
      setStateLocation(user?.shippingAddress?.state || '');
      setZipCode(user?.shippingAddress?.postalCode || '');
      setCountry(user?.shippingAddress?.country || 'United States');
    }
    if (section === 'all' || section === 'payment') setPreferredPaymentMethod(user?.preferredPaymentMethod || 'cash_on_delivery');
    if (section === 'all' || section === 'avatar') {
      setAvatarPreviewUrl(null);
      setFinalAvatarFile(null);
    }
  };
// ==========================================
// USE PROFILE DATA HOOK - PART 2 OF 2
// ==========================================
  const handleProfileFormSubmit = async (e, section = 'all', avatarOverride = null) => {
    e?.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    
    try {
      const token = localStorage.getItem('token');
      const formDataPacket = new FormData();
      if (section === 'all' || section === 'personal') {
        formDataPacket.append('firstName', firstName.trim());
        formDataPacket.append('lastName', lastName.trim());
        formDataPacket.append('phoneNumber', phone.trim());
        formDataPacket.append('email', email.trim());
      }
      if (section === 'all' || section === 'address') {
        formDataPacket.append('shippingAddress', JSON.stringify({
          street: street.trim(), city: city.trim(), state: stateLocation.trim(),
          postalCode: zipCode.trim(), country: country.trim()
        }));
      }
      if (section === 'all' || section === 'payment') formDataPacket.append('preferredPaymentMethod', preferredPaymentMethod);
      const avatarFile = avatarOverride || finalAvatarFile;
      if ((section === 'all' || section === 'avatar') && avatarFile) formDataPacket.append('avatarImage', avatarFile);

      // 🛠️ FIX: Replaced hardcoded localhost endpoint string path directly with hotspot network variable URL
      const response = await fetch(`${BASE_URL}/auth/profile/update`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataPacket
      });

      if (response.status === 401) {
        setModalMessage("Your operational session validation parameter has expired. Re-authentication required.");
        setIsSuccessModalOpen(true);
        setTimeout(() => { handleLogout(); }, 3000);
        return false;
      }

      if (response.ok) {
        const result = await response.json();
        if (section === 'avatar') {
          setModalMessage('Your profile photo has been updated.');
          setIsSuccessModalOpen(true);
        }
        if (onProfileUpdateSuccess) onProfileUpdateSuccess(result.user);
        if (section === 'avatar') resetProfileForm('avatar');
        return true;
      } else {
        const result = await response.json().catch(() => ({}));
        setModalMessage(result.error || 'Could not save your profile changes. Please try again.');
        setIsSuccessModalOpen(true);
        return false;
      }
    } catch (err) {
      console.error(err);
      setModalMessage("Could not connect to the server. Please try again.");
      setIsSuccessModalOpen(true);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isCropModalOpen, setIsCropModalOpen, isSuccessModalOpen, setIsSuccessModalOpen,
    modalMessage, setModalMessage, isSaving, hoveredBtn, setHoveredBtn, firstName, setFirstName,
    lastName, setLastName, phone, setPhone, email, setEmail, street, setStreet, city, setCity,
    stateLocation, setStateLocation, zipCode, setZipCode, country, setCountry, preferredPaymentMethod, setPreferredPaymentMethod, avatarPreviewUrl,
    handleCroppedAvatarArrival, handleProfileFormSubmit, resetProfileForm
  };
}
