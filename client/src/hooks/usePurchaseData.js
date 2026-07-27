// ==========================================
// USE PURCHASE DATA HOOK - PART 1 OF 2
// ==========================================
import { useState, useEffect } from 'react';

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

  // 🛠️ FAIL-SAFE BASE URL: Bypasses localhost to route requests directly to your laptop over the hotspot network
const BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : `http://${window.location.hostname}:5000`;

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      // 🛠️ FIX: Replaced localhost URL with hotspot string variable
      const url = `${BASE_URL}/inventory/${itemId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`Fetch blueprint fault: ${response.status}`);
      const data = await response.json();
      setProduct(data);
      hydrateFormStates(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const hydrateFormStates = (data) => {
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
  };

  useEffect(() => {
    if (itemId && token) fetchProductDetails();
  }, [itemId, token]);
// ==========================================
// USE PURCHASE DATA HOOK - PART 2 OF 2
// ==========================================
  const handleCroppedEditReturn = (file) => {
    setFinalEditFile(file);
    setEditPreviewUrl(URL.createObjectURL(file));
  };

  const handleCompletePurchase = async () => {
    try {
      // 🛠️ FIX: Replaced hardcoded localhost endpoint string directly with hotspot network variable
      const response = await fetch(`${BASE_URL}/inventory/${itemId}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: orderQuantity })
      });

      if (response.ok) {
        setIsCheckoutOpen(false);
        setSuccessMsg(`Secure transaction authorized! Final settlement of $${(product.price * orderQuantity * 1.085).toFixed(2)} posted to records.`);
        setIsSuccessOpen(true);
        fetchProductDetails();
      } else {
        const data = await response.json();
        setSuccessMsg(`Checkout Denied: ${data.error || "Operational breakdown."}`);
        setIsSuccessOpen(true);
      }
    } catch (err) {
      console.error(err);
      setSuccessMsg("Network connectivity failure executing purchase layout sequence.");
      setIsSuccessOpen(true);
    }
  };

  return {
    isSuccessOpen, setIsSuccessOpen, successMsg, setSuccessMsg, product, setProduct, loading, setLoading,
    error, setError, userRating, setUserRating, userComment, setUserComment, reviewSubmitting, setReviewSubmitting,
    hoverRating, setHoverRating, isCheckoutOpen, setIsCheckoutOpen, orderQuantity, setOrderQuantity,
    hoveredBtnId, setHoveredBtnId, isEditMode, setIsEditMode, editName, setEditName, editBrand, setEditBrand,
    editQuantity, setEditQuantity, editPrice, setEditPrice, editCategory, setEditCategory, editDescription,
    setEditDescription, editCondition, setEditCondition, editWarranty, setEditWarranty, editDimensions,
    setEditDimensions, editWeight, setEditWeight, editPowerSource, setEditPowerSource, isEditCropOpen,
    setIsEditCropOpen, finalEditFile, setFinalEditFile, editPreviewUrl, setEditPreviewUrl, saveSubmitting,
    setSaveSubmitting, deleteTargetId, setDeleteTargetId, fetchProductDetails, hydrateFormStates,
    handleCroppedEditReturn, handleCompletePurchase
  };
}
