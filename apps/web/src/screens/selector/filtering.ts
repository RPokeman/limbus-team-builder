// apps/web/src/screens/selector/filtering.ts
import type { EgoTier } from "@limbus/core/types";

export type SelectorMode = "identities" | "ego";

export type IdentityFilterState = {
  rarity: Set<number>; // 1,2,3
  attackType: Set<string>; // slash|pierce|blunt (from skills[].type)
  affinity: Set<string>; // wrath|lust|sloth|gluttony|gloom|pride|envy (from affinities[])
  keyword: Set<string>; // burn|bleed|tremor|rupture|sinking|poise|charge (from statusTags[])
};

export type EgoFilterState = {
  tier: Set<EgoTier>; // ZAYIN..ALEPH (from tier)
  attackType: Set<string>; // slash|pierce|blunt (from type)
  affinity: Set<string>; // wrath|lust|sloth|gluttony|gloom|pride|envy (from affinity)
  keyword: Set<string>; // burn|bleed|tremor|rupture|sinking|poise|charge (from statusTags[])
};

export const EGO_TIER_ORDER: EgoTier[] = ["ZAYIN", "TETH", "HE", "WAW", "ALEPH"];

export const ID_RARITIES: Array<{ label: string; value: number }> = [
  { label: "0", value: 1 },
  { label: "00", value: 2 },
  { label: "000", value: 3 },
];

export const ATTACK_TYPES: Array<{ label: string; value: string }> = [
  { label: "Slash", value: "slash" },
  { label: "Pierce", value: "pierce" },
  { label: "Blunt", value: "blunt" },
];

export const AFFINITIES: Array<{ label: string; value: string }> = [
  { label: "Wrath", value: "wrath" },
  { label: "Lust", value: "lust" },
  { label: "Sloth", value: "sloth" },
  { label: "Glut.", value: "gluttony" },
  { label: "Gloom", value: "gloom" },
  { label: "Pride", value: "pride" },
  { label: "Envy", value: "envy" },
];

export const KEYWORDS: Array<{ label: string; value: string }> = [
  { label: "Burn", value: "burn" },
  { label: "Bleed", value: "bleed" },
  { label: "Tremor", value: "tremor" },
  { label: "Rupture", value: "rupture" },
  { label: "Sinking", value: "sinking" },
  { label: "Poise", value: "poise" },
  { label: "Charge", value: "charge" },
];

export function emptyIdentityFilters(): IdentityFilterState {
  return { rarity: new Set(), attackType: new Set(), affinity: new Set(), keyword: new Set() };
}

export function emptyEgoFilters(): EgoFilterState {
  return { tier: new Set(), attackType: new Set(), affinity: new Set(), keyword: new Set() };
}

function groupActive(s: Set<any>): boolean {
  return s.size > 0;
}

export function toggleInSet<T>(s: Set<T>, v: T): Set<T> {
  const next = new Set(Array.from(s));
  if (next.has(v)) next.delete(v);
  else next.add(v);
  return next;
}

/**
 * Whitelist logic:
 * - OR within a group
 * - AND across groups
 *
 * Empty groups do not constrain results.
 */
export function recordMatchesIdentityFilters(rec: any, f: IdentityFilterState): boolean {
  if (groupActive(f.rarity)) {
    const r = Number(rec?.rarity ?? 0);
    if (!f.rarity.has(r)) return false;
  }

  if (groupActive(f.attackType)) {
    const skills: any[] = Array.isArray(rec?.skills) ? rec.skills : [];
    const types = new Set<string>();
    for (const sk of skills) {
      const t = String(sk?.type ?? "");
      if (t) types.add(t);
    }
    let ok = false;
    for (const t of f.attackType) {
      if (types.has(t)) {
        ok = true;
        break;
      }
    }
    if (!ok) return false;
  }

  if (groupActive(f.affinity)) {
    const affs: any[] = Array.isArray(rec?.affinities) ? rec.affinities : [];
    const set = new Set<string>(affs.map((x) => String(x)));
    let ok = false;
    for (const a of f.affinity) {
      if (set.has(a)) {
        ok = true;
        break;
      }
    }
    if (!ok) return false;
  }

  if (groupActive(f.keyword)) {
    const tags: any[] = Array.isArray(rec?.statusTags) ? rec.statusTags : [];
    const set = new Set<string>(tags.map((x) => String(x)));
    let ok = false;
    for (const k of f.keyword) {
      if (set.has(k)) {
        ok = true;
        break;
      }
    }
    if (!ok) return false;
  }

  return true;
}

export function recordMatchesEgoFilters(rec: any, f: EgoFilterState): boolean {
  if (groupActive(f.tier)) {
    const t = (rec?.tier as EgoTier) ?? "ZAYIN";
    if (!f.tier.has(t)) return false;
  }

  if (groupActive(f.attackType)) {
    const t = String(rec?.type ?? "");
    if (!t || !f.attackType.has(t)) return false;
  }

  if (groupActive(f.affinity)) {
    const a = String(rec?.affinity ?? "");
    if (!a || !f.affinity.has(a)) return false;
  }

  if (groupActive(f.keyword)) {
    const tags: any[] = Array.isArray(rec?.statusTags) ? rec.statusTags : [];
    const set = new Set<string>(tags.map((x) => String(x)));
    let ok = false;
    for (const k of f.keyword) {
      if (set.has(k)) {
        ok = true;
        break;
      }
    }
    if (!ok) return false;
  }

  return true;
}
