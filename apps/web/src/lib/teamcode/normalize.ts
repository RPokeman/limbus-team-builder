// apps/web/src/lib/teamcode/normalize.ts
import type { EgoRecord, EgoTier, IdentityRecord, SinnerId, TeamState } from "@limbus/core/types";
import { SINNER_ORDER } from "@limbus/core/types";

type DatasetLike = {
  identities: IdentityRecord[];
  egos: EgoRecord[];
};

function makeEmptyTeam(): TeamState {
  return {
    slots: SINNER_ORDER.map(() => ({ identityKey: "", egos: {} })),
  };
}

function indexBaseIdentity(ds: DatasetLike): Record<SinnerId, string> {
  const out = {} as Record<SinnerId, string>;
  for (const id of ds.identities) {
    if (id.isBase) out[id.sinner] = id.page;
  }
  return out;
}

function indexDefaultEgos(ds: DatasetLike): Record<SinnerId, Partial<Record<EgoTier, string>>> {
  const out = {} as Record<SinnerId, Partial<Record<EgoTier, string>>>;
  for (const e of ds.egos) {
    if (!out[e.sinner]) out[e.sinner] = {};
    if (e.isDefault) out[e.sinner][e.tier] = e.page;
  }
  return out;
}

/**
 * Enforces:
 * - 12 slots in SINNER_ORDER
 * - identityKey always filled (falls back to base identity)
 * - ZAYIN always filled when possible (falls back to default ZAYIN)
 *
 * This is the correct place to fix “some slots blank” and “IDs w/o EGOs”
 * because it runs after decode / load / reset.
 */
export function normalizeTeamState(team: TeamState | null | undefined, ds: DatasetLike): TeamState {
  const baseIds = indexBaseIdentity(ds);
  const defaultEgos = indexDefaultEgos(ds);

  const src = team?.slots?.length ? team : makeEmptyTeam();

  const slots = SINNER_ORDER.map((sinner, i) => {
    const cur = src.slots[i] ?? { identityKey: "", egos: {} };

    const identityKey = cur.identityKey || baseIds[sinner] || "";

    const egos = { ...(cur.egos ?? {}) } as any;
    if (!egos.ZAYIN) {
      const defZ = defaultEgos[sinner]?.ZAYIN;
      if (defZ) egos.ZAYIN = defZ;
    }

    return { identityKey, egos };
  });

  return { slots };
}
