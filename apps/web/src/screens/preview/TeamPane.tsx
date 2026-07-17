// apps/web/src/screens/preview/TeamPane.tsx
import React, { useMemo, useState } from "react";
import type { EgoRecord, IdentityRecord, OrdinalTables, TeamState } from "@limbus/core/types";
import { SINNER_ORDER } from "@limbus/core/types";

import { identityPortraitUrl, rarityBorderUrl } from "../../assets";

type Dataset = {
  identities: IdentityRecord[];
  egos: EgoRecord[];
  ordinals: OrdinalTables;
  assetBaseUrl?: string;
};

export default function TeamPane(props: {
  dataset: Dataset;
  team: TeamState;
  detailsMode: "min" | "skills" | "ego";
  onClickCard: (slotIndex: number) => void;
}) {
  const { dataset, team, detailsMode, onClickCard } = props;

  const idsByPage = useMemo(() => {
    const m = new Map<string, IdentityRecord>();
    for (const id of dataset.identities) m.set(id.page, id);
    return m;
  }, [dataset.identities]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
        gap: 10,
      }}
    >
      {SINNER_ORDER.map((sinner, idx) => {
        const slot = team.slots[idx];
        const ident = slot?.identityKey ? idsByPage.get(slot.identityKey) : undefined;

        return (
          <button
            key={sinner}
            onClick={() => onClickCard(idx)}
            style={{
              padding: 0,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              outline: "none",
              boxShadow: "none",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <IdentityCard identity={ident} identityKey={slot?.identityKey} detailsMode={detailsMode} />
          </button>
        );
      })}
    </div>
  );
}

function IdentityCard(props: {
  identity?: IdentityRecord;
  identityKey?: string;
  detailsMode: "min" | "skills" | "ego";
}) {
  const { identity, identityKey, detailsMode } = props;
  const [hovered, setHovered] = useState(false);

  const rarity = identity?.rarity ?? 1;

  // Let the portrait define the card height (canonical image ratio).
  const portrait = identity?.page ? identityPortraitUrl(identity.page) : "";
  const border = rarityBorderUrl(rarity);

  // Your tuned values
  const BORDER_SCALE_X = 1.09;
  const BORDER_SCALE_Y = 1.065;

  // Show PREFIX only (identities.json provides identity.prefix)
  const labelText = (identity as any)?.prefix ?? identityKey ?? "—";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        width: "100%",
        borderRadius: 10,
        overflow: "hidden",
        background: "#101015",

        boxShadow: hovered
          ? "0 0 0 1px rgba(255, 210, 120, 0.95), 0 0 10px rgba(255, 210, 120, 0.35)"
          : "none",
        transition: "box-shadow 120ms ease",
      }}
    >
      {portrait ? (
        <img
          src={portrait}
          alt={identity?.name ?? identity?.page ?? "Identity"}
          draggable={false}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          style={{
            display: "block",
            width: "100%",
            height: "auto",
            objectFit: "cover",
            filter: detailsMode === "min" ? "none" : "brightness(0.55)",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
      ) : (
        <div
          style={{
            height: 160,
            display: "grid",
            placeItems: "center",
            opacity: 0.7,
            fontSize: 12,
          }}
        >
          No portrait
        </div>
      )}

      {/* Border overlay: fill the card, then overscale so it reads flush */}
      <img
        src={border}
        alt=""
        draggable={false}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "fill",
          pointerEvents: "none",
          userSelect: "none",
          transform: `scaleX(${BORDER_SCALE_X}) scaleY(${BORDER_SCALE_Y})`,
          transformOrigin: "center",
        }}
      />

      {/* Prefix label: in-game-ish (right aligned), no background, pure white, grows upward */}
      <div
        style={{
          position: "absolute",
          // right-anchored like the game UI
          right: 21,
          bottom: 28,

          // constrain width so it doesn't look like a title card; lets it wrap upward from the right
          maxWidth: "81%",

          textAlign: "right",
          color: "#F2C94C",

          // font + stack: close approximation without bundling a proprietary font
          fontFamily:
            '"Roboto Condensed","Archivo Narrow","Noto Sans KR","Pretendard","Source Han Sans KR","Segoe UI",system-ui,sans-serif',
          fontSize: 21,
          fontWeight: 800,
          lineHeight: 1.05,

          // allow wrapping + growth upward
          whiteSpace: "normal",
          overflowWrap: "normal",
          wordBreak: "normal",

          textShadow:
            "0 2px 0 rgba(45, 26, 5, 0.85), 0 0 6px rgba(255, 200, 90, 0.35)",

          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {labelText}
      </div>
    </div>
  );
}
