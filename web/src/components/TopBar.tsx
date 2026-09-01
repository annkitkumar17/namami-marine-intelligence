import React from "react";
import { Anchor, ShieldCheck, Activity, Radio } from "lucide-react";

interface TopBarProps {
  degradedTier: string;
  isOnline: boolean;
  navicSimActive: boolean;
  onToggleNavIC: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  degradedTier,
  isOnline,
  navicSimActive,
  onToggleNavIC,
}) => {
  return (
    <header className="glass-panel" style={{ height: "60px", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ background: "linear-gradient(135deg, #00f2fe, #4facfe)", padding: "8px", borderRadius: "8px", display: "flex" }}>
          <Anchor size={22} color="#0a1128" />
        </div>
        <div>
          <h1 style={{ fontSize: "1.2rem", fontWeight: 700, letterSpacing: "1px", background: "linear-gradient(90deg, #fff, #00f2fe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            NAMAMI
          </h1>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1.5px" }}>
            Marine Intelligence Platform
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {/* NavIC Simulator Toggle */}
        <button
          onClick={onToggleNavIC}
          style={{
            background: navicSimActive ? "rgba(0, 242, 254, 0.2)" : "rgba(255, 255, 255, 0.05)",
            border: `1px solid ${navicSimActive ? "var(--accent-cyan)" : "rgba(255, 255, 255, 0.1)"}`,
            color: navicSimActive ? "var(--accent-cyan)" : "var(--text-muted)",
            padding: "6px 12px",
            borderRadius: "6px",
            fontSize: "0.8rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <Radio size={14} />
          <span>NavIC Sim</span>
        </button>

        {/* Degraded Tier Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(0, 230, 118, 0.1)", border: "1px solid rgba(0, 230, 118, 0.3)", padding: "4px 10px", borderRadius: "12px", fontSize: "0.75rem", color: "var(--safety-go)" }}>
          <ShieldCheck size={14} />
          <span>{degradedTier}</span>
        </div>

        {/* System Health */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: isOnline ? "var(--safety-go)" : "var(--safety-caution)" }}>
          <Activity size={14} />
          <span>{isOnline ? "ONLINE" : "OFFLINE PWA"}</span>
        </div>
      </div>
    </header>
  );
};
