import { useState, useEffect } from 'react';

export function useHomeData({
  itemList = [],
  deleteTargetId = null,
  handleSavePostEdit = () => {},
  externalSearchQuery = "",
  externalSearchCategory = "all"
} = {}) {
  // --- 1. CORE LIST STATES ---
  const [liveNews, setLiveNews] = useState([]);
  const [liveAd, setLiveAd] = useState([]);
  const [softwareList, setSoftwareList] = useState([]);
  const [editingSoftware, setEditingSoftware] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- 2. MODAL & PREVIEW STATES ---
  const [isNewsCropOpen, setIsNewsCropOpen] = useState(false);
  const [isAdCropOpen, setIsAdCropOpen] = useState(false);
  const [isEditNewsCropOpen, setIsEditNewsCropOpen] = useState(false);
  const [isEditAdCropOpen, setIsEditAdCropOpen] = useState(false);
  const [croppedNewsFile, setCroppedNewsFile] = useState(null);
  const [newsPreviewUrl, setNewsPreviewUrl] = useState(null);
  const [croppedAdFile, setCroppedAdFile] = useState(null);
  const [adPreviewUrl, setAdPreviewUrl] = useState(null);
  const [finalEditNewsFile, setFinalEditNewsFile] = useState(null);
  const [editNewsPreviewUrl, setEditNewsPreviewUrl] = useState(null);
  const [finalEditAdFile, setFinalEditAdFile] = useState(null);
  const [editAdPreviewUrl, setEditAdPreviewUrl] = useState(null);

  // --- 3. UI INTERACTION STATES ---
  const [isNewsExpanded, setIsNewsExpanded] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;
  const [editingNewsId, setEditingNewsId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editFullText, setEditFullText] = useState("");
  const [editingAdId, setEditingAdId] = useState(null);
  const [editAdTitle, setEditAdTitle] = useState("");
  const [editAdDescription, setEditAdDescription] = useState("");
  const [expandedCommentsMap, setExpandedCommentsMap] = useState({});
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [activeAdMenuId, setActiveAdMenuId] = useState(null);
  const [hoveredBtnId, setHoveredBtnId] = useState(null);

  // --- 4. COMPUTED METRICS & SEARCH FILTER CORES ---
  const totalInventoryValue = itemList.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0);
  const lowStockCount = itemList.filter(item => Number(item.quantity || 0) < 10).length;

  const filteredAds = liveAd;
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;

  // Static pagination slices untouched by query text input changes
  const currentNewsPosts = liveNews.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(liveNews.length / postsPerPage) || 1;
  // --- 5. IMAGE RETURN HANDLERS ---
  const handleNewsCroppedReturn = (file) => {
    setCroppedNewsFile(file);
    setNewsPreviewUrl(URL.createObjectURL(file));
  };
  const handleAdCroppedReturn = (file) => {
    setCroppedAdFile(file);
    setAdPreviewUrl(URL.createObjectURL(file));
  };
  const handleNewsEditCroppedReturn = (file) => {
    setFinalEditNewsFile(file);
    setEditNewsPreviewUrl(URL.createObjectURL(file));
  };
  const handleAdEditCroppedReturn = (file) => {
    setFinalEditAdFile(file);
    setEditAdPreviewUrl(URL.createObjectURL(file));
  };

  // --- 6. API FETCHING ENGINES ---
  const loadNewsFeed = () => {
    fetch('http://localhost:5000/content/news/latest')
      .then(res => res.json())
      .then(data => {
        const newsArray = Array.isArray(data) ? data : [];
        setLiveNews(newsArray);
        const maxPages = Math.ceil(newsArray.length / postsPerPage) || 1;
        setCurrentPage(current => Math.min(current, maxPages));
      })
      .catch(err => console.error(err));
  };

  const loadAdBanners = () => {
    fetch('http://localhost:5000/content/ads/active')
      .then(res => res.json())
      .then(data => setLiveAd(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  };

  const loadSoftwareCatalog = async () => {
    try {
      const response = await fetch('http://localhost:5000/software');
      const data = await response.json();

      setSoftwareList(Array.isArray(data) ? data : []);

      return data;
    } catch (err) {
      console.error("Marketplace fetch crash:", err);
      return [];
    }
  };
  // --- 7. SIDE EFFECTS (LIFECYCLE) ---
  useEffect(() => {
    loadNewsFeed();
    loadAdBanners();
    loadSoftwareCatalog();
  }, []);

  useEffect(() => {
    if (!deleteTargetId) {
      loadNewsFeed();
      loadAdBanners();
    }
  }, [deleteTargetId]);

  useEffect(() => {
    const closeAllMenus = () => {
      setActiveMenuId(null);
      setActiveAdMenuId(null);
    };
    window.addEventListener('click', closeAllMenus);
    return () => window.removeEventListener('click', closeAllMenus);
  }, []);
  // --- 8. SUBMISSION & ACTION METHODS ---
  const handleCommentSubmit = async (e, newsId) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/content/news/${newsId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: newComment })
      });
      if (!response.ok) throw new Error("Failed to post comment.");
      setNewComment("");
      loadNewsFeed();
    } catch (err) {
      console.error("Discussion submit error:", err);
    }
  };

  const handleCommentDelete = async (newsId, commentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/content/news/${newsId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to delete comment asset.");
      loadNewsFeed();
    } catch (err) {
      console.error("Comment erasure error:", err);
    }
  };

  const startEditingNews = (item) => {
    setEditingNewsId(item._id);
    setEditTitle(item.title || "");
    setEditSummary(item.summary || "");
    setEditFullText(item.fullText || "");
  };

  const startEditingAd = (item) => {
    setEditingAdId(item._id);
    setEditAdTitle(item.title || "");
    setEditAdDescription(item.description || "");
  };

  const executeNewsSave = async (id, originalItem) => {
    const textChanged = editTitle !== originalItem.title || editSummary !== originalItem.summary || editFullText !== originalItem.fullText;
    if (!textChanged && !finalEditNewsFile) {
      handleSavePostEdit(id, null, false);
      setEditingNewsId(null);
      return;
    }
    try {
      const formData = new FormData();
      formData.append('title', editTitle);
      formData.append('summary', editSummary);
      formData.append('fullText', editFullText);
      if (finalEditNewsFile) formData.append('image', finalEditNewsFile);
      await fetch(`http://localhost:5000/content/news/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      handleSavePostEdit(id, null, true);
      setEditingNewsId(null);
      loadNewsFeed();
    } catch (err) {
      console.error(err);
    }
  };

  const executeAdSave = async (id, originalItem) => {
    const textChanged = editAdTitle !== originalItem.title || editAdDescription !== originalItem.description;
    if (!textChanged && !finalEditAdFile) {
      handleSavePostEdit(id, null, false);
      setEditingAdId(null);
      return;
    }
    try {
      const formData = new FormData();
      formData.append('title', editAdTitle);
      formData.append('description', editAdDescription);
      if (finalEditAdFile) formData.append('image', finalEditAdFile);
      await fetch(`http://localhost:5000/content/ads/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      handleSavePostEdit(id, null, true);
      setEditingAdId(null);
      loadAdBanners();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveApp = async (payload, rawImageFile = null) => {
    const isEdit = !!payload._id;
    const url = isEdit ? `http://localhost:5000/software/${payload._id}` : 'http://localhost:5000/software';
    const method = isEdit ? 'PUT' : 'POST';

    // 📡 TRACER TELEMETRY 2A: Verify parameters hitting the custom hook layout network layer
    console.warn(`[TRACER 2A] useHomeData Hook Intercepted Save Stream`, { url, method, isEdit });

    try {
      const formData = new FormData();
      formData.append('name', payload.name || '');
      formData.append('version', payload.version || 'v1.0');
      formData.append('description', payload.description || '');
      formData.append('downloadLink', payload.downloadLink || '/404');
      formData.append('slug', payload.slug || '');

      if (rawImageFile) {
        console.log(`[TRACER 2B] Binary file detected. Appending image buffer asset node...`, rawImageFile);
        formData.append('image', rawImageFile);
      } else {
        console.info(`[TRACER 2B] No graphic file supplied. Skipping image field appendix.`);
      }

      const token = localStorage.getItem('token');

      // 📡 TRACER TELEMETRY 2D: Log exactly what is about to be sent across the network
      console.info(`[TRACER 2D] Dispatching Request Network Stream to Backend Endpoint API...`);

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
          // Note: Content-Type header must remain omitted so the browser sets multi-part boundaries correctly!
        },
        body: formData
      });

      if (response.ok) {
        const resultData = await response.json();
        setIsModalOpen(false);

        await loadSoftwareCatalog();
      } else {
        const errorText = await response.text();
        console.error(`[TRACER 2E-FAIL] Backend rejected submission:`, errorText);
      }
    } catch (err) {

    }
  };


  return {
    liveNews: liveNews,
    liveAd: filteredAds,
    softwareList,
    isModalOpen,
    setIsModalOpen,
    editingSoftware,
    setEditingSoftware,
    loadSoftwareCatalog,
    handleSaveApp,
    isNewsCropOpen, setIsNewsCropOpen,
    isAdCropOpen, setIsAdCropOpen,
    isEditNewsCropOpen, setIsEditNewsCropOpen,
    isEditAdCropOpen, setIsEditAdCropOpen,
    croppedNewsFile, setCroppedNewsFile,
    newsPreviewUrl, setNewsPreviewUrl,
    croppedAdFile, setCroppedAdFile,
    adPreviewUrl, setAdPreviewUrl,
    finalEditNewsFile, setFinalEditNewsFile,
    editNewsPreviewUrl, setEditNewsPreviewUrl,
    finalEditAdFile, setFinalEditAdFile,
    editAdPreviewUrl, setEditAdPreviewUrl,
    isNewsExpanded, setIsNewsExpanded,
    newComment, setNewComment,
    currentPage, setCurrentPage,
    postsPerPage,
    editingNewsId, setEditingNewsId,
    editTitle, setEditTitle,
    editSummary, setEditSummary,
    editFullText, setEditFullText,
    editingAdId, setEditingAdId,
    editAdTitle, setEditAdTitle,
    editAdDescription, setEditAdDescription,
    expandedCommentsMap, setExpandedCommentsMap,
    activeMenuId, setActiveMenuId,
    activeAdMenuId, setActiveAdMenuId,
    hoveredBtnId, setHoveredBtnId,
    totalInventoryValue, lowStockCount,
    currentNewsPosts, totalPages,
    handleNewsCroppedReturn, handleAdCroppedReturn,
    handleNewsEditCroppedReturn, handleAdEditCroppedReturn,
    handleCommentSubmit, handleCommentDelete,
    startEditingNews, startEditingAd,
    executeNewsSave, executeAdSave,
    loadNewsFeed, loadAdBanners
  };
}
