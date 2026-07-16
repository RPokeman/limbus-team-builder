// apps/web/src/screens/selector/SinnerRail.tsx
import React, { useMemo } from "react";
import type { IdentityRecord, TeamState } from "@limbus/core/types";
import { SINNER_ORDER } from "@limbus/core/types";
import { identityPortraitUrl } from "../../assets";

type SinnerFilter = "ALL" | number;

export function SinnerRail(props: {
  sinnerFilter: SinnerFilter;
  onSelect: (f: SinnerFilter) => void;
  onBack: () => void;

  teamState: TeamState;
  identitiesByKey: Map<string, IdentityRecord>;
}) {
  const { sinnerFilter, onSelect, onBack, teamState, identitiesByKey } = props;

  const portraitsBySinnerIndex = useMemo(() => {
    const out = new Map<number, string>();
    for (let i = 0; i < SINNER_ORDER.length; i++) {
      const key = teamState.slots[i]?.identityKey ?? "";
      const rec = key ? identitiesByKey.get(key) : null;
      const url = rec?.page ? identityPortraitUrl(rec.page) : "";
      out.set(i, url);
    }
    return out;
  }, [teamState, identitiesByKey]);

  return (
    <div
      style={{
        border: "1px solid #1e1e22",
        borderRadius: 10,
        overflow: "hidden",
        background: "#0f0f13",
        display: "grid",
        gridTemplateRows: "54px 1fr",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "48px 1fr",
          alignItems: "center",
          gap: 8,
          padding: "10px 10px",
          borderBottom: "1px solid #1e1e22",
          background: "linear-gradient(180deg, #17171d, #121218)",
        }}
      >
        <button
          onClick={onBack}
          style={{
            height: 34,
            borderRadius: 8,
            border: "1px solid #2a2a33",
            background: "#121218",
            color: "#eee",
            cursor: "pointer",
          }}
          title="Back"
        >
          ←
        </button>

        <div style={{ fontWeight: 800, opacity: 0.9 }}>Sinners</div>
      </div>

      <div
        style={{
          padding: 10,
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 10,
          alignContent: "start",
        }}
      >
        {/* ALL button spans both columns */}
        <button
          onClick={() => onSelect("ALL")}
          style={{
            ...tileStyle(sinnerFilter === "ALL"),
            gridColumn: "1 / span 2",
            height: 56,
            display: "grid",
            placeItems: "center",
            fontWeight: 900,
            letterSpacing: 0.6,
          }}
        >
          ALL
        </button>

        {SINNER_ORDER.map((name, i) => {
          const active = sinnerFilter === i;
          const portrait = portraitsBySinnerIndex.get(i) ?? "";

          return (
            <button
              key={name}
              onClick={() => onSelect(i)}
              style={{
                ...tileStyle(active),
                padding: 8,
                display: "grid",
                placeItems: "center",
              }}
              title={name}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "1 / 1",
                  borderRadius: 10,
                  overflow: "hidden",
                  border: "1px solid #2a2a33",
                  background: "#101015",
                }}
              >
                {portrait ? (
                  <img
                    src={portrait}
                    alt={name}
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      userSelect: "none",
                      pointerEvents: "none",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "grid",
                      placeItems: "center",
                      fontWeight: 900,
                      opacity: 0.85,
                    }}
                  >
                    —
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function tileStyle(active: boolean): React.CSSProperties {
  return {
    borderRadius: 12,
    border: `1px solid ${active ? "#ffb84d" : "#2a2a33"}`,
    background: active ? "rgba(255,184,77,0.08)" : "#101015",
    color: "#eee",
    cursor: "pointer",
  };
}
