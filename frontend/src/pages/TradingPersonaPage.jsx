import { useMemo, useState } from "react";
import {
  Bot,
  BrainCircuit,
  MessageSquareText,
  ScanFace,
  TrendingUp,
  Upload,
} from "lucide-react";

const watchlist = [
  { symbol: "AAPL", name: "Apple", price: 189.34, change: 1.24 },
  { symbol: "TSLA", name: "Tesla", price: 178.62, change: -2.13 },
  { symbol: "NVDA", name: "NVIDIA", price: 903.18, change: 3.82 },
  { symbol: "MSFT", name: "Microsoft", price: 427.11, change: 0.67 },
];

const positions = [
  { symbol: "AAPL", shares: 120, cost: 181.2, pnl: 976.8 },
  { symbol: "NVDA", shares: 32, cost: 864.6, pnl: 1235.84 },
  { symbol: "TSLA", shares: 54, cost: 186.4, pnl: -420.12 },
];

const moods = ["高兴", "冷静", "坚定", "兴奋", "惊讶", "困惑"];
const styles = ["交易员海报风", "贴纸风", "柔和插画风", "专业头像风"];

const slangLibrary = {
  财经: {
    上车: "指开始买入某个标的，希望抓住上涨行情。",
    梭哈: "把手里大部分甚至全部资金一次性投入。",
    踏空: "没有买入结果行情上涨，错过盈利机会。",
  },
  游戏: {
    上大分: "表示排名、分数、战绩明显提升。",
    开摆: "不想再努力，直接躺平式处理。",
    吃操作: "形容被对方的高水平玩法压制或惊到。",
  },
  短视频: {
    爆款脸: "镜头感、识别度和情绪张力都很强的形象。",
    冷启动: "新账号或新内容刚开始获取流量的阶段。",
    钩子: "视频开头吸引用户继续看下去的强刺激点。",
  },
};

const hotTerms = ["上车", "梭哈", "爆款脸", "冷启动", "上大分"];

export default function TradingPersonaPage() {
  const [uploadedImage, setUploadedImage] = useState("");
  const [generatedCards, setGeneratedCards] = useState([]);
  const [selectedMood, setSelectedMood] = useState(moods[0]);
  const [selectedStyle, setSelectedStyle] = useState(styles[0]);
  const [customText, setCustomText] = useState("今天也要稳住节奏");
  const [industry, setIndustry] = useState("财经");
  const [term, setTerm] = useState("上车");

  const explanation = useMemo(() => {
    const bank = slangLibrary[industry] || {};
    return bank[term] || "输入或切换一个热门词，我会在这里展示含义和适用场景。";
  }, [industry, term]);

  const totalPnl = positions.reduce((sum, item) => sum + item.pnl, 0);
  const totalMarketValue = positions.reduce(
    (sum, item) => sum + item.shares * item.cost + item.pnl,
    0
  );

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadedImage(URL.createObjectURL(file));
  };

  const handleGenerate = () => {
    setGeneratedCards((prev) => [
      {
        id: Date.now(),
        image: uploadedImage,
        mood: selectedMood,
        style: selectedStyle,
        text: customText.trim() || "情绪生成完成",
      },
      ...prev,
    ]);
  };

  return (
    <div className="persona-page">
      <section className="persona-hero">
        <div>
          <p className="section-kicker">Fusion Workspace</p>
          <h2>交易画像工坊</h2>
          <p className="hero-desc">
            把股票交易模拟工作台的桌面结构，和 AI 头像生成网站的上传、情绪、文案、
            黑话解释能力合成到一个统一功能模块里。
          </p>
        </div>
        <div className="persona-hero-badge">
          <BrainCircuit size={18} />
          Trading + AI Emoji
        </div>
      </section>

      <section className="persona-summary-grid">
        <div className="persona-summary-card">
          <span>组合市值</span>
          <strong>¥{totalMarketValue.toFixed(2)}</strong>
        </div>
        <div className="persona-summary-card">
          <span>今日浮盈</span>
          <strong className={totalPnl >= 0 ? "success" : "danger"}>
            {totalPnl >= 0 ? "+" : ""}¥{totalPnl.toFixed(2)}
          </strong>
        </div>
        <div className="persona-summary-card">
          <span>自选标的</span>
          <strong>{watchlist.length}</strong>
        </div>
        <div className="persona-summary-card">
          <span>已生成画像</span>
          <strong>{generatedCards.length}</strong>
        </div>
      </section>

      <section className="persona-layout">
        <div className="persona-left-column">
          <div className="persona-card">
            <div className="persona-card-head">
              <div>
                <p className="section-kicker">Market Board</p>
                <h3>交易观察列表</h3>
              </div>
              <TrendingUp size={18} />
            </div>
            <table className="persona-table">
              <thead>
                <tr>
                  <th>代码</th>
                  <th>名称</th>
                  <th>价格</th>
                  <th>涨跌幅</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map((item) => (
                  <tr key={item.symbol}>
                    <td>{item.symbol}</td>
                    <td>{item.name}</td>
                    <td>${item.price.toFixed(2)}</td>
                    <td className={item.change >= 0 ? "success" : "danger"}>
                      {item.change >= 0 ? "+" : ""}
                      {item.change.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="persona-card">
            <div className="persona-card-head">
              <div>
                <p className="section-kicker">Position Snapshot</p>
                <h3>持仓概览</h3>
              </div>
            </div>
            <div className="persona-position-list">
              {positions.map((item) => (
                <div key={item.symbol} className="persona-position-item">
                  <div>
                    <strong>{item.symbol}</strong>
                    <p>{item.shares} 股 · 成本 ${item.cost}</p>
                  </div>
                  <span className={item.pnl >= 0 ? "success" : "danger"}>
                    {item.pnl >= 0 ? "+" : ""}¥{item.pnl.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="persona-main-column">
          <div className="persona-card">
            <div className="persona-card-head">
              <div>
                <p className="section-kicker">Avatar Generator</p>
                <h3>交易员头像生成台</h3>
              </div>
              <ScanFace size={18} />
            </div>

            <div className="persona-generator-layout">
              <div className="persona-upload-panel">
                <label className="persona-upload-box">
                  <input type="file" accept="image/*" hidden onChange={handleUpload} />
                  <Upload size={22} />
                  <strong>上传人物图片</strong>
                  <p>支持 JPG、PNG，建议正脸或半身照</p>
                </label>

                <div className="persona-control-group">
                  <span>情绪选择</span>
                  <div className="persona-chip-group">
                    {moods.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={selectedMood === item ? "active" : ""}
                        onClick={() => setSelectedMood(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="persona-control-group">
                  <span>风格选择</span>
                  <div className="persona-chip-group">
                    {styles.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={selectedStyle === item ? "active" : ""}
                        onClick={() => setSelectedStyle(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="persona-field">
                  <span>文案文字</span>
                  <textarea
                    rows="4"
                    value={customText}
                    onChange={(event) => setCustomText(event.target.value)}
                    placeholder="例如：别慌，先看量能"
                  />
                </label>

                <button
                  className="auth-submit-btn"
                  type="button"
                  onClick={handleGenerate}
                  disabled={!uploadedImage}
                >
                  生成交易头像
                </button>
              </div>

              <div className="persona-preview-panel">
                <div className="persona-preview-stage">
                  {uploadedImage ? (
                    <div className="persona-preview-card">
                      <img src={uploadedImage} alt="preview" />
                      <div className="persona-preview-overlay">
                        <span>{selectedStyle}</span>
                        <strong>{selectedMood}</strong>
                        <p>{customText}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="persona-preview-empty">
                      上传图片后，这里会展示交易风格头像预览
                    </div>
                  )}
                </div>

                <div className="persona-result-grid">
                  {generatedCards.map((item) => (
                    <div key={item.id} className="persona-result-card">
                      <img src={item.image} alt={item.text} />
                      <div>
                        <strong>{item.mood}</strong>
                        <p>{item.style}</p>
                        <span>{item.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="persona-right-column">
          <div className="persona-card">
            <div className="persona-card-head">
              <div>
                <p className="section-kicker">Slang Box</p>
                <h3>黑话解释器</h3>
              </div>
              <MessageSquareText size={18} />
            </div>

            <label className="persona-field">
              <span>行业</span>
              <select value={industry} onChange={(event) => setIndustry(event.target.value)}>
                {Object.keys(slangLibrary).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="persona-field">
              <span>词语</span>
              <input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="输入互联网黑话"
              />
            </label>

            <div className="persona-hot-terms">
              {hotTerms.map((item) => (
                <button key={item} type="button" onClick={() => setTerm(item)}>
                  {item}
                </button>
              ))}
            </div>

            <div className="persona-explain-box">
              <p className="persona-explain-word">{term}</p>
              <p>{explanation}</p>
            </div>
          </div>

          <div className="persona-card">
            <div className="persona-card-head">
              <div>
                <p className="section-kicker">AI Queue</p>
                <h3>任务节奏</h3>
              </div>
              <Bot size={18} />
            </div>
            <div className="persona-queue-list">
              <div className="persona-queue-item">
                <strong>09:30 - 盘前观察</strong>
                <p>更新观察列表，确认热点板块情绪。</p>
              </div>
              <div className="persona-queue-item">
                <strong>11:00 - 头像生成</strong>
                <p>为今日复盘主题生成一张交易员风格头像。</p>
              </div>
              <div className="persona-queue-item">
                <strong>16:00 - 黑话解释</strong>
                <p>整理社区高频词，用于内容二创和社媒分发。</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
