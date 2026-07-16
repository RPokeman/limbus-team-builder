// apps/web/src/components/preview/SinCostPanel.tsx
import React, { useMemo } from "react";
import type { EgoRecord, IdentityRecord, OrdinalTables, Sin, TeamState } from "@limbus/core/types";

import { sinIconUrl } from "../../assets";
import { computeSinAndCost } from "../../state/computeSinCost";

type Dataset = {
  identities: IdentityRecord[];
  egos: EgoRecord[];
  ordinals: OrdinalTables;
  assetBaseUrl?: string;
};

const SIN_ORDER: Sin[] = ["wrath", "lust", "sloth", "gluttony", "gloom", "pride", "envy"];

export default function SinCostPanel(props: { dataset: Dataset; team: TeamState }) {
  const { dataset, team } = props;

  const { sinTotals, costTotals } = useMemo(() => computeSinAndCost(dataset, team), [dataset, team]);

  const gridCols = "36px 72px 72px";

  return (
    <div
      style={{
        borderRadius: 10,
        border: "1px solid #1e1e22",
        overflow: "hidden",
        background: "#0f0f13",
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
        SIN | COST
      </div>

      <div style={{ padding: 12, display: "grid", gap: 10 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: gridCols,
            gap: 10,
            alignItems: "center",
            opacity: 0.85,
            fontSize: 11,
            fontWeight: 900,
          }}
        >
          <div />
          <div style={{ textAlign: "center" }}>SIN</div>
          <div style={{ textAlign: "center" }}>COST</div>
        </div>

        {SIN_ORDER.map((sin) => (
          <div
            key={sin}
            style={{
              display: "grid",
              gridTemplateColumns: gridCols,
              gap: 10,
              alignItems: "center",
            }}
          >
            <img src={sinIconUrl(sin)} alt={sin} style={{ width: 28, height: 28 }} />
            <div
              style={{
                textAlign: "center",
                fontWeight: 900,
                fontSize: 20,
                letterSpacing: 0.5,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {sinTotals[sin] ?? 0}
            </div>
            <div
              style={{
                textAlign: "center",
                fontWeight: 900,
                fontSize: 20,
                letterSpacing: 0.5,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {costTotals[sin] ?? 0}
            </div>
          </div>
        ))}

        <button
          style={{
            marginTop: 6,
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #2b2b31",
            background: "#15151a",
            color: "#eee",
            cursor: "pointer",
            fontWeight: 900,
          }}
        >
          Details
        </button>
      </div>
    </div>
  );
}
