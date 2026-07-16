// apps/web/src/components/preview/TeamReset.tsx
import React from "react";

export default function TeamReset(props: { onReset: () => void }) {
  return (
    <button
      onClick={props.onReset}
      title="Reset Team"
      style={{
        width: 44,
        height: 40,
        borderRadius: 8,
        border: "1px solid #3a1010",
        background: "linear-gradient(180deg, #7a1212, #4b0d0d)",
        color: "#fff",
        cursor: "pointer",
        fontWeight: 900,
      }}
    >
      🗑
    </button>
  );
}
