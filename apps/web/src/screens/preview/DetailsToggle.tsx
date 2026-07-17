// apps/web/src/screens/preview/DetailsToggle.tsx
import React from "react";

export default function DetailsToggle(props: {
  mode: "min" | "skills" | "ego";
  setMode: (m: "min" | "skills" | "ego") => void;
}) {
  const { mode, setMode } = props;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        onClick={() => {
          if (mode === "min") setMode("skills");
          else setMode("min");
        }}
        style={{
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid #2b2b31",
          background: "#15151a",
          color: "#eee",
          cursor: "pointer",
          fontWeight: 900,
          letterSpacing: 0.3,
          minWidth: 44,
          outline: "none",
          boxShadow: "none",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {mode === "min" ? "<<" : ">>"}
      </button>

      {mode !== "min" && (
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => setMode("skills")}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: mode === "skills" ? "1px solid #f0b44b" : "1px solid #2b2b31",
              background: mode === "skills" ? "#211807" : "#15151a",
              color: "#eee",
              cursor: "pointer",
              fontWeight: 900,
              outline: "none",
              boxShadow: "none",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            SKILL
          </button>
          <button
            onClick={() => setMode("ego")}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: mode === "ego" ? "1px solid #f0b44b" : "1px solid #2b2b31",
              background: mode === "ego" ? "#211807" : "#15151a",
              color: "#eee",
              cursor: "pointer",
              fontWeight: 900,
              outline: "none",
              boxShadow: "none",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            E.G.O
          </button>
        </div>
      )}
    </div>
  );
}
