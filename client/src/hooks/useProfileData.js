// ==========================================
// USE PROFILE DATA HOOK - PART 1 OF 2
// ==========================================
import { useState, useEffect } from 'react';

export function useProfileData({ user, handleLogout, onProfileUpdateSuccess }) {
  const [editMode, setEditMode] = useState(false);
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

  const [finalAvatarFile, setFinalAvatarFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(null);

  // 🛠️ FAIL-SAFE BASE URL: Points your phone directly to your laptop over the mobile hotspot LAN
const BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : `http://${window.location.hostname}:5000`;

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
    }
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }
    setAvatarPreviewUrl(null);
    setFinalAvatarFile(null);
  }, [user]);

  const handleCroppedAvatarArrival = (fileBlob) => {
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }
    setFinalAvatarFile(fileBlob);
    setAvatarPreviewUrl(URL.createObjectURL(fileBlob));
  };
// ==========================================
// USE PROFILE DATA HOOK - PART 2 OF 2
// ==========================================
  const handleProfileFormSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    
    try {
      const token = localStorage.getItem('token');
      const formDataPacket = new FormData();
      formDataPacket.append('firstName', firstName.trim());
      formDataPacket.append('lastName', lastName.trim());
      formDataPacket.append('phoneNumber', phone.trim());
      formDataPacket.append('email', email.trim());

      const addressDataString = JSON.stringify({
        street: street.trim(),
        city: city.trim(),
        state: stateLocation.trim(),
        postalCode: zipCode.trim(),
        country: country.trim()
      });
      formDataPacket.append('shippingAddress', addressDataString);

      if (finalAvatarFile) {
        formDataPacket.append('avatarImage', finalAvatarFile);
      }

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
        return;
      }

      if (response.ok) {
        const result = await response.json();
        setEditMode(false);
        setModalMessage("Centralized account profile layout metrics and storage coordinates synced successfully!");
        setIsSuccessModalOpen(true);
        if (onProfileUpdateSuccess) onProfileUpdateSuccess(result.user);
      } else {
        setModalMessage("Profile compilation execution error. Verify authorization barriers.");
        setIsSuccessModalOpen(true);
      }
    } catch (err) {
      console.error(err);
      setModalMessage("A critical hardware communication fault occurred during synchronization protocols.");
      setIsSuccessModalOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    editMode, setEditMode, isCropModalOpen, setIsCropModalOpen, isSuccessModalOpen, setIsSuccessModalOpen,
    modalMessage, setModalMessage, isSaving, hoveredBtn, setHoveredBtn, firstName, setFirstName,
    lastName, setLastName, phone, setPhone, email, setEmail, street, setStreet, city, setCity,
    stateLocation, setStateLocation, zipCode, setZipCode, country, setCountry, avatarPreviewUrl,
    handleCroppedAvatarArrival, handleProfileFormSubmit
  };
}
