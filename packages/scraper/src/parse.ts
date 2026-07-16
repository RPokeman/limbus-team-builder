// packages\scraper\src\parse.ts
import * as cheerio from "cheerio";
import type { WikiClient } from "./wiki";
import { fileNameFromThumbSrc, isUptiedFileName, portraitUrlFromFileName } from "./portraits";

export type Sin = "lust" | "pride" | "wrath" | "envy" | "gluttony" | "sloth" | "gloom";
export type AttackType = "slash" | "blunt" | "pierce" | "guard" | "counter" | "evade" | "clashable_guard";
export type StatusTag = "burn" | "tremor" | "sinking" | "poise" | "rupture" | "bleed" | "charge";
export type SkillSlot = "skill1" | "skill2" | "skill3" | "defense";

export interface IdentitySkillMeta {
  slot: SkillSlot;
  sin: Sin;
  type: AttackType;
}

export interface IdentityRecord {
  page: string;
  name: string;
  prefix: string;
  sinner: string;
  rarity: number;
  releaseDate: string; // YYYY-MM-DD
  portraitUrl: string; // single URL only
  skills: IdentitySkillMeta[];
  affinities: Sin[];
  statusTags: StatusTag[];
}

export interface IdentityIndexEntry {
  page: string;
  name: string;
  portraitFileName: string; // e.g. "..._Uptied.png" or LCB fallback
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getParamLine(src: string, key: string): string | undefined {
  const re = new RegExp(`^\\|${escapeRegExp(key)}\\s*=\\s*(.*?)\\s*$`, "mi");
  const m = src.match(re);
  return m?.[1]?.trim();
}

function parseDateDotsToIso(dots: string): string | null {
  const m = dots.trim().match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

// Extract the {{Skill ...}} block assigned to a slot, balancing nested templates.
function extractSkillBlock(src: string, slotKey: string): string | null {
  const startRe = new RegExp(`^\\|${escapeRegExp(slotKey)}\\s*=\\s*\\{\\{Skill\\b`, "mi");
  const start = src.search(startRe);
  if (start < 0) return null;

  const tail = src.slice(start);
  const idx = tail.indexOf("{{Skill");
  if (idx < 0) return null;

  let depth = 0;
  for (let i = idx; i < tail.length - 1; i++) {
    const two = tail.slice(i, i + 2);
    if (two === "{{") depth++;
    else if (two === "}}") depth--;

    if (depth === 0) return tail.slice(idx, i + 2);
  }
  return null;
}

function getSkillParam(skillBlock: string, key: string): string | undefined {
  const re = new RegExp(`\\|${escapeRegExp(key)}\\s*=\\s*([^|}]*)`, "i");
  const m = skillBlock.match(re);
  return m?.[1]?.trim();
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
  if (v === "slash" || v === "blunt" || v === "pierce" || v === "guard" || v === "counter" || v === "evade")
    return v;
  if (v === "clashable_guard") return v;
  throw new Error(`Unknown attack type: ${s}`);
}

function extractCategories(wikitext: string): string[] {
  const out: string[] = [];
  const re = /\[\[Category:([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(wikitext))) out.push(m[1].trim());
  return out;
}

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

function categoriesToAffinities(categories: string[]): Sin[] {
  const out = new Set<Sin>();
  for (const c of categories) {
    const m = c.match(/^(.+)\s+Affinity$/);
    if (!m) continue;
    const sin = SIN_BY_LABEL[m[1].trim()];
    if (sin) out.add(sin);
  }
  return [...out];
}

function categoriesToStatusTags(categories: string[]): StatusTag[] {
  const out = new Set<StatusTag>();
  for (const c of categories) {
    const m = c.match(/^Identities with (.+)$/);
    if (!m) continue;
    const tag = STATUS_BY_LABEL[m[1].trim()];
    if (tag) out.add(tag);
  }
  return [...out];
}

function parseSkill(wikitext: string, slot: SkillSlot, slotKey: string): IdentitySkillMeta | null {
  const block = extractSkillBlock(wikitext, slotKey);
  if (!block) return null;

  const sinRaw = getSkillParam(block, "sin");
  const typeRaw = getSkillParam(block, "type");
  if (!sinRaw || !typeRaw) return null;

  return { slot, sin: normalizeSin(sinRaw), type: normalizeAttackType(typeRaw) };
}

/**
 * Scrape identity index from List_of_Identities.
 * Uses the anchor containing img.IDArt (per your inspect element).
 * Prefers *_Uptied.png if present; otherwise uses the first IDArt (LCB case).
 */
export async function scrapeIdentityIndex(wiki: WikiClient): Promise<IdentityIndexEntry[]> {
  const html = await wiki.parseHtml("List_of_Identities");
  const $ = cheerio.load(html);

  const out: IdentityIndexEntry[] = [];
  const seen = new Set<string>();

  $("a[href^='/wiki/']:has(img.IDArt)").each((_, a) => {
    const $a = $(a);
    const href = $a.attr("href") ?? "";
    const titleAttr = ($a.attr("title") ?? "").trim();

    const page = decodeURIComponent(href.replace(/^\/wiki\//, "")).split("#")[0];
    if (!page || page.includes(":")) return;

    const imgSrcs = $a
      .find("img.IDArt")
      .map((_, img) => $(img).attr("src") ?? "")
      .get()
      .filter(Boolean);

    if (imgSrcs.length === 0) return;

    // pick Uptied if any; else first
    let chosenFile: string | null = null;
    for (const src of imgSrcs) {
      const fn = fileNameFromThumbSrc(src);
      if (fn && isUptiedFileName(fn)) {
        chosenFile = fn;
        break;
      }
    }
    if (!chosenFile) chosenFile = fileNameFromThumbSrc(imgSrcs[0]);

    if (!chosenFile) return;

    const name = titleAttr || page.replace(/_/g, " ");
    if (seen.has(page)) return;

    out.push({ page, name, portraitFileName: chosenFile });
    seen.add(page);
  });

  return out;
}

export function parseIdentityPage(args: {
  page: string;
  name: string;
  wikitext: string;
  portraitUrl: string;
}): IdentityRecord {
  const { page, name, wikitext, portraitUrl } = args;

  const prefix = getParamLine(wikitext, "prefix");
  const sinner = getParamLine(wikitext, "sinner");
  const rarityRaw = getParamLine(wikitext, "rarity");
  const releaseRaw = getParamLine(wikitext, "releasedate");

  if (!prefix) throw new Error(`Missing prefix for ${page}`);
  if (!sinner) throw new Error(`Missing sinner for ${page}`);
  if (!rarityRaw) throw new Error(`Missing rarity for ${page}`);
  if (!releaseRaw) throw new Error(`Missing releasedate for ${page}`);

  const rarity = Number(rarityRaw);
  if (!Number.isFinite(rarity)) throw new Error(`Invalid rarity "${rarityRaw}" for ${page}`);

  const releaseDate = parseDateDotsToIso(releaseRaw);
  if (!releaseDate) throw new Error(`Invalid releasedate "${releaseRaw}" for ${page}`);

  const skills: IdentitySkillMeta[] = [];
  const s1 = parseSkill(wikitext, "skill1", "skill1");
  const s2 = parseSkill(wikitext, "skill2", "skill2");
  const s3 = parseSkill(wikitext, "skill3", "skill3");
  const def = parseSkill(wikitext, "defense", "defense");

  if (s1) skills.push(s1);
  if (s2) skills.push(s2);
  if (s3) skills.push(s3);
  if (def) skills.push(def);

  const categories = extractCategories(wikitext);
  const affinities = categoriesToAffinities(categories);
  const statusTags = categoriesToStatusTags(categories);

  // Conditional override:
  // Only if category exists AND defense is actually guard.
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

export function portraitUrlForIndexEntry(entry: IdentityIndexEntry): string {
  return portraitUrlFromFileName(entry.portraitFileName);
}
