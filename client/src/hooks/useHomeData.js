import { API_BASE_URL } from '../api/config';
import { useState, useEffect } from "react";

export function useHomeData({
  itemList = [],
  deleteTargetId = null,
  handleSavePostEdit = () => { },
  externalSearchQuery = "",
  externalSearchCategory = "all"
} = {}) {
  const [liveNews, setLiveNews] = useState([]);
  const [liveAd, setLiveAd] = useState([]);
  const [softwareList, setSoftwareList] = useState([]);
  const [editingSoftware, setEditingSoftware] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const token = () => localStorage.getItem("token");

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentNewsPosts = liveNews.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(liveNews.length / postsPerPage) || 1;

  const createPreviewUrls = files => {
    if (!files) return null;

    const list = Array.isArray(files) ? files : [files];

    if (!list.length) return null;

    const urls = list.map(file => {
      try {
        return URL.createObjectURL(file);
      } catch (err) {
        console.error("Preview creation error:", err);
        return null;
      }
    }).filter(Boolean);

    return urls.length === 1 ? urls[0] : urls;
  };

  const revokePreviewUrls = value => {
    if (!value) return;

    const urls = Array.isArray(value) ? value : [value];

    urls.forEach(url => {
      if (typeof url === "string" && url.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(url);
        } catch { }
      }
    });
  };

  const loadNewsFeed = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/content/news/latest`
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : [];

      setLiveNews(list);
      setCurrentPage(
        p => Math.min(
          p,
          Math.ceil(list.length / postsPerPage) || 1
        )
      );
    } catch (err) {
      console.error("News feed error:", err);
    }
  };

  const loadAdBanners = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/content/ads/active`
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      setLiveAd(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Ad feed error:", err);
    }
  };

  const loadSoftwareCatalog = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/software`
      );

      const data = await response.json();

      setSoftwareList(
        Array.isArray(data) ? data : []
      );

      return data;
    } catch (err) {
      console.error("Marketplace fetch crash:", err);
      return [];
    }
  };

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
    const close = e => {
      if (!e.target.closest("[data-context-menu]")) {
        setActiveMenuId(null);
        setActiveAdMenuId(null);
      }
    };

    document.addEventListener("click", close);

    return () => {
      document.removeEventListener("click", close);
    };
  }, []);

  useEffect(() => {
    return () => {
      revokePreviewUrls(newsPreviewUrl);
      revokePreviewUrls(adPreviewUrl);
      revokePreviewUrls(editNewsPreviewUrl);
      revokePreviewUrls(editAdPreviewUrl);
    };
  }, [
    newsPreviewUrl,
    adPreviewUrl,
    editNewsPreviewUrl,
    editAdPreviewUrl
  ]);

  const handleNewsCroppedReturn = files => {
    revokePreviewUrls(newsPreviewUrl);

    const normalized = Array.isArray(files)
      ? files.filter(Boolean)
      : files;

    if (!normalized || (Array.isArray(normalized) && !normalized.length)) {
      setCroppedNewsFile(null);
      setNewsPreviewUrl(null);
      setIsNewsCropOpen(false);
      return;
    }

    setCroppedNewsFile(normalized);
    setNewsPreviewUrl(createPreviewUrls(normalized));
    setIsNewsCropOpen(false);
  };

  const handleAdCroppedReturn = file => {
    revokePreviewUrls(adPreviewUrl);

    if (!file) {
      setCroppedAdFile(null);
      setAdPreviewUrl(null);
      setIsAdCropOpen(false);
      return;
    }

    setCroppedAdFile(file);
    setAdPreviewUrl(createPreviewUrls(file));
    setIsAdCropOpen(false);
  };

  const handleNewsEditCroppedReturn = files => {
    revokePreviewUrls(editNewsPreviewUrl);

    const normalized = Array.isArray(files)
      ? files.filter(Boolean)
      : files;

    if (!normalized || (Array.isArray(normalized) && !normalized.length)) {
      setFinalEditNewsFile(null);
      setEditNewsPreviewUrl(null);
      setIsEditNewsCropOpen(false);
      return;
    }

    setFinalEditNewsFile(normalized);
    setEditNewsPreviewUrl(createPreviewUrls(normalized));
    setIsEditNewsCropOpen(false);
  };

  const handleAdEditCroppedReturn = file => {
    revokePreviewUrls(editAdPreviewUrl);

    if (!file) {
      setFinalEditAdFile(null);
      setEditAdPreviewUrl(null);
      setIsEditAdCropOpen(false);
      return;
    }

    setFinalEditAdFile(file);
    setEditAdPreviewUrl(createPreviewUrls(file));
    setIsEditAdCropOpen(false);
  };

  const handleCommentSubmit = async (e, newsId) => {
    e.preventDefault();

    const text = newComment.trim();

    if (!text) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/content/news/${newsId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token()}`
          },
          body: JSON.stringify({ text })
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();

      const createdComment =
        data?.comment ||
        data?.data?.comment ||
        (Array.isArray(data) ? data[data.length - 1] : null) ||
        data?.data ||
        null;

      const comment = {
        ...(createdComment || {}),
        _id:
          createdComment?._id ||
          createdComment?.id ||
          `local-${Date.now()}`,
        text: createdComment?.text || text,
        user:
          createdComment?.user ||
          createdComment?.username ||
          "You",
        createdAt:
          createdComment?.createdAt ||
          new Date().toISOString(),
        approvals: createdComment?.approvals || [],
        disapprovals: createdComment?.disapprovals || [],
        replies: createdComment?.replies || []
      };

      setLiveNews(prev =>
        prev.map(item =>
          item._id === newsId
            ? {
              ...item,
              comments: [
                ...(Array.isArray(item.comments) ? item.comments : []),
                comment
              ]
            }
            : item
        )
      );

      setNewComment("");
    } catch (err) {
      console.error("Discussion submit error:", err);
    }
  };

  const handleCommentDelete = async (newsId, commentId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/content/news/${newsId}/comments/${commentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token()}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      await loadNewsFeed();
    } catch (err) {
      console.error("Comment deletion error:", err);
    }
  };

  const handleCommentEdit = async (newsId, commentId, text) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/content/news/${newsId}/comments/${commentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token()}`
          },
          body: JSON.stringify({ text })
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      await loadNewsFeed();
      return true;
    } catch (err) {
      console.error("Comment edit error:", err);
      return false;
    }
  };

  const handleNewsLike = async newsId => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/content/news/${newsId}/like`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token()}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      await loadNewsFeed();
    } catch (err) {
      console.error("News like error:", err);
    }
  };

  const handleCommentApprove = async (newsId, commentId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/content/news/${newsId}/comments/${commentId}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token()}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      await loadNewsFeed();
    } catch (err) {
      console.error("Comment approval error:", err);
    }
  };

  const handleCommentDisapprove = async (newsId, commentId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/content/news/${newsId}/comments/${commentId}/disapprove`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token()}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      await loadNewsFeed();
    } catch (err) {
      console.error("Comment disapproval error:", err);
    }
  };

  const startEditingNews = item => {
    setEditingNewsId(item._id);
    setEditTitle(item.title || "");
    setEditSummary(item.summary || "");
    setEditFullText(item.fullText || "");
    setActiveMenuId(null);

    revokePreviewUrls(editNewsPreviewUrl);

    setFinalEditNewsFile(null);
    setEditNewsPreviewUrl(null);
  };

  const startEditingAd = item => {
    setEditingAdId(item._id);
    setEditAdTitle(item.title || "");
    setEditAdDescription(item.description || "");
    setActiveAdMenuId(null);

    revokePreviewUrls(editAdPreviewUrl);

    setFinalEditAdFile(null);
    setEditAdPreviewUrl(null);
  };

  const executeNewsSave = async (id, originalItem) => {
    try {
      const formData = new FormData();

      formData.append(
        "title",
        editTitle.trim()
      );

      formData.append(
        "summary",
        editSummary.trim()
      );

      formData.append(
        "fullText",
        editFullText.trim()
      );

      if (finalEditNewsFile) {
        const files = Array.isArray(finalEditNewsFile)
          ? finalEditNewsFile
          : [finalEditNewsFile];

        files.forEach(file => {
          if (file instanceof File) {
            formData.append("image", file);
          }
        });
      }

      const response = await fetch(
        `${API_BASE_URL}/content/news/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token()}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      handleSavePostEdit(id, null, true);

      revokePreviewUrls(editNewsPreviewUrl);

      setEditingNewsId(null);
      setFinalEditNewsFile(null);
      setEditNewsPreviewUrl(null);
      setIsEditNewsCropOpen(false);

      await loadNewsFeed();

      return true;
    } catch (err) {
      console.error("News save error:", err);
      return false;
    }
  };

  const executeAdSave = async (id, originalItem) => {
    try {
      const formData = new FormData();

      formData.append(
        "title",
        editAdTitle.trim()
      );

      formData.append(
        "description",
        editAdDescription.trim()
      );

      if (finalEditAdFile) {
        const files = Array.isArray(finalEditAdFile)
          ? finalEditAdFile
          : [finalEditAdFile];

        files.forEach(file => {
          if (file instanceof File) {
            formData.append("image", file);
          }
        });
      }

      const response = await fetch(
        `${API_BASE_URL}/content/ads/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token()}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      handleSavePostEdit(id, null, true);

      revokePreviewUrls(editAdPreviewUrl);

      setEditingAdId(null);
      setFinalEditAdFile(null);
      setEditAdPreviewUrl(null);
      setIsEditAdCropOpen(false);

      await loadAdBanners();

      return true;
    } catch (err) {
      console.error("Ad save error:", err);
      return false;
    }
  };

  const handleSaveApp = async (payload, rawImageFile = null) => {
    const isEdit = !!payload._id;

    const url = isEdit
      ? `${API_BASE_URL}/software/${payload._id}`
      : `${API_BASE_URL}/software`;

    try {
      const formData = new FormData();

      formData.append("name", payload.name || "");
      formData.append("version", payload.version || "v1.0");
      formData.append("description", payload.description || "");
      formData.append("downloadLink", payload.downloadLink || "/404");
      formData.append("slug", payload.slug || "");

      if (rawImageFile) {
        formData.append("image", rawImageFile);
      }

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token()}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      setIsModalOpen(false);
      await loadSoftwareCatalog();
    } catch (err) {
      console.error("Software save error:", err);
    }
  };

  const handleDeleteApp = async id => {
    if (!id) return false;

    try {
      const response = await fetch(
        `${API_BASE_URL}/software/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token()}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      await loadSoftwareCatalog();

      return true;
    } catch (err) {
      console.error("Software delete error:", err);
      return false;
    }
  };

  return {
    liveNews,
    liveAd,
    softwareList,
    isModalOpen,
    setIsModalOpen,
    editingSoftware,
    setEditingSoftware,
    loadSoftwareCatalog,
    handleSaveApp,
    handleDeleteApp,

    isNewsCropOpen,
    setIsNewsCropOpen,
    isAdCropOpen,
    setIsAdCropOpen,
    isEditNewsCropOpen,
    setIsEditNewsCropOpen,
    isEditAdCropOpen,
    setIsEditAdCropOpen,

    croppedNewsFile,
    setCroppedNewsFile,
    newsPreviewUrl,
    setNewsPreviewUrl,
    croppedAdFile,
    setCroppedAdFile,
    adPreviewUrl,
    setAdPreviewUrl,

    finalEditNewsFile,
    setFinalEditNewsFile,
    editNewsPreviewUrl,
    setEditNewsPreviewUrl,
    finalEditAdFile,
    setFinalEditAdFile,
    editAdPreviewUrl,
    setEditAdPreviewUrl,

    isNewsExpanded,
    setIsNewsExpanded,
    newComment,
    setNewComment,
    currentPage,
    setCurrentPage,
    postsPerPage,

    editingNewsId,
    setEditingNewsId,
    editTitle,
    setEditTitle,
    editSummary,
    setEditSummary,
    editFullText,
    setEditFullText,

    editingAdId,
    setEditingAdId,
    editAdTitle,
    setEditAdTitle,
    editAdDescription,
    setEditAdDescription,

    expandedCommentsMap,
    setExpandedCommentsMap,
    activeMenuId,
    setActiveMenuId,
    activeAdMenuId,
    setActiveAdMenuId,
    hoveredBtnId,
    setHoveredBtnId,

    currentNewsPosts,
    totalPages,

    handleNewsCroppedReturn,
    handleAdCroppedReturn,
    handleNewsEditCroppedReturn,
    handleAdEditCroppedReturn,

    handleCommentSubmit,
    handleCommentDelete,
    handleCommentEdit,
    handleNewsLike,
    handleCommentApprove,
    handleCommentDisapprove,

    startEditingNews,
    startEditingAd,
    executeNewsSave,
    executeAdSave,

    loadNewsFeed,
    loadAdBanners
  };
}
