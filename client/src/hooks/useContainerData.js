// ========================================== //
// USE CONTAINER DATA HOOK - PART 1 OF 2      //
// ========================================== //
import { useState, useEffect } from 'react'; 
import { API_BASE_URL } from '../api/config';

// 🚀 FIXED: Declaring this outside the hook ensures it is a static reference 
// that never triggers React rendering dependency size mutations!
const BASE_URL = API_BASE_URL;

export function useContainerData({ token, inventory }) { 
  // 1. CONFIGURATION STATES 
  const [activeTab, setActiveTab] = useState('home'); 
  const [showProfile, setShowProfile] = useState(false); 
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(null); 
  const [wishlist, setWishlist] = useState([]); 
  
  // 2. SEARCH DECK DRIVERS 
  const [globalSearchQuery, setGlobalSearchQuery] = useState(""); 
  const [inventorySearchQuery, setInventorySearchQuery] = useState(""); 
  const [searchCategory, setSearchCategory] = useState("all"); 
  const [searchOpen, setSearchOpen] = useState(false); 
  const [successNotice, setSuccessNotice] = useState({ show: false, type: "", message: "" }); 

  // 🔌 Safe Wishlist Fetch Pipeline 
  useEffect(() => { 
    const fetchSavedWishlist = async () => { 
      if (!token) return; 
      try { 
        const response = await fetch(`${BASE_URL}/inventory/wishlist`, { 
          method: 'GET', 
          headers: { 
            'Authorization': `Bearer ${token}` 
          } 
        }); 
        if (response.ok) { 
          const data = await response.json(); 
          setWishlist(Array.isArray(data) ? data : []); 
        } else {
          setWishlist([]);
        }
      } catch (err) { 
        console.error("💥 FETCH ENGINE FAULT (Wishlist Fetch Failed):", err.message || err); 
        setWishlist([]); 
      } 
    }; 
    fetchSavedWishlist(); 
  }, [token]); // 🚀 FIXED: Removed BASE_URL from here to keep the array size perfectly stable!

  const triggerToggleWishlist = async (item) => { 
    if (!token) return; 
    try { 
      const response = await fetch(`${BASE_URL}/inventory/wishlist/toggle`, { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        }, 
        body: JSON.stringify({ itemId: item._id }) 
      }); 
      if (response.ok) { 
        const updatedItemsList = await response.json(); 
        setWishlist(Array.isArray(updatedItemsList) ? updatedItemsList : []); 
      } 
    } catch (err) { 
      console.error("Database connection failure updating wishlist:", err.message || err); 
    } 
  }; 

  const handleCloseNotice = () => { 
    setSuccessNotice({ show: false, type: "", message: "" }); 
    if (inventory && typeof inventory.loadItems === 'function') inventory.loadItems(); 
  };

  // ========================================== //
  // USE CONTAINER DATA HOOK - PART 2 OF 2      //
  // ========================================== //
  const triggerAddItem = async (imageFile) => { 
    if (inventory && typeof inventory.addItem === 'function') {
      await inventory.addItem(imageFile); 
    }
    setSuccessNotice({ show: true, type: "ADD", message: "Product Added Successfully" }); 
    setTimeout(() => { 
      handleCloseNotice(); 
    }, 2500); 
  }; 

  const triggerSaveEdit = async (id, imageFile, hasChanged) => { 
    if (!hasChanged) { 
      setSuccessNotice({ show: true, type: "NO_CHANGES", message: "No Changes Made" }); 
      setTimeout(() => { 
        handleCloseNotice(); 
      }, 2500); 
      return; 
    } 
    if (inventory && typeof inventory.handleSaveEdit === 'function') {
      await inventory.handleSaveEdit(id, imageFile); 
    }
    setSuccessNotice({ show: true, type: "EDIT", message: "Changes Saved Successfully" }); 
    setTimeout(() => { 
      handleCloseNotice(); 
    }, 2500); 
  }; 

  // 🎯 CORE DELETION LIFECYCLE HANDLER 
  const triggerConfirmDelete = async () => { 
    if (!inventory || !inventory.deleteTargetId) return; 
    try { 
      const headers = { 
        'Content-Type': 'application/json', 
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}) 
      }; 

      // 🎯 INTERCEPTOR LOCK: If deleting a marketplace software asset node 
      if (typeof inventory.deleteTargetId === 'string' && inventory.deleteTargetId.startsWith("software_purge:")) { 
        const cleanSoftwareId = inventory.deleteTargetId.replace("software_purge:", ""); 
        const response = await fetch(`${BASE_URL}/software/${cleanSoftwareId}`, { method: 'DELETE', headers }); 
        if (response.ok) { 
          setSuccessNotice({ show: true, type: "DELETE", message: "Extension Severed Successfully" }); 
          inventory.setDeleteTargetId(null); 
          window.location.reload(); 
        } 
        return; 
      } 

      // --- LEGACY FALLBACK FOR FEEDS OR RAW INVENTORY --- 
      if (activeTab === 'home') { 
        const routeSegment = searchCategory === 'ads' ? 'ads' : 'news'; 
        await fetch(`${BASE_URL}/content/${routeSegment}/${inventory.deleteTargetId}`, { method: 'DELETE', headers }); 
        setSuccessNotice({ show: true, type: "DELETE", message: "Asset Removed Successfully" }); 
      } else { 
        if (typeof inventory.handleConfirmDelete === 'function') {
          await inventory.handleConfirmDelete(); 
        }
        setSuccessNotice({ show: true, type: "DELETE", message: "Product Removed Successfully" }); 
      } 
      inventory.setDeleteTargetId(null); 
      setTimeout(() => { 
        handleCloseNotice(); 
      }, 2500); 
    } catch (err) { 
      console.error("Deletion lifecycle fault:", err.message || err); 
      if (inventory && typeof inventory.setDeleteTargetId === 'function') {
        inventory.setDeleteTargetId(null); 
      }
    } 
  }; 

  return { 
    activeTab, setActiveTab, showProfile, setShowProfile, selectedPurchaseId, setSelectedPurchaseId, 
    wishlist, setWishlist, globalSearchQuery, setGlobalSearchQuery, inventorySearchQuery, setInventorySearchQuery, 
    searchCategory, setSearchCategory, searchOpen, setSearchOpen, successNotice, setSuccessNotice, 
    triggerToggleWishlist, handleCloseNotice, triggerAddItem, triggerSaveEdit, triggerConfirmDelete 
  }; 
}
