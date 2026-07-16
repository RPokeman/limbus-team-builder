// packages\scraper\src\parse\identities.ts
import type { AttackType, IdentityRecord, IdentitySkillMeta, Sin } from "../types";
import { categoriesToAffinities, categoriesToCoreStatusTags, extractCategories } from "./categories";
import { extractSkillBlock, getParamLine, getSkillParam, parseDateDotsToIso } from "./wikitext";

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
  const v = s.trim().toLowerCase();
  if (
    v === "lust" ||
    v === "pride" ||
    v === "wrath" ||
    v === "envy" ||
    v === "gluttony" ||
    v === "sloth" ||
    v === "gloom"
  )
    return v;
  throw new Error(`Unknown sin: ${s}`);
}

function normalizeAttackType(s: string): AttackType {
  const v = s.trim().toLowerCase();

  // Rare legacy formatting
  if (v === "defense") return "guard";

  if (v === "slash" || v === "blunt" || v === "pierce" || v === "guard" || v === "counter" || v === "evade")
    return v;

  if (v === "clashable_guard") return v;

  throw new Error(`Unknown attack type: ${s}`);
}

function parseIdentitySkill(
  wikitext: string,
  slotKey: "skill1" | "skill2" | "skill3" | "defense",
): IdentitySkillMeta | null {
  const block = extractSkillBlock(wikitext, slotKey);
  if (!block) return null;

  const sinRaw = getSkillParam(block, "sin");
  const typeRaw = getSkillParam(block, "type");
  if (!sinRaw || !typeRaw) return null;

  return {
    slot: slotKey,
    sin: normalizeSin(sinRaw),
    type: normalizeAttackType(typeRaw),
  };
}

export function parseIdentityPage(args: {
  page: string;
  name: string;
  wikitext: string;
  portraitUrl: string;
}): IdentityRecord {
  const { page, name, wikitext, portraitUrl } = args;

  const prefix = getParamLine(wikitext, "prefix");
  const sinnerRaw = getParamLine(wikitext, "sinner");
  const rarityRaw = getParamLine(wikitext, "rarity");
  const releaseRaw = getParamLine(wikitext, "releasedate");

  if (!prefix) throw new Error(`Missing prefix for ${page}`);
  if (!sinnerRaw) throw new Error(`Missing sinner for ${page}`);
  if (!rarityRaw) throw new Error(`Missing rarity for ${page}`);
  if (!releaseRaw) throw new Error(`Missing releasedate for ${page}`);

  const sinner = normalizeSinner(sinnerRaw);

  const rarity = Number(rarityRaw);
  if (!Number.isFinite(rarity)) throw new Error(`Invalid rarity "${rarityRaw}" for ${page}`);

  const releaseDate = parseDateDotsToIso(releaseRaw);
  if (!releaseDate) throw new Error(`Invalid releasedate "${releaseRaw}" for ${page}`);

  const skills: IdentitySkillMeta[] = [];
  for (const k of ["skill1", "skill2", "skill3", "defense"] as const) {
    const s = parseIdentitySkill(wikitext, k);
    if (s) skills.push(s);
  }

  const categories = extractCategories(wikitext);
  const affinities = categoriesToAffinities(categories);
  const statusTags = categoriesToCoreStatusTags(categories);

  // Clashable guard override
  const hasClashableGuardCategory = categories.some((c) => c.trim() === "Identities with Clashable Guard");
  if (hasClashableGuardCategory) {
    const d = skills.find((s) => s.slot === "defense");
    if (d && d.type === "guard") d.type = "clashable_guard";
  }

  return {
    page,
    name,
    prefix,
    sinner,
    rarity,
    releaseDate,
    portraitUrl,
    skills,
    affinities,
    statusTags,
  };
}
