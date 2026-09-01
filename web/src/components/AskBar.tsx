import React, { useState } from "react";
import { Send, Compass } from "lucide-react";

interface AskBarProps {
  onAsk: (queryText: string) => void;
  isLoading: boolean;
}

export const AskBar: React.FC<AskBarProps> = ({ onAsk, isLoading }) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onAsk(query);
  };

  return (
    <div
      className="glass-panel glow-cyan"
      style={{
        position: "absolute",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "90%",
        maxWidth: "680px",
        borderRadius: "16px",
        padding: "8px 16px",
        zIndex: 50,
      }}
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Compass size={20} color="var(--accent-cyan)" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask marine query (e.g., 'Is it safe to fish near Rameswaram south today?')"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--text-main)",
            fontSize: "0.95rem",
            padding: "8px 0",
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          style={{
            background: query.trim() ? "linear-gradient(135deg, #00f2fe, #4facfe)" : "rgba(255, 255, 255, 0.1)",
            border: "none",
            borderRadius: "10px",
            padding: "8px 16px",
            color: query.trim() ? "#0a1128" : "var(--text-muted)",
            fontWeight: 600,
            cursor: query.trim() ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>{isLoading ? "Querying..." : "Ask"}</span>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
