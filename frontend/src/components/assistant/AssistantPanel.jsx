import { MessageSquareText, RefreshCcw, X } from "lucide-react";
import AssistantComposer from "./AssistantComposer";
import AssistantMessageList from "./AssistantMessageList";

export default function AssistantPanel({
  isOpen,
  isLoading,
  routeLabel,
  messages,
  onAsk,
  onMessageAction,
  onClose,
  onReset,
}) {
  return (
    <>
      <div
        className={`assistant-overlay ${isOpen ? "visible" : ""}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      <aside className={`assistant-panel ${isOpen ? "open" : ""}`}>
        <div className="assistant-panel-head">
          <div>
            <p className="assistant-panel-kicker">Butler Mode</p>
            <h3>AI 管家</h3>
            <span>当前页面：{routeLabel}</span>
          </div>

          <div className="assistant-panel-actions">
            <button type="button" onClick={onReset} title="重置对话">
              <RefreshCcw size={16} />
            </button>
            <button type="button" onClick={onClose} title="关闭 AI 管家">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="assistant-panel-tip">
          <MessageSquareText size={16} />
          <p>已接入股票模块的确认式执行能力，涉及写入前会先展示待执行内容，确认后才真正调用接口。</p>
        </div>

        <AssistantMessageList
          messages={messages}
          isLoading={isLoading}
          onAsk={onAsk}
          onMessageAction={onMessageAction}
        />
        <AssistantComposer disabled={isLoading} onSubmit={onAsk} />
      </aside>
    </>
  );
}
