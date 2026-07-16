// apps/web/src/state/computeSinCost.ts
import type { EgoRecord, IdentityRecord, OrdinalTables, Sin, TeamState } from "@limbus/core/types";
import { SINNER_ORDER } from "@limbus/core/types";

type Dataset = {
  identities: IdentityRecord[];
  egos: EgoRecord[];
  ordinals: OrdinalTables;
  assetBaseUrl?: string;
};

const SIN_ORDER: Sin[] = ["wrath", "lust", "sloth", "gluttony", "gloom", "pride", "envy"];

function emptyTotals(): Record<Sin, number> {
  return Object.fromEntries(SIN_ORDER.map((s) => [s, 0])) as Record<Sin, number>;
}

export function computeSinAndCost(dataset: Dataset, team: TeamState): {
  sinTotals: Record<Sin, number>;
  costTotals: Record<Sin, number>;
} {
  const sinTotals = emptyTotals();
  const costTotals = emptyTotals();

  const idsByPage = new Map<string, IdentityRecord>();
  for (const id of dataset.identities) idsByPage.set(id.page, id);

  const egosByPage = new Map<string, EgoRecord>();
  for (const e of dataset.egos) egosByPage.set(e.page, e);

  for (let i = 0; i < SINNER_ORDER.length; i++) {
    const slot = team.slots[i];
    if (!slot) continue;

    // SIN generation from identity skills:
    // 3x skill1, 2x skill2, 1x skill3 (ignore defense)
    const ident = slot.identityKey ? idsByPage.get(slot.identityKey) : undefined;
    if (ident) {
      const s1 = ident.skills.find((x) => x.slot === "skill1")?.sin;
      const s2 = ident.skills.find((x) => x.slot === "skill2")?.sin;
      const s3 = ident.skills.find((x) => x.slot === "skill3")?.sin;

      if (s1) sinTotals[s1] += 3;
      if (s2) sinTotals[s2] += 2;
      if (s3) sinTotals[s3] += 1;
    }

    // EGO costs from equipped egos
    for (const egoKey of Object.values(slot.egos ?? {})) {
      if (!egoKey) continue;
      const ego = egosByPage.get(egoKey);
      if (!ego?.cost) continue;
      for (const sin of SIN_ORDER) costTotals[sin] += ego.cost[sin] ?? 0;
    }
  }

  return { sinTotals, costTotals };
}
