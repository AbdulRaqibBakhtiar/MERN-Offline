import { useState, useEffect } from 'react';

export function useInventoryData({ inventory, searchQuery, searchCategory }) {
  const { itemList = [] } = inventory;

  const [showAddForm, setShowAddForm] = useState(false);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [activeInventoryMenuId, setActiveInventoryMenuId] = useState(null);
  const [finalProductFile, setFinalProductFile] = useState(null);
  const [productPreviewUrl, setProductPreviewUrl] = useState(null);
  const [hoveredWishlistId, setHoveredWishlistId] = useState(null);
  const [hoveredBtnId, setHoveredBtnId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Reset pagination index boundaries upon filter updates
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, searchCategory]);

  const handleCroppedProductReturn = (file) => {
    setFinalProductFile(file);
    setProductPreviewUrl(URL.createObjectURL(file));
  };
  // Protect the catalog from repeated records if a server response contains the
  // same listing more than once. Keep the first occurrence and preserve order.
  const seenListingIds = new Set();
  const safeItemList = Array.isArray(itemList) ? itemList.filter(item => {
    if (!item) return false;
    if (!item._id) return true;
    const id = String(item._id);
    if (seenListingIds.has(id)) return false;
    seenListingIds.add(id);
    return true;
  }) : [];
  
  const filteredItems = safeItemList.filter(item => {
    if (!item) return false;

    // 1. Evaluate Category Dropdowns bounds
    const itemCatLower = (item.category || "").toLowerCase().trim();
    const filterCatLower = (searchCategory || "all").toLowerCase().trim();
    if (filterCatLower !== 'all' && filterCatLower !== 'ads' && filterCatLower !== 'news') {
      if (itemCatLower !== filterCatLower) return false;
    }

    // Match the fields shoppers use to identify a listing.
    const lowerSearchQuery = (searchQuery || "").toLowerCase().trim();
    if (!lowerSearchQuery) return true;
    const searchableFields = [
      item.name,
      item.brand,
      item.category,
      item.description,
      item.createdBy?.username,
      item.createdBy?.firstName,
      item.createdBy?.lastName
    ];
    return searchableFields.some(value => String(value || "").toLowerCase().includes(lowerSearchQuery));
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedAndFilteredItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  return {
    showAddForm, setShowAddForm,
    isCropOpen, setIsCropOpen,
    activeInventoryMenuId, setActiveInventoryMenuId,
    finalProductFile, setFinalProductFile,
    productPreviewUrl, setProductPreviewUrl,
    hoveredWishlistId, setHoveredWishlistId,
    hoveredBtnId, setHoveredBtnId,
    currentPage, setCurrentPage,
    filteredItems, paginatedAndFilteredItems, totalPages,
    handleCroppedProductReturn
  };
}
