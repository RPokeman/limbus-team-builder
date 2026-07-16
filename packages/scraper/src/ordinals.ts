// packages\scraper\src\ordinals.ts
import fs from "node:fs/promises";
import path from "node:path";

type Identity = {
  page: string;
  sinner: string;
  rarity: number;
  releaseDate: string | null;
};

type Ego = {
  page: string;
  sinner: string;
  tier: string; // "ZAYIN" | "TETH" | "HE" | "WAW" | "ALEPH"
  releaseDate: string | null;
  isDefault?: boolean;
};

function dateKey(d: string | null): number {
  if (!d) return Number.POSITIVE_INFINITY;
  const t = Date.parse(d);
  return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
}

function buildIdentityOrdinal(identities: Identity[]) {
  const bySinner = new Map<string, Identity[]>();

  for (const rec of identities) {
    const arr = bySinner.get(rec.sinner) ?? [];
    arr.push(rec);
    bySinner.set(rec.sinner, arr);
  }

  const out: Record<string, Record<string, number>> = {};

  for (const [sinner, arr] of bySinner.entries()) {
    arr.sort((a, b) => {
      const d = dateKey(a.releaseDate) - dateKey(b.releaseDate);
      if (d !== 0) return d;
      const r = (a.rarity ?? 999) - (b.rarity ?? 999);
      if (r !== 0) return r;
      return (a.page ?? "").localeCompare(b.page ?? "");
    });

    out[sinner] = {};
    arr.forEach((id, i) => {
      out[sinner][id.page] = i + 1;
    });
  }

  return out;
}

function buildEgoOrdinalByTier(egos: Ego[]) {
  const bySinner = new Map<string, Ego[]>();
  for (const rec of egos) {
    const arr = bySinner.get(rec.sinner) ?? [];
    arr.push(rec);
    bySinner.set(rec.sinner, arr);
  }

  const out: Record<string, Record<string, Record<string, number>>> = {};

  for (const [sinner, sinnerEgos] of bySinner.entries()) {
    const byTier = new Map<string, Ego[]>();

    for (const e of sinnerEgos) {
      const arr = byTier.get(e.tier) ?? [];
      arr.push(e);
      byTier.set(e.tier, arr);
    }

    out[sinner] = {};

    for (const [tier, tierEgos] of byTier.entries()) {
      // Defaults first (isDefault=true), then releaseDate, then page for stability
      tierEgos.sort((a, b) => {
        const ad = !!a.isDefault;
        const bd = !!b.isDefault;
        if (ad !== bd) return ad ? -1 : 1;

        const d = dateKey(a.releaseDate) - dateKey(b.releaseDate);
        if (d !== 0) return d;

        return (a.page ?? "").localeCompare(b.page ?? "");
      });

      const map: Record<string, number> = {};
      tierEgos.forEach((e, i) => {
        map[e.page] = i + 1;
      });

      out[sinner][tier] = map;
    }
  }

  return out;
}

export async function buildOrdinals(dataDir: string) {
  const identities = JSON.parse(await fs.readFile(path.join(dataDir, "identities.json"), "utf8")) as Identity[];
  const egos = JSON.parse(await fs.readFile(path.join(dataDir, "egos.json"), "utf8")) as Ego[];

  const identityOrdinal = buildIdentityOrdinal(identities);
  const egoOrdinal = buildEgoOrdinalByTier(egos);

  await fs.writeFile(
    path.join(dataDir, "ordinals.json"),
    JSON.stringify({ identityOrdinal, egoOrdinal }, null, 2) + "\n",
    "utf8",
  );
}
