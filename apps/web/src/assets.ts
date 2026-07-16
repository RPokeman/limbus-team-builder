// apps/web/src/assets.ts
import type { EgoTier } from "@limbus/core/types";

export const API_ORIGIN = (import.meta as any).env?.VITE_API_ORIGIN ?? "";

// Filled at runtime from /dataset
type Portraits = {
  identities: Record<string, string>;
  egos: Record<string, string>;
};

let PORTRAITS: Portraits | null = null;

export function setPortraits(p: Portraits | null) {
  PORTRAITS = p;
}

export function identityPortraitUrl(identityPage: string) {
  const url = PORTRAITS?.identities?.[identityPage];
  if (url) return url;
  return `${API_ORIGIN}/images/identities/${encodeURIComponent(identityPage)}.png`;
}

export function egoIconUrl(egoPage: string) {
  const url = PORTRAITS?.egos?.[egoPage];
  if (url) return url;
  return `${API_ORIGIN}/images/egos/${encodeURIComponent(egoPage)}.png`;
}

export function rarityBorderUrl(rarity: number) {
  return `${API_ORIGIN}/images/types/rarity_border/rarity_${rarity}.png`;
}

function titleCase(s: string) {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

export function sinIconUrl(sin: string) {
  return `${API_ORIGIN}/images/types/sin/${titleCase(sin)}.png`;
}

export function skillBgUrl(sin: string, skillIndex: 1 | 2 | 3) {
  return `${API_ORIGIN}/images/types/skill_bg/${sin}_${skillIndex}.png`;
}

export function physicalIconUrl(attackType: string) {
  const map: Record<string, string> = {
    slash: "Slash.png",
    pierce: "Pierce.png",
    blunt: "Blunt.png",
    guard: "Guard.png",
    evade: "Evade.png",
    counter: "Counter.png",
    clashable_guard: "Clashable_Guard.png",
  };
  const file = map[attackType] ?? "Slash.png";
  return `${API_ORIGIN}/images/types/physical/${file}`;
}

export const EGO_TIER_ORDER: EgoTier[] = ["ZAYIN", "TETH", "HE", "WAW", "ALEPH"];
