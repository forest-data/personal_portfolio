import { useState } from "react";
import { SendHorizonal } from "lucide-react";

export default function AssistantComposer({ disabled, onSubmit }) {
  const [value, setValue] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedValue = value.trim();
    if (!trimmedValue || disabled) return;
    onSubmit(trimmedValue);
    setValue("");
  };

  return (
    <form className="assistant-composer" onSubmit={handleSubmit}>
      <textarea
        rows="3"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="例如：把 PE 调到 20 以下并重跑、为什么推荐这些股票、当前股票偏好是什么"
        disabled={disabled}
      />
      <button type="submit" disabled={disabled || !value.trim()}>
        <SendHorizonal size={16} />
        发送
      </button>
    </form>
  );
}
