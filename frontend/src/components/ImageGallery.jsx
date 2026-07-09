export default function ImageGallery({
  images,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDelete,
  onGoGenerate,
}) {
  if (images.length === 0) {
    return (
      <div className="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-secondary)", opacity: 0.4 }}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <p>还没有上传图片</p>
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          上传一些图片开始制作视频吧
        </p>
        <style>{`
          .empty-state {
            text-align: center;
            padding: 60px 24px;
            color: var(--text-secondary);
          }
          .empty-state svg { margin-bottom: 16px; }
          .empty-state p { margin-bottom: 4px; }
        `}</style>
      </div>
    );
  }

  const allSelected = selectedIds.size === images.length;

  return (
    <div>
      <div className="gallery-toolbar">
        <div className="toolbar-left">
          <button className="btn btn-sm btn-outline" onClick={onSelectAll}>
            {allSelected ? "取消全选" : "全选"}
          </button>
          <span className="select-info">
            已选 <strong>{selectedIds.size}</strong> / {images.length} 张
          </span>
        </div>
        {selectedIds.size > 0 && (
          <button className="btn btn-sm btn-primary" onClick={onGoGenerate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            生成视频
          </button>
        )}
      </div>

      <div className="gallery-grid">
        {images.map((img, idx) => {
          const selected = selectedIds.has(img.id);
          return (
            <div
              key={img.id}
              className={`gallery-item ${selected ? "selected" : ""}`}
              onClick={() => onToggleSelect(img.id)}
            >
              <div className="gallery-img-wrap">
                <img
                  src={`/api/uploads/${img.stored_name}`}
                  alt={img.filename}
                  loading="lazy"
                />
                <div className="gallery-checkbox">
                  {selected ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--accent)" stroke="white" strokeWidth="2">
                      <rect x="2" y="2" width="20" height="20" rx="4" />
                      <polyline points="7 13 10 16 17 9" fill="none" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="2" width="20" height="20" rx="4" />
                    </svg>
                  )}
                </div>
                {selected && (
                  <div className="gallery-order">{
                    [...selectedIds].indexOf(img.id) + 1
                  }</div>
                )}
              </div>
              <div className="gallery-info">
                <span className="gallery-name" title={img.filename}>
                  {img.filename}
                </span>
                <button
                  className="btn-icon danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(img.id);
                  }}
                  title="删除"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .gallery-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .select-info {
          font-size: 13px;
          color: var(--text-secondary);
        }
        .select-info strong {
          color: var(--accent);
        }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: none;
          border-radius: var(--radius-sm);
          font-size: 14px;
          font-weight: 500;
          padding: 8px 16px;
          transition: all 0.2s;
        }
        .btn-sm { padding: 6px 14px; font-size: 13px; }
        .btn-outline {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-primary);
        }
        .btn-outline:hover { border-color: var(--accent); color: var(--accent); }
        .btn-primary {
          background: var(--accent);
          color: #fff;
        }
        .btn-primary:hover { background: var(--accent-hover); }
        .btn-icon {
          background: none;
          border: none;
          color: var(--text-secondary);
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          transition: all 0.2s;
        }
        .btn-icon.danger:hover { color: var(--danger); background: rgba(231, 76, 60, 0.1); }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
        }
        .gallery-item {
          background: var(--bg-secondary);
          border: 2px solid transparent;
          border-radius: var(--radius);
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
        }
        .gallery-item:hover {
          border-color: var(--border);
          transform: translateY(-2px);
          box-shadow: var(--shadow);
        }
        .gallery-item.selected {
          border-color: var(--accent);
          box-shadow: 0 0 0 1px var(--accent), var(--shadow);
        }
        .gallery-img-wrap {
          position: relative;
          aspect-ratio: 1;
          overflow: hidden;
          background: var(--bg-card);
        }
        .gallery-img-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }
        .gallery-item:hover .gallery-img-wrap img {
          transform: scale(1.05);
        }
        .gallery-checkbox {
          position: absolute;
          top: 8px;
          left: 8px;
          filter: drop-shadow(0 1px 3px rgba(0,0,0,0.5));
        }
        .gallery-order {
          position: absolute;
          top: 8px;
          right: 8px;
          background: var(--accent);
          color: #fff;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
        }
        .gallery-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
        }
        .gallery-name {
          font-size: 12px;
          color: var(--text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 120px;
        }
      `}</style>
    </div>
  );
}
