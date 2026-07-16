// apps/web/src/screens/selector/ModeToggle.tsx
import React from "react";

export function ModeToggle(props: {
  mode: "identities" | "ego";
  setMode: (m: "identities" | "ego") => void;
}) {
  const { mode, setMode } = props;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        borderRadius: 10,
        overflow: "hidden",
        border: "1px solid #2a2a33",
        background: "#101015",
      }}
    >
      <button
        onClick={() => setMode("identities")}
        style={segStyle(mode === "identities")}
      >
        Identities
      </button>
      <button
        onClick={() => setMode("ego")}
        style={segStyle(mode === "ego")}
      >
        E.G.O
      </button>
    </div>
  );
}

function segStyle(active: boolean): React.CSSProperties {
  return {
    height: 34,
    padding: "0 12px",
    border: "none",
    background: active ? "rgba(255,184,77,0.14)" : "transparent",
    color: "#eee",
    cursor: "pointer",
    fontWeight: 800,
    letterSpacing: 0.2,
  };
}
