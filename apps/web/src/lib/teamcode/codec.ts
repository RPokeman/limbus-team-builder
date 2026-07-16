// apps/web/src/lib/teamcode/codec.ts
import type { EgoTier, OrdinalTables, TeamState } from "@limbus/core/types";
import { SINNER_ORDER } from "@limbus/core/types";
import {
  decodeOuterTeamCode,
  encodeOuterTeamCode,
  encodeTeamStateToPayload,
  readIdentityOrdinal,
} from "@limbus/core/teamcode";

export type DatasetForCodec = { ordinals: OrdinalTables };

function invertIdentityOrdinals(ordinals: OrdinalTables["identityOrdinal"]) {
  const out: Record<string, Record<number, string>> = {};
  for (const [sinner, table] of Object.entries(ordinals)) {
    const inv: Record<number, string> = {};
    for (const [page, n] of Object.entries(table as Record<string, number>)) inv[n] = page;
    out[sinner] = inv;
  }
  return out;
}

function invertEgoOrdinals(ordinals: OrdinalTables["egoOrdinal"]) {
  // sinner -> tier -> page -> n  ===> sinner -> tier -> n -> page
  const out: Record<string, Record<string, Record<number, string>>> = {};
  for (const [sinner, byTier] of Object.entries(ordinals as any)) {
    const sinnerOut: Record<string, Record<number, string>> = {};
    for (const [tier, table] of Object.entries(byTier as Record<string, Record<string, number>>)) {
      const inv: Record<number, string> = {};
      for (const [page, n] of Object.entries(table)) inv[n] = page;
      sinnerOut[tier] = inv;
    }
    out[sinner] = sinnerOut;
  }
  return out;
}

function getPayloadBytes(decoded: any): Uint8Array {
  if (decoded instanceof Uint8Array) return decoded;
  if (decoded?.payload instanceof Uint8Array) return decoded.payload;
  if (decoded?.bytes instanceof Uint8Array) return decoded.bytes;
  if (decoded?.data instanceof Uint8Array) return decoded.data;
  return decoded as Uint8Array;
}

function blockBase(s: number): { base: number; pos: 0 | 1 | 2 | 3 } {
  const block = Math.floor(s / 4);
  const pos = (s % 4) as 0 | 1 | 2 | 3;
  return { base: block * 23, pos };
}

// Mirrors current known layout.
// For pos0, ZAYIN storage is not yet known; returns 0 (caller normalizes).
function readEgosKnownPositions(
  payload: Uint8Array,
  sinnerIndex: number
): { ZAYIN: number; TETH: number; HE: number; WAW: number } {
  const { base, pos } = blockBase(sinnerIndex);

  // pos2 (simple 1-byte tiers)
  if (pos === 2) {
    const z = (payload[base + 13] >> 1) & 0xff;
    const t = (payload[base + 14] >> 2) & 0x3f;
    const h = (payload[base + 15] >> 3) & 0x1f;
    const w = (payload[base + 16] >> 4) & 0x0f;
    return { ZAYIN: z, TETH: t, HE: h, WAW: w };
  }

  // pos1 (ZAYIN/TETH packed + HE + WAW)
  if (pos === 1) {
    const b7 = payload[base + 7];
    const b8 = payload[base + 8];

    // ZAYIN:
    // - default zayin => bit7 set in base+8 => ord 1
    // - alternate => bit7 clear and base+7 stores (altIndex<<2)-1 ; ord = altIndex+1
    const isDefaultZ = (b8 & 0x80) !== 0;
    let z = 0;
    if (isDefaultZ) {
      z = 1;
    } else if (b7 !== 0) {
      const altIndex = ((b7 + 1) >> 2) & 0xff;
      z = altIndex + 1;
    }

    // TETH low 7 bits: code = (tOrd<<2)-1 ; ord = (code+1)>>2
    const tCode = b8 & 0x7f;
    const t = tCode ? ((tCode + 1) >> 2) & 0x7f : 0;

    // HE: (heOrd<<2) | flags ; ignore flags here
    const heByte = payload[base + 9];
    const h = (heByte >> 2) & 0x3f;

    // WAW: wawOrd<<5
    const w = (payload[base + 10] >> 5) & 0x07;

    return { ZAYIN: z, TETH: t, HE: h, WAW: w };
  }

  // pos0 (packed: TETH in top 2 bits of base+3; HE in low 6 bits + base+4; WAW at base+5)
  if (pos === 0) {
    const t = (payload[base + 3] >> 6) & 0x03;

    const heField = (((payload[base + 3] & 0x3f) << 8) | payload[base + 4]) & 0xffff;
    const h = (heField >> 7) & 0x1ff;

    const w = (payload[base + 5] >> 6) & 0x03;

    return { ZAYIN: 0, TETH: t, HE: h, WAW: w };
  }

  // pos3 (shared bytes for HE/WAW in base+21)
  const z = (payload[base + 19] >> 3) & 0x1f;
  const t = (payload[base + 20] >> 4) & 0x0f;

  const wawHi = payload[base + 21] & 0xc0;
  const wawLo = payload[base + 22];
  const wawField = ((wawHi << 8) | wawLo) & 0xffff;
  const w = (wawField >> 6) & 0x3ff;

  const heHiNibble = payload[base + 20] & 0x0f;
  const heLoMasked = payload[base + 21] & 0x3f;
  const heField = ((heHiNibble << 8) | heLoMasked) & 0x0fff;
  const h = (heField >> 5) & 0x7f;

  return { ZAYIN: z, TETH: t, HE: h, WAW: w };
}

export function decodeTeamStateFromOuterCodeSafe(
  code: string,
  dataset: DatasetForCodec
): TeamState | null {
  try {
    const decoded = decodeOuterTeamCode(code);
    const payload = getPayloadBytes(decoded);
    if (!(payload instanceof Uint8Array) || payload.length !== 70) return null;

    const idInv = invertIdentityOrdinals(dataset.ordinals.identityOrdinal);
    const egoInv = invertEgoOrdinals(dataset.ordinals.egoOrdinal);

    const slots = SINNER_ORDER.map((sinner, s) => {
      const idN = readIdentityOrdinal(payload, s);
      const identityKey = idInv[sinner]?.[idN] ?? "";

      const { ZAYIN, TETH, HE, WAW } = readEgosKnownPositions(payload, s);

      const egos: Partial<Record<EgoTier, string>> = {};
      if (ZAYIN) egos.ZAYIN = egoInv[sinner]?.ZAYIN?.[ZAYIN] ?? "";
      if (TETH) egos.TETH = egoInv[sinner]?.TETH?.[TETH] ?? "";
      if (HE) egos.HE = egoInv[sinner]?.HE?.[HE] ?? "";
      if (WAW) egos.WAW = egoInv[sinner]?.WAW?.[WAW] ?? "";

      return { identityKey, egos };
    });

    return { slots };
  } catch {
    return null;
  }
}

export function encodeTeamStateToOuterCode(team: TeamState, dataset: DatasetForCodec): string {
  const payload = encodeTeamStateToPayload(team, dataset.ordinals);
  return encodeOuterTeamCode(payload);
}
