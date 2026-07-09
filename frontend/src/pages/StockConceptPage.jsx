import { useEffect, useMemo, useState } from "react";
import {
  BadgePercent,
  BarChart3,
  BookOpenText,
  Brain,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";
import api from "../api/client";
import {
  defaultConceptId,
  flattenStockConcepts,
  stockConceptSections,
} from "../data/stockConcepts";
import { stockIndicators } from "../data/stockIndicators";

const defaultPreferences = {
  min_price: 3,
  max_price: 60,
  recommendation_count: 10,
  max_pe_ttm: 30,
  max_pb: 3.5,
  min_turnover_rate: 0.8,
  min_amount_million: 80,
  refresh_daily: true,
};

const defaultIndicatorCategory = stockIndicators[0]?.category || "";
const defaultConceptSectionId = stockConceptSections[0]?.id || "";

export default function StockConceptPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [latestScan, setLatestScan] = useState(null);
  const [selectedConceptId, setSelectedConceptId] = useState(defaultConceptId);
  const [activeLearningCard, setActiveLearningCard] = useState(null);
  const [expandedConceptSectionId, setExpandedConceptSectionId] = useState(
    defaultConceptSectionId
  );
  const [expandedIndicatorCategory, setExpandedIndicatorCategory] = useState(
    defaultIndicatorCategory
  );
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const fetchDashboard = async () => {
    setLoading(true);
    setActionError("");
    try {
      const { data } = await api.get("/stocks/dashboard");
      setPreferences({ ...defaultPreferences, ...(data.preferences || {}) });
      setLatestScan(data.latest_scan || null);
    } catch (error) {
      setActionError(readApiError(error, "加载股票模块失败，请确认后端正在运行。"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    const handleAssistantRefresh = () => {
      fetchDashboard();
    };

    window.addEventListener("assistant:stocks-updated", handleAssistantRefresh);
    return () => {
      window.removeEventListener("assistant:stocks-updated", handleAssistantRefresh);
    };
  }, []);

  useEffect(() => {
    if (!activeLearningCard) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setActiveLearningCard(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeLearningCard]);

  const recommendationStats = useMemo(() => {
    const recommendations = latestScan?.recommendations || [];
    if (recommendations.length === 0) {
      return {
        averagePe: 0,
        averagePb: 0,
        averagePrice: 0,
      };
    }

    const totalPe = recommendations.reduce((sum, item) => sum + Number(item.pe_ttm || 0), 0);
    const totalPb = recommendations.reduce((sum, item) => sum + Number(item.pb || 0), 0);
    const totalPrice = recommendations.reduce((sum, item) => sum + Number(item.price || 0), 0);

    return {
      averagePe: totalPe / recommendations.length,
      averagePb: totalPb / recommendations.length,
      averagePrice: totalPrice / recommendations.length,
    };
  }, [latestScan]);

  const allConcepts = useMemo(() => flattenStockConcepts(), []);
  const selectedConcept =
    allConcepts.find((item) => item.id === selectedConceptId) || allConcepts[0];
  const indicatorGroups = useMemo(() => {
    const groups = new Map();

    stockIndicators.forEach((item) => {
      if (!groups.has(item.category)) {
        groups.set(item.category, []);
      }
      groups.get(item.category).push(item);
    });

    return Array.from(groups.entries()).map(([category, items]) => ({
      category,
      items,
    }));
  }, []);

  const handlePreferenceChange = (key, value, type = "number") => {
    setPreferences((prev) => ({
      ...prev,
      [key]: type === "checkbox" ? value : Number(value),
    }));
  };

  const savePreferences = async (event) => {
    event.preventDefault();
    setSaving(true);
    setActionError("");
    setActionMessage("");
    try {
      const { data } = await api.post("/stocks/preferences", preferences);
      setPreferences({ ...defaultPreferences, ...(data.preferences || {}) });
      setLatestScan(data.latest_scan || null);
      setActionMessage(
        `筛选条件已保存，并已按新条件重跑。当前返回 ${
          data.latest_scan?.recommendations?.length || 0
        } 只候选股票。`
      );
    } catch (error) {
      setActionError(readApiError(error, "保存条件失败，请稍后再试。"));
    } finally {
      setSaving(false);
    }
  };

  const runScan = async () => {
    setScanning(true);
    setActionError("");
    setActionMessage("");
    try {
      const { data } = await api.post("/stocks/scan");
      setLatestScan(data.latest_scan || null);
      setActionMessage(
        `已重新扫描完成。当前返回 ${data.latest_scan?.recommendations?.length || 0} 只候选股票。`
      );
    } catch (error) {
      setActionError(readApiError(error, "立即扫描失败，请确认后端接口可用。"));
    } finally {
      setScanning(false);
    }
  };

  const openConceptCard = (concept) => {
    setActiveLearningCard({
      sourceId: concept.id,
      badge: concept.sectionTitle,
      title: concept.term,
      valueLabel: "公式",
      value: concept.formula,
      plain: concept.plain,
      howToRead: concept.hint,
      example: concept.example,
    });
  };

  const openIndicatorCard = (indicator) => {
    setActiveLearningCard({
      sourceId: indicator.id,
      badge: indicator.category,
      title: indicator.term,
      valueLabel: "图里数值",
      value: indicator.displayValue,
      plain: indicator.plain,
      howToRead: indicator.howToRead,
      example: indicator.example,
    });
  };

  const toggleIndicatorCategory = (category) => {
    setExpandedIndicatorCategory((prev) => (prev === category ? "" : category));
  };

  const toggleConceptSection = (sectionId) => {
    setExpandedConceptSectionId((prev) => (prev === sectionId ? "" : sectionId));
  };

  return (
    <div className="stock-page">
      <section className="stock-hero">
        <div>
          <p className="section-kicker">Stock Learning Workspace</p>
          <h2>股票概念理解</h2>
          <p className="hero-desc">
            一边看概念解释，一边按价格、PE、PB、换手率和成交额做 A 股日度初筛，
            自动生成 10 只观察标的和推荐理由。
          </p>
        </div>
        <div className="stock-hero-badge">
          <BarChart3 size={18} />
          Daily A-Share Scanner
        </div>
      </section>

      <section className="stock-summary-grid">
        <InfoCard
          icon={Wallet}
          label="价格上限"
          value={`¥${Number(preferences.max_price).toFixed(0)}`}
          note="用于筛掉单价过高标的"
        />
        <InfoCard
          icon={BadgePercent}
          label="平均 PE(TTM)"
          value={latestScan ? recommendationStats.averagePe.toFixed(2) : "--"}
          note="推荐池最近 12 个月利润估值"
        />
        <InfoCard
          icon={ShieldCheck}
          label="平均 PB"
          value={latestScan ? recommendationStats.averagePb.toFixed(2) : "--"}
          note="推荐池账面家底估值倍数"
        />
        <InfoCard
          icon={Brain}
          label="结果数量"
          value={`${latestScan?.recommendations?.length || 0} 只`}
          note={latestScan?.selection_mode === "relaxed" ? "已自动放宽规则" : "按当前条件筛选"}
        />
      </section>

      <section className="stock-layout">
        <div className="stock-main-column">
          <section className="stock-card">
            <div className="stock-card-head">
              <div>
                <p className="section-kicker">Concept Guide</p>
                <h3>概念解释</h3>
              </div>
              <BookOpenText size={18} />
            </div>

            {loading ? (
              <div className="empty-panel">加载概念中...</div>
            ) : (
              <div className="stock-concept-browser">
                <div className="stock-concept-nav">
                  {stockConceptSections.map((section) => (
                    <div
                      key={section.id}
                      className={`stock-concept-nav-group ${
                        expandedConceptSectionId === section.id ? "expanded" : "collapsed"
                      }`}
                    >
                      <button
                        type="button"
                        className="stock-concept-nav-head"
                        onClick={() => toggleConceptSection(section.id)}
                        aria-expanded={expandedConceptSectionId === section.id}
                      >
                        <strong>{section.title}</strong>
                        <span>{section.description}</span>
                        <em className="stock-concept-nav-toggle">
                          {expandedConceptSectionId === section.id ? "收起" : "展开"}
                        </em>
                      </button>

                      <div
                        className={`stock-concept-nav-list ${
                          expandedConceptSectionId === section.id ? "expanded" : "collapsed"
                        }`}
                      >
                        {section.items.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            className={`stock-concept-nav-item ${
                              selectedConceptId === item.id ? "active" : ""
                            }`}
                            onClick={() => {
                              setSelectedConceptId(item.id);
                              setExpandedConceptSectionId(section.id);
                            }}
                          >
                            <strong>{item.term}</strong>
                            <span>{item.formula}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <article className="stock-concept-detail">
                  <div className="stock-concept-title-row">
                    <div>
                      <span className="stock-detail-tag">{selectedConcept.sectionTitle}</span>
                      <h4>{selectedConcept.term}</h4>
                      <p>{selectedConcept.plain}</p>
                    </div>
                    <button
                      type="button"
                      className="stock-refresh-btn stock-card-open-btn"
                      onClick={() => openConceptCard(selectedConcept)}
                    >
                      卡片讲解
                    </button>
                  </div>

                  <div className="stock-concept-detail-grid">
                    <div className="stock-concept-item">
                      <div className="stock-concept-top">
                        <strong>公式</strong>
                        <span>{selectedConcept.formula}</span>
                      </div>
                      <p>{selectedConcept.plain}</p>
                    </div>

                    <div className="stock-concept-item">
                      <div className="stock-concept-top">
                        <strong>怎么看</strong>
                        <span>使用提示</span>
                      </div>
                      <p>{selectedConcept.hint}</p>
                    </div>
                  </div>

                  <div className="stock-concept-example">
                    <span className="stock-pick-section-title">举例</span>
                    <p>{selectedConcept.example}</p>
                  </div>
                </article>
              </div>
            )}
          </section>

          <section className="stock-card">
            <div className="stock-card-head">
              <div>
                <p className="section-kicker">Indicator Learning Table</p>
                <h3>指标理解表</h3>
                <p className="stock-inline-note">
                  点击整条指标，就会在右侧打开知识面板，不用再看挤在一起的表格。
                </p>
              </div>
              <BarChart3 size={18} />
            </div>

            <div className="stock-indicator-groups">
              {indicatorGroups.map((group) => (
                <section
                  key={group.category}
                  className={`stock-indicator-group ${
                    expandedIndicatorCategory === group.category ? "expanded" : "collapsed"
                  }`}
                >
                  <button
                    type="button"
                    className="stock-indicator-group-head"
                    onClick={() => toggleIndicatorCategory(group.category)}
                    aria-expanded={expandedIndicatorCategory === group.category}
                  >
                    <div>
                      <strong>{group.category}</strong>
                      <p>共 {group.items.length} 个指标，适合按组理解。</p>
                    </div>
                    <span className="stock-indicator-group-toggle">
                      {expandedIndicatorCategory === group.category ? "收起" : "展开"}
                    </span>
                  </button>

                  <div
                    className={`stock-indicator-list ${
                      expandedIndicatorCategory === group.category ? "expanded" : "collapsed"
                    }`}
                  >
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`stock-indicator-row ${
                          activeLearningCard?.sourceId === item.id ? "active" : ""
                        }`}
                        onClick={() => openIndicatorCard(item)}
                      >
                        <div className="stock-indicator-row-top">
                          <div>
                            <strong>{item.term}</strong>
                            <span>{item.displayValue}</span>
                          </div>
                          <em>点击查看讲解</em>
                        </div>

                        <div className="stock-indicator-row-content">
                          <p>
                            <label>大白话</label>
                            {item.plain}
                          </p>
                          <p>
                            <label>怎么看</label>
                            {item.howToRead}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </section>

          <section className="stock-card">
            <div className="stock-card-head">
              <div>
                <p className="section-kicker">Daily Picks</p>
                <h3>每日推荐股票</h3>
                <p className="stock-inline-note">
                  {latestScan?.summary || "先保存条件或手动扫描一次，生成当天的候选股票。"}
                </p>
              </div>
              <button className="stock-refresh-btn" onClick={runScan} disabled={scanning}>
                <RefreshCw size={16} className={scanning ? "spin" : ""} />
                {scanning ? "扫描中..." : "立即扫描"}
              </button>
            </div>

            {actionMessage ? <div className="stock-feedback success">{actionMessage}</div> : null}
            {actionError ? <div className="stock-feedback error">{actionError}</div> : null}

            <div className="stock-scan-meta">
              <span>数据源：{latestScan?.source || "--"}</span>
              <span>更新时间：{formatDateTime(latestScan?.generated_at)}</span>
              <span>筛选模式：{latestScan?.selection_mode === "relaxed" ? "宽松补足" : "严格筛选"}</span>
              <span>价格区间：¥{Number(preferences.min_price).toFixed(1)} - ¥{Number(preferences.max_price).toFixed(1)}</span>
              <span>PE(TTM) ≤ {Number(preferences.max_pe_ttm).toFixed(1)}</span>
              <span>PB ≤ {Number(preferences.max_pb).toFixed(1)}</span>
            </div>

            {!latestScan?.recommendations?.length ? (
              <div className="empty-panel">当前还没有推荐结果。</div>
            ) : (
              <div className="stock-recommendation-list">
                {latestScan.recommendations.map((item, index) => (
                  <article key={`${item.code}-${item.name}`} className="stock-pick-card">
                    <div className="stock-pick-head">
                      <div>
                        <span className="stock-rank">#{index + 1}</span>
                        <h4>
                          {item.name} <em>{item.code}</em>
                        </h4>
                      </div>
                      <div className="stock-pick-price">
                        <strong>¥{Number(item.price).toFixed(2)}</strong>
                        <span className={Number(item.change_pct) >= 0 ? "success" : "danger"}>
                          {Number(item.change_pct) >= 0 ? "+" : ""}
                          {Number(item.change_pct).toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    <div className="stock-pick-metrics">
                      <MetricPill label="PE(TTM)" value={item.pe_ttm} />
                      <MetricPill label="PB" value={item.pb} />
                      <MetricPill label="换手率" value={`${Number(item.turnover_rate).toFixed(2)}%`} />
                      <MetricPill
                        label="成交额"
                        value={`${Number(item.amount_million).toFixed(0)} 百万`}
                      />
                      <MetricPill
                        label="总市值"
                        value={`${Number(item.market_cap_billion).toFixed(2)} 亿`}
                      />
                      <MetricPill label="评分" value={item.score} accent />
                    </div>

                    <p className="stock-pick-commentary">{item.commentary}</p>

                    <div className="stock-pick-columns">
                      <div>
                        <span className="stock-pick-section-title">推荐理由</span>
                        {item.reasons.map((reason) => (
                          <p key={reason} className="stock-pick-line">
                            {reason}
                          </p>
                        ))}
                      </div>

                      <div>
                        <span className="stock-pick-section-title">需要继续确认</span>
                        {item.risks.map((risk) => (
                          <p key={risk} className="stock-pick-line risk">
                            {risk}
                          </p>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="stock-side-column">
          <form className="stock-card stock-form-card" onSubmit={savePreferences}>
            <div className="stock-card-head">
              <div>
                <p className="section-kicker">Scanner Config</p>
                <h3>筛选条件</h3>
              </div>
              <ScanSearch size={18} />
            </div>

            <div className="stock-form-grid">
              <label className="finance-field">
                <span>最低价格</span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={preferences.min_price}
                  onChange={(event) => handlePreferenceChange("min_price", event.target.value)}
                />
              </label>

              <label className="finance-field">
                <span>最高价格</span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={preferences.max_price}
                  onChange={(event) => handlePreferenceChange("max_price", event.target.value)}
                />
              </label>

              <label className="finance-field">
                <span>推荐数量</span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  step="1"
                  value={preferences.recommendation_count}
                  onChange={(event) =>
                    handlePreferenceChange("recommendation_count", event.target.value)
                  }
                />
              </label>

              <label className="finance-field">
                <span>PE(TTM) 上限</span>
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={preferences.max_pe_ttm}
                  onChange={(event) => handlePreferenceChange("max_pe_ttm", event.target.value)}
                />
              </label>

              <label className="finance-field">
                <span>PB 上限</span>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={preferences.max_pb}
                  onChange={(event) => handlePreferenceChange("max_pb", event.target.value)}
                />
              </label>

              <label className="finance-field">
                <span>最低换手率</span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={preferences.min_turnover_rate}
                  onChange={(event) =>
                    handlePreferenceChange("min_turnover_rate", event.target.value)
                  }
                />
              </label>

              <label className="finance-field">
                <span>最低成交额(百万)</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={preferences.min_amount_million}
                  onChange={(event) =>
                    handlePreferenceChange("min_amount_million", event.target.value)
                  }
                />
              </label>
            </div>

            <label className="stock-checkbox-row">
              <input
                type="checkbox"
                checked={preferences.refresh_daily}
                onChange={(event) =>
                  handlePreferenceChange("refresh_daily", event.target.checked, "checkbox")
                }
              />
              <span>每天自动刷新当日推荐池</span>
            </label>

            <button className="auth-submit-btn" type="submit" disabled={saving}>
              {saving ? "保存并刷新中..." : "保存条件并重跑"}
            </button>
          </form>

          <div className="stock-card">
            <div className="stock-card-head">
              <div>
                <p className="section-kicker">How To Use</p>
                <h3>使用建议</h3>
              </div>
            </div>

            <div className="stock-tips">
              <div className="stock-tip-item">
                <strong>1. 先看概念</strong>
                <p>先把 PE、PB、EPS、ROE、换手率这些指标看明白，再看推荐结果。</p>
              </div>
              <div className="stock-tip-item">
                <strong>2. 再看条件</strong>
                <p>如果你偏稳健，可以把 PE 和 PB 上限设低一点，再收窄价格上限。</p>
              </div>
              <div className="stock-tip-item">
                <strong>3. 最后做复核</strong>
                <p>推荐池是日度初筛，不等于最终买入名单，仍需复核财报、公告和行业景气。</p>
              </div>
            </div>
          </div>
        </aside>
      </section>

      {activeLearningCard ? (
        <div
          className="stock-learning-drawer-backdrop"
          role="presentation"
          onClick={() => setActiveLearningCard(null)}
        >
          <div
            className="stock-learning-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="stock-learning-card-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="stock-learning-drawer-head">
              <div>
                <span className="stock-detail-tag">{activeLearningCard.badge}</span>
                <h3 id="stock-learning-card-title">{activeLearningCard.title}</h3>
                <p>这张卡片会尽量不用术语，直接用大白话和例子帮你理解。</p>
              </div>
              <button
                type="button"
                className="stock-learning-drawer-close"
                onClick={() => setActiveLearningCard(null)}
                aria-label="关闭讲解卡片"
              >
                <X size={18} />
              </button>
            </div>

            <div className="stock-learning-drawer-body">
              <div className="stock-learning-summary">
                <div className="stock-learning-summary-value">
                  <span>{activeLearningCard.valueLabel}</span>
                  <strong>{activeLearningCard.value}</strong>
                </div>
                <div className="stock-learning-summary-plain">
                  <span>一句话理解</span>
                  <p>{activeLearningCard.plain}</p>
                </div>
              </div>

              <div className="stock-learning-reading">
                <section className="stock-learning-section">
                  <span>大白话</span>
                  <p>{activeLearningCard.plain}</p>
                </section>

                <section className="stock-learning-section">
                  <span>一般怎么看</span>
                  <p>{activeLearningCard.howToRead}</p>
                </section>

                <section className="stock-learning-section">
                  <span>举个例子</span>
                  <p>{activeLearningCard.example}</p>
                </section>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, note }) {
  return (
    <article className="stock-summary-card">
      <div className="stock-summary-top">
        <span>{label}</span>
        <div className="stock-summary-icon">
          <Icon size={16} />
        </div>
      </div>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  );
}

function MetricPill({ label, value, accent = false }) {
  return (
    <div className={`stock-metric-pill ${accent ? "accent" : ""}`}>
      <span>{label}</span>
      <strong>{typeof value === "number" ? Number(value).toFixed(2) : value}</strong>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return "--";
  return value.replace("T", " ").slice(0, 19);
}

function readApiError(error, fallback) {
  return error?.response?.data?.detail || error?.message || fallback;
}
