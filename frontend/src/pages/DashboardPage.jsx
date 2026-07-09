import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CircleAlert,
  Clock3,
  Megaphone,
  Monitor,
  MousePointerClick,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const headlineStats = [
  {
    label: "今日活跃用户",
    value: "128.4K",
    delta: "+8.6%",
    note: "较上周同期提升 10.2K",
    trend: "up",
    icon: Users,
  },
  {
    label: "新增注册",
    value: "9,280",
    delta: "+12.4%",
    note: "自然流量与短视频投放共同拉动",
    trend: "up",
    icon: TrendingUp,
  },
  {
    label: "付费转化率",
    value: "4.82%",
    delta: "+0.7%",
    note: "落地页改版后转化质量更稳定",
    trend: "up",
    icon: Target,
  },
  {
    label: "获客成本 CAC",
    value: "¥36.8",
    delta: "-5.1%",
    note: "信息流与私域联动降低整体投放成本",
    trend: "down",
    icon: WalletCards,
  },
];

const growthSeries = [
  { label: "Mon", users: 42, conversion: 26 },
  { label: "Tue", users: 48, conversion: 31 },
  { label: "Wed", users: 46, conversion: 29 },
  { label: "Thu", users: 58, conversion: 36 },
  { label: "Fri", users: 67, conversion: 39 },
  { label: "Sat", users: 72, conversion: 44 },
  { label: "Sun", users: 76, conversion: 48 },
];

const channelSource = [
  { name: "短视频投放", share: 34, cvr: "5.8%", roi: "2.7x" },
  { name: "信息流广告", share: 26, cvr: "4.9%", roi: "2.1x" },
  { name: "搜索与 SEO", share: 18, cvr: "6.2%", roi: "3.4x" },
  { name: "私域裂变", share: 14, cvr: "8.1%", roi: "4.2x" },
  { name: "渠道合作", share: 8, cvr: "3.7%", roi: "1.6x" },
];

const activityBuckets = [
  { time: "00", value: 18 },
  { time: "03", value: 12 },
  { time: "06", value: 22 },
  { time: "09", value: 56 },
  { time: "12", value: 68 },
  { time: "15", value: 74 },
  { time: "18", value: 88 },
  { time: "21", value: 64 },
];

const funnelSteps = [
  { name: "曝光用户", value: "2.4M", rate: 100 },
  { name: "落地页访问", value: "286K", rate: 68 },
  { name: "注册转化", value: "34.2K", rate: 42 },
  { name: "激活完成", value: "18.7K", rate: 26 },
  { name: "首单付费", value: "4.8K", rate: 14 },
];

const campaignCards = [
  {
    title: "新客拉新计划",
    owner: "增长组 / 本周冲量",
    status: "进行中",
    value: "注册成本 ¥29.6",
    note: "短视频素材 CTR 连续 3 天上升，适合继续放量。",
  },
  {
    title: "老客召回计划",
    owner: "CRM / 自动化旅程",
    status: "稳定",
    value: "召回率 18.4%",
    note: "Push + 企业微信联动生效，7 日回访用户增长明显。",
  },
  {
    title: "大促预热内容池",
    owner: "内容团队 / 素材矩阵",
    status: "待优化",
    value: "素材完成度 72%",
    note: "转化页首屏信息偏弱，建议强化利益点与社证元素。",
  },
];

const alerts = [
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
];

function buildPath(values, width, height) {
  const max = Math.max(...values, 1);
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - (value / max) * height;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function buildArea(values, width, height) {
  return `${buildPath(values, width, height)} L ${width} ${height} L 0 ${height} Z`;
}

function MetricCard({ item }) {
  const Icon = item.icon;
  const isUp = item.trend === "up";

  return (
    <article className="ops-stat-card">
      <div className="ops-stat-card-top">
        <div>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
        <div className="ops-stat-icon">
          <Icon size={18} />
        </div>
      </div>
      <div className={`ops-stat-trend ${isUp ? "up" : "down"}`}>
        {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        <em>{item.delta}</em>
        <p>{item.note}</p>
      </div>
    </article>
  );
}

function DashboardChart() {
  const userValues = growthSeries.map((item) => item.users);
  const conversionValues = growthSeries.map((item) => item.conversion);

  return (
    <section className="ops-panel ops-chart-panel">
      <div className="ops-panel-head">
        <div>
          <p className="section-kicker">Growth Curve</p>
          <h3>用户增长趋势</h3>
          <p>同时展示访问热度与注册转化抬升，用于判断拉新质量。</p>
        </div>
        <div className="ops-chip-row">
          <span className="ops-chip active">近 7 天</span>
          <span className="ops-chip">近 30 天</span>
          <span className="ops-chip">季度趋势</span>
        </div>
      </div>

      <div className="ops-chart-legend">
        <span>
          <i className="line users" />
          活跃趋势
        </span>
        <span>
          <i className="line conversion" />
          转化趋势
        </span>
      </div>

      <div className="ops-chart-stage">
        <svg viewBox="0 0 600 260" className="ops-chart-svg" aria-hidden="true">
          <defs>
            <linearGradient id="opsGrowthArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(108, 92, 231, 0.45)" />
              <stop offset="100%" stopColor="rgba(108, 92, 231, 0)" />
            </linearGradient>
          </defs>
          {[40, 100, 160, 220].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="600"
              y2={y}
              className="ops-chart-grid-line"
            />
          ))}
          <path d={buildArea(userValues, 600, 220)} fill="url(#opsGrowthArea)" />
          <path d={buildPath(userValues, 600, 220)} className="ops-chart-line users" />
          <path
            d={buildPath(conversionValues, 600, 220)}
            className="ops-chart-line conversion"
          />
        </svg>

        <div className="ops-chart-axis">
          {growthSeries.map((item) => (
            <span key={item.label}>{item.label}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="ops-dashboard">
      <section className="ops-hero">
        <div>
          <p className="hero-kicker">Hi, {user?.name || "运营负责人"}</p>
          <h2>运营 / KPI 总览看板</h2>
          <p className="hero-desc">
            这是一个可直接拿来做运营汇报、渠道复盘与增长分析的 BI 模板页。
            当前为高保真静态数据布局，重点在结构、层级与视觉效果，后续可无缝接入真实接口。
          </p>
        </div>
        <div className="ops-hero-side">
          <div className="ops-hero-badge">
            <Sparkles size={16} />
            Practical BI Template
          </div>
          <div className="ops-hero-meta">
            <div>
              <span>观察周期</span>
              <strong>近 7 天</strong>
            </div>
            <div>
              <span>核心目标</span>
              <strong>拉新 + 激活 + 付费</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="ops-stat-grid">
        {headlineStats.map((item) => (
          <MetricCard key={item.label} item={item} />
        ))}
      </section>

      <section className="ops-main-grid">
        <DashboardChart />

        <section className="ops-panel">
          <div className="ops-panel-head">
            <div>
              <p className="section-kicker">Traffic Mix</p>
              <h3>渠道来源</h3>
              <p>适合快速判断流量结构是否健康，以及渠道质量差异。</p>
            </div>
            <Megaphone size={18} className="ops-panel-icon" />
          </div>

          <div className="ops-source-list">
            {channelSource.map((item) => (
              <div key={item.name} className="ops-source-item">
                <div className="ops-source-head">
                  <strong>{item.name}</strong>
                  <span>{item.share}%</span>
                </div>
                <div className="ops-progress">
                  <div style={{ width: `${item.share}%` }} />
                </div>
                <div className="ops-source-meta">
                  <span>转化率 {item.cvr}</span>
                  <span>ROI {item.roi}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="ops-panel">
          <div className="ops-panel-head">
            <div>
              <p className="section-kicker">Realtime Activity</p>
              <h3>活跃用户</h3>
              <p>观察全天活跃波峰，定位适合推送、投放和直播的时段。</p>
            </div>
            <Activity size={18} className="ops-panel-icon" />
          </div>

          <div className="ops-activity-overview">
            <div className="ops-activity-total">
              <strong>31.6K</strong>
              <span>当前在线会话</span>
            </div>
            <div className="ops-device-split">
              <div>
                <Smartphone size={16} />
                <span>App 67%</span>
              </div>
              <div>
                <Monitor size={16} />
                <span>Web 33%</span>
              </div>
            </div>
          </div>

          <div className="ops-activity-bars">
            {activityBuckets.map((item) => (
              <div key={item.time} className="ops-activity-bar">
                <div className="ops-activity-track">
                  <div style={{ height: `${item.value}%` }} />
                </div>
                <span>{item.time}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="ops-panel">
          <div className="ops-panel-head">
            <div>
              <p className="section-kicker">Conversion Funnel</p>
              <h3>转化漏斗</h3>
              <p>拆解从曝光到首单的关键损耗节点，方便运营动作优先级排序。</p>
            </div>
            <MousePointerClick size={18} className="ops-panel-icon" />
          </div>

          <div className="ops-funnel-list">
            {funnelSteps.map((item) => (
              <div key={item.name} className="ops-funnel-item">
                <div className="ops-funnel-label">
                  <strong>{item.name}</strong>
                  <span>{item.value}</span>
                </div>
                <div className="ops-funnel-track">
                  <div style={{ width: `${item.rate}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="ops-panel ops-campaign-panel">
          <div className="ops-panel-head">
            <div>
              <p className="section-kicker">Campaign Focus</p>
              <h3>重点项目推进</h3>
              <p>把增长、召回、内容预热这些核心动作放进同一块区域追踪。</p>
            </div>
            <Target size={18} className="ops-panel-icon" />
          </div>

          <div className="ops-campaign-list">
            {campaignCards.map((item) => (
              <article key={item.title} className="ops-campaign-card">
                <div className="ops-campaign-top">
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.owner}</p>
                  </div>
                  <span>{item.status}</span>
                </div>
                <strong>{item.value}</strong>
                <p>{item.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="ops-panel">
          <div className="ops-panel-head">
            <div>
              <p className="section-kicker">Action Center</p>
              <h3>异常预警与机会点</h3>
              <p>兼顾风险提醒与增长机会，适合日会或周会直接投屏展示。</p>
            </div>
            <CircleAlert size={18} className="ops-panel-icon" />
          </div>

          <div className="ops-alert-list">
            {alerts.map((item) => (
              <div key={item.title} className="ops-alert-item">
                <div className="ops-alert-icon">
                  {item.level === "高优先级" ? (
                    <ShieldAlert size={16} />
                  ) : item.level === "机会点" ? (
                    <Sparkles size={16} />
                  ) : (
                    <Clock3 size={16} />
                  )}
                </div>
                <div>
                  <div className="ops-alert-top">
                    <strong>{item.title}</strong>
                    <span>{item.level}</span>
                  </div>
                  <p>{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}
