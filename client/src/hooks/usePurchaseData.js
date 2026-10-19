// ==========================================
// USE PURCHASE DATA HOOK - PART 1 OF 2
// ==========================================
import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL } from '../api/config';

export function usePurchaseData({ itemId, token, onBack }) {
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Interactive Review States
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  // Checkout & UI Aux States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [purchaseSubmitting, setPurchaseSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [hoveredBtnId, setHoveredBtnId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Administrative Inline Parameters Refactoring States
  const [editName, setEditName] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editQuantity, setEditQuantity] = useState(0);
  const [editPrice, setEditPrice] = useState(0);
  const [editCategory, setEditCategory] = useState("tools");
  const [editDescription, setEditDescription] = useState("");
  const [editCondition, setEditCondition] = useState("");
  const [editWarranty, setEditWarranty] = useState("");
  const [editDimensions, setEditDimensions] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editPowerSource, setEditPowerSource] = useState("");

  // System Image Management State Hooks
  const [isEditCropOpen, setIsEditCropOpen] = useState(false);
  const [finalEditFile, setFinalEditFile] = useState(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState(null);
  const [saveSubmitting, setSaveSubmitting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const fetchSequence = useRef(0);

  // 🛠️ FAIL-SAFE BASE URL: Bypasses localhost to route requests directly to your laptop over the hotspot network
const BASE_URL = API_BASE_URL;

  const hydrateFormStates = useCallback((data) => {
    if (!data) return;
    setEditName(data.name || "");
    setEditBrand(data.brand || "");
    setEditQuantity(data.quantity || 0);
    setEditPrice(data.price || 0);
    setEditCategory(data.category || "tools");
    setEditDescription(data.description || "");
    setEditCondition(data.condition || "");
    setEditWarranty(data.warranty || "");
    setEditDimensions(data.specifications?.dimensions || "");
    setEditWeight(data.specifications?.weight || "");
    setEditPowerSource(data.specifications?.powerSource || "");
  }, []);

  const fetchProductDetails = useCallback(async () => {
    const sequence = ++fetchSequence.current;
    try {
      setLoading(true);
      setError(null);
      // 🛠️ FIX: Replaced localhost URL with hotspot string variable
      const url = `${BASE_URL}/inventory/${itemId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`Fetch blueprint fault: ${response.status}`);
      const data = await response.json();
      if (sequence !== fetchSequence.current) return;
      setProduct(data);
      hydrateFormStates(data);
    } catch (err) {
      if (sequence === fetchSequence.current) {
        setProduct(null);
        setError(err.message);
      }
    } finally {
      if (sequence === fetchSequence.current) setLoading(false);
    }
  }, [BASE_URL, itemId, token, hydrateFormStates]);

  useEffect(() => {
    if (itemId && token) fetchProductDetails();
  }, [itemId, token, fetchProductDetails]);
// ==========================================
// USE PURCHASE DATA HOOK - PART 2 OF 2
// ==========================================
  const handleCroppedEditReturn = (file) => {
    setFinalEditFile(file);
    setEditPreviewUrl(URL.createObjectURL(file));
  };

  const handleCompletePurchase = async (quantity = orderQuantity, checkoutDetails = {}) => {
    if (purchaseSubmitting) return;
    setCheckoutError('');
    setPurchaseSubmitting(true);
    try {
      // 🛠️ FIX: Replaced hardcoded localhost endpoint string directly with hotspot network variable
      const response = await fetch(`${BASE_URL}/inventory/${itemId}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: Number(quantity), ...checkoutDetails })
      });

      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        setIsCheckoutOpen(false);
        setSuccessMsg(`Order ${payload.order?.orderNumber || ''} placed. The vendor will confirm your request. Total: $${Number(payload.order?.total || 0).toFixed(2)}. Payment is arranged directly with the vendor.`);
        setIsSuccessOpen(true);
        fetchProductDetails();
      } else {
        setCheckoutError(payload.detail ? `${payload.error || 'Your order request could not be sent.'} ${payload.detail}` : payload.error || 'Your order request could not be sent. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setCheckoutError(err.message || 'Could not reach the server. Check your connection and try again.');
    } finally {
      setPurchaseSubmitting(false);
    }
  };

  return {
    isSuccessOpen, setIsSuccessOpen, successMsg, setSuccessMsg, product, setProduct, loading, setLoading,
    error, setError, userRating, setUserRating, userComment, setUserComment, reviewSubmitting, setReviewSubmitting,
    hoverRating, setHoverRating, isCheckoutOpen, setIsCheckoutOpen, orderQuantity, setOrderQuantity, purchaseSubmitting, checkoutError, setCheckoutError,
    hoveredBtnId, setHoveredBtnId, isEditMode, setIsEditMode, editName, setEditName, editBrand, setEditBrand,
    editQuantity, setEditQuantity, editPrice, setEditPrice, editCategory, setEditCategory, editDescription,
    setEditDescription, editCondition, setEditCondition, editWarranty, setEditWarranty, editDimensions,
    setEditDimensions, editWeight, setEditWeight, editPowerSource, setEditPowerSource, isEditCropOpen,
    setIsEditCropOpen, finalEditFile, setFinalEditFile, editPreviewUrl, setEditPreviewUrl, saveSubmitting,
    setSaveSubmitting, deleteTargetId, setDeleteTargetId, fetchProductDetails, hydrateFormStates,
    handleCroppedEditReturn, handleCompletePurchase
  };
}
