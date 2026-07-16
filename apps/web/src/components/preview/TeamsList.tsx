// apps/web/src/components/preview/TeamsList.tsx
import React, { useRef } from "react";
import type { StoredTeam } from "../../state/teamsStorage";

export default function TeamsList(props: {
  teams: StoredTeam[];
  activeIndex: number;
  onSelect: (idx: number) => void;
}) {
  const { teams, activeIndex, onSelect } = props;
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const drag = useRef<{ active: boolean; y: number; top: number }>({ active: false, y: 0, top: 0 });

  const onPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest("button")) return;

    const el = scrollerRef.current;
    if (!el) return;

    drag.current = { active: true, y: e.clientY, top: el.scrollTop };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    const el = scrollerRef.current;
    if (!el) return;
    const dy = e.clientY - drag.current.y;
    el.scrollTop = drag.current.top - dy;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    drag.current.active = false;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div
      style={{
        borderRadius: 10,
        border: "1px solid #1e1e22",
        overflow: "hidden",
        background: "#0f0f13",
        display: "grid",
        gridTemplateRows: "44px 1fr",
        minHeight: 0,
      }}
    >
      <div
        style={{
          padding: "10px 12px",
          fontWeight: 900,
          letterSpacing: 0.6,
          borderBottom: "1px solid #1e1e22",
          background: "linear-gradient(180deg, #1b1b22, #14141a)",
        }}
      >
        TEAMS
      </div>

      <div
        ref={scrollerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          overflowY: "auto",
          padding: 10,
          display: "grid",
          gap: 8,
          userSelect: "none",
          touchAction: "pan-y",
          minHeight: 0,
        }}
      >
        {teams.map((t, idx) => {
          const active = idx === activeIndex;
          return (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              style={{
                width: "100%",
                textAlign: "center",
                padding: "12px 10px",
                borderRadius: 8,
                border: active ? "2px solid #f0b44b" : "1px solid #2b2b31",
                background: active ? "#211807" : "#15151a",
                color: "#eee",
                cursor: "pointer",
                fontWeight: 900,
                letterSpacing: 0.5,
                outline: "none",
                boxShadow: "none",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {t.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
