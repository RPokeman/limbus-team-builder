// apps/web/src/screens/selector/SelectedIdentityPanel.tsx
import React, { useMemo } from "react";
import type { EgoRecord, IdentityRecord, TeamState, EgoTier } from "@limbus/core/types";
import { identityPortraitUrl } from "../../assets";

const TIERS: EgoTier[] = ["ZAYIN", "TETH", "HE", "WAW", "ALEPH"];
const CARD_ASPECT = 333 / 465;

function getName(rec: any): string {
  return String(rec?.name ?? rec?.page ?? "");
}

export function SelectedIdentityPanel(props: {
  sinnerIndex: number | null;
  sinnerName: string | null;
  teamState: TeamState;
  identitiesByKey: Map<string, IdentityRecord>;
  egosByKey: Map<string, EgoRecord>;
}) {
  const { sinnerIndex, sinnerName, teamState, identitiesByKey, egosByKey } = props;

  const slot = sinnerIndex == null ? null : teamState.slots[sinnerIndex];

  const identityRec = useMemo(() => {
    if (!slot?.identityKey) return null;
    return identitiesByKey.get(slot.identityKey) ?? null;
  }, [slot?.identityKey, identitiesByKey]);

  const equipped = useMemo(() => {
    if (!slot) return [];
    return TIERS.map((tier) => {
      const key = String((slot.egos as any)?.[tier] ?? "");
      const rec = key ? egosByKey.get(key) ?? null : null;
      return { tier, key, rec };
    });
  }, [slot, egosByKey]);

  const portrait = identityRec?.page ? identityPortraitUrl(identityRec.page) : "";

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
          padding: "10px 12px",
          borderBottom: "1px solid #1e1e22",
          background: "linear-gradient(180deg, #17171d, #121218)",
          display: "grid",
          alignItems: "center",
          fontWeight: 900,
          letterSpacing: 0.3,
        }}
      >
        Selected Identity
      </div>

      {sinnerIndex == null ? (
        <div style={{ padding: 12, opacity: 0.7, fontSize: 12, lineHeight: 1.4 }}>
          Select a sinner (not ALL) to view the selected identity panel.
        </div>
      ) : (
        <div style={{ padding: 12, display: "grid", gap: 12, alignContent: "start" }}>
          {/* Large portrait */}
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: String(CARD_ASPECT),
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid #2a2a33",
              background: "#101015",
            }}
          >
            {portrait ? (
              <img
                src={portrait}
                alt={identityRec ? getName(identityRec) : "Identity"}
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
                  fontSize: 14,
                  opacity: 0.75,
                  fontWeight: 900,
                }}
              >
                —
              </div>
            )}

            {/* name plate */}
            <div
              style={{
                position: "absolute",
                left: 10,
                right: 10,
                bottom: 10,
                background: "rgba(0,0,0,0.65)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 10,
                padding: "8px 10px",
                display: "grid",
                gap: 4,
              }}
            >
              <div style={{ fontWeight: 900 }}>{sinnerName}</div>
              <div style={{ fontSize: 12, opacity: 0.85, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {identityRec ? getName(identityRec) : "(no identity selected)"}
              </div>
            </div>
          </div>

          {/* Equipped EGOs */}
          <div style={{ display: "grid", gap: 8 }}>
            {equipped.map(({ tier, rec }) => (
              <div
                key={tier}
                style={{
                  display: "grid",
                  gridTemplateColumns: "66px 1fr",
                  gap: 10,
                  alignItems: "center",
                  padding: "10px 10px",
                  borderRadius: 10,
                  border: "1px solid #2a2a33",
                  background: "#101015",
                }}
              >
                <div style={{ fontWeight: 900, opacity: 0.9 }}>{tier}</div>
                <div style={{ fontSize: 12, opacity: 0.85 }}>{rec ? getName(rec) : "(empty)"}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
