export default function VideoList({ videos, images, onDelete, onRefresh }) {
  const imageMap = Object.fromEntries(images.map((img) => [img.id, img]));

  if (videos.length === 0) {
    return (
      <div className="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-secondary)", opacity: 0.4 }}>
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
        <p>还没有生成过视频</p>
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          选择图片并生成你的第一个视频
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

  return (
    <div>
      <div className="vl-header">
        <h2>视频列表</h2>
        <button className="btn btn-outline btn-sm" onClick={onRefresh}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          刷新
        </button>
      </div>

      <div className="vl-list">
        {videos.map((video) => (
          <div key={video.id} className="vl-card">
            <div className="vl-card-main">
              <div className="vl-video-area">
                {video.status === "completed" ? (
                  <video
                    controls
                    preload="metadata"
                    className="vl-video"
                  >
                    <source
                      src={`/api/videos/file/${video.filename}`}
                      type="video/mp4"
                    />
                  </video>
                ) : (
                  <div className="vl-video-placeholder">
                    {video.status === "processing" ? (
                      <>
                        <div className="spinner-md" />
                        <span>生成中 {video.progress}%</span>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${video.progress}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        <span style={{ color: "var(--danger)" }}>生成失败</span>
                        {video.error && (
                          <span className="vl-error">{video.error}</span>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="vl-card-info">
                <div className="vl-meta">
                  <div className="vl-status-row">
                    <span className={`vl-status ${video.status}`}>
                      {video.status === "completed"
                        ? "已完成"
                        : video.status === "processing"
                          ? "生成中"
                          : "失败"}
                    </span>
                    <span className="vl-time">{formatTime(video.create_time)}</span>
                  </div>
                  <p className="vl-detail">
                    {video.image_count || video.image_ids?.length || 0} 张图片 ·{" "}
                    {video.settings?.duration_per_image || 3}秒/张
                    {video.settings?.transition === "fade" ? " · 淡入淡出" : ""}
                  </p>
                </div>

                <div className="vl-thumbs">
                  {(video.image_ids || []).slice(0, 5).map((imgId) => {
                    const img = imageMap[imgId];
                    return img ? (
                      <img
                        key={imgId}
                        src={`/api/uploads/${img.stored_name}`}
                        alt=""
                        className="vl-thumb"
                      />
                    ) : null;
                  })}
                  {(video.image_ids || []).length > 5 && (
                    <span className="vl-more">
                      +{video.image_ids.length - 5}
                    </span>
                  )}
                </div>

                <div className="vl-actions">
                  {video.status === "completed" && (
                    <a
                      href={`/api/videos/file/${video.filename}`}
                      download
                      className="btn btn-sm btn-outline"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      下载
                    </a>
                  )}
                  <button
                    className="btn btn-sm btn-danger-outline"
                    onClick={() => onDelete(video.id)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .vl-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .vl-header h2 { font-size: 20px; font-weight: 600; }
        .vl-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .vl-card {
          background: var(--bg-secondary);
          border-radius: var(--radius);
          overflow: hidden;
          border: 1px solid var(--border);
          transition: border-color 0.2s;
        }
        .vl-card:hover { border-color: var(--accent); }
        .vl-card-main {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 0;
        }
        @media (max-width: 800px) {
          .vl-card-main { grid-template-columns: 1fr; }
        }
        .vl-video-area {
          background: #000;
          aspect-ratio: 16/9;
        }
        .vl-video {
          width: 100%;
          height: 100%;
          display: block;
        }
        .vl-video-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: var(--text-secondary);
          font-size: 14px;
        }
        .spinner-md {
          width: 32px;
          height: 32px;
          border: 3px solid var(--border);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .progress-bar {
          width: 120px;
          height: 4px;
          background: var(--border);
          border-radius: 2px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: var(--accent);
          transition: width 0.3s;
          border-radius: 2px;
        }
        .vl-card-info {
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .vl-status-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
        }
        .vl-status {
          font-size: 12px;
          font-weight: 600;
          padding: 2px 10px;
          border-radius: 10px;
        }
        .vl-status.completed { background: rgba(46, 204, 113, 0.15); color: var(--success); }
        .vl-status.processing { background: rgba(243, 156, 18, 0.15); color: var(--warning); }
        .vl-status.failed { background: rgba(231, 76, 60, 0.15); color: var(--danger); }
        .vl-time {
          font-size: 12px;
          color: var(--text-secondary);
        }
        .vl-detail {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 12px;
        }
        .vl-error {
          font-size: 11px;
          color: var(--text-secondary);
          max-width: 200px;
          text-align: center;
        }
        .vl-thumbs {
          display: flex;
          gap: 6px;
          align-items: center;
          margin-bottom: 16px;
        }
        .vl-thumb {
          width: 40px;
          height: 40px;
          border-radius: 6px;
          object-fit: cover;
          border: 1px solid var(--border);
        }
        .vl-more {
          font-size: 12px;
          color: var(--text-secondary);
          padding: 0 4px;
        }
        .vl-actions {
          display: flex;
          gap: 8px;
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
          cursor: pointer;
          text-decoration: none;
        }
        .btn-sm { padding: 6px 14px; font-size: 13px; }
        .btn-outline {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-primary);
        }
        .btn-outline:hover { border-color: var(--accent); color: var(--accent); }
        .btn-danger-outline {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-secondary);
        }
        .btn-danger-outline:hover {
          border-color: var(--danger);
          color: var(--danger);
          background: rgba(231, 76, 60, 0.08);
        }
      `}</style>
    </div>
  );
}

function formatTime(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  return d.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
