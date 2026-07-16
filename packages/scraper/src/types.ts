// packages\scraper\src\types.ts
export type Sin = "lust" | "pride" | "wrath" | "envy" | "gluttony" | "sloth" | "gloom";

export type AttackType = "slash" | "blunt" | "pierce" | "guard" | "counter" | "evade" | "clashable_guard";

/** Core 7 only (same rule as identities) */
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

/** EGO risk levels as seen on the wiki (kept as-is, uppercase) */
export type EgoRisk = "ZAYIN" | "TETH" | "HE" | "WAW" | "ALEPH";

export interface EgoSinCost {
  sin: Sin;
  cost: number; // blank => 0
}

export interface EgoSkillMeta {
  sin: Sin;
  type: AttackType; // EGOs are typically slash/blunt/pierce, but union is fine
}

export interface EgoRecord {
  page: string;
  name: string;
  prefix: string;
  sinner: string;
  affinity: Sin;
  risk: EgoRisk;
  portraitUrl: string; // single URL only
  sinCosts: EgoSinCost[];
  skill: EgoSkillMeta; // awakening skill
  statusTags: StatusTag[]; // core 7 only, derived from categories
}
