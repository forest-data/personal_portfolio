function ResponseCards({ response }) {
  if (!response?.cards?.length) return null;

  return (
    <div className="assistant-cards">
      {response.cards.map((card) => (
        <div key={`${card.type}-${card.title}`} className="assistant-card">
          <div className="assistant-card-head">
            <strong>{card.title}</strong>
            {card.type === "metric" ? <span>{card.value}</span> : null}
          </div>

          {card.type === "metric" ? <p>{card.note}</p> : null}

          {card.type === "list" ? (
            <div className="assistant-card-list">
              {card.items.length > 0 ? (
                card.items.map((item) => <p key={item}>{item}</p>)
              ) : (
                <p>暂无可展示内容。</p>
              )}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function MessageActions({ actions, onMessageAction }) {
  if (!actions?.length) return null;

  return (
    <div className="assistant-action-row">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          className={`assistant-action-btn ${action.variant === "primary" ? "primary" : "secondary"}`}
          onClick={() => onMessageAction(action.id)}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

export default function AssistantMessageList({ messages, isLoading, onAsk, onMessageAction }) {
  return (
    <div className="assistant-message-list">
      {messages.map((message) => (
        <article
          key={message.id}
          className={`assistant-message assistant-message-${message.role}`}
        >
          <div className="assistant-message-bubble">
            <p>{message.text}</p>
            {message.response ? <ResponseCards response={message.response} /> : null}
          </div>

          {message.role === "assistant" ? (
            <MessageActions actions={message.actions} onMessageAction={onMessageAction} />
          ) : null}

          {message.role === "assistant" && message.suggestions?.length ? (
            <div className="assistant-suggestion-row">
              {message.suggestions.map((item) => (
                <button
                  key={`${message.id}-${item}`}
                  type="button"
                  className="assistant-suggestion-chip"
                  onClick={() => onAsk(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          ) : null}
        </article>
      ))}

      {isLoading ? (
        <article className="assistant-message assistant-message-assistant">
          <div className="assistant-message-bubble assistant-loading-bubble">
            <span />
            <span />
            <span />
          </div>
        </article>
      ) : null}
    </div>
  );
}
