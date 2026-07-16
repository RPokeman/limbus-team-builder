// apps/web/src/components/modals/TeamCodeModal.tsx
import React, { useEffect, useState } from "react";

export default function TeamCodeModal(props: {
  teamCode: string;
  setTeamCode: (code: string) => void;
  error: string | null;
  onClose: () => void;
}) {
  const { teamCode, setTeamCode, error, onClose } = props;
  const [draft, setDraft] = useState(teamCode);

  useEffect(() => setDraft(teamCode), [teamCode]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(teamCode);
    } catch {}
  };

  const paste = async () => {
    try {
      const txt = await navigator.clipboard.readText();
      if (txt) setDraft(txt.trim());
    } catch {}
  };

  const load = () => {
    setTeamCode(draft.trim());
    onClose();
  };

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "grid",
        placeItems: "center",
        zIndex: 999,
        padding: 14,
      }}
    >
      <div
        style={{
          width: 640,
          maxWidth: "96vw",
          borderRadius: 12,
          border: "1px solid #2b2b31",
          background: "#0f0f13",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            padding: "12px 14px",
            borderBottom: "1px solid #1e1e22",
            fontWeight: 900,
            letterSpacing: 0.5,
            background: "linear-gradient(180deg, #1b1b22, #14141a)",
          }}
        >
          Team Code
        </div>

        <div style={{ padding: 14, display: "grid", gap: 10 }}>
          <div style={{ opacity: 0.8, fontSize: 12, lineHeight: 1.35 }}>
            With Team Codes, you can copy/share your loadout, or paste/load a team loadout.
          </div>

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            style={{
              width: "100%",
              height: 120,
              resize: "none",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #2b2b31",
              background: "#0b0b0d",
              color: "#eaeaea",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              fontSize: 12,
              lineHeight: 1.25,
            }}
          />

          {error && <div style={{ color: "#ff6b6b", fontSize: 12 }}>{error}</div>}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={copy} style={btnWide()}>
              Copy Team Code
            </button>
            <button onClick={paste} style={btnWide()}>
              Paste from Clipboard
            </button>
            <button onClick={load} style={btnWide()}>
              Load Team Code
            </button>
          </div>

          <button onClick={onClose} style={{ ...btnWide(), background: "#15151a" }}>
            ✕ Close
          </button>
        </div>
      </div>
    </div>
  );
}

function btnWide(): React.CSSProperties {
  return {
    flex: "1 1 180px",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #2b2b31",
    background: "#17171d",
    color: "#eee",
    cursor: "pointer",
    fontWeight: 900,
  };
}
