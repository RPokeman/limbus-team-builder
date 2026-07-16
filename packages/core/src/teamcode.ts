// packages/core/src/teamcode.ts
import pako from "pako";
import { EgoTier, OrdinalTables, SINNER_ORDER, TeamState } from "./types";
import { getBaselinePayload } from "./baseline";

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

/**
 * outer = Base64( gzip( inner_b64_bytes ) )
 * inner_b64_bytes = Base64(payload_bytes) (ASCII)
 * payload_bytes length is 70 bytes
 */
export function decodeOuterTeamCode(code: string): Uint8Array {
  const gzBytes = b64ToBytes(code);
  const innerB64Bytes = pako.ungzip(gzBytes);
  const innerB64 = new TextDecoder().decode(innerB64Bytes);
  const payload = b64ToBytes(innerB64);
  if (payload.length !== 70) throw new Error(`Expected 70 bytes, got ${payload.length}`);
  return payload;
}

export function encodeOuterTeamCode(payload70: Uint8Array): string {
  if (payload70.length !== 70) throw new Error(`Expected 70 bytes, got ${payload70.length}`);
  const innerB64 = bytesToB64(payload70);
  const innerB64Bytes = new TextEncoder().encode(innerB64);
  const gzBytes = pako.gzip(innerB64Bytes);
  return bytesToB64(gzBytes);
}

function blockBase(s: number): { base: number; pos: 0 | 1 | 2 | 3 } {
  const block = Math.floor(s / 4);
  const pos = (s % 4) as 0 | 1 | 2 | 3;
  return { base: block * 23, pos };
}

// -------------------------
// Identity ordinals
// -------------------------

export function readIdentityOrdinal(payload: Uint8Array, sinnerIndex: number): number {
  const { base, pos } = blockBase(sinnerIndex);
  if (pos === 0) return payload[base + 0] >> 0;
  if (pos === 1) return payload[base + 6] >> 2;
  if (pos === 2) return payload[base + 12] >> 4;
  return (((payload[base + 17] << 8) | payload[base + 18]) >> 6) & 0x3ff; // pos3
}

export function writeIdentityOrdinal(payload: Uint8Array, sinnerIndex: number, ord: number) {
  const { base, pos } = blockBase(sinnerIndex);

  if (pos === 0) {
    payload[base + 0] = (ord & 0xff) << 0;
    return;
  }
  if (pos === 1) {
    payload[base + 6] = (ord & 0xff) << 2;
    return;
  }
  if (pos === 2) {
    payload[base + 12] = (ord & 0xff) << 4;
    return;
  }

  // pos3
  const val = (ord & 0x3ff) << 6;
  payload[base + 17] = (val >> 8) & 0xff;
  payload[base + 18] = val & 0xff;
}

// -------------------------
// EGO ordinals
// -------------------------

type EgoOrdWithFlags = { ord: number; flags?: number };
type EgoOrdMap = Partial<Record<EgoTier, EgoOrdWithFlags>>;

// pos1 ZAYIN encoding (confirmed via Sinclair):
// - Default ZAYIN (ord=1): base+8 has bit7 set (0x80) and base+7 is 0
// - Alternate ZAYIN (ord>=2): base+8 bit7 cleared and base+7 stores (altIndex<<2)-1 where altIndex = ord-1
function encodePos1Zayin(base8: number, zOrd: number): { b7: number; b8: number } {
  if (zOrd <= 1) {
    // default ZAYIN flag in bit7 of base+8
    return { b7: 0x00, b8: base8 | 0x80 };
  }
  const altIndex = zOrd - 1; // 1-based among alternates
  const b7 = ((altIndex << 2) - 1) & 0xff; // e.g. ord=2 -> altIndex=1 -> 0x03
  const b8 = base8 & 0x7f; // clear default bit7
  return { b7, b8 };
}

// pos1 TETH encoding (confirmed via Faust + Sinclair):
// store tethCode in low 7 bits of base+8: tethCode = (tOrd<<2)-1, or 0 for none
function encodePos1TethLow7(tOrd: number): number {
  if (!tOrd) return 0;
  return ((tOrd << 2) - 1) & 0x7f;
}

/**
 * Writes EGO ordinals for positions you have mapped.
 *
 * Supported (fully):
 * - pos0: TETH/HE/WAW
 * - pos1: ZAYIN/TETH/HE/WAW (ZAYIN supports default + alternates; proven with Sinclair)
 * - pos2: ZAYIN/TETH/HE/WAW
 * - pos3: ZAYIN/TETH/HE/WAW (HE and WAW overlap at base+21; merged via OR, proven with Ryōshū)
 */
export function writeEgosKnownPositions(payload: Uint8Array, sinnerIndex: number, egos: EgoOrdMap) {
  const { base, pos } = blockBase(sinnerIndex);

  // -------------------------
  // pos2 (simple 1-byte tiers)
  // -------------------------
  if (pos === 2) {
    // ZAYIN mandatory
    if (egos.ZAYIN?.ord != null) payload[base + 13] = (egos.ZAYIN.ord & 0xff) << 1;

    payload[base + 14] = (egos.TETH?.ord ?? 0) << 2;
    payload[base + 15] = (egos.HE?.ord ?? 0) << 3;
    payload[base + 16] = (egos.WAW?.ord ?? 0) << 4;
    return;
  }

  // -------------------------
  // pos3 (shared bytes: HE + WAW overlap at base+21; OR-merge proven)
  // -------------------------
  if (pos === 3) {
    if (egos.ZAYIN?.ord != null) payload[base + 19] = (egos.ZAYIN.ord & 0xff) << 3;

    // TETH high nibble of base+20
    const t = egos.TETH?.ord ?? 0;
    payload[base + 20] = (payload[base + 20] & 0x0f) | ((t & 0x0f) << 4);

    // HE: heField = hOrd<<5, stored into (base+20 low nibble, base+21)
    const h = egos.HE?.ord ?? 0;
    const heField = (h & 0x0fff) << 5;
    const heHiNibble = (heField >> 8) & 0x0f; // base+20 low nibble
    const heLoByte = heField & 0xff; // contributes into base+21

    // WAW: wawField = wOrd<<6, stored BE into (base+21, base+22)
    const w = egos.WAW?.ord ?? 0;
    const wawField = (w & 0xffff) << 6;
    const wawHi = (wawField >> 8) & 0xff; // contributes into base+21
    const wawLo = wawField & 0xff; // base+22

    payload[base + 20] = (payload[base + 20] & 0xf0) | heHiNibble;
    payload[base + 21] = (heLoByte | wawHi) & 0xff; // merge (confirmed via Ryōshū HE-only / WAW-only / both)
    payload[base + 22] = wawLo & 0xff;

    return;
  }

  // -------------------------
  // pos0 (packed: TETH in top 2 bits of base+3; HE in low 6 bits + base+4; WAW at base+5)
  // -------------------------
  if (pos === 0) {
    // TETH in top 2 bits of base+3
    const t = egos.TETH?.ord ?? ((payload[base + 3] & 0xc0) >> 6);
    payload[base + 3] = (payload[base + 3] & 0x3f) | ((t & 0x03) << 6);

    // HE spans low 6 bits of base+3 + all of base+4: he_field == (h_ord<<7)
    if (egos.HE?.ord != null) {
      const h = egos.HE.ord;
      const heField2 = (h & 0xffff) << 7;
      payload[base + 3] = (payload[base + 3] & 0xc0) | ((heField2 >> 8) & 0x3f);
      payload[base + 4] = heField2 & 0xff;
    }

    // WAW: base+5 = w_ord<<6
    if (egos.WAW?.ord != null) payload[base + 5] = (egos.WAW.ord & 0xff) << 6;

    return;
  }

  // -------------------------
  // pos1 (now fully supported: ZAYIN/TETH packed + HE + WAW)
  //
  // Layout (confirmed with Sinclair):
  // - base+7: ZAYIN alternate code (0 when default ZAYIN)
  // - base+8: bit7 indicates default ZAYIN; low 7 bits store TETH code
  // - base+9: HE = (heIndex<<2) | flags
  // - base+10: WAW = wawOrd<<5
  // -------------------------
  if (pos === 1) {
    // ZAYIN (mandatory): support default + alternates
    if (egos.ZAYIN?.ord != null) {
      const cur8 = payload[base + 8];
      const low7Preserve = cur8 & 0x7f; // keep current TETH unless we overwrite it below
      const { b7, b8 } = encodePos1Zayin(low7Preserve, egos.ZAYIN.ord);
      payload[base + 7] = b7;
      payload[base + 8] = b8;
    }

    // TETH: low 7 bits of base+8
    if (egos.TETH?.ord != null) {
      const low7 = encodePos1TethLow7(egos.TETH.ord);
      payload[base + 8] = (payload[base + 8] & 0x80) | low7; // preserve default-ZAYIN bit7
    }

    // HE at base+9: (heIndex<<2) | flags
    if (egos.HE?.ord != null) {
      const flags = egos.HE.flags ?? 0;
      payload[base + 9] = ((egos.HE.ord & 0x3f) << 2) | (flags & 0x03);
    }

    // WAW at base+10: wawOrd<<5
    if (egos.WAW?.ord != null) {
      payload[base + 10] = (egos.WAW.ord & 0xff) << 5;
    }

    return;
  }
}

// -------------------------
// TeamState -> payload (used by API encode endpoint)
// -------------------------

export function encodeTeamStateToPayload(team: TeamState, tables: OrdinalTables): Uint8Array {
  const payload = getBaselinePayload(); // preserves any unknown baseline bits

  const egoTierOrder: EgoTier[] = ["ZAYIN", "TETH", "HE", "WAW"];

  for (let s = 0; s < SINNER_ORDER.length; s++) {
    const sinner = SINNER_ORDER[s];
    const slot = team.slots[s];

    // Identity
    const idOrd = tables.identityOrdinal[sinner]?.[slot.identityKey];
    if (!idOrd) throw new Error(`Missing identity ordinal for ${sinner}: ${slot.identityKey}`);
    writeIdentityOrdinal(payload, s, idOrd);

    // EGOs
    const egoOrds: EgoOrdMap = {};
    for (const tier of egoTierOrder) {
      const key = slot.egos[tier];
      if (!key) continue;

      const ord = tables.egoOrdinal[sinner]?.[tier]?.[key];
      if (!ord) throw new Error(`Missing ego ordinal for ${sinner}/${tier}: ${key}`);

      const flags = tables.egoFlags?.[sinner]?.[tier]?.[key] ?? 0;
      egoOrds[tier] = { ord, flags };
    }

    writeEgosKnownPositions(payload, s, egoOrds);
  }

  return payload;
}
