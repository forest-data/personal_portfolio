const ROUTE_CONTEXTS = [
  { key: "dashboard", label: "运营 BI 看板", path: "/app" },
  { key: "finance", label: "记账台", path: "/app/finance" },
  { key: "stocks", label: "股票概念理解", path: "/app/stock-concepts" },
  { key: "image-to-video", label: "Image To Video", path: "/app/image-to-video" },
  { key: "trading-persona", label: "交易画像工坊", path: "/app/trading-persona" },
];

const INTENTS = [
  {
    id: "auth.me",
    toolId: "auth.me",
    keywords: ["我是谁", "当前登录", "登录账户", "我的账号", "账户信息", "个人信息"],
    routeBias: {},
  },
  {
    id: "finance.overview",
    toolId: "finance.overview",
    keywords: ["财务", "结余", "收入", "支出", "概览", "余额", "账目", "财务情况"],
    routeBias: { finance: 3 },
  },
  {
    id: "finance.transactions",
    toolId: "finance.transactions",
    keywords: ["流水", "交易记录", "明细", "最近流水", "记账", "最近账单", "收入明细", "支出明细"],
    routeBias: { finance: 4 },
    extractLimit: true,
  },
  {
    id: "stocks.recommendations",
    toolId: "stocks.recommendations",
    keywords: ["股票推荐", "推荐结果", "候选股票", "观察标的", "扫描结果", "推荐股票"],
    routeBias: { stocks: 4 },
    extractLimit: true,
  },
  {
    id: "stocks.explainRecommendations",
    toolId: "stocks.explainRecommendations",
    keywords: ["为什么推荐", "推荐理由", "解释推荐", "为什么这些股票", "为什么没结果"],
    routeBias: { stocks: 6 },
  },
  {
    id: "stocks.preferences",
    toolId: "stocks.preferences",
    keywords: ["股票偏好", "筛选条件", "偏好设置", "股票设置", "参数设置", "当前条件"],
    routeBias: { stocks: 3 },
  },
  {
    id: "stocks.dashboard",
    toolId: "stocks.dashboard",
    keywords: ["股票情况", "股票模块", "股票看板", "股票概览", "股票数据"],
    routeBias: { stocks: 2 },
  },
  {
    id: "images.list",
    toolId: "images.list",
    keywords: ["图片", "素材", "上传图片", "图片列表", "最近上传", "图片情况"],
    routeBias: { "image-to-video": 3 },
    extractLimit: true,
  },
  {
    id: "videos.list",
    toolId: "videos.list",
    keywords: ["视频", "成片", "生成记录", "视频列表", "最新生成", "视频情况"],
    routeBias: { "image-to-video": 4 },
    extractLimit: true,
  },
  {
    id: "dashboard.overview",
    toolId: "dashboard.overview",
    keywords: ["运营看板", "bi", "增长", "活跃用户", "新增注册", "转化率", "渠道来源", "漏斗"],
    routeBias: { dashboard: 4 },
  },
  {
    id: "trading.overview",
    toolId: "trading.overview",
    keywords: ["交易画像", "持仓", "自选", "头像生成", "黑话", "工坊", "画像工坊"],
    routeBias: { "trading-persona": 4 },
  },
];

const DEFAULT_INTENT_BY_ROUTE = {
  dashboard: "dashboard.overview",
  finance: "finance.transactions",
  stocks: "stocks.recommendations",
  "image-to-video": "videos.list",
  "trading-persona": "trading.overview",
};

const SUGGESTIONS_BY_ROUTE = {
  dashboard: [
    "运营看板现在怎么样",
    "渠道来源表现如何",
    "当前有哪些异常预警",
  ],
  finance: [
    "我今天的财务情况怎么样",
    "最近 5 条流水",
    "本月收支概览",
  ],
  stocks: [
    "把 PE 调到 20 以下并重跑",
    "为什么推荐这些股票",
    "当前股票偏好设置是什么",
  ],
  "image-to-video": [
    "最近上传了哪些图片",
    "最近生成了哪些视频",
    "现在视频生成情况如何",
  ],
  "trading-persona": [
    "交易画像工坊有什么数据",
    "当前持仓概览",
    "有哪些热门黑话",
  ],
};

const STOCK_FIELD_CONFIGS = [
  {
    key: "max_pe_ttm",
    label: "PE(TTM) 上限",
    aliases: ["pe(ttm)", "pettm", "pe", "市盈率", "pe上限"],
    mode: "max",
  },
  {
    key: "max_pb",
    label: "PB 上限",
    aliases: ["pb", "市净率", "pb上限"],
    mode: "max",
  },
  {
    key: "min_turnover_rate",
    label: "最低换手率",
    aliases: ["换手率", "最低换手", "换手"],
    mode: "min",
  },
  {
    key: "min_amount_million",
    label: "最低成交额(百万)",
    aliases: ["成交额", "金额", "成交金额"],
    mode: "min",
  },
];

const STOCK_SCAN_KEYWORDS = [
  "重新扫描",
  "扫描一次",
  "立即扫描",
  "重新跑",
  "重跑",
  "刷新推荐",
  "更新推荐",
];

const STOCK_EXPLAIN_KEYWORDS = [
  "为什么推荐",
  "推荐理由",
  "解释一下",
  "为什么这些股票",
  "为什么没结果",
  "为什么没有结果",
  "条件太严格",
  "筛选逻辑",
];

function normalizeText(value = "") {
  return value.toLowerCase().replace(/\s+/g, "");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function regexEscape(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractLimit(query, fallback = 5) {
  const match = String(query).match(/最近\s*(\d{1,2})\s*(条|个|张|只|笔)?/);
  if (!match) return fallback;
  const limit = Number(match[1]);
  if (Number.isNaN(limit)) return fallback;
  return Math.min(Math.max(limit, 1), 10);
}

function toNumber(rawValue) {
  const value = Number(rawValue);
  return Number.isNaN(value) ? null : value;
}

function addChange(changes, changeSummary, key, label, value) {
  if (value === null || value === undefined || Number.isNaN(value)) return;
  changes[key] = value;
  changeSummary.push(`${label}改为 ${value}`);
}

function parsePriceRange(query, changes, changeSummary) {
  const rangeMatch = query.match(
    /(?:价格|股价|单价)(?:区间|范围)?[^\d]{0,8}(\d+(?:\.\d+)?)\s*(?:到|至|~|-|—)\s*(\d+(?:\.\d+)?)/i
  );
  if (rangeMatch) {
    const minPrice = toNumber(rangeMatch[1]);
    const maxPrice = toNumber(rangeMatch[2]);
    addChange(changes, changeSummary, "min_price", "最低价格", minPrice);
    addChange(changes, changeSummary, "max_price", "最高价格", maxPrice);
    return;
  }

  const minMatch = query.match(
    /(?:最低价格|价格下限|价格最低|股价下限|价格至少|价格大于等于|价格不低于|价格高于|价格大于|价格>)\s*(\d+(?:\.\d+)?)/i
  );
  const maxMatch = query.match(
    /(?:最高价格|价格上限|价格最高|股价上限|价格最多|价格小于等于|价格不高于|价格不超过|价格低于|价格小于|价格<)\s*(\d+(?:\.\d+)?)/i
  );
  addChange(changes, changeSummary, "min_price", "最低价格", toNumber(minMatch?.[1]));
  addChange(changes, changeSummary, "max_price", "最高价格", toNumber(maxMatch?.[1]));
}

function parseSingleBound(query, aliases, mode) {
  const aliasPattern = aliases.map(regexEscape).join("|");
  const boundKeywords =
    mode === "max"
      ? "(?:小于等于|不高于|不超过|最多|最高|上限|低于|小于|<=|≤|<|＜)"
      : "(?:大于等于|不低于|至少|最低|下限|高于|大于|>=|≥|>|＞)";
  const primaryMatch = query.match(
    new RegExp(`(?:${aliasPattern})[^\\d]{0,8}${boundKeywords}?\\s*(\\d+(?:\\.\\d+)?)`, "i")
  );
  if (primaryMatch) {
    return toNumber(primaryMatch[1]);
  }

  const suffixKeywords = mode === "max" ? "(?:以下|以内|之内)" : "(?:以上|及以上|起步)";
  const suffixMatch = query.match(
    new RegExp(`(?:${aliasPattern})[^\\d]{0,8}(\\d+(?:\\.\\d+)?)[^\\d]{0,4}${suffixKeywords}`, "i")
  );
  if (suffixMatch) {
    return toNumber(suffixMatch[1]);
  }

  const prefixKeywords = mode === "max" ? "(?:最高|最多|上限)" : "(?:最低|至少|下限)";
  const prefixMatch = query.match(
    new RegExp(`${prefixKeywords}[^\\d]{0,4}(?:${aliasPattern})[^\\d]{0,4}(\\d+(?:\\.\\d+)?)`, "i")
  );
  return toNumber(prefixMatch?.[1]);
}

function parseRecommendationCount(query, changes, changeSummary) {
  const match = query.match(/(?:推荐数量|候选数量|推荐股数量|推荐|候选股)[^\d]{0,8}(\d{1,2})\s*只?/i);
  if (!match) return;
  addChange(
    changes,
    changeSummary,
    "recommendation_count",
    "推荐数量",
    clamp(Number(match[1]), 1, 20)
  );
}

function parseRefreshDaily(query, changes, changeSummary) {
  if (/(关闭|取消|不要|停用).{0,6}(自动刷新|每日刷新|每天刷新)/i.test(query)) {
    changes.refresh_daily = false;
    changeSummary.push("关闭每天自动刷新");
    return;
  }
  if (/(开启|打开|启用).{0,6}(自动刷新|每日刷新|每天刷新)/i.test(query)) {
    changes.refresh_daily = true;
    changeSummary.push("开启每天自动刷新");
  }
}

function extractStockPreferenceDraft(query) {
  const changes = {};
  const changeSummary = [];

  parsePriceRange(query, changes, changeSummary);

  STOCK_FIELD_CONFIGS.forEach((field) => {
    addChange(
      changes,
      changeSummary,
      field.key,
      field.label,
      parseSingleBound(query, field.aliases, field.mode)
    );
  });

  parseRecommendationCount(query, changes, changeSummary);
  parseRefreshDaily(query, changes, changeSummary);

  return {
    changes,
    changeSummary,
    hasChanges: Object.keys(changes).length > 0,
  };
}

function scoreIntent(intent, normalizedQuery, routeKey) {
  let score = 0;
  intent.keywords.forEach((keyword) => {
    const normalizedKeyword = normalizeText(keyword);
    if (normalizedQuery.includes(normalizedKeyword)) {
      score += normalizedKeyword.length >= 4 ? 4 : 2;
    }
  });
  score += intent.routeBias[routeKey] || 0;
  return score;
}

export function getRouteContext(pathname = "/app") {
  const match =
    ROUTE_CONTEXTS.find((item) =>
      item.path === "/app" ? pathname === item.path : pathname.startsWith(item.path)
    ) || ROUTE_CONTEXTS[0];
  return match;
}

export function getSuggestionPrompts(pathname) {
  const route = getRouteContext(pathname);
  return SUGGESTIONS_BY_ROUTE[route.key] || SUGGESTIONS_BY_ROUTE.dashboard;
}

export function matchIntent(query, pathname) {
  const routeContext = getRouteContext(pathname);
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    const fallbackId = DEFAULT_INTENT_BY_ROUTE[routeContext.key];
    return {
      intentId: fallbackId,
      params: { limit: 5 },
      routeContext,
      confidence: 0,
    };
  }

  if (routeContext.key === "stocks") {
    const stockDraft = extractStockPreferenceDraft(query);
    if (stockDraft.hasChanges) {
      return {
        intentId: "stocks.updatePreferencesDraft",
        params: {
          changes: stockDraft.changes,
          changeSummary: stockDraft.changeSummary,
        },
        routeContext,
        confidence: 9,
      };
    }

    if (STOCK_SCAN_KEYWORDS.some((keyword) => normalizedQuery.includes(normalizeText(keyword)))) {
      return {
        intentId: "stocks.runScan",
        params: {},
        routeContext,
        confidence: 8,
      };
    }

    if (STOCK_EXPLAIN_KEYWORDS.some((keyword) => normalizedQuery.includes(normalizeText(keyword)))) {
      return {
        intentId: "stocks.explainRecommendations",
        params: { limit: 5 },
        routeContext,
        confidence: 8,
      };
    }
  }

  const scored = INTENTS.map((intent) => ({
    ...intent,
    score: scoreIntent(intent, normalizedQuery, routeContext.key),
  })).sort((left, right) => right.score - left.score);

  const best = scored[0];
  const fallbackId = DEFAULT_INTENT_BY_ROUTE[routeContext.key];
  const finalIntent =
    best && best.score > 0 ? best : INTENTS.find((item) => item.id === fallbackId);

  return {
    intentId: finalIntent.id,
    params: finalIntent.extractLimit ? { limit: extractLimit(query) } : {},
    routeContext,
    confidence: best?.score || 0,
  };
}
