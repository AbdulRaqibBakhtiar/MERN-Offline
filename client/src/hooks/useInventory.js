// ========================================== //
// USE INVENTORY HOOK - PART 1 OF 2           //
// ========================================== //
import { useState, useEffect, useCallback } from 'react'; 
import { fetchItems, updateItem, deleteItem, createItem } from '../services/inventoryServices'; 
import { useAuth } from '../context/AuthContext'; 
import { useSocket } from '../context/SocketContext';

export const useInventory = () => { 
  const { token, logout } = useAuth(); 
  const { socket } = useSocket() || {};
  
  // States mapping layouts 
  const [loading, setLoading] = useState(true); 
  const [itemName, setItemName] = useState(""); 
  const [itemBrand, setItemBrand] = useState(""); 
  const [itemQuantity, setItemQuantity] = useState(0); 
  const [itemPrice, setItemPrice] = useState(0); 
  const [itemCategory, setItemCategory] = useState("tools"); 
  const [itemDescription, setItemDescription] = useState("");
  const [itemList, setItemList] = useState([]); 
  const [isEditing, setIsEditing] = useState(null); 
  
  // Inline Administrative Editing State Blueprints 
  const [editName, setEditName] = useState(""); 
  const [editBrand, setEditBrand] = useState(""); 
  const [editQuantity, setEditQuantity] = useState(0); 
  const [editPrice, setEditPrice] = useState(0); 
  const [editCategory, setEditCategory] = useState("tools"); 
  const [deleteTargetId, setDeleteTargetId] = useState(null); 

  // 🚀 FIXED: Dynamic Environment URL Router. If running on local app it maps 'localhost', 
  // otherwise it detects the current staging or deployment machine domain automatically.
  const activeHostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const BASE_URL = `http://${activeHostname === '127.0.0.1' ? 'localhost' : activeHostname}:5000`;

  const loadItems = useCallback(async () => { 
    if (!token) { 
      console.log("🛑 INVENTORY DIAGNOSTIC: Token is missing. Fetch blocked."); 
      return; 
    } 
    try { 
      setLoading(true); 
      console.log(`📡 INVENTORY DIAGNOSTIC: Initiating API call via fetchItems to baseline environment...`); 
      
      const res = await fetchItems(token); 
      console.log("📦 SERVER PAYLOAD RECEIVED:", res); 
      
      if (res && res.data && Array.isArray(res.data.data)) { 
        setItemList(res.data.data); 
      } else if (res && Array.isArray(res.data)) { 
        setItemList(res.data); 
      } else if (res && res.data && Array.isArray(res.data)) { 
        setItemList(res.data); 
      } else { 
        console.warn("❌ SERVER STRUCT MISMATCH: Format fallback empty assignment."); 
        setItemList([]); 
      } 
    } catch (err) { 
      // 🚀 FIXED: Insulates application execution stack from network connection faults
      console.error("💥 FETCH ENGINE FAULT (Inventory Grid Summary Log):", err.message || err); 
      setItemList([]); 
      if (err.response?.status === 401) logout(); 
    } finally { 
      setLoading(false); 
    } 
  }, [token, logout]); 

  useEffect(() => { 
    if (token) loadItems(); 
  }, [token, loadItems]);

  useEffect(() => {
    if (!socket || !token) return undefined;
    const refreshInventory = () => loadItems();
    socket.on('inventory_updated', refreshInventory);
    return () => socket.off('inventory_updated', refreshInventory);
  }, [socket, token, loadItems]);
  // ========================================== //
  // USE INVENTORY HOOK - PART 2 OF 2           //
  // ========================================== //
  const addItem = async (imageFiles = []) => { 
    if (!itemName.trim() || !itemBrand.trim() || !Number.isInteger(Number(itemQuantity)) || Number(itemQuantity) < 0 || !Number.isFinite(Number(itemPrice)) || Number(itemPrice) < 0 || !itemCategory) { 
      throw new Error("Enter a product name, brand, valid stock quantity, and non-negative price.");
    } 
    try { 
      const formData = new FormData(); 
      formData.append('name', itemName); 
      formData.append('brand', itemBrand); 
      formData.append('quantity', Number(itemQuantity)); 
      formData.append('price', Number(itemPrice)); 
      formData.append('category', itemCategory); 
      formData.append('description', itemDescription);
      const files = Array.isArray(imageFiles) ? imageFiles : imageFiles ? [imageFiles] : [];
      files.forEach(file => formData.append('productMedia', file));
      
      await createItem(formData, token); 
      setItemName(""); 
      setItemBrand(""); 
      setItemQuantity(0); 
      setItemPrice(0); 
      setItemCategory("tools"); 
      setItemDescription("");
      loadItems(); 
    } catch (err) { 
      console.error("Add Item Error:", err.message || err);
      throw err;
    } 
  }; 

  const startEditing = (item) => { 
    setIsEditing(item._id); 
    setEditName(item.name); 
    setEditBrand(item.brand); 
    setEditQuantity(item.quantity); 
    setEditPrice(item.price); 
    setEditCategory(item.category || "tools"); 
  }; 

  const handleSaveEdit = async (id, imageFile = null) => { 
    try { 
      const formData = new FormData(); 
      formData.append('name', editName); 
      formData.append('brand', editBrand); 
      formData.append('quantity', Number(editQuantity)); 
      formData.append('price', Number(editPrice)); 
      formData.append('category', editCategory); 
      if (imageFile) formData.append('productImage', imageFile); 
      
      await updateItem(id, formData, token); 
      setIsEditing(null); 
      loadItems(); 
    } catch (err) { 
      console.error("Update Item Error:", err.message || err); 
    } 
  }; 

  const openDeleteModal = (id) => setDeleteTargetId(id); 

  const handleConfirmDelete = async () => { 
    if (!deleteTargetId) return; 
    try { 
      await deleteItem(deleteTargetId, token); 
      setDeleteTargetId(null); 
      loadItems(); 
    } catch (err) { 
      console.error("Delete Action Mismatch:", err.message || err); 
      setDeleteTargetId(null); 
    } 
  }; 

  // RESTORED PRODUCT REVIEWS FORM PROCESSOR ENGINE
  const submitProductReview = async (itemId, reviewData) => { 
    try { 
      // Uses the new safe network routing variable setup from Part 1
      const response = await fetch(`${BASE_URL}/inventory/${itemId}/review`, { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        }, 
        body: JSON.stringify(reviewData) 
      }); 
      if (response.ok) { 
        const refreshedItem = await response.json(); 
        setItemList(prevList => prevList.map(item => item._id === itemId ? refreshedItem : item)); 
        return refreshedItem; 
      } else { 
        const errorData = await response.json(); 
        alert(errorData.error || "Failed to log review details."); 
        return null; 
      } 
    } catch (err) { 
      console.error("Review pipeline breakdown:", err.message || err); 
      return null; 
    } 
  }; 

  return { 
    loading, itemList, itemName, setItemName, itemBrand, setItemBrand, itemQuantity, setItemQuantity, 
    itemPrice, setItemPrice, itemCategory, setItemCategory, itemDescription, setItemDescription, isEditing, setIsEditing, editName, setEditName, 
    editBrand, setEditBrand, editQuantity, setEditQuantity, editPrice, setEditPrice, editCategory, setEditCategory, 
    deleteTargetId, setDeleteTargetId, addItem, startEditing, handleSaveEdit, openDeleteModal, handleConfirmDelete, 
    loadItems, submitProductReview 
  }; 
};
