import { useCallback, useEffect, useState } from "react";
import ImageUploader from "../components/ImageUploader";
import ImageGallery from "../components/ImageGallery";
import VideoSettings from "../components/VideoSettings";
import VideoList from "../components/VideoList";
import api from "../api/client";
import "../App.css";

export default function Image2VideoPage() {
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [activeTab, setActiveTab] = useState("images");
  const [loading, setLoading] = useState(false);

  const fetchImages = useCallback(async () => {
    try {
      const { data } = await api.get("/images");
      setImages(data.images);
    } catch (error) {
      console.error("Failed to fetch images", error);
    }
  }, []);

  const fetchVideos = useCallback(async () => {
    try {
      const { data } = await api.get("/videos");
      setVideos(data.videos);
    } catch (error) {
      console.error("Failed to fetch videos", error);
    }
  }, []);

  useEffect(() => {
    fetchImages();
    fetchVideos();
  }, [fetchImages, fetchVideos]);

  useEffect(() => {
    const hasProcessing = videos.some((video) => video.status === "processing");
    if (!hasProcessing) return undefined;

    const timer = setInterval(fetchVideos, 2000);
    return () => clearInterval(timer);
  }, [videos, fetchVideos]);

  const handleUpload = async (files) => {
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }

    setLoading(true);
    try {
      await api.post("/upload", formData);
      await fetchImages();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (id) => {
    await api.delete(`/images/${id}`);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    await fetchImages();
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === images.length) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(images.map((img) => img.id)));
  };

  const handleGenerate = async (settings) => {
    const payload = {
      ...settings,
      image_ids: images
        .filter((img) => selectedIds.has(img.id))
        .map((img) => img.id),
    };
    await api.post("/videos/generate", payload);
    setActiveTab("videos");
    await fetchVideos();
  };

  const handleDeleteVideo = async (id) => {
    await api.delete(`/videos/${id}`);
    await fetchVideos();
  };

  const selectedImages = images.filter((img) => selectedIds.has(img.id));
  const tabMeta = {
    images: {
      kicker: "Media Library",
      title: "图片素材管理",
      desc: "集中上传、筛选和勾选素材，按顺序进入后续视频生成流程。",
    },
    generate: {
      kicker: "Generation Studio",
      title: "视频生成设置",
      desc: "统一调整时长、分辨率、字幕与样式，快速产出可用视频版本。",
    },
    videos: {
      kicker: "Delivery Center",
      title: "视频结果列表",
      desc: "查看生成进度、预览成片，并随时下载或删除历史结果。",
    },
  };
  const quickStats = [
    { label: "图片素材", value: `${images.length} 张` },
    { label: "已选队列", value: `${selectedIds.size} 张` },
    { label: "生成记录", value: `${videos.length} 条` },
  ];
  const currentTabMeta = tabMeta[activeTab];

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="app-header-main">
            <h1 className="logo">
              <span className="logo-icon">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </span>
              Image2Video
            </h1>
            <p className="header-desc">上传图片，轻松生成精美视频</p>
          </div>
          <div className="app-header-stats">
            {quickStats.map((item) => (
              <div key={item.label} className="app-stat-card">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </header>

      <nav className="tab-nav">
        <button
          className={`tab-btn ${activeTab === "images" ? "active" : ""}`}
          onClick={() => setActiveTab("images")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          图片管理
          {images.length > 0 && <span className="badge">{images.length}</span>}
        </button>

        <button
          className={`tab-btn ${activeTab === "generate" ? "active" : ""}`}
          onClick={() => setActiveTab("generate")}
          disabled={selectedIds.size === 0}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          生成视频
          {selectedIds.size > 0 && (
            <span className="badge accent">{selectedIds.size}</span>
          )}
        </button>

        <button
          className={`tab-btn ${activeTab === "videos" ? "active" : ""}`}
          onClick={() => setActiveTab("videos")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          视频列表
          {videos.length > 0 && <span className="badge">{videos.length}</span>}
        </button>
      </nav>

      <main className="main-content">
        <div className="panel panel-surface">
          <div className="panel-shell-head">
            <div>
              <p className="section-kicker">{currentTabMeta.kicker}</p>
              <h2>{currentTabMeta.title}</h2>
              <p className="panel-shell-desc">{currentTabMeta.desc}</p>
            </div>
            <div className="panel-shell-chip">
              {activeTab === "generate" ? `待生成 ${selectedIds.size} 张` : quickStats[0].value}
            </div>
          </div>

          {activeTab === "images" && (
            <div className="panel-shell-body">
              <ImageUploader onUpload={handleUpload} loading={loading} />
              <ImageGallery
                images={images}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
                onDelete={handleDeleteImage}
                onGoGenerate={() => setActiveTab("generate")}
              />
            </div>
          )}

          {activeTab === "generate" && (
            <div className="panel-shell-body">
              <VideoSettings
                selectedImages={selectedImages}
                onGenerate={handleGenerate}
                onBack={() => setActiveTab("images")}
              />
            </div>
          )}

          {activeTab === "videos" && (
            <div className="panel-shell-body">
              <VideoList
                videos={videos}
                images={images}
                onDelete={handleDeleteVideo}
                onRefresh={fetchVideos}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
