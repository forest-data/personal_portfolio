import { useEffect, useMemo, useState } from "react";
import {
  getRouteContext,
  getSuggestionPrompts,
  matchIntent,
} from "./intentMatcher";
import {
  buildPendingActionCancelled,
  buildPendingActionPreview,
  formatAssistantError,
  formatAssistantResponse,
} from "./responseFormatter";
import { executeAssistantTool } from "./toolRegistry";

const STOCK_REFRESH_EVENT = "assistant:stocks-updated";

function createActionButtons() {
  return [
    { id: "confirm-pending", label: "确认执行", variant: "primary" },
    { id: "cancel-pending", label: "取消", variant: "secondary" },
  ];
}

function isConfirmText(value) {
  return /^(确认|确认执行|好|好的|执行|继续|提交|保存|开始吧)$/i.test(value.trim());
}

function isCancelText(value) {
  return /^(取消|先别执行|不用了|算了|停止|撤销)$/i.test(value.trim());
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildWelcomeMessage(pathname) {
  const route = getRouteContext(pathname);
  return {
    id: createId("assistant"),
    role: "assistant",
    text:
      route.key === "stocks"
        ? `我是你的股票 AI 助手，当前在“${route.label}”页面。我既能解释推荐结果，也能先确认再帮你修改筛选条件并触发重跑。`
        : `我是你的 AI 管家，当前在“${route.label}”页面。我可以直接读取这个项目里已接入的界面数据，并用对话方式帮你整理结果。`,
    suggestions: getSuggestionPrompts(pathname),
  };
}

export function useAssistant(pathname) {
  const [messages, setMessages] = useState(() => [buildWelcomeMessage(pathname)]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const routeContext = useMemo(() => getRouteContext(pathname), [pathname]);
  const suggestions = useMemo(() => getSuggestionPrompts(pathname), [pathname]);

  useEffect(() => {
    setPendingAction(null);
  }, [pathname]);

  const openAssistant = () => setIsOpen(true);
  const closeAssistant = () => setIsOpen(false);
  const toggleAssistant = () => setIsOpen((prev) => !prev);

  const appendAssistantMessage = (message) => {
    setMessages((prev) => [...prev, message]);
  };

  const dispatchAssistantRefresh = (intentId) => {
    if (intentId === "stocks.updatePreferences" || intentId === "stocks.runScan") {
      window.dispatchEvent(new CustomEvent(STOCK_REFRESH_EVENT));
    }
  };

  const executePendingAction = async () => {
    if (!pendingAction || isLoading) return;
    setIsLoading(true);

    try {
      const result = await executeAssistantTool(pendingAction.intentId, pendingAction.params);
      dispatchAssistantRefresh(pendingAction.intentId);
      const response = formatAssistantResponse(result);
      appendAssistantMessage({
        id: createId("assistant"),
        role: "assistant",
        text: response.summary,
        response,
        suggestions,
      });
      setPendingAction(null);
    } catch (error) {
      appendAssistantMessage({
        id: createId("assistant"),
        role: "assistant",
        text: formatAssistantError(error),
        suggestions,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cancelPendingAction = () => {
    if (!pendingAction) return;
    const action = pendingAction;
    setPendingAction(null);
    appendAssistantMessage({
      id: createId("assistant"),
      role: "assistant",
      text: buildPendingActionCancelled(action),
      suggestions,
    });
  };

  const ask = async (query) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || isLoading) return;

    const userMessage = {
      id: createId("user"),
      role: "user",
      text: trimmedQuery,
    };

    setMessages((prev) => [...prev, userMessage]);

    if (pendingAction && isConfirmText(trimmedQuery)) {
      await executePendingAction();
      return;
    }

    if (pendingAction && isCancelText(trimmedQuery)) {
      cancelPendingAction();
      return;
    }

    setIsLoading(true);

    try {
      const match = matchIntent(trimmedQuery, pathname);

      if (match.intentId === "stocks.updatePreferencesDraft") {
        const nextPendingAction = {
          id: createId("pending"),
          intentId: "stocks.updatePreferences",
          params: match.params,
          summaryLines: match.params.changeSummary || [],
        };
        const preview = buildPendingActionPreview(nextPendingAction);
        setPendingAction(nextPendingAction);
        appendAssistantMessage({
          id: createId("assistant"),
          role: "assistant",
          text: preview.text,
          response: preview.response,
          suggestions,
          actions: createActionButtons(),
        });
        return;
      }

      if (match.intentId === "stocks.runScan") {
        const nextPendingAction = {
          id: createId("pending"),
          intentId: "stocks.runScan",
          params: {},
          summaryLines: ["按当前股票页里保存的筛选条件重新扫描推荐池"],
        };
        const preview = buildPendingActionPreview(nextPendingAction);
        setPendingAction(nextPendingAction);
        appendAssistantMessage({
          id: createId("assistant"),
          role: "assistant",
          text: preview.text,
          response: preview.response,
          suggestions,
          actions: createActionButtons(),
        });
        return;
      }

      const result = await executeAssistantTool(match.intentId, match.params);
      const response = formatAssistantResponse(result);
      appendAssistantMessage({
        id: createId("assistant"),
        role: "assistant",
        text: response.summary,
        response,
        suggestions,
      });
    } catch (error) {
      appendAssistantMessage({
        id: createId("assistant"),
        role: "assistant",
        text: formatAssistantError(error),
        suggestions,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessageAction = async (actionId) => {
    if (actionId === "confirm-pending") {
      await executePendingAction();
      return;
    }
    if (actionId === "cancel-pending") {
      cancelPendingAction();
    }
  };

  const resetConversation = () => {
    setMessages([buildWelcomeMessage(pathname)]);
    setPendingAction(null);
  };

  return {
    isOpen,
    isLoading,
    messages,
    routeContext,
    suggestions,
    openAssistant,
    closeAssistant,
    toggleAssistant,
    ask,
    handleMessageAction,
    resetConversation,
  };
}
