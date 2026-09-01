import React from "react";
import { AlertTriangle, CheckCircle2, XCircle, Cpu, ChevronDown, Clock, ShieldAlert } from "lucide-react";

interface AdvisoryDrawerProps {
  advisory: any;
  onClose: () => void;
}

export const AdvisoryDrawer: React.FC<AdvisoryDrawerProps> = ({ advisory, onClose }) => {
  if (!advisory) return null;

  const isGo = advisory.safety_verdict === "GO";
  const isCaution = advisory.safety_verdict === "CAUTION";

  return (
    <div
      className={`glass-panel ${isGo ? "glow-go" : isCaution ? "glow-caution" : "glow-nogo"}`}
      style={{
        position: "absolute",
        top: "80px",
        right: "24px",
        width: "420px",
        maxHeight: "calc(100vh - 120px)",
        borderRadius: "16px",
        padding: "20px",
        zIndex: 60,
        overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isGo ? (
            <CheckCircle2 color="var(--safety-go)" size={24} />
          ) : isCaution ? (
            <AlertTriangle color="var(--safety-caution)" size={24} />
          ) : (
            <XCircle color="var(--safety-nogo)" size={24} />
          )}
          <span style={{ fontSize: "1.2rem", fontWeight: 700, color: isGo ? "var(--safety-go)" : isCaution ? "var(--safety-caution)" : "var(--safety-nogo)" }}>
            {advisory.safety_verdict} VERDICT
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
        >
          <ChevronDown size={20} />
        </button>
      </div>

      <div style={{ background: "rgba(255, 255, 255, 0.03)", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "4px" }}>Query Narrative</p>
        <p style={{ fontSize: "0.9rem", lineHeight: "1.4" }}>{advisory.narrative}</p>
      </div>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
        <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Nearest PFZ Distance</span>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--accent-cyan)" }}>
            {advisory.nearest_pfz_distance_km ? `${advisory.nearest_pfz_distance_km} km` : "N/A"}
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Confidence Score</span>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--safety-go)" }}>
            {(advisory.confidence_score * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Evidence Ledger Steps */}
      <div style={{ marginTop: "16px" }}>
        <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-muted)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
          <Cpu size={14} color="var(--accent-cyan)" />
          <span>Evidence Ledger ({advisory.ledger_steps.length} Kernels)</span>
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {advisory.ledger_steps.map((step: any) => (
            <div key={step.step_id} style={{ background: "rgba(0, 0, 0, 0.3)", borderLeft: "3px solid var(--accent-cyan)", padding: "8px 12px", borderRadius: "4px", fontSize: "0.8rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                <span style={{ fontWeight: 600, color: "#fff" }}>{step.agent_name}</span>
                <span style={{ color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>{step.kernel_name}</span>
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "flex", gap: "10px" }}>
                <span>Exec: {step.execution_time_ms}ms</span>
                <span>Deterministic</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
