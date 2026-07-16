// packages\scraper\src\parse\egos.ts
import type { AttackType, EgoRisk, Sin, StatusTag } from "../types";
import { extractCategories, categoriesToCoreStatusTags } from "./categories";
import { getParamLine, parseDateDotsToIso } from "./wikitext";

function normalizeSinner(raw: string): string {
  let v = raw.trim();

  // Strip template wrappers like {{Ryoshu}}
  if (v.startsWith("{{") && v.endsWith("}}")) {
    v = v.slice(2, -2).trim();
  }

  // Canonical spelling fixes
  if (v === "Ryoshu") return "Ryōshū";

  return v;
}

function normalizeSin(s: string): Sin {
  return s.trim().toLowerCase() as Sin;
}

function normalizeAttackType(s: string): AttackType {
  return s.trim().toLowerCase() as AttackType;
}

function normalizeRisk(s: string): EgoRisk {
  return s.trim().toUpperCase() as EgoRisk;
}

function parseCost(wikitext: string): Record<Sin, number> {
  const sins: Sin[] = ["wrath", "lust", "sloth", "gluttony", "gloom", "pride", "envy"];

  const out = {} as Record<Sin, number>;
  for (const sin of sins) {
    const raw = getParamLine(wikitext, `${sin}cost`);
    out[sin] = raw ? Number(raw) || 0 : 0;
  }
  return out;
}

function parseDamageType(wikitext: string, page: string): AttackType {
  const m = wikitext.match(/^\|\s*type\s*=\s*([^\s|]+)/im);
  if (!m) throw new Error(`Missing type= for EGO page ${page}`);
  return normalizeAttackType(m[1]);
}

export function parseEgoPage(args: {
  page: string;
  name: string;
  wikitext: string;
  portraitUrl: string;
}) {
  const { page, name, wikitext, portraitUrl } = args;

  const sinnerRaw = getParamLine(wikitext, "sinner");
  const affinityLine = getParamLine(wikitext, "affinity");
  const riskLine = getParamLine(wikitext, "risk");
  const releaseRaw = getParamLine(wikitext, "releasedate");

  if (!sinnerRaw) throw new Error(`Missing sinner for ${page}`);
  if (!affinityLine) throw new Error(`Missing affinity for ${page}`);
  if (!riskLine) throw new Error(`Missing risk for ${page}`);

  const sinner = normalizeSinner(sinnerRaw);
  const affinity = normalizeSin(affinityLine);
  const tier = normalizeRisk(riskLine);

  const releaseDate = releaseRaw ? parseDateDotsToIso(releaseRaw) : null;
  const isDefault = !releaseDate;

  const type = parseDamageType(wikitext, page);
  const cost = parseCost(wikitext);

  const categories = extractCategories(wikitext);
  const statusTags = categoriesToCoreStatusTags(categories) as StatusTag[];

  return {
    page,
    name,
    sinner,
    tier,
    releaseDate,
    isDefault,
    affinity,
    type,
    cost,
    statusTags,
    portraitUrl,
  };
}
