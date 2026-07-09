import { Bot, X } from "lucide-react";

export default function AssistantLauncher({ isOpen, onToggle }) {
  return (
    <button
      type="button"
      className={`assistant-launcher ${isOpen ? "open" : ""}`}
      onClick={onToggle}
      aria-label={isOpen ? "关闭 AI 管家" : "打开 AI 管家"}
    >
      {isOpen ? <X size={20} /> : <Bot size={20} />}
      <span>{isOpen ? "收起管家" : "AI 管家"}</span>
    </button>
  );
}
