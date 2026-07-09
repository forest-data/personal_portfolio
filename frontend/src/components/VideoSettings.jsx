import { useState } from "react";

export default function VideoSettings({ selectedImages, onGenerate, onBack }) {
  const [settings, setSettings] = useState({
    duration_per_image: 3,
    transition: "none",
    font_size: 40,
    font_color: "#FFFFFF",
    subtitle_position: "bottom",
    subtitle_style: "stroke",
    video_width: 1280,
    video_height: 720,
    fps: 24,
  });

  const [subtitles, setSubtitles] = useState(
    selectedImages.map((img) => ({ image_id: img.id, text: "" }))
  );

  const [generating, setGenerating] = useState(false);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateSubtitle = (imageId, text) => {
    setSubtitles((prev) =>
      prev.map((s) => (s.image_id === imageId ? { ...s, text } : s))
    );
  };

  const handleSubmit = async () => {
    setGenerating(true);
    try {
      const activeSubs = subtitles.filter((s) => s.text.trim());
      await onGenerate({
        ...settings,
        subtitles: activeSubs.length > 0 ? activeSubs : null,
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="vs-container">
      <div className="vs-header">
        <button className="btn btn-outline btn-sm" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          返回
        </button>
        <h2>视频生成设置</h2>
      </div>

      <div className="vs-layout">
        <div className="vs-left">
          <section className="vs-section">
            <h3>选中的图片 ({selectedImages.length}张)</h3>
            <div className="vs-preview-strip">
              {selectedImages.map((img, idx) => (
                <div key={img.id} className="vs-preview-item">
                  <div className="vs-preview-img">
                    <img src={`/api/uploads/${img.stored_name}`} alt="" />
                    <span className="vs-preview-idx">{idx + 1}</span>
                  </div>
                  <input
                    type="text"
                    className="vs-subtitle-input"
                    placeholder={`第${idx + 1}张字幕 (可选)`}
                    value={
                      subtitles.find((s) => s.image_id === img.id)?.text || ""
                    }
                    onChange={(e) => updateSubtitle(img.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="vs-right">
          <section className="vs-section">
            <h3>基础设置</h3>

            <div className="vs-field">
              <label>每张图片持续时间</label>
              <div className="vs-field-row">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={settings.duration_per_image}
                  onChange={(e) =>
                    updateSetting("duration_per_image", Number(e.target.value))
                  }
                />
                <span className="vs-value">{settings.duration_per_image}秒</span>
              </div>
            </div>

            <div className="vs-field">
              <label>转场效果</label>
              <select
                value={settings.transition}
                onChange={(e) => updateSetting("transition", e.target.value)}
              >
                <option value="none">无</option>
                <option value="fade">淡入淡出</option>
              </select>
            </div>

            <div className="vs-field">
              <label>视频分辨率</label>
              <select
                value={`${settings.video_width}x${settings.video_height}`}
                onChange={(e) => {
                  const [w, h] = e.target.value.split("x").map(Number);
                  updateSetting("video_width", w);
                  updateSetting("video_height", h);
                }}
              >
                <option value="1920x1080">1920x1080 (1080p)</option>
                <option value="1280x720">1280x720 (720p)</option>
                <option value="854x480">854x480 (480p)</option>
                <option value="720x1280">720x1280 (竖屏)</option>
                <option value="1080x1920">1080x1920 (竖屏高清)</option>
              </select>
            </div>

            <div className="vs-field">
              <label>帧率 (FPS)</label>
              <select
                value={settings.fps}
                onChange={(e) => updateSetting("fps", Number(e.target.value))}
              >
                <option value={24}>24 fps</option>
                <option value={30}>30 fps</option>
                <option value={60}>60 fps</option>
              </select>
            </div>
          </section>

          <section className="vs-section">
            <h3>字幕样式</h3>

            <div className="vs-field">
              <label>字体大小</label>
              <div className="vs-field-row">
                <input
                  type="range"
                  min="16"
                  max="80"
                  step="2"
                  value={settings.font_size}
                  onChange={(e) =>
                    updateSetting("font_size", Number(e.target.value))
                  }
                />
                <span className="vs-value">{settings.font_size}px</span>
              </div>
            </div>

            <div className="vs-field">
              <label>字体颜色</label>
              <div className="vs-field-row">
                <input
                  type="color"
                  value={settings.font_color}
                  onChange={(e) => updateSetting("font_color", e.target.value)}
                />
                <span className="vs-value">{settings.font_color}</span>
              </div>
            </div>

            <div className="vs-field">
              <label>字幕位置</label>
              <select
                value={settings.subtitle_position}
                onChange={(e) =>
                  updateSetting("subtitle_position", e.target.value)
                }
              >
                <option value="top">顶部</option>
                <option value="center">居中</option>
                <option value="bottom">底部</option>
              </select>
            </div>

            <div className="vs-field">
              <label>字幕样式</label>
              <div className="vs-style-grid">
                {[
                  { value: "stroke", label: "描边", desc: "万能百搭", icon: "T" },
                  { value: "shadow", label: "阴影", desc: "简洁优雅", icon: "T" },
                  { value: "gradient", label: "渐变", desc: "电影质感", icon: "▁" },
                  { value: "glass", label: "毛玻璃", desc: "现代风格", icon: "▢" },
                  { value: "classic", label: "经典", desc: "半透明底", icon: "■" },
                ].map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    className={`vs-style-btn ${settings.subtitle_style === s.value ? "active" : ""}`}
                    onClick={() => updateSetting("subtitle_style", s.value)}
                  >
                    <span className={`vs-style-icon vs-style-${s.value}`}>{s.icon}</span>
                    <span className="vs-style-label">{s.label}</span>
                    <span className="vs-style-desc">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <button
            className="btn btn-primary btn-lg btn-block"
            onClick={handleSubmit}
            disabled={generating}
          >
            {generating ? (
              <>
                <div className="spinner-sm" /> 生成中...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                开始生成视频
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .vs-container { }
        .vs-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        .vs-header h2 { font-size: 20px; font-weight: 600; }
        .vs-layout {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 24px;
        }
        @media (max-width: 900px) {
          .vs-layout { grid-template-columns: 1fr; }
        }
        .vs-section {
          background: var(--bg-secondary);
          border-radius: var(--radius);
          padding: 20px;
          margin-bottom: 16px;
        }
        .vs-section h3 {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 16px;
          color: var(--text-primary);
        }
        .vs-preview-strip {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 12px;
        }
        .vs-preview-item { }
        .vs-preview-img {
          position: relative;
          aspect-ratio: 16/10;
          border-radius: var(--radius-sm);
          overflow: hidden;
          margin-bottom: 8px;
          background: var(--bg-card);
        }
        .vs-preview-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .vs-preview-idx {
          position: absolute;
          top: 4px;
          left: 4px;
          background: var(--accent);
          color: #fff;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
        }
        .vs-subtitle-input {
          width: 100%;
          padding: 6px 10px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text-primary);
          font-size: 12px;
          outline: none;
          transition: border-color 0.2s;
        }
        .vs-subtitle-input:focus {
          border-color: var(--accent);
        }
        .vs-subtitle-input::placeholder {
          color: var(--text-secondary);
          opacity: 0.6;
        }
        .vs-field {
          margin-bottom: 14px;
        }
        .vs-field label {
          display: block;
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 6px;
        }
        .vs-field select, .vs-field input[type="text"] {
          width: 100%;
          padding: 8px 12px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text-primary);
          font-size: 13px;
          outline: none;
        }
        .vs-field select:focus, .vs-field input[type="text"]:focus {
          border-color: var(--accent);
        }
        .vs-style-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .vs-style-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 10px 6px 8px;
          background: var(--bg-card);
          border: 2px solid var(--border);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text-primary);
        }
        .vs-style-btn:hover {
          border-color: var(--accent);
          background: rgba(99,102,241,0.06);
        }
        .vs-style-btn.active {
          border-color: var(--accent);
          background: rgba(99,102,241,0.12);
          box-shadow: 0 0 0 1px var(--accent);
        }
        .vs-style-icon {
          font-size: 18px;
          font-weight: 800;
          line-height: 1;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .vs-style-stroke {
          -webkit-text-stroke: 2px #000;
          color: #fff;
          text-shadow: none;
        }
        .vs-style-shadow {
          color: #fff;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
          -webkit-text-stroke: 0;
        }
        .vs-style-gradient {
          color: #fff;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }
        .vs-style-glass {
          color: rgba(255,255,255,0.8);
          background: rgba(255,255,255,0.08);
          border-radius: 4px;
          padding: 0 4px;
        }
        .vs-style-classic {
          color: rgba(0,0,0,0.55);
        }
        .vs-style-label {
          font-size: 12px;
          font-weight: 600;
        }
        .vs-style-desc {
          font-size: 10px;
          color: var(--text-secondary);
          opacity: 0.7;
        }
        .vs-field-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .vs-field-row input[type="range"] {
          flex: 1;
          accent-color: var(--accent);
        }
        .vs-field-row input[type="color"] {
          width: 36px;
          height: 30px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          background: none;
        }
        .vs-value {
          font-size: 13px;
          color: var(--accent);
          font-weight: 600;
          min-width: 50px;
          text-align: right;
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
        }
        .btn-sm { padding: 6px 14px; font-size: 13px; }
        .btn-lg { padding: 12px 24px; font-size: 15px; }
        .btn-block { width: 100%; justify-content: center; }
        .btn-outline {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-primary);
        }
        .btn-outline:hover { border-color: var(--accent); color: var(--accent); }
        .btn-primary {
          background: var(--accent);
          color: #fff;
          border: none;
        }
        .btn-primary:hover { background: var(--accent-hover); }
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .spinner-sm {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
