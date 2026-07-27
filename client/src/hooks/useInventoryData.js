import { useState, useEffect } from 'react';

export function useInventoryData({ inventory, searchQuery, searchCategory }) {
  const { itemList = [], addItem } = inventory;

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
  const safeItemList = Array.isArray(itemList) ? itemList : [];
  
  // 🔍 Fully Activated Evaluation Grid Filter Matrix
  const filteredItems = safeItemList.filter(item => {
    if (!item) return false;

    // 1. Evaluate Category Dropdowns bounds
    const itemCatLower = (item.category || "").toLowerCase().trim();
    const filterCatLower = (searchCategory || "all").toLowerCase().trim();
    if (filterCatLower !== 'all' && filterCatLower !== 'ads' && filterCatLower !== 'news') {
      if (itemCatLower !== filterCatLower) return false;
    }

    // 2. Evaluate Text Matching bounds (Product Name or Manufacturing Brand)
    const itemNameString = (item.name || "").toLowerCase();
    const itemBrandString = (item.brand || "").toLowerCase();
    const lowerSearchQuery = (searchQuery || "").toLowerCase().trim();
    
    return itemNameString.includes(lowerSearchQuery) || itemBrandString.includes(lowerSearchQuery);
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
