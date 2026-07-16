// packages/core/src/types.ts

export type SinnerId =
  | "Yi Sang"
  | "Faust"
  | "Don Quixote"
  | "Ryōshū"
  | "Meursault"
  | "Hong Lu"
  | "Heathcliff"
  | "Ishmael"
  | "Rodion"
  | "Sinclair"
  | "Outis"
  | "Gregor";

export const SINNER_ORDER: SinnerId[] = [
  "Yi Sang",
  "Faust",
  "Don Quixote",
  "Ryōshū",
  "Meursault",
  "Hong Lu",
  "Heathcliff",
  "Ishmael",
  "Rodion",
  "Sinclair",
  "Outis",
  "Gregor",
];

export type IdentityRarity = 1 | 2 | 3;

// Note: UI uses only ZAYIN/TETH/HE/WAW right now.
export type EgoTier = "ZAYIN" | "TETH" | "HE" | "WAW" | "ALEPH";

// These come from your trusted JSON (lowercase).
export type Sin = "wrath" | "lust" | "sloth" | "gluttony" | "gloom" | "pride" | "envy";

// These come from your trusted JSON (lowercase).
export type PhysicalType =
  | "slash"
  | "pierce"
  | "blunt"
  | "guard"
  | "clashable_guard"
  | "evade"
  | "counter";

// These come from your trusted JSON (lowercase).
export type StatusTag =
  | "burn"
  | "bleed"
  | "tremor"
  | "rupture"
  | "sinking"
  | "poise"
  | "charge";

export interface SkillMeta {
  slot: "skill1" | "skill2" | "skill3" | "defense";
  sin: Sin;
  type: PhysicalType;
}

export interface IdentityRecord {
  page: string;
  name: string;
  sinner: SinnerId;
  rarity: IdentityRarity;
  releaseDate: string;
  skills: SkillMeta[];
  affinities: Sin[];
  statusTags: StatusTag[];
  isBase: boolean;
}

export interface EgoCost {
  wrath: number;
  lust: number;
  sloth: number;
  gluttony: number;
  gloom: number;
  pride: number;
  envy: number;
}

export interface EgoRecord {
  page: string;
  name: string;
  sinner: SinnerId;
  tier: EgoTier;
  releaseDate: string;
  isDefault: boolean;
  affinity: Sin;
  type: PhysicalType;
  cost: EgoCost;
  statusTags: StatusTag[];
}

export interface OrdinalTables {
  identityOrdinal: Record<SinnerId, Record<string, number>>;
  egoOrdinal: Record<SinnerId, Record<EgoTier, Record<string, number>>>;
  // optional: reserved low-bit patterns for specific EGOs (pos1 HE etc.)
  egoFlags?: Record<SinnerId, Partial<Record<EgoTier, Record<string, number>>>>;
}

export interface TeamSlot {
  // identity page key (matches identities.json "page")
  identityKey: string;
  // ego page keys by tier (matches egos.json "page")
  egos: Partial<Record<EgoTier, string>>;
}

export interface TeamState {
  slots: TeamSlot[]; // length 12, sinner order
}
