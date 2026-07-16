// packages\scraper\src\parse\categories.ts
import type { Sin, StatusTag } from "../types";

const SIN_BY_LABEL: Record<string, Sin> = {
  Lust: "lust",
  Pride: "pride",
  Wrath: "wrath",
  Envy: "envy",
  Gluttony: "gluttony",
  Sloth: "sloth",
  Gloom: "gloom",
};

const STATUS_BY_LABEL: Record<string, StatusTag> = {
  Burn: "burn",
  Tremor: "tremor",
  Sinking: "sinking",
  Poise: "poise",
  Rupture: "rupture",
  Bleed: "bleed",
  Charge: "charge",
};

export function extractCategories(wikitext: string): string[] {
  const out: string[] = [];
  const re = /\[\[Category:([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(wikitext))) out.push(m[1].trim());
  return out;
}

export function categoriesToAffinities(categories: string[]): Sin[] {
  const out = new Set<Sin>();
  for (const c of categories) {
    const m = c.match(/^(.+)\s+Affinity$/);
    if (!m) continue;
    const sin = SIN_BY_LABEL[m[1].trim()];
    if (sin) out.add(sin);
  }
  return [...out];
}

export function categoriesToCoreStatusTags(categories: string[]): StatusTag[] {
  const out = new Set<StatusTag>();
  for (const c of categories) {
    // Identities: "Identities with X"
    let m = c.match(/^Identities with (.+)$/);
    if (m) {
      const tag = STATUS_BY_LABEL[m[1].trim()];
      if (tag) out.add(tag);
      continue;
    }

    // EGOs: "E.G.O with X"
    m = c.match(/^E\.G\.O with (.+)$/);
    if (m) {
      const tag = STATUS_BY_LABEL[m[1].trim()];
      if (tag) out.add(tag);
      continue;
    }
  }
  return [...out];
}
