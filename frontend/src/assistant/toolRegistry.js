import api from "../api/client";
import { dashboardSnapshot, tradingPersonaSnapshot } from "./localData";

function clampLimit(value, fallback = 5) {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return fallback;
  return Math.min(Math.max(numericValue, 1), 10);
}

function sortByDate(items, key) {
  return [...(items || [])].sort((left, right) =>
    String(right?.[key] || "").localeCompare(String(left?.[key] || ""))
  );
}

function normalizeStockPreferenceChanges(params = {}) {
  const changes = params.changes || params;
  return {
    ...changes,
    min_price: changes.min_price !== undefined ? Number(changes.min_price) : undefined,
    max_price: changes.max_price !== undefined ? Number(changes.max_price) : undefined,
    recommendation_count:
      changes.recommendation_count !== undefined ? Number(changes.recommendation_count) : undefined,
    max_pe_ttm: changes.max_pe_ttm !== undefined ? Number(changes.max_pe_ttm) : undefined,
    max_pb: changes.max_pb !== undefined ? Number(changes.max_pb) : undefined,
    min_turnover_rate:
      changes.min_turnover_rate !== undefined ? Number(changes.min_turnover_rate) : undefined,
    min_amount_million:
      changes.min_amount_million !== undefined ? Number(changes.min_amount_million) : undefined,
    refresh_daily:
      changes.refresh_daily !== undefined ? Boolean(changes.refresh_daily) : undefined,
  };
}

export const assistantTools = {
  "auth.me": {
    id: "auth.me",
    label: "当前登录用户",
    dataSources: ["/api/auth/me"],
    async run() {
      const { data } = await api.get("/auth/me");
      return data.user;
    },
  },
  "finance.overview": {
    id: "finance.overview",
    label: "财务概览",
    dataSources: ["/api/finance/overview"],
    async run() {
      const { data } = await api.get("/finance/overview");
      return data;
    },
  },
  "finance.transactions": {
    id: "finance.transactions",
    label: "流水明细",
    dataSources: ["/api/finance/transactions"],
    async run(params = {}) {
      const { data } = await api.get("/finance/transactions");
      const limit = clampLimit(params.limit);
      return {
        total: data.transactions?.length || 0,
        items: (data.transactions || []).slice(0, limit),
        limit,
      };
    },
  },
  "stocks.dashboard": {
    id: "stocks.dashboard",
    label: "股票模块概览",
    dataSources: ["/api/stocks/dashboard"],
    async run() {
      const { data } = await api.get("/stocks/dashboard");
      return data;
    },
  },
  "stocks.recommendations": {
    id: "stocks.recommendations",
    label: "股票推荐结果",
    dataSources: ["/api/stocks/dashboard"],
    async run(params = {}) {
      const { data } = await api.get("/stocks/dashboard");
      const recommendations = data.latest_scan?.recommendations || [];
      const limit = clampLimit(params.limit);
      return {
        preferences: data.preferences || {},
        summary: data.latest_scan?.summary || "",
        latest_scan: data.latest_scan || null,
        items: recommendations.slice(0, limit),
        limit,
      };
    },
  },
  "stocks.preferences": {
    id: "stocks.preferences",
    label: "股票筛选偏好",
    dataSources: ["/api/stocks/dashboard"],
    async run() {
      const { data } = await api.get("/stocks/dashboard");
      return data.preferences || {};
    },
  },
  "stocks.explainRecommendations": {
    id: "stocks.explainRecommendations",
    label: "股票推荐解释",
    dataSources: ["/api/stocks/dashboard"],
    async run(params = {}) {
      const { data } = await api.get("/stocks/dashboard");
      const recommendations = data.latest_scan?.recommendations || [];
      const limit = clampLimit(params.limit, 5);
      return {
        preferences: data.preferences || {},
        latest_scan: data.latest_scan || null,
        items: recommendations.slice(0, limit),
        limit,
      };
    },
  },
  "stocks.updatePreferences": {
    id: "stocks.updatePreferences",
    label: "更新股票筛选条件",
    dataSources: ["/api/stocks/preferences"],
    async run(params = {}) {
      const payload = normalizeStockPreferenceChanges(params);
      const { data } = await api.post("/stocks/preferences", payload);
      return {
        preferences: data.preferences || {},
        latest_scan: data.latest_scan || null,
        appliedChanges: params.changeSummary || [],
      };
    },
  },
  "stocks.runScan": {
    id: "stocks.runScan",
    label: "重新扫描股票池",
    dataSources: ["/api/stocks/scan"],
    async run() {
      const { data } = await api.post("/stocks/scan");
      return {
        latest_scan: data.latest_scan || null,
      };
    },
  },
  "images.list": {
    id: "images.list",
    label: "图片素材列表",
    dataSources: ["/api/images"],
    async run(params = {}) {
      const { data } = await api.get("/images");
      const limit = clampLimit(params.limit);
      const items = sortByDate(data.images, "upload_time");
      return {
        total: items.length,
        items: items.slice(0, limit),
        limit,
      };
    },
  },
  "videos.list": {
    id: "videos.list",
    label: "视频结果列表",
    dataSources: ["/api/videos"],
    async run(params = {}) {
      const { data } = await api.get("/videos");
      const limit = clampLimit(params.limit);
      const items = sortByDate(data.videos, "create_time");
      return {
        total: items.length,
        items: items.slice(0, limit),
        limit,
      };
    },
  },
  "dashboard.overview": {
    id: "dashboard.overview",
    label: "运营看板概览",
    dataSources: ["frontend-local/dashboard"],
    async run() {
      return dashboardSnapshot;
    },
  },
  "trading.overview": {
    id: "trading.overview",
    label: "交易画像工坊概览",
    dataSources: ["frontend-local/trading-persona"],
    async run() {
      return tradingPersonaSnapshot;
    },
  },
};

export async function executeAssistantTool(intentId, params) {
  const tool = assistantTools[intentId];
  if (!tool) {
    throw new Error("Unsupported assistant intent");
  }

  const payload = await tool.run(params);
  return {
    intent: intentId,
    dataSources: tool.dataSources,
    payload,
  };
}
