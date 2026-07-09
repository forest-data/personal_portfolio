function formatMoney(value) {
  return `¥${Number(value || 0).toFixed(2)}`;
}

function formatDate(value) {
  if (!value) return "未知时间";
  return String(value).replace("T", " ").slice(0, 16);
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

function typeLabel(value) {
  return value === "income" ? "收入" : value === "expense" ? "支出" : "记录";
}

function toMetricCard(title, value, note) {
  return { type: "metric", title, value, note };
}

function toListCard(title, items = []) {
  return { type: "list", title, items };
}

function formatSelectionMode(value) {
  return value === "relaxed" ? "宽松补足" : "严格筛选";
}

function buildStockPreferenceSummary(preferences = {}) {
  return [
    `价格 ${formatMoney(preferences.min_price)} - ${formatMoney(preferences.max_price)}`,
    `PE(TTM) <= ${Number(preferences.max_pe_ttm || 0).toFixed(1)}`,
    `PB <= ${Number(preferences.max_pb || 0).toFixed(1)}`,
    `换手率 >= ${formatPercent(preferences.min_turnover_rate)}`,
    `成交额 >= ${Number(preferences.min_amount_million || 0).toFixed(0)} 百万`,
    `推荐数量 ${preferences.recommendation_count || 0} 只`,
  ].join("，");
}

function summarizeRecommendationItem(item) {
  const mainReason = item?.reasons?.[0] || item?.commentary || "已入选推荐池";
  return `${item.name}(${item.code}) · 评分 ${Number(item.score || 0).toFixed(2)} · ${mainReason}`;
}

function explainEmptyStockResult(preferences = {}) {
  return `当前还没有命中结果。可以优先检查 ${buildStockPreferenceSummary(
    preferences
  )}，如果近期结果持续偏少，通常说明估值或流动性条件偏严。`;
}

export function buildPendingActionPreview(action) {
  if (action?.intentId === "stocks.updatePreferences") {
    return {
      text: "我已经识别到你要调整股票筛选条件。确认后我会保存这些条件，并立即按新条件重跑推荐池。",
      response: {
        intent: "stocks.updatePreferences.preview",
        cards: [
          toListCard("待执行变更", action.summaryLines || []),
          toMetricCard("执行方式", "确认后写入", "不会在你确认前修改任何股票筛选数据"),
        ],
      },
    };
  }

  if (action?.intentId === "stocks.runScan") {
    return {
      text: "我准备按当前股票条件重新扫描一次推荐池。确认后才会真正调用扫描接口。",
      response: {
        intent: "stocks.runScan.preview",
        cards: [
          toMetricCard("待执行动作", "重新扫描一次", "沿用当前股票页里保存的筛选条件"),
        ],
      },
    };
  }

  return {
    text: "我已经整理好待执行动作，确认后才会继续。",
    response: {
      intent: "assistant.preview",
      cards: [],
    },
  };
}

export function buildPendingActionCancelled(action) {
  if (action?.intentId === "stocks.updatePreferences") {
    return "已取消这次股票条件调整，不会修改任何筛选数据。";
  }
  if (action?.intentId === "stocks.runScan") {
    return "已取消这次重新扫描，不会触发任何接口调用。";
  }
  return "已取消待执行动作。";
}

const formatters = {
  "auth.me": ({ payload, dataSources }) => ({
    intent: "auth.me",
    dataSources,
    summary: `当前登录用户是 ${payload?.name || "未知用户"}，邮箱 ${payload?.email || "未提供"}。`,
    cards: [
      toMetricCard("用户姓名", payload?.name || "--", "当前会话身份"),
      toMetricCard("登录邮箱", payload?.email || "--", "后端鉴权返回"),
    ],
    raw: payload,
  }),
  "finance.overview": ({ payload, dataSources }) => ({
    intent: "finance.overview",
    dataSources,
    summary: `当前累计收入 ${formatMoney(payload?.summary?.income)}，累计支出 ${formatMoney(
      payload?.summary?.expense
    )}，结余 ${formatMoney(payload?.summary?.balance)}，共 ${payload?.summary?.transaction_count || 0} 笔流水。`,
    cards: [
      toMetricCard("当前结余", formatMoney(payload?.summary?.balance), "累计收入 - 累计支出"),
      toMetricCard("累计收入", formatMoney(payload?.summary?.income), "账本总收入"),
      toMetricCard("累计支出", formatMoney(payload?.summary?.expense), "账本总支出"),
      toMetricCard("流水笔数", `${payload?.summary?.transaction_count || 0} 笔`, "当前账号下全部记录"),
    ],
    raw: payload,
  }),
  "finance.transactions": ({ payload, dataSources }) => ({
    intent: "finance.transactions",
    dataSources,
    summary:
      payload?.items?.length > 0
        ? `已整理最近 ${payload.limit} 条流水，当前总共有 ${payload.total} 笔记录。最新一笔是 ${
            payload.items[0].title
          }，金额 ${formatMoney(payload.items[0].amount)}。`
        : "当前还没有任何流水记录。",
    cards: [
      toMetricCard("流水总数", `${payload?.total || 0} 笔`, "按时间倒序统计"),
      toListCard(
        `最近 ${payload?.limit || 5} 条流水`,
        (payload?.items || []).map(
          (item) =>
            `${item.occurred_at} · ${typeLabel(item.type)} · ${item.title} · ${formatMoney(item.amount)}`
        )
      ),
    ],
    raw: payload,
  }),
  "stocks.dashboard": ({ payload, dataSources }) => ({
    intent: "stocks.dashboard",
    dataSources,
    summary: `股票模块当前有 ${
      payload?.latest_scan?.recommendations?.length || 0
    } 只候选股票，当前条件为 ${buildStockPreferenceSummary(
      payload?.preferences || {}
    )}。`,
    cards: [
      toMetricCard(
        "候选数量",
        `${payload?.latest_scan?.recommendations?.length || 0} 只`,
        payload?.latest_scan?.selection_mode === "relaxed" ? "当前为放宽规则模式" : "当前为标准规则模式"
      ),
      toMetricCard("扫描来源", payload?.latest_scan?.source || "--", "最近一次扫描返回"),
      toMetricCard("当前条件", "已同步", buildStockPreferenceSummary(payload?.preferences || {})),
    ],
    raw: payload,
  }),
  "stocks.recommendations": ({ payload, dataSources }) => ({
    intent: "stocks.recommendations",
    dataSources,
    summary:
      payload?.items?.length > 0
        ? `当前推荐池共有 ${payload.latest_scan?.recommendations?.length || 0} 只候选股，最靠前的是 ${
            payload.items[0].name
          }(${payload.items[0].code})。${
            payload?.latest_scan?.summary ||
            `当前按${formatSelectionMode(payload?.latest_scan?.selection_mode)}返回结果。`
          }`
        : explainEmptyStockResult(payload?.preferences || {}),
    cards: [
      toMetricCard(
        "筛选模式",
        formatSelectionMode(payload?.latest_scan?.selection_mode),
        payload?.latest_scan?.source ? `数据源：${payload.latest_scan.source}` : "最近一次扫描结果"
      ),
      toMetricCard("当前条件", "股票筛选", buildStockPreferenceSummary(payload?.preferences || {})),
      toListCard(
        `前 ${payload?.items?.length || 0} 只推荐`,
        (payload?.items || []).map((item) => summarizeRecommendationItem(item))
      ),
    ],
    raw: payload,
  }),
  "stocks.explainRecommendations": ({ payload, dataSources }) => {
    const items = payload?.items || [];
    const firstItem = items[0];
    const riskHighlights = items
      .slice(0, 3)
      .flatMap((item) => (item?.risks || []).slice(0, 1).map((risk) => `${item.name}(${item.code}) · ${risk}`));

    return {
      intent: "stocks.explainRecommendations",
      dataSources,
      summary:
        items.length > 0
          ? `这批股票之所以会被推荐，核心是它们同时满足了 ${buildStockPreferenceSummary(
              payload?.preferences || {}
            )}。当前排在第一的是 ${firstItem.name}(${firstItem.code})，因为 ${
              firstItem?.reasons?.[0] || firstItem?.commentary || "综合评分最高"
            }。`
          : explainEmptyStockResult(payload?.preferences || {}),
      cards: [
        toMetricCard(
          "解释口径",
          formatSelectionMode(payload?.latest_scan?.selection_mode),
          payload?.latest_scan?.summary || "我会结合当前条件与推荐理由解释结果"
        ),
        toListCard(
          "当前推荐逻辑",
          items.length > 0
            ? items.slice(0, 3).map((item) => {
                const reasonText = (item.reasons || []).slice(0, 2).join("；");
                return `${item.name}(${item.code}) · ${reasonText || item.commentary || "暂无补充说明"}`;
              })
            : [buildStockPreferenceSummary(payload?.preferences || {})]
        ),
        toListCard(
          "需要继续确认",
          riskHighlights.length > 0 ? riskHighlights : ["当前没有更多风险提示，仍建议结合财报与公告复核。"]
        ),
      ],
      raw: payload,
    };
  },
  "stocks.preferences": ({ payload, dataSources }) => ({
    intent: "stocks.preferences",
    dataSources,
    summary: `当前股票筛选条件为 ${buildStockPreferenceSummary(payload || {})}。`,
    cards: [
      toMetricCard(
        "价格区间",
        `${formatMoney(payload?.min_price)} - ${formatMoney(payload?.max_price)}`,
        "股票单价筛选范围"
      ),
      toMetricCard("推荐数量", `${payload?.recommendation_count || 0} 只`, "候选池上限"),
      toMetricCard(
        "估值限制",
        `PE ${payload?.max_pe_ttm || 0} / PB ${payload?.max_pb || 0}`,
        "越低通常越偏保守"
      ),
    ],
    raw: payload,
  }),
  "stocks.updatePreferences": ({ payload, dataSources }) => ({
    intent: "stocks.updatePreferences",
    dataSources,
    summary: `已更新 ${payload?.appliedChanges?.length || 0} 项股票条件，并按新条件完成重跑。当前返回 ${
      payload?.latest_scan?.recommendations?.length || 0
    } 只候选股票。`,
    cards: [
      toListCard("本次已应用变更", payload?.appliedChanges || []),
      toMetricCard(
        "当前结果",
        `${payload?.latest_scan?.recommendations?.length || 0} 只`,
        payload?.latest_scan?.summary || "已按你的新条件生成最新推荐池"
      ),
      toMetricCard("最新条件", "已保存", buildStockPreferenceSummary(payload?.preferences || {})),
    ],
    raw: payload,
  }),
  "stocks.runScan": ({ payload, dataSources }) => ({
    intent: "stocks.runScan",
    dataSources,
    summary: `已按当前股票条件重新扫描，返回 ${
      payload?.latest_scan?.recommendations?.length || 0
    } 只候选股票。`,
    cards: [
      toMetricCard(
        "扫描来源",
        payload?.latest_scan?.source || "--",
        payload?.latest_scan?.summary || "最近一次扫描摘要"
      ),
      toMetricCard(
        "筛选模式",
        formatSelectionMode(payload?.latest_scan?.selection_mode),
        `更新时间：${formatDate(payload?.latest_scan?.generated_at)}`
      ),
      toListCard(
        "前 3 只结果",
        (payload?.latest_scan?.recommendations || []).slice(0, 3).map((item) => summarizeRecommendationItem(item))
      ),
    ],
    raw: payload,
  }),
  "images.list": ({ payload, dataSources }) => ({
    intent: "images.list",
    dataSources,
    summary:
      payload?.items?.length > 0
        ? `当前图片素材库共有 ${payload.total} 张图，我列出最近 ${payload.items.length} 张上传内容。`
        : "当前还没有上传任何图片素材。",
    cards: [
      toMetricCard("素材总数", `${payload?.total || 0} 张`, "图片库当前数量"),
      toListCard(
        `最近 ${payload?.items?.length || 0} 张图片`,
        (payload?.items || []).map(
          (item) =>
            `${item.filename} · ${Math.round((item.size || 0) / 1024)} KB · ${formatDate(
              item.upload_time
            )}`
        )
      ),
    ],
    raw: payload,
  }),
  "videos.list": ({ payload, dataSources }) => ({
    intent: "videos.list",
    dataSources,
    summary:
      payload?.items?.length > 0
        ? `当前共有 ${payload.total} 条视频生成记录，最近 ${payload.items.length} 条里有 ${
            payload.items.filter((item) => item.status === "processing").length
          } 条仍在处理中。`
        : "当前还没有任何视频生成记录。",
    cards: [
      toMetricCard("视频记录", `${payload?.total || 0} 条`, "当前账号下的生成历史"),
      toListCard(
        `最近 ${payload?.items?.length || 0} 条视频`,
        (payload?.items || []).map(
          (item) =>
            `${item.filename} · ${item.status} · ${item.image_count || 0} 张图 · 进度 ${
              item.progress || 0
            }%`
        )
      ),
    ],
    raw: payload,
  }),
  "dashboard.overview": ({ payload, dataSources }) => ({
    intent: "dashboard.overview",
    dataSources,
    summary: `运营看板当前重点指标包括 ${payload.headlineStats[0].label} ${payload.headlineStats[0].value}、${
      payload.headlineStats[1].label
    } ${payload.headlineStats[1].value}，渠道来源里占比最高的是 ${
      payload.channelSource[0].name
    }。`,
    cards: [
      ...payload.headlineStats.slice(0, 4).map((item) => toMetricCard(item.label, item.value, item.note)),
      toListCard(
        "当前预警",
        payload.alerts.map((item) => `${item.level} · ${item.title} · ${item.detail}`)
      ),
    ],
    raw: payload,
  }),
  "trading.overview": ({ payload, dataSources }) => {
    const totalPnl = payload.positions.reduce((sum, item) => sum + Number(item.pnl || 0), 0);
    const totalMarketValue = payload.positions.reduce(
      (sum, item) => sum + Number(item.shares || 0) * Number(item.cost || 0) + Number(item.pnl || 0),
      0
    );
    return {
      intent: "trading.overview",
      dataSources,
      summary: `交易画像工坊当前有 ${payload.watchlist.length} 只自选股、${
        payload.positions.length
      } 条持仓，组合市值约 ${formatMoney(totalMarketValue)}，浮盈 ${formatMoney(totalPnl)}。`,
      cards: [
        toMetricCard("组合市值", formatMoney(totalMarketValue), "按页面静态持仓估算"),
        toMetricCard("当前浮盈", formatMoney(totalPnl), "页面持仓盈亏合计"),
        toListCard(
          "自选标的",
          payload.watchlist.map(
            (item) =>
              `${item.symbol} · ${item.name} · $${item.price.toFixed(2)} · ${
                item.change >= 0 ? "+" : ""
              }${item.change.toFixed(2)}%`
          )
        ),
      ],
      raw: payload,
    };
  },
};

export function formatAssistantResponse(result) {
  const formatter = formatters[result.intent];
  if (!formatter) {
    return {
      intent: result.intent,
      dataSources: result.dataSources,
      summary: "已获取数据，但当前没有对应的展示模板。",
      cards: [],
      raw: result.payload,
    };
  }
  return formatter(result);
}

export function formatAssistantError(error) {
  const detail = error?.response?.data?.detail || error?.message || "请求失败，请稍后再试。";
  if (detail === "Unauthorized" || detail === "Invalid token") {
    return "当前登录状态已失效，请重新登录后再查询。";
  }
  return `查询失败：${detail}`;
}
