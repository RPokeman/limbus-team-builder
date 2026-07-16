// apps/web/src/screens/selector/sort.ts
import type { EgoRecord, IdentityRecord, SinnerId, TeamState } from "@limbus/core/types";
import { SINNER_ORDER } from "@limbus/core/types";

export type SelectorMode = "identities" | "egos";
export type SinnerFilter = "ALL" | SinnerId;

function dateKeyDesc(d: string | null | undefined): number {
  if (!d) return Number.NEGATIVE_INFINITY; // unknown/none -> oldest
  const t = Date.parse(d);
  return Number.isFinite(t) ? t : Number.NEGATIVE_INFINITY;
}

function tierRank(tier: string): number {
  // risk level (lowest -> highest)
  switch (tier) {
    case "ZAYIN":
      return 0;
    case "TETH":
      return 1;
    case "HE":
      return 2;
    case "WAW":
      return 3;
    case "ALEPH":
      return 4;
    default:
      return 99;
  }
}

export function sinnerIndexOf(filter: SinnerFilter): number {
  if (filter === "ALL") return -1;
  return SINNER_ORDER.indexOf(filter);
}

export function buildIdentityList(
  identities: IdentityRecord[],
  mode: SelectorMode,
  sinner: SinnerFilter,
  team: TeamState | null,
): IdentityRecord[] {
  if (mode !== "identities") return [];

  const idx = sinnerIndexOf(sinner);
  const selectedKey = idx >= 0 && team ? team.slots[idx]?.identityKey : "";

  const filtered = idx >= 0 ? identities.filter((r) => r.sinner === sinner) : identities.slice();

  // NOTE: Sorting is only applied when we (re)build the list (filter transition).
  // Default ordering: Currently Selected -> Rarity -> Release Date
  filtered.sort((a, b) => {
    const aSel = selectedKey && a.page === selectedKey ? 1 : 0;
    const bSel = selectedKey && b.page === selectedKey ? 1 : 0;
    if (aSel !== bSel) return bSel - aSel;

    // rarity: higher first
    const ar = Number(a.rarity ?? 0);
    const br = Number(b.rarity ?? 0);
    if (ar !== br) return br - ar;

    // releaseDate: newer first
    const ad = dateKeyDesc(a.releaseDate);
    const bd = dateKeyDesc(b.releaseDate);
    return bd - ad;
  });

  return filtered;
}

export function buildEgoList(
  egos: EgoRecord[],
  mode: SelectorMode,
  sinner: SinnerFilter,
  team: TeamState | null,
): EgoRecord[] {
  if (mode !== "egos") return [];

  const idx = sinnerIndexOf(sinner);
  const selectedByTier =
    idx >= 0 && team
      ? (team.slots[idx]?.egos as Record<string, string | undefined>)
      : ({} as Record<string, string | undefined>);

  const filtered = idx >= 0 ? egos.filter((r) => r.sinner === sinner) : egos.slice();

  // Default ordering: Currently Selected -> Risk Level -> Release Date
  filtered.sort((a, b) => {
    const aSel = idx >= 0 && selectedByTier ? (selectedByTier[a.tier] === a.page ? 1 : 0) : 0;
    const bSel = idx >= 0 && selectedByTier ? (selectedByTier[b.tier] === b.page ? 1 : 0) : 0;
    if (aSel !== bSel) return bSel - aSel;

    const ar = tierRank(a.tier);
    const br = tierRank(b.tier);
    if (ar !== br) return ar - br;

    const ad = dateKeyDesc(a.releaseDate);
    const bd = dateKeyDesc(b.releaseDate);
    return bd - ad;
  });

  return filtered;
}
