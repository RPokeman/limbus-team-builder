// apps/web/src/screens/selector/MiniFilterButton.tsx
import React from "react";

export function MiniFilterButton(props: { open: boolean; onToggle: () => void }) {
  const { open, onToggle } = props;

  return (
    <button
      onClick={onToggle}
      style={{
        height: 34,
        width: 44,
        borderRadius: 10,
        border: `1px solid ${open ? "#ffb84d" : "#2a2a33"}`,
        background: open ? "rgba(255,184,77,0.08)" : "#101015",
        color: "#eee",
        cursor: "pointer",
        fontWeight: 900,
      }}
      title="Filters"
    >
      ⌄
    </button>
  );
}
