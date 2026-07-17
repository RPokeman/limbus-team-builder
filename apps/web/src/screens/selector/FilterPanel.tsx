// apps/web/src/screens/selector/FilterPanel.tsx
import React from "react";

import type { SelectorMode, IdentityFilterState, EgoFilterState } from "./filtering";
import {
  ID_RARITIES,
  ATTACK_TYPES,
  AFFINITIES,
  KEYWORDS,
  EGO_TIER_ORDER,
  toggleInSet,
} from "./filtering";

function Chip(props: { active: boolean; label: string; onClick: () => void }) {
  const { active, label, onClick } = props;
  return (
    <button
      onClick={onClick}
      style={{
        height: 30,
        padding: "0 10px",
        borderRadius: 10,
        border: `1px solid ${active ? "#ffb84d" : "#2a2a33"}`,
        background: active ? "rgba(255,184,77,0.12)" : "#101015",
        color: "#eee",
        cursor: "pointer",
        fontWeight: 800,
        fontSize: 12,
        letterSpacing: 0.2,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function Section(props: { title: string; children: React.ReactNode }) {
  const { title, children } = props;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 0.4, opacity: 0.9, marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{children}</div>
    </div>
  );
}

export default function FilterPanel(props: {
  open: boolean;
  mode: SelectorMode;

  identityFilters: IdentityFilterState;
  setIdentityFilters: React.Dispatch<React.SetStateAction<IdentityFilterState>>;

  egoFilters: EgoFilterState;
  setEgoFilters: React.Dispatch<React.SetStateAction<EgoFilterState>>;

  onClose: () => void;
  onClear: () => void;
}) {
  const { open, mode, identityFilters, setIdentityFilters, egoFilters, setEgoFilters, onClose, onClear } = props;

  if (!open) return null;

  const title = mode === "identities" ? "Identity Filters" : "E.G.O Filters";

  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        left: 12,
        maxHeight: "calc(100% - 24px)",
        overflow: "auto",
        borderRadius: 10,
        border: "1px solid #2a2a33",
        background: "#101015",
        padding: 12,
        zIndex: 20,
        boxShadow: "0 12px 30px rgba(0,0,0,0.55)",
        pointerEvents: "auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontWeight: 900, letterSpacing: 0.3 }}>{title}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onClear}
            style={{
              height: 30,
              padding: "0 10px",
              borderRadius: 10,
              border: "1px solid #2a2a33",
              background: "#0f0f14",
              color: "#eee",
              cursor: "pointer",
              fontWeight: 800,
              fontSize: 12,
            }}
            title="Clear filters"
          >
            Clear
          </button>

          <button
            onClick={onClose}
            style={{
              height: 30,
              width: 34,
              borderRadius: 10,
              border: "1px solid #2a2a33",
              background: "#0f0f14",
              color: "#eee",
              cursor: "pointer",
              fontWeight: 900,
            }}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {mode === "identities" ? (
        <>
          <Section title="Rarity">
            {ID_RARITIES.map((r) => (
              <Chip
                key={r.value}
                label={r.label}
                active={identityFilters.rarity.has(r.value)}
                onClick={() => setIdentityFilters((prev) => ({ ...prev, rarity: toggleInSet(prev.rarity, r.value) }))}
              />
            ))}
          </Section>

          <Section title="Skill Attack Type">
            {ATTACK_TYPES.map((t) => (
              <Chip
                key={t.value}
                label={t.label}
                active={identityFilters.attackType.has(t.value)}
                onClick={() =>
                  setIdentityFilters((prev) => ({ ...prev, attackType: toggleInSet(prev.attackType, t.value) }))
                }
              />
            ))}
          </Section>

          <Section title="Skill Affinity">
            {AFFINITIES.map((a) => (
              <Chip
                key={a.value}
                label={a.label}
                active={identityFilters.affinity.has(a.value)}
                onClick={() =>
                  setIdentityFilters((prev) => ({ ...prev, affinity: toggleInSet(prev.affinity, a.value) }))
                }
              />
            ))}
          </Section>

          <Section title="Keyword">
            {KEYWORDS.map((k) => (
              <Chip
                key={k.value}
                label={k.label}
                active={identityFilters.keyword.has(k.value)}
                onClick={() => setIdentityFilters((prev) => ({ ...prev, keyword: toggleInSet(prev.keyword, k.value) }))}
              />
            ))}
          </Section>
        </>
      ) : (
        <>
          <Section title="Rarity">
            {EGO_TIER_ORDER.map((t) => (
              <Chip
                key={t}
                label={t}
                active={egoFilters.tier.has(t)}
                onClick={() => setEgoFilters((prev) => ({ ...prev, tier: toggleInSet(prev.tier, t) }))}
              />
            ))}
          </Section>

          <Section title="E.G.O Attack Type">
            {ATTACK_TYPES.map((t) => (
              <Chip
                key={t.value}
                label={t.label}
                active={egoFilters.attackType.has(t.value)}
                onClick={() => setEgoFilters((prev) => ({ ...prev, attackType: toggleInSet(prev.attackType, t.value) }))}
              />
            ))}
          </Section>

          <Section title="E.G.O Affinity">
            {AFFINITIES.map((a) => (
              <Chip
                key={a.value}
                label={a.label}
                active={egoFilters.affinity.has(a.value)}
                onClick={() => setEgoFilters((prev) => ({ ...prev, affinity: toggleInSet(prev.affinity, a.value) }))}
              />
            ))}
          </Section>

          <Section title="Keyword">
            {KEYWORDS.map((k) => (
              <Chip
                key={k.value}
                label={k.label}
                active={egoFilters.keyword.has(k.value)}
                onClick={() => setEgoFilters((prev) => ({ ...prev, keyword: toggleInSet(prev.keyword, k.value) }))}
              />
            ))}
          </Section>
        </>
      )}
    </div>
  );
}
