// apps/web/src/screens/preview/TeamName.tsx
import React, { useState } from "react";

export default function TeamName(props: { name: string; onRename: (name: string) => void }) {
  const { name, onRename } = props;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  const commit = () => {
    const next = draft.trim() || name;
    onRename(next);
    setEditing(false);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      {!editing ? (
        <>
          <div style={{ fontWeight: 900, letterSpacing: 0.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {name}
          </div>
          <button
            onClick={() => {
              setDraft(name);
              setEditing(true);
            }}
            title="Rename"
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: "1px solid #2b2b31",
              background: "#15151a",
              color: "#eee",
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            ✎
          </button>
        </>
      ) : (
        <>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            autoFocus
            style={{
              width: 220,
              maxWidth: "50vw",
              padding: "7px 8px",
              borderRadius: 6,
              border: "1px solid #2b2b31",
              background: "#0f0f13",
              color: "#eee",
              fontWeight: 800,
            }}
          />
          <button
            onClick={commit}
            style={{
              padding: "7px 10px",
              borderRadius: 6,
              border: "1px solid #2b2b31",
              background: "#15151a",
              color: "#eee",
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            Save
          </button>
        </>
      )}
    </div>
  );
}
