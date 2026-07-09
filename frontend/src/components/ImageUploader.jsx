import { useState, useRef } from "react";

export default function ImageUploader({ onUpload, loading }) {
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length > 0) onUpload(files);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) onUpload(files);
    e.target.value = "";
  };

  return (
    <div
      className={`uploader ${dragOver ? "drag-over" : ""} ${loading ? "uploading" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !loading && fileRef.current?.click()}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleFileChange}
      />

      <div className="uploader-icon">
        {loading ? (
          <div className="spinner" />
        ) : (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        )}
      </div>

      <p className="uploader-title">
        {loading ? "正在上传..." : "拖拽图片到此处，或点击选择"}
      </p>
      <p className="uploader-hint">支持 JPG、PNG、GIF、WebP 等格式，可多选</p>

      <style>{`
        .uploader {
          border: 2px dashed var(--border);
          border-radius: var(--radius);
          padding: 48px 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.25s;
          background: var(--bg-secondary);
          margin-bottom: 24px;
        }
        .uploader:hover, .uploader.drag-over {
          border-color: var(--accent);
          background: var(--accent-light);
        }
        .uploader.uploading {
          pointer-events: none;
          opacity: 0.7;
        }
        .uploader-icon {
          color: var(--accent);
          margin-bottom: 16px;
          display: flex;
          justify-content: center;
        }
        .uploader-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .uploader-hint {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
