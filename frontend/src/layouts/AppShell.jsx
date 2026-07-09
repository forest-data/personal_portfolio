import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Clapperboard,
  LayoutDashboard,
  LogOut,
  NotebookTabs,
  ReceiptText,
  Sparkles,
  SquareUserRound,
  UserCircle2,
} from "lucide-react";
import { useAssistant } from "../assistant/useAssistant";
import AssistantLauncher from "../components/assistant/AssistantLauncher";
import AssistantPanel from "../components/assistant/AssistantPanel";
import { useAuth } from "../contexts/AuthContext";

const modules = [
  {
    to: "/app",
    end: true,
    label: "运营 BI 看板",
    icon: LayoutDashboard,
  },
  {
    to: "/app/finance",
    label: "记账台",
    icon: ReceiptText,
  },
  {
    to: "/app/stock-concepts",
    label: "股票概念理解",
    icon: NotebookTabs,
  },
  {
    to: "/app/trading-persona",
    label: "交易画像工坊",
    icon: SquareUserRound,
  },
  {
    to: "/app/image-to-video",
    label: "Image To Video",
    icon: Clapperboard,
  },
];

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    isOpen,
    isLoading,
    messages,
    routeContext,
    toggleAssistant,
    closeAssistant,
    ask,
    handleMessageAction,
    resetConversation,
  } = useAssistant(location.pathname);
  const pageMeta =
    modules.find((item) =>
      item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
    ) || modules[0];
  const pendingTasks = [
    "复盘今日新增、活跃与转化走势",
    "检查重点渠道 ROI 与投放节奏",
    "跟进高优先级预警与异常波动",
    "同步内容、投放与增长团队动作",
  ];
  const todayLabel = new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());

  return (
    <div className="shell">
      <aside className="shell-sidebar">
        <div className="shell-brand">
          <div className="shell-brand-icon">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="shell-brand-title">Aether Studio</p>
            <p className="shell-brand-subtitle">Admin Workspace</p>
          </div>
        </div>

        <div className="shell-sidebar-section">
          <p className="shell-side-label">任务栏</p>
          <nav className="shell-nav">
            {modules.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `shell-nav-item ${isActive ? "active" : ""}`
                  }
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="shell-sidebar-section">
          <p className="shell-side-label">今日待办</p>
          <div className="shell-task-list">
            {pendingTasks.map((task) => (
              <div key={task} className="shell-task-item">
                <span className="shell-task-dot" />
                <p>{task}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="shell-sidebar-footer">
          <div className="shell-user-card">
            <UserCircle2 size={18} />
            <div>
              <p>{user?.name || "演示用户"}</p>
              <span>{user?.email}</span>
            </div>
          </div>
          <button
            className="shell-logout-btn"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            <LogOut size={16} />
            退出登录
          </button>
        </div>
      </aside>

      <div className="shell-main">
        <header className="shell-topbar">
          <div>
            <p className="shell-topbar-kicker">Workspace</p>
            <h1>{pageMeta.label}</h1>
            <p className="shell-topbar-subtitle">
              左侧用于切换业务模块，右侧聚焦当前数据看板与实际操作。
            </p>
          </div>
          <div className="shell-topbar-meta">
            <div className="shell-topbar-metric">
              <span>当前节奏</span>
              <strong>{pendingTasks.length} 项待跟进</strong>
              <em>{todayLabel}</em>
            </div>
            <div className="shell-topbar-badge">Preview v2</div>
          </div>
        </header>

        <main className="shell-content">
          <Outlet />
        </main>
      </div>

      <AssistantLauncher isOpen={isOpen} onToggle={toggleAssistant} />
      <AssistantPanel
        isOpen={isOpen}
        isLoading={isLoading}
        routeLabel={routeContext.label}
        messages={messages}
        onAsk={ask}
        onMessageAction={handleMessageAction}
        onClose={closeAssistant}
        onReset={resetConversation}
      />
    </div>
  );
}
