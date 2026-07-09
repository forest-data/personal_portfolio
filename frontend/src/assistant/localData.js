export const dashboardSnapshot = {
  headlineStats: [
    {
      label: "今日活跃用户",
      value: "128.4K",
      delta: "+8.6%",
      note: "较上周同期提升 10.2K",
    },
    {
      label: "新增注册",
      value: "9,280",
      delta: "+12.4%",
      note: "自然流量与短视频投放共同拉动",
    },
    {
      label: "付费转化率",
      value: "4.82%",
      delta: "+0.7%",
      note: "落地页改版后转化质量更稳定",
    },
    {
      label: "获客成本 CAC",
      value: "¥36.8",
      delta: "-5.1%",
      note: "信息流与私域联动降低整体投放成本",
    },
  ],
  channelSource: [
    { name: "短视频投放", share: 34, cvr: "5.8%", roi: "2.7x" },
    { name: "信息流广告", share: 26, cvr: "4.9%", roi: "2.1x" },
    { name: "搜索与 SEO", share: 18, cvr: "6.2%", roi: "3.4x" },
    { name: "私域裂变", share: 14, cvr: "8.1%", roi: "4.2x" },
    { name: "渠道合作", share: 8, cvr: "3.7%", roi: "1.6x" },
  ],
  alerts: [
    {
      title: "安卓端激活率波动",
      detail: "18:00 后安卓激活完成率较昨日下降 11%，需排查版本兼容与埋点。",
      level: "高优先级",
    },
    {
      title: "信息流素材疲劳",
      detail: "主投素材频次过高，CTR 已连续 2 日下滑，建议替换新素材组。",
      level: "中优先级",
    },
    {
      title: "私域转化表现优秀",
      detail: "社群限时活动带来高质量付费用户，可复制到下周运营节奏。",
      level: "机会点",
    },
  ],
  funnelSteps: [
    { name: "曝光用户", value: "2.4M", rate: 100 },
    { name: "落地页访问", value: "286K", rate: 68 },
    { name: "注册转化", value: "34.2K", rate: 42 },
    { name: "激活完成", value: "18.7K", rate: 26 },
    { name: "首单付费", value: "4.8K", rate: 14 },
  ],
};

export const tradingPersonaSnapshot = {
  watchlist: [
    { symbol: "AAPL", name: "Apple", price: 189.34, change: 1.24 },
    { symbol: "TSLA", name: "Tesla", price: 178.62, change: -2.13 },
    { symbol: "NVDA", name: "NVIDIA", price: 903.18, change: 3.82 },
    { symbol: "MSFT", name: "Microsoft", price: 427.11, change: 0.67 },
  ],
  positions: [
    { symbol: "AAPL", shares: 120, cost: 181.2, pnl: 976.8 },
    { symbol: "NVDA", shares: 32, cost: 864.6, pnl: 1235.84 },
    { symbol: "TSLA", shares: 54, cost: 186.4, pnl: -420.12 },
  ],
  moods: ["高兴", "冷静", "坚定", "兴奋", "惊讶", "困惑"],
  styles: ["交易员海报风", "贴纸风", "柔和插画风", "专业头像风"],
  hotTerms: ["上车", "梭哈", "爆款脸", "冷启动", "上大分"],
  slangExamples: {
    财经: {
      上车: "指开始买入某个标的，希望抓住上涨行情。",
      梭哈: "把手里大部分甚至全部资金一次性投入。",
    },
    短视频: {
      爆款脸: "镜头感、识别度和情绪张力都很强的形象。",
      冷启动: "新账号或新内容刚开始获取流量的阶段。",
    },
  },
};
