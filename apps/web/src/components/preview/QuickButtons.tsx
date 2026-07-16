// apps/web/src/components/preview/QuickButtons.tsx
import React from "react";

export default function QuickButtons(props: {
  onAllIdentities: () => void;
  onAllEgos: () => void;
}) {
  const { onAllIdentities, onAllEgos } = props;

  const btnStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 10px",
    borderRadius: 10,
    border: "1px solid #2b2b31",
    background: "#0f0f13",
    color: "#eee",
    cursor: "pointer",
    fontWeight: 900,
    letterSpacing: 0.3,
    fontSize: 12,
    outline: "none",
    boxShadow: "none",
    WebkitTapHighlightColor: "transparent",
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <button onClick={onAllIdentities} style={btnStyle}>
        All Identities
      </button>
      <button onClick={onAllEgos} style={btnStyle}>
        All E.G.O
      </button>
    </div>
  );
}
